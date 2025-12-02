// WebSocket Server for Tic-Tac-Toe Online Game
const WebSocket = require('ws');
const http = require('http');

class TicTacToeServer {
    constructor(port = 8080) {
        this.port = port;
        this.clients = new Map(); // username -> { ws, username, roomId }
        this.rooms = new Map(); // roomId -> { id, players: [username1, username2], gameState, spectators }
        this.server = null;
        this.wss = null;
    }

    start() {
        // Create HTTP server
        this.server = http.createServer();
        
        // Create WebSocket server
        this.wss = new WebSocket.Server({ server: this.server });
        
        this.wss.on('connection', (ws) => {
            console.log('New client connected');
            
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleMessage(ws, data);
                } catch (error) {
                    console.error('Error parsing message:', error);
                }
            });
            
            ws.on('close', () => {
                this.handleDisconnect(ws);
            });
            
            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
            });
        });
        
        this.server.listen(this.port, () => {
            console.log(`✓ Tic-Tac-Toe server running on port ${this.port}`);
            console.log(`✓ WebSocket URL: ws://localhost:${this.port}`);
        });
    }

    handleMessage(ws, data) {
        const { type } = data;
        
        switch (type) {
            case 'login':
                this.handleLogin(ws, data);
                break;
            case 'logout':
                this.handleLogout(ws);
                break;
            case 'create_room':
                this.handleCreateRoom(ws);
                break;
            case 'join_room':
                this.handleJoinRoom(ws, data);
                break;
            case 'leave_room':
                this.handleLeaveRoom(ws);
                break;
            case 'make_move':
                this.handleMove(ws, data);
                break;
            case 'chat_message':
                this.handleChatMessage(ws, data);
                break;
            case 'rematch_request':
                this.handleRematchRequest(ws);
                break;
        }
    }

    handleLogin(ws, data) {
        const { username, reconnect, room } = data;
        
        // Check if username is already taken (unless reconnecting)
        if (!reconnect && this.clients.has(username)) {
            this.send(ws, {
                type: 'login_error',
                message: 'Username already taken'
            });
            return;
        }
        
        // Register client
        const clientData = {
            ws,
            username,
            roomId: null
        };
        
        this.clients.set(username, clientData);
        
        // Handle reconnection to room
        if (reconnect && room && this.rooms.has(room)) {
            const roomData = this.rooms.get(room);
            if (roomData.players.includes(username)) {
                clientData.roomId = room;
                
                // Determine symbol
                const symbol = roomData.players[0] === username ? 'X' : 'O';
                
                this.send(ws, {
                    type: 'login_success',
                    username,
                    room: {
                        id: room,
                        symbol,
                        playerX: roomData.players[0],
                        playerO: roomData.players[1] || null,
                        gameState: roomData.gameState
                    }
                });
                return;
            }
        }
        
        this.send(ws, {
            type: 'login_success',
            username
        });
        
        // Broadcast updated players list
        this.broadcastPlayersList();
        this.broadcastRoomsList();
    }

    handleLogout(ws) {
        const client = this.getClientByWs(ws);
        if (!client) return;
        
        // Leave room if in one
        if (client.roomId) {
            this.handleLeaveRoom(ws);
        }
        
        // Remove client
        this.clients.delete(client.username);
        
        // Broadcast updated players list
        this.broadcastPlayersList();
    }

    handleCreateRoom(ws) {
        const client = this.getClientByWs(ws);
        if (!client) return;
        
        // Leave current room if in one
        if (client.roomId) {
            this.handleLeaveRoom(ws);
        }
        
        // Generate unique room ID
        const roomId = this.generateRoomId();
        
        // Create room
        const room = {
            id: roomId,
            players: [client.username],
            gameState: {
                board: Array(9).fill(null),
                currentTurn: 'X',
                playerX: client.username,
                playerO: null,
                gameOver: false,
                winner: null
            },
            spectators: []
        };
        
        this.rooms.set(roomId, room);
        client.roomId = roomId;
        
        this.send(ws, {
            type: 'room_created',
            roomId,
            symbol: 'X',
            playerX: client.username,
            playerO: null
        });
        
        // Broadcast updated rooms list
        this.broadcastRoomsList();
    }

    handleJoinRoom(ws, data) {
        const client = this.getClientByWs(ws);
        if (!client) return;
        
        const { roomId } = data;
        
        if (!this.rooms.has(roomId)) {
            this.send(ws, {
                type: 'room_error',
                message: 'Room not found'
            });
            return;
        }
        
        const room = this.rooms.get(roomId);
        
        // Check if room is full
        if (room.players.length >= 2) {
            this.send(ws, {
                type: 'room_error',
                message: 'Room is full'
            });
            return;
        }
        
        // Leave current room if in one
        if (client.roomId) {
            this.handleLeaveRoom(ws);
        }
        
        // Join room
        room.players.push(client.username);
        room.gameState.playerO = client.username;
        client.roomId = roomId;
        
        this.send(ws, {
            type: 'room_joined',
            roomId,
            symbol: 'O',
            playerX: room.players[0],
            playerO: client.username
        });
        
        // Notify other player
        const otherClient = this.clients.get(room.players[0]);
        if (otherClient) {
            this.send(otherClient.ws, {
                type: 'player_joined',
                playerName: client.username,
                playerX: room.players[0],
                playerO: client.username
            });
            
            // Start game
            this.send(otherClient.ws, {
                type: 'game_start',
                playerX: room.players[0],
                playerO: client.username
            });
        }
        
        this.send(ws, {
            type: 'game_start',
            playerX: room.players[0],
            playerO: client.username
        });
        
        // Broadcast updated rooms list
        this.broadcastRoomsList();
    }

    handleLeaveRoom(ws) {
        const client = this.getClientByWs(ws);
        if (!client || !client.roomId) return;
        
        const room = this.rooms.get(client.roomId);
        if (!room) return;
        
        // Remove player from room
        room.players = room.players.filter(p => p !== client.username);
        
        // Notify other players
        room.players.forEach(playerUsername => {
            const playerClient = this.clients.get(playerUsername);
            if (playerClient) {
                this.send(playerClient.ws, {
                    type: 'player_left',
                    playerName: client.username
                });
            }
        });
        
        // Delete room if empty
        if (room.players.length === 0) {
            this.rooms.delete(client.roomId);
        } else {
            // Reset game state
            room.gameState = {
                board: Array(9).fill(null),
                currentTurn: 'X',
                playerX: room.players[0],
                playerO: null,
                gameOver: false,
                winner: null
            };
        }
        
        client.roomId = null;
        
        // Broadcast updated rooms list
        this.broadcastRoomsList();
    }

    handleMove(ws, data) {
        const client = this.getClientByWs(ws);
        if (!client || !client.roomId) return;
        
        const room = this.rooms.get(client.roomId);
        if (!room) return;
        
        const { index } = data;
        const { gameState } = room;
        
        // Validate move
        if (gameState.gameOver) return;
        if (gameState.board[index] !== null) return;
        
        // Determine player symbol
        const playerIndex = room.players.indexOf(client.username);
        const symbol = playerIndex === 0 ? 'X' : 'O';
        
        // Check if it's player's turn
        if (gameState.currentTurn !== symbol) return;
        
        // Make move
        gameState.board[index] = symbol;
        gameState.currentTurn = symbol === 'X' ? 'O' : 'X';
        
        // Broadcast move to all players in room
        room.players.forEach(playerUsername => {
            const playerClient = this.clients.get(playerUsername);
            if (playerClient) {
                this.send(playerClient.ws, {
                    type: 'game_move',
                    board: gameState.board,
                    symbol,
                    index,
                    nextTurn: gameState.currentTurn
                });
            }
        });
        
        // Check for winner
        const winner = this.checkWinner(gameState.board);
        if (winner) {
            gameState.gameOver = true;
            gameState.winner = winner.winner;
            gameState.winningLine = winner.line;
            
            // Broadcast game over
            room.players.forEach(playerUsername => {
                const playerClient = this.clients.get(playerUsername);
                if (playerClient) {
                    this.send(playerClient.ws, {
                        type: 'game_over',
                        winner: winner.winner,
                        winningLine: winner.line,
                        totalMoves: gameState.board.filter(cell => cell !== null).length
                    });
                }
            });
        }
    }

    handleChatMessage(ws, data) {
        const client = this.getClientByWs(ws);
        if (!client || !client.roomId) return;
        
        const room = this.rooms.get(client.roomId);
        if (!room) return;
        
        const { message } = data;
        
        // Broadcast message to all players in room
        room.players.forEach(playerUsername => {
            const playerClient = this.clients.get(playerUsername);
            if (playerClient) {
                this.send(playerClient.ws, {
                    type: 'chat_message',
                    username: client.username,
                    message
                });
            }
        });
    }

    handleRematchRequest(ws) {
        const client = this.getClientByWs(ws);
        if (!client || !client.roomId) return;
        
        const room = this.rooms.get(client.roomId);
        if (!room) return;
        
        // Reset game state
        room.gameState = {
            board: Array(9).fill(null),
            currentTurn: 'X',
            playerX: room.players[0],
            playerO: room.players[1] || null,
            gameOver: false,
            winner: null
        };
        
        // Broadcast rematch acceptance
        room.players.forEach(playerUsername => {
            const playerClient = this.clients.get(playerUsername);
            if (playerClient) {
                this.send(playerClient.ws, {
                    type: 'rematch_request',
                    accepted: true
                });
            }
        });
    }

    handleDisconnect(ws) {
        const client = this.getClientByWs(ws);
        if (!client) return;
        
        console.log(`Client disconnected: ${client.username}`);
        
        // Note: We don't immediately remove the client to allow for reconnection
        // They will be cleaned up after a timeout or explicit logout
        
        setTimeout(() => {
            const stillExists = this.clients.has(client.username);
            if (stillExists && this.clients.get(client.username).ws === ws) {
                // Client didn't reconnect, clean up
                if (client.roomId) {
                    this.handleLeaveRoom(ws);
                }
                this.clients.delete(client.username);
                this.broadcastPlayersList();
            }
        }, 30000); // 30 second grace period for reconnection
    }

    checkWinner(board) {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6] // Diagonals
        ];
        
        for (const pattern of winPatterns) {
            const [a, b, c] = pattern;
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return { winner: board[a], line: pattern };
            }
        }
        
        // Check for draw
        if (board.every(cell => cell !== null)) {
            return { winner: 'draw', line: null };
        }
        
        return null;
    }

    generateRoomId() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let roomId;
        do {
            roomId = '';
            for (let i = 0; i < 6; i++) {
                roomId += chars.charAt(Math.floor(Math.random() * chars.length));
            }
        } while (this.rooms.has(roomId));
        return roomId;
    }

    broadcastPlayersList() {
        const players = Array.from(this.clients.keys());
        
        this.clients.forEach(client => {
            this.send(client.ws, {
                type: 'players_update',
                players
            });
        });
    }

    broadcastRoomsList() {
        const rooms = Array.from(this.rooms.values())
            .filter(room => room.players.length < 2)
            .map(room => ({
                id: room.id,
                players: room.players,
                playerCount: room.players.length
            }));
        
        this.clients.forEach(client => {
            if (!client.roomId) { // Only send to clients in lobby
                this.send(client.ws, {
                    type: 'rooms_update',
                    rooms
                });
            }
        });
    }

    getClientByWs(ws) {
        for (const client of this.clients.values()) {
            if (client.ws === ws) {
                return client;
            }
        }
        return null;
    }

    send(ws, data) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(data));
        }
    }
}

// Start the server
const server = new TicTacToeServer(8080);
server.start();

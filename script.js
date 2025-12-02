// Client-side JavaScript for Tic-Tac-Toe Online Game
class TicTacToeClient {
    constructor() {
        this.ws = null;
        this.username = null;
        this.currentRoom = null;
        this.currentSymbol = null;
        this.gameState = {
            board: Array(9).fill(null),
            currentTurn: 'X',
            playerX: null,
            playerO: null,
            gameOver: false,
            winner: null,
            moveHistoryX: [],
            moveHistoryO: []
        };
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectTimeout = null;
        
        this.initializeElements();
        this.attachEventListeners();
        this.checkSessionStorage();
        this.connectWebSocket();
    }

    initializeElements() {
        // Screens
        this.loginScreen = document.getElementById('loginScreen');
        this.lobbyScreen = document.getElementById('lobbyScreen');
        this.gameScreen = document.getElementById('gameScreen');
        
        // Login elements
        this.usernameInput = document.getElementById('usernameInput');
        this.loginBtn = document.getElementById('loginBtn');
        this.loginError = document.getElementById('loginError');
        
        // Lobby elements
        this.currentUsername = document.getElementById('currentUsername');
        this.playerCount = document.getElementById('playerCount');
        this.playersList = document.getElementById('playersList');
        this.createRoomBtn = document.getElementById('createRoomBtn');
        this.roomIdInput = document.getElementById('roomIdInput');
        this.joinRoomBtn = document.getElementById('joinRoomBtn');
        this.roomsList = document.getElementById('roomsList');
        this.lobbyError = document.getElementById('lobbyError');
        this.logoutBtn = document.getElementById('logoutBtn');
        
        // Game elements
        this.gameUsername = document.getElementById('gameUsername');
        this.roomIdDisplay = document.getElementById('roomIdDisplay');
        this.copyRoomLinkBtn = document.getElementById('copyRoomLinkBtn');
        this.shareLinkMsg = document.getElementById('shareLinkMsg');
        this.playerXDisplay = document.getElementById('playerX');
        this.playerODisplay = document.getElementById('playerO');
        this.gameStatus = document.getElementById('gameStatus');
        this.turnIndicator = document.getElementById('turnIndicator');
        this.gameBoard = document.getElementById('gameBoard');
        this.cells = document.querySelectorAll('.cell');
        this.resetGameBtn = document.getElementById('resetGameBtn');
        this.leaveRoomBtn = document.getElementById('leaveRoomBtn');
        
        // Chat elements
        this.chatMessages = document.getElementById('chatMessages');
        this.chatInput = document.getElementById('chatInput');
        this.sendChatBtn = document.getElementById('sendChatBtn');
        
        // Modal elements
        this.summaryModal = document.getElementById('summaryModal');
        this.summaryTitle = document.getElementById('summaryTitle');
        this.summaryDetails = document.getElementById('summaryDetails');
        this.playAgainBtn = document.getElementById('playAgainBtn');
        this.backToLobbyBtn = document.getElementById('backToLobbyBtn');
    }

    attachEventListeners() {
        // Login
        this.loginBtn.addEventListener('click', () => this.login());
        this.usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.login();
        });
        
        // Lobby
        this.logoutBtn.addEventListener('click', () => this.logout());
        this.createRoomBtn.addEventListener('click', () => this.createRoom());
        this.joinRoomBtn.addEventListener('click', () => this.joinRoom());
        this.roomIdInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.joinRoom();
        });
        
        // Game
        this.leaveRoomBtn.addEventListener('click', () => this.leaveRoom());
        this.copyRoomLinkBtn.addEventListener('click', () => this.copyRoomLink());
        this.resetGameBtn.addEventListener('click', () => this.requestRematch());
        
        // Game board
        this.cells.forEach((cell, index) => {
            cell.addEventListener('click', () => this.makeMove(index));
        });
        
        // Chat
        this.sendChatBtn.addEventListener('click', () => this.sendChatMessage());
        this.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendChatMessage();
        });
        
        // Modal
        this.playAgainBtn.addEventListener('click', () => this.playAgain());
        this.backToLobbyBtn.addEventListener('click', () => this.backToLobby());
        
        // Handle page unload
        window.addEventListener('beforeunload', () => {
            if (this.username) {
                sessionStorage.setItem('ttt_username', this.username);
                sessionStorage.setItem('ttt_timestamp', Date.now());
                if (this.currentRoom) {
                    sessionStorage.setItem('ttt_room', this.currentRoom);
                }
            }
        });
    }

    connectWebSocket() {
        // Connect to WebSocket server (adjust URL as needed)
        // For production, update this URL after deploying your server
        const isLocal = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname === '';
        
        // UPDATE THIS URL with your deployed server URL (e.g., from Render.com, Railway.app)
        const productionWsUrl = 'wss://ttt-nokc.onrender.com';
        const localWsUrl = 'ws://localhost:8080';
        
        const wsUrl = isLocal ? localWsUrl : productionWsUrl;
        
        console.log('Connecting to WebSocket:', wsUrl);
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
            console.log('Connected to server');
            this.reconnectAttempts = 0;
            
            // Try to reconnect with session data
            const savedUsername = sessionStorage.getItem('ttt_username');
            const savedTimestamp = sessionStorage.getItem('ttt_timestamp');
            const savedRoom = sessionStorage.getItem('ttt_room');
            
            // Allow reconnection within 5 minutes
            if (savedUsername && savedTimestamp && (Date.now() - savedTimestamp < 300000)) {
                this.username = savedUsername;
                this.send('login', { username: savedUsername, reconnect: true, room: savedRoom });
            }
        };
        
        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
        };
        
        this.ws.onclose = () => {
            console.log('Disconnected from server');
            this.attemptReconnect();
        };
        
        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }

    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            
            this.reconnectTimeout = setTimeout(() => {
                this.connectWebSocket();
            }, 2000 * this.reconnectAttempts);
        } else {
            this.showError('Connection lost. Please refresh the page.', 'login');
        }
    }

    send(type, data = {}) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type, ...data }));
        }
    }

    handleMessage(data) {
        switch (data.type) {
            case 'login_success':
                this.handleLoginSuccess(data);
                break;
            case 'login_error':
                this.showError(data.message, 'login');
                break;
            case 'players_update':
                this.updatePlayersList(data.players);
                break;
            case 'rooms_update':
                this.updateRoomsList(data.rooms);
                break;
            case 'room_created':
                this.handleRoomCreated(data);
                break;
            case 'room_joined':
                this.handleRoomJoined(data);
                break;
            case 'room_error':
                this.showError(data.message, 'lobby');
                break;
            case 'player_joined':
                this.handlePlayerJoined(data);
                break;
            case 'player_left':
                this.handlePlayerLeft(data);
                break;
            case 'game_start':
                this.handleGameStart(data);
                break;
            case 'game_move':
                this.handleGameMove(data);
                break;
            case 'game_over':
                this.handleGameOver(data);
                break;
            case 'chat_message':
                this.handleChatMessage(data);
                break;
            case 'rematch_request':
                this.handleRematchRequest(data);
                break;
        }
    }

    checkSessionStorage() {
        const savedUsername = sessionStorage.getItem('ttt_username');
        const savedTimestamp = sessionStorage.getItem('ttt_timestamp');
        
        if (savedUsername && savedTimestamp && (Date.now() - savedTimestamp < 300000)) {
            this.usernameInput.value = savedUsername;
        }
    }

    login() {
        const username = this.usernameInput.value.trim();
        
        if (!username) {
            this.showError('Please enter a username', 'login');
            return;
        }
        
        if (username.length < 3) {
            this.showError('Username must be at least 3 characters', 'login');
            return;
        }
        
        this.send('login', { username });
    }

    handleLoginSuccess(data) {
        this.username = data.username;
        this.currentUsername.textContent = this.username;
        this.gameUsername.textContent = this.username;
        
        sessionStorage.setItem('ttt_username', this.username);
        sessionStorage.setItem('ttt_timestamp', Date.now());
        
        this.showScreen('lobby');
        
        // If reconnecting to a room
        if (data.room) {
            this.currentRoom = data.room.id;
            this.showScreen('game');
            this.updateGameRoom(data.room);
        }
    }

    logout() {
        this.send('logout');
        sessionStorage.clear();
        this.username = null;
        this.currentRoom = null;
        this.usernameInput.value = '';
        this.showScreen('login');
    }

    createRoom() {
        this.send('create_room');
    }

    joinRoom() {
        const roomId = this.roomIdInput.value.trim();
        
        if (!roomId) {
            this.showError('Please enter a room ID', 'lobby');
            return;
        }
        
        this.send('join_room', { roomId });
    }

    handleRoomCreated(data) {
        this.currentRoom = data.roomId;
        this.roomIdInput.value = '';
        this.showScreen('game');
        this.setupGameRoom(data);
    }

    handleRoomJoined(data) {
        this.currentRoom = data.roomId;
        this.roomIdInput.value = '';
        this.showScreen('game');
        this.setupGameRoom(data);
    }

    setupGameRoom(data) {
        this.roomIdDisplay.textContent = this.currentRoom;
        this.currentSymbol = data.symbol;
        
        // Reset game state
        this.gameState.board = Array(9).fill(null);
        this.gameState.currentTurn = 'X';
        this.gameState.playerX = data.playerX;
        this.gameState.playerO = data.playerO;
        this.gameState.gameOver = false;
        this.gameState.winner = null;
        this.gameState.moveHistoryX = [];
        this.gameState.moveHistoryO = [];
        
        this.updateGameDisplay();
        this.clearBoard();
        this.chatMessages.innerHTML = '';
        this.resetGameBtn.style.display = 'none';
        
        sessionStorage.setItem('ttt_room', this.currentRoom);
    }

    updateGameRoom(room) {
        this.roomIdDisplay.textContent = room.id;
        this.currentSymbol = room.symbol;
        this.gameState = room.gameState;
        
        this.updateGameDisplay();
        this.renderBoard();
    }

    handlePlayerJoined(data) {
        this.gameState.playerX = data.playerX;
        this.gameState.playerO = data.playerO;
        this.updateGameDisplay();
        
        this.addSystemMessage(`${data.playerName} joined the game`);
    }

    handlePlayerLeft(data) {
        this.addSystemMessage(`${data.playerName} left the game`);
        this.gameStatus.textContent = 'Opponent left the game';
        this.turnIndicator.textContent = 'Waiting for new opponent...';
        this.resetGameBtn.style.display = 'none';
    }

    handleGameStart(data) {
        this.gameState.playerX = data.playerX;
        this.gameState.playerO = data.playerO;
        this.gameState.currentTurn = 'X';
        this.updateGameDisplay();
        this.addSystemMessage('Game started! Good luck! 🎮');
    }

    leaveRoom() {
        if (confirm('Are you sure you want to leave this room?')) {
            this.send('leave_room');
            this.currentRoom = null;
            this.currentSymbol = null;
            sessionStorage.removeItem('ttt_room');
            this.showScreen('lobby');
        }
    }

    copyRoomLink() {
        const roomLink = `${window.location.origin}${window.location.pathname}?room=${this.currentRoom}`;
        
        navigator.clipboard.writeText(roomLink).then(() => {
            this.shareLinkMsg.textContent = '✓ Link copied to clipboard!';
            setTimeout(() => {
                this.shareLinkMsg.textContent = '';
            }, 3000);
        }).catch(() => {
            this.shareLinkMsg.textContent = '✗ Failed to copy link';
        });
    }

    makeMove(index) {
        if (this.gameState.gameOver) return;
        if (this.gameState.board[index] !== null) return;
        if (this.gameState.currentTurn !== this.currentSymbol) return;
        if (!this.gameState.playerX || !this.gameState.playerO) return;
        
        this.send('make_move', { index });
    }

    handleGameMove(data) {
        // Use the complete board state from server (includes sliding window changes)
        this.gameState.board = data.board;
        this.gameState.currentTurn = data.nextTurn;
        
        this.renderBoard();
        this.updateGameDisplay();
    }

    handleGameOver(data) {
        this.gameState.gameOver = true;
        this.gameState.winner = data.winner;
        this.gameState.winningLine = data.winningLine;
        
        this.renderBoard();
        
        // Highlight winning cells
        if (data.winningLine) {
            data.winningLine.forEach(index => {
                this.cells[index].classList.add('winning');
            });
        }
        
        this.updateGameDisplay();
        this.resetGameBtn.style.display = 'block';
        
        // Show summary modal
        setTimeout(() => {
            this.showGameSummary(data);
        }, 1000);
    }

    renderBoard() {
        this.cells.forEach((cell, index) => {
            const value = this.gameState.board[index];
            cell.textContent = value === 'X' ? '❌' : value === 'O' ? '⭕' : '';
            cell.classList.toggle('taken', value !== null);
        });
    }

    clearBoard() {
        this.cells.forEach(cell => {
            cell.textContent = '';
            cell.classList.remove('taken', 'winning');
        });
    }

    updateGameDisplay() {
        // Update player displays
        this.playerXDisplay.textContent = this.gameState.playerX || 'Waiting...';
        this.playerODisplay.textContent = this.gameState.playerO || 'Waiting...';
        
        // Update active player indicator
        const playerItems = document.querySelectorAll('#gamePlayers .player-item');
        playerItems[0].classList.toggle('active', this.gameState.currentTurn === 'X' && !this.gameState.gameOver);
        playerItems[1].classList.toggle('active', this.gameState.currentTurn === 'O' && !this.gameState.gameOver);
        
        // Update game status
        if (this.gameState.gameOver) {
            if (this.gameState.winner === 'draw') {
                this.gameStatus.textContent = "It's a Draw!";
                this.turnIndicator.textContent = 'Good game!';
            } else {
                const winnerName = this.gameState.winner === 'X' ? this.gameState.playerX : this.gameState.playerO;
                this.gameStatus.textContent = `${winnerName} Wins! 🎉`;
                this.turnIndicator.textContent = this.gameState.winner === this.currentSymbol ? 'You won!' : 'You lost!';
            }
        } else if (!this.gameState.playerX || !this.gameState.playerO) {
            this.gameStatus.textContent = 'Waiting for opponent...';
            this.turnIndicator.textContent = 'Share the room link to invite a player';
        } else {
            const currentPlayerName = this.gameState.currentTurn === 'X' ? this.gameState.playerX : this.gameState.playerO;
            this.gameStatus.textContent = 'Game in Progress';
            
            if (this.gameState.currentTurn === this.currentSymbol) {
                this.turnIndicator.textContent = `Your turn (${this.currentSymbol === 'X' ? '❌' : '⭕'})`;
            } else {
                this.turnIndicator.textContent = `${currentPlayerName}'s turn`;
            }
        }
    }

    showGameSummary(data) {
        if (data.winner === 'draw') {
            this.summaryTitle.textContent = "It's a Draw! 🤝";
        } else {
            const winnerName = data.winner === 'X' ? this.gameState.playerX : this.gameState.playerO;
            if (data.winner === this.currentSymbol) {
                this.summaryTitle.textContent = "You Win! 🎉";
            } else {
                this.summaryTitle.textContent = "You Lose! 😔";
            }
        }
        
        const moves = data.totalMoves || this.gameState.board.filter(cell => cell !== null).length;
        
        this.summaryDetails.innerHTML = `
            <p><strong>Match Summary</strong></p>
            <p>❌ Player X: ${this.gameState.playerX}</p>
            <p>⭕ Player O: ${this.gameState.playerO}</p>
            <p>📊 Total Moves: ${moves}</p>
            <p>🏆 Result: ${data.winner === 'draw' ? 'Draw' : (data.winner === 'X' ? this.gameState.playerX : this.gameState.playerO) + ' wins!'}</p>
        `;
        
        this.summaryModal.classList.add('active');
    }

    requestRematch() {
        this.send('rematch_request');
        this.resetGameBtn.disabled = true;
        this.resetGameBtn.textContent = 'Waiting for opponent...';
    }

    handleRematchRequest(data) {
        if (data.accepted) {
            // Reset game
            this.gameState.board = Array(9).fill(null);
            this.gameState.currentTurn = 'X';
            this.gameState.gameOver = false;
            this.gameState.winner = null;
            this.gameState.winningLine = null;
            this.gameState.moveHistoryX = [];
            this.gameState.moveHistoryO = [];
            
            this.clearBoard();
            this.updateGameDisplay();
            this.resetGameBtn.style.display = 'none';
            this.resetGameBtn.disabled = false;
            this.resetGameBtn.textContent = 'Play Again';
            this.summaryModal.classList.remove('active');
            
            this.addSystemMessage('New game started! 🎮');
        }
    }

    playAgain() {
        this.summaryModal.classList.remove('active');
        this.requestRematch();
    }

    backToLobby() {
        this.summaryModal.classList.remove('active');
        this.leaveRoom();
    }

    sendChatMessage() {
        const message = this.chatInput.value.trim();
        
        if (!message) return;
        
        this.send('chat_message', { message });
        this.chatInput.value = '';
    }

    handleChatMessage(data) {
        const isOwn = data.username === this.username;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${isOwn ? 'own' : 'other'}`;
        
        if (!isOwn) {
            const senderSpan = document.createElement('div');
            senderSpan.className = 'chat-sender';
            senderSpan.textContent = data.username;
            messageDiv.appendChild(senderSpan);
        }
        
        const textSpan = document.createElement('div');
        textSpan.className = 'chat-text';
        textSpan.textContent = data.message;
        messageDiv.appendChild(textSpan);
        
        this.chatMessages.appendChild(messageDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    addSystemMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message';
        messageDiv.style.background = '#ffc107';
        messageDiv.style.color = '#000';
        messageDiv.style.textAlign = 'center';
        messageDiv.style.fontSize = '0.9em';
        messageDiv.style.fontStyle = 'italic';
        messageDiv.textContent = message;
        
        this.chatMessages.appendChild(messageDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    updatePlayersList(players) {
        this.playerCount.textContent = players.length;
        
        const otherPlayers = players.filter(p => p !== this.username);
        
        if (otherPlayers.length === 0) {
            this.playersList.innerHTML = '<p class="empty-message">No other players online</p>';
        } else {
            this.playersList.innerHTML = otherPlayers.map(player => `
                <div class="player-item">
                    <span class="player-name">👤 ${player}</span>
                    <span class="player-status">● Online</span>
                </div>
            `).join('');
        }
    }

    updateRoomsList(rooms) {
        if (rooms.length === 0) {
            this.roomsList.innerHTML = '<p class="empty-message">No active rooms</p>';
        } else {
            this.roomsList.innerHTML = rooms.map(room => `
                <div class="room-item">
                    <div class="room-info">
                        <div class="room-id">🎮 Room: ${room.id}</div>
                        <div class="room-players">${room.players.join(' vs ')}</div>
                    </div>
                    <button class="btn btn-small" onclick="client.joinRoomById('${room.id}')">Join</button>
                </div>
            `).join('');
        }
    }

    joinRoomById(roomId) {
        this.roomIdInput.value = roomId;
        this.joinRoom();
    }

    showScreen(screenName) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        switch (screenName) {
            case 'login':
                this.loginScreen.classList.add('active');
                break;
            case 'lobby':
                this.lobbyScreen.classList.add('active');
                break;
            case 'game':
                this.gameScreen.classList.add('active');
                break;
        }
    }

    showError(message, context) {
        if (context === 'login') {
            this.loginError.textContent = message;
            setTimeout(() => {
                this.loginError.textContent = '';
            }, 5000);
        } else if (context === 'lobby') {
            this.lobbyError.textContent = message;
            setTimeout(() => {
                this.lobbyError.textContent = '';
            }, 5000);
        }
    }
}

// Initialize the client when the page loads
let client;
window.addEventListener('DOMContentLoaded', () => {
    client = new TicTacToeClient();
    
    // Check for room ID in URL
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('room');
    if (roomId) {
        sessionStorage.setItem('ttt_join_room', roomId);
    }
});

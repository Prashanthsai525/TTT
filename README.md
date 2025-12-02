# 🎮 Tic-Tac-Toe Online - Multiplayer Game

A real-time, multiplayer Tic-Tac-Toe game with WebSocket support. Players can create or join game rooms, chat with opponents, and enjoy seamless gameplay without any database storage.

## ✨ Features

- **Real-time Multiplayer**: Play against other players in real-time using WebSocket
- **User Authentication**: Enter unique usernames to join the game
- **Online Players List**: See all currently active players
- **Room Management**: Create new game rooms or join existing ones with unique room IDs
- **Shareable Room Links**: Invite friends by sharing the room link
- **In-game Chat**: Communicate with your opponent during the game
- **Session Recovery**: Reconnect to your game within 5 minutes if page refreshes
- **Match Summary**: View game statistics at the end of each match
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **No Database**: All data stored in memory (temporary sessions)

## 🚀 Getting Started

### Prerequisites

- **Node.js** (version 14 or higher)
- **npm** (comes with Node.js)
- A modern web browser

### Installation

1. **Install Node.js** (if not already installed):
   - Download from: https://nodejs.org/
   - Choose the LTS (Long Term Support) version
   - Follow the installation wizard

2. **Open Terminal/PowerShell** in the project folder:
   - Right-click in the folder and select "Open in Terminal" or "Open PowerShell window here"

3. **Install dependencies**:
   ```bash
   npm install
   ```

### Running the Application

1. **Start the WebSocket Server**:
   ```bash
   npm start
   ```
   
   You should see:
   ```
   ✓ Tic-Tac-Toe server running on port 8080
   ✓ WebSocket URL: ws://localhost:8080
   ```

2. **Open the Game in Your Browser**:
   - Simply double-click `index.html` to open it in your default browser
   - Or right-click `index.html` → "Open with" → Choose your browser
   - You can open multiple browser tabs to test with multiple players

3. **Play the Game**:
   - Enter a unique username
   - Create a room or join an existing one
   - Share the room link with friends to play together!

## 📖 How to Play

### Login
1. Enter a unique username (3-20 characters)
2. Click "Join Game" to enter the lobby

### In the Lobby
- View all online players
- See active game rooms
- Create a new room or join an existing one by entering the Room ID

### In the Game Room
- Wait for an opponent to join (or share the room link)
- Take turns placing your symbol (❌ or ⭕) on the board
- Chat with your opponent using the chat panel
- First player to get 3 in a row wins!
- Click "Play Again" for a rematch

### Room Links
- Click "📋 Copy Room Link" to copy a shareable link
- Send this link to friends so they can join your room directly

## 🎯 Game Rules

1. Players take turns placing their symbol on a 3x3 grid
2. Player X always goes first
3. First player to get 3 symbols in a row (horizontally, vertically, or diagonally) wins
4. If all 9 squares are filled and no player has won, the game is a draw

## 🔧 Configuration

### Changing the Server Port

Edit `server.js` (line 7):
```javascript
const server = new TicTacToeServer(8080); // Change 8080 to your desired port
```

Also update `script.js` (line 117):
```javascript
const wsUrl = 'ws://localhost:8080'; // Change 8080 to match server port
```

### Session Recovery Time

Edit `script.js` (line 112) to change the reconnection window (default: 5 minutes = 300000ms):
```javascript
if (savedUsername && savedTimestamp && (Date.now() - savedTimestamp < 300000)) {
    // Change 300000 to desired milliseconds
}
```

## 🛠️ Technical Details

### Technologies Used
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js with WebSocket (ws library)
- **Real-time Communication**: WebSocket protocol
- **Storage**: Session Storage (client-side) + In-memory storage (server-side)

### Architecture
- **Client-Server Model**: Clients connect to a central WebSocket server
- **No Database**: All game state stored in server memory
- **Automatic Cleanup**: Disconnected players and empty rooms are removed automatically
- **Reconnection Support**: 30-second grace period for reconnection after disconnect

### File Structure
```
tic-tac-toe-online/
│
├── index.html          # Main HTML structure
├── styles.css          # All styling and animations
├── script.js           # Client-side game logic
├── server.js           # WebSocket server
├── package.json        # Node.js dependencies
└── README.md          # This file
```

## 🐛 Troubleshooting

### Server Won't Start
- Make sure Node.js is installed: `node --version`
- Install dependencies: `npm install`
- Check if port 8080 is available (or change the port)

### Can't Connect to Server
- Verify the server is running (you should see the "server running" message)
- Check that the WebSocket URL in `script.js` matches your server port
- Disable browser extensions that might block WebSocket connections

### Username Already Taken
- Choose a different username
- If you were disconnected, wait 30 seconds for automatic cleanup

### Game Not Updating
- Check your internet connection
- Refresh the page and reconnect
- Make sure the server is still running

## 🌟 Features Explained

### Session Recovery
- When you refresh the page within 5 minutes, you'll automatically reconnect to your game
- Your username and room are stored in session storage
- The server keeps your game state for 30 seconds after disconnect

### Automatic Cleanup
- Players who close their browser are removed after 30 seconds
- Empty rooms are deleted automatically
- No manual cleanup required

### Real-time Updates
- Player list updates automatically when players join/leave
- Room list refreshes when rooms are created/deleted
- Game board syncs in real-time between players

## 🎨 Customization

### Changing Colors
Edit `styles.css` to change the color scheme:
```css
/* Primary gradient colors */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### Changing Symbols
Edit `script.js` to use different symbols (currently ❌ and ⭕):
```javascript
cell.textContent = value === 'X' ? '❌' : value === 'O' ? '⭕' : '';
```

## 📝 Notes

- All game data is stored in memory and will be lost when the server restarts
- Maximum room ID length: 6 characters (uppercase letters and numbers)
- Maximum chat message length: 100 characters
- Maximum username length: 20 characters

## 🤝 Multiplayer Testing

To test with multiple players on the same computer:
1. Start the server: `npm start`
2. Open `index.html` in multiple browser windows/tabs
3. Use different usernames for each window
4. Create a room in one window and join it from another

## 🚀 Deployment Options

### Local Network
1. Find your local IP address (e.g., 192.168.1.100)
2. Update `script.js` with your IP:
   ```javascript
   const wsUrl = 'ws://192.168.1.100:8080';
   ```
3. Share your IP and port with others on the same network

### Cloud Deployment
For production deployment, consider:
- Heroku
- DigitalOcean
- AWS
- Azure

Update the WebSocket URL to your production domain.

## 📄 License

MIT License - Feel free to use and modify!

## 🎉 Enjoy Playing!

Have fun playing Tic-Tac-Toe with your friends! If you encounter any issues, check the troubleshooting section or create an issue.

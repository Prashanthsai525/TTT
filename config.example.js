// Configuration for deployment
// Copy this file to config.js and update with your server URL

const CONFIG = {
    // For local development
    LOCAL_WS_URL: 'ws://localhost:8080',
    
    // For production (update with your deployed server URL)
    PRODUCTION_WS_URL: 'wss://your-server-name.onrender.com',
    
    // Automatically use production URL if not on localhost
    getWebSocketUrl() {
        const isLocal = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname === '';
        
        return isLocal ? this.LOCAL_WS_URL : this.PRODUCTION_WS_URL;
    }
};

// Example URLs for different platforms:
// Render.com: wss://your-app-name.onrender.com
// Railway.app: wss://your-app-name.railway.app
// Fly.io: wss://your-app-name.fly.dev
// Heroku: wss://your-app-name.herokuapp.com

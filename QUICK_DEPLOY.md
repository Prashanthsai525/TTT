# 🚀 QUICK START: Deploy Your WebSocket Server

## Follow These Steps:

### 1️⃣ Deploy Server on Render.com (FREE)

1. Go to https://render.com/ and sign up
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repo (or upload code manually)
4. Configure:
   - **Name**: `tictactoe-server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free
5. Click **"Create Web Service"**
6. Wait for deployment (2-3 minutes)
7. **Copy your server URL** (e.g., `https://tictactoe-server.onrender.com`)

### 2️⃣ Update Your Client Code

Open `script.js` and find line ~124:

**Change this:**
```javascript
const wsUrl = 'ws://localhost:8080';
```

**To this:**
```javascript
const wsUrl = 'wss://tictactoe-server.onrender.com'; // Use YOUR Render URL
```

⚠️ **Important**: Use `wss://` (not `ws://`) for production!

### 3️⃣ Deploy Frontend on Vercel

Your frontend is already on Vercel! Just:
1. Push the updated `script.js` to your repo
2. Vercel will auto-redeploy
3. Done! 🎉

---

## ✅ Testing

1. Open your Vercel app: `https://your-app.vercel.app`
2. Enter a username
3. If it takes 30-60 seconds the first time, that's normal (free tier wakes up)
4. Open another browser tab and test multiplayer!

---

## 🆘 Troubleshooting

**"Can't connect to server"**
- Check if Render server is running (visit Render dashboard)
- Make sure you used `wss://` (not `ws://`)
- Check browser console for errors (F12)

**"Server is sleeping"**
- Render free tier sleeps after 15 min inactivity
- First connection takes 30-60 seconds to wake up
- This is normal behavior

**"Still not working"**
- Open browser console (F12) and check for errors
- Visit your Render URL directly in browser
- Check Render logs for server errors

---

## 💡 Alternative: Deploy on Railway.app

1. Go to https://railway.app/
2. Create new project
3. Deploy from GitHub
4. Get URL like: `https://your-app.railway.app`
5. Update script.js with: `wss://your-app.railway.app`

Railway has better free tier (no sleeping servers)!

---

## 🎮 Ready to Play!

Once deployed:
- Share your Vercel URL with friends
- They can join from anywhere in the world
- Enjoy real-time multiplayer Tic-Tac-Toe! 🎉

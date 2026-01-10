# 🚀 Email Server - Quick Start

## ⚡ START THE SERVER

### Step 1: Open Terminal in VS Code
Press `Ctrl + \`` (backtick)

### Step 2: Navigate to server folder
```bash
cd server
```

### Step 3: Start the server
```bash
npm start
```

**OR directly:**
```bash
node server.js
```

## ✅ What You Should See

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ SERVER RUNNING ON http://localhost:8080
📧 Contact endpoint: http://localhost:8080/api/contact
🔗 Health check: http://localhost:8080/
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️  KEEP THIS TERMINAL OPEN!
⚠️  Press Ctrl+C to stop the server
```

## ✅ Verify Server is Running

Open browser: http://localhost:8080

Should show:
```json
{
  "message": "Email Server Running",
  "status": "OK",
  "email": "Configured ✅"
}
```

## 📧 Test Contact Form

1. Open: http://localhost:3000/contact
2. Fill out form
3. Submit
4. Check server terminal for: `✅ Email sent successfully`
5. Check email: rakshakmorchaorg@gmail.com

## ⚠️ IMPORTANT

- **KEEP THE TERMINAL OPEN** where server is running
- If you close terminal → Server stops → Contact form won't work
- Server must be running BEFORE testing contact form

## 🔧 Troubleshooting

### Port 8080 in use?
```bash
lsof -ti:8080 | xargs kill -9
npm start
```

### Dependencies not installed?
```bash
npm install
```

### Email not sending?
- Check `.env` file has correct EMAIL_USER and EMAIL_PASS
- For Gmail, use App Password (not regular password)

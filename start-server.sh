#!/bin/bash

# Start Rakshak Morcha Email Server
echo "🚀 Starting Rakshak Morcha Email Server..."
echo ""

cd "$(dirname "$0")"

# Kill any existing process on port 8080
echo "🧹 Cleaning port 8080..."
lsof -ti:8080 | xargs kill -9 2>/dev/null || true
sleep 1

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    echo "💡 Creating .env file..."
    cat > .env << EOF
PORT=8080
EMAIL_USER=rakshakmorchaorg@gmail.com
EMAIL_PASS=kookoovnrdyttyat
EOF
fi

# Start server
echo "✅ Starting server..."
echo ""
node server.js


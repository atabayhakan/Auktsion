#!/usr/bin/env bash
# =============================================================================
# Auktsion v2.0 / iTorgo — Production Deployment Script (VPS / Hostinger / Linux)
# =============================================================================
set -e

echo "🚀 [1/5] Building Frontend SPA..."
cd frontend
npm ci --prefer-offline || npm install
npm run build
cd ..

echo "⚙️ [2/5] Building Backend Server..."
cd server
npm ci --prefer-offline || npm install
npm run build
cd ..

echo "📂 [3/5] Ensuring required directories exist..."
mkdir -p server/uploads/auctions
mkdir -p server/uploads/kyc
mkdir -p server/database

echo "🔄 [4/5] Reloading PM2 process..."
if command -v pm2 >/dev/null 2>&1; then
  pm2 reload server/ecosystem.config.cjs || pm2 start server/ecosystem.config.cjs
  pm2 save
else
  echo "PM2 is not installed globally. You can start the server with: npm run start"
fi

echo ""
echo "✅ ========================================================"
echo "🎉 Auktsion v2.0 deployment completed successfully!"
echo "🌐 URL: http://localhost:5000"
echo "🩺 Health: http://localhost:5000/api/health"
echo "========================================================"

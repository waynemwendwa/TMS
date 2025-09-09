#!/bin/bash

echo "🚀 Deploying TMS Application..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in TMS root directory"
    exit 1
fi

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build applications
echo "🔨 Building applications..."
npm run build

# Run database migrations
echo "🗄️ Running database migrations..."
cd apps/api
npx prisma migrate deploy
npx prisma generate
cd ../..

# Create logs directory
mkdir -p logs

# Restart PM2 services
echo "🔄 Restarting services..."
pm2 restart ecosystem.config.js

# Show status
echo "📊 Service status:"
pm2 status

echo "✅ Deployment complete!"
echo "🌐 Your app should be running at:"
echo "   - Frontend: http://your-domain.com"
echo "   - API: http://your-domain.com/api"

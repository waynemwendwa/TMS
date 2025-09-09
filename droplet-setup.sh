#!/bin/bash

echo "🌊 DigitalOcean Droplet Setup for TMS"
echo "====================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in TMS root directory"
    echo "Current directory: $(pwd)"
    echo "Please run this from /root/TMS"
    exit 1
fi

echo "✅ Current directory: $(pwd)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Start Docker services
echo "🐳 Starting Docker services..."
docker compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Setup database
echo "🗄️ Setting up database..."
./setup-database.sh

# Build applications
echo "🔨 Building applications..."
npm run build

# Create logs directory
mkdir -p logs

# Start PM2 services
echo "🚀 Starting PM2 services..."
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Show status
echo "📊 Service status:"
pm2 status

echo ""
echo "✅ Setup complete!"
echo "🌐 Your app should be running at:"
echo "   - Frontend: http://your-droplet-ip"
echo "   - API: http://your-droplet-ip/api"
echo "   - MinIO Console: http://your-droplet-ip:9001"

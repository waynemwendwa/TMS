#!/bin/bash

# TMS Deployment Script for Render
# This script helps prepare your application for Render deployment

set -e

echo "🚀 Preparing TMS for Render deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the TMS root directory"
    exit 1
fi

# 1. Install dependencies
print_status "Installing dependencies..."
npm install

# 2. Build all packages
print_status "Building packages..."
npm run build:db
npm run build:api
npm run build:web

# 3. Check if build was successful
if [ $? -eq 0 ]; then
    print_status "Build completed successfully!"
else
    print_error "Build failed. Please check the errors above."
    exit 1
fi

# 4. Create production environment file template
print_status "Creating production environment template..."
cat > .env.production << EOF
# Production Environment Variables for Render
# Copy these to your Render service environment variables

# Database
DATABASE_URL=postgresql://username:password@host:5432/database

# API
NODE_ENV=production
PORT=10000
JWT_SECRET=your_super_secure_jwt_secret_here
JWT_EXPIRES_IN=7d

# Frontend
NEXT_PUBLIC_API_URL=https://your-api-service.onrender.com

# AWS S3 (for file storage)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-s3-bucket-name
EOF

# 5. Create render.yaml if it doesn't exist
if [ ! -f "render.yaml" ]; then
    print_status "Creating render.yaml configuration..."
    cat > render.yaml << 'EOF'
services:
  # PostgreSQL Database
  - type: pserv
    name: tms-database
    env: postgres
    plan: starter
    region: oregon

  # Backend API
  - type: web
    name: tms-api
    env: node
    plan: starter
    region: oregon
    buildCommand: npm run build:api
    startCommand: cd apps/api && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: DATABASE_URL
        fromDatabase:
          name: tms-database
          property: connectionString
      - key: JWT_SECRET
        generateValue: true
      - key: JWT_EXPIRES_IN
        value: 7d
    healthCheckPath: /api/health

  # Frontend Web App
  - type: web
    name: tms-web
    env: node
    plan: starter
    region: oregon
    buildCommand: npm run build:web
    startCommand: cd apps/web && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: NEXT_PUBLIC_API_URL
        fromService:
          type: web
          name: tms-api
          envVarKey: RENDER_EXTERNAL_URL
EOF
    print_status "render.yaml created!"
fi

# 6. Check for common issues
print_status "Running pre-deployment checks..."

# Check if all required files exist
required_files=(
    "apps/api/dist/index.js"
    "apps/web/.next"
    "packages/db/dist/client.js"
)

for file in "${required_files[@]}"; do
    if [ ! -e "$file" ]; then
        print_error "Required file/directory missing: $file"
        print_error "Please run the build process first"
        exit 1
    fi
done

# Check for environment variables in code
if grep -r "process.env" apps/api/src/ | grep -v "NODE_ENV\|PORT\|DATABASE_URL\|JWT_SECRET\|JWT_EXPIRES_IN" > /dev/null; then
    print_warning "Found additional environment variables in API code"
    print_warning "Make sure to add them to your Render service configuration"
fi

# 7. Create deployment checklist
print_status "Creating deployment checklist..."
cat > DEPLOYMENT_CHECKLIST.md << 'EOF'
# TMS Render Deployment Checklist

## Pre-Deployment
- [ ] Code is committed to GitHub
- [ ] All tests pass locally
- [ ] Build process completes successfully
- [ ] Environment variables are documented

## Render Setup
- [ ] Create Render account
- [ ] Connect GitHub repository
- [ ] Create PostgreSQL database service
- [ ] Create API web service
- [ ] Create Frontend web service
- [ ] Configure environment variables
- [ ] Set up custom domain (optional)

## Post-Deployment
- [ ] Test API health endpoint
- [ ] Test frontend loads correctly
- [ ] Test user authentication
- [ ] Test file upload functionality
- [ ] Test file download/view functionality
- [ ] Test database operations
- [ ] Set up monitoring and alerts

## File Storage Migration
- [ ] Set up AWS S3 bucket (or alternative)
- [ ] Update upload configuration
- [ ] Test file upload with cloud storage
- [ ] Migrate existing files (if any)

## Security
- [ ] Use strong JWT secrets
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Regular security updates

## Monitoring
- [ ] Set up log monitoring
- [ ] Configure health checks
- [ ] Set up error tracking
- [ ] Monitor performance metrics
EOF

print_status "Deployment preparation completed!"
print_warning "Next steps:"
echo "1. Review .env.production and update with your values"
echo "2. Commit all changes to GitHub"
echo "3. Go to render.com and create your services"
echo "4. Follow the DEPLOYMENT.md guide"
echo "5. Use DEPLOYMENT_CHECKLIST.md to track progress"

print_status "Good luck with your deployment! 🚀"

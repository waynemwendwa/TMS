# TMS Deployment Guide for Render

This guide will walk you through deploying your Tender Management System (TMS) to Render, a modern cloud platform that's perfect for full-stack applications.

## 🏗️ Architecture Overview

Your TMS consists of:
- **Frontend**: Next.js app (React)
- **Backend**: Node.js/Express API
- **Database**: PostgreSQL
- **File Storage**: Local file system (will migrate to cloud storage)

## 📋 Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **GitHub Repository**: Your code should be in a GitHub repo
3. **Environment Variables**: Prepare your production environment variables

## 🚀 Step-by-Step Deployment

### 1. Prepare Your Repository

#### 1.1 Update package.json Scripts
Ensure your root `package.json` has these scripts:
```json
{
  "scripts": {
    "build": "./build.sh",
    "start": "concurrently \"npm run start:api\" \"npm run start:web\"",
    "start:api": "cd apps/api && npm start",
    "start:web": "cd apps/web && npm start"
  }
}
```

#### 1.2 Create Production Build Script
Update your `build.sh` to handle production builds:
```bash
#!/bin/bash
set -e

echo "🏗️ Building TMS for production..."

# Install dependencies
npm install

# Build database package
npm run build:db

# Build API
npm run build:api

# Build web app
npm run build:web

echo "✅ Build completed successfully!"
```

#### 1.3 Create Render Configuration
Create `render.yaml` in your root directory:
```yaml
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
```

### 2. Environment Variables Setup

#### 2.1 Database Environment Variables
For your PostgreSQL service:
```env
POSTGRES_USER=tms
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=tms
```

#### 2.2 API Environment Variables
```env
NODE_ENV=production
PORT=10000
DATABASE_URL=postgresql://tms:password@host:5432/tms
JWT_SECRET=your_super_secure_jwt_secret
JWT_EXPIRES_IN=7d
```

#### 2.3 Frontend Environment Variables
```env
NODE_ENV=production
PORT=10000
NEXT_PUBLIC_API_URL=https://your-api-service.onrender.com
```

### 3. Database Migration Strategy

#### 3.1 Create Migration Script
Create `migrate-db.sh`:
```bash
#!/bin/bash
set -e

echo "🔄 Running database migrations..."

cd packages/db
npx prisma migrate deploy
npx prisma generate

echo "✅ Database migrations completed!"
```

#### 3.2 Update API Build Process
Modify your API build to include migrations:
```bash
# In apps/api/package.json
{
  "scripts": {
    "build": "tsc -p tsconfig.json && npm run migrate",
    "migrate": "cd ../../packages/db && npx prisma migrate deploy && npx prisma generate"
  }
}
```

### 4. File Storage Migration

#### 4.1 Current Issue
Your current setup uses local file storage (`/uploads/documents/`), which won't work on Render because:
- Render's file system is ephemeral
- Files are lost on every deployment
- No persistent storage

#### 4.2 Solution: Migrate to Cloud Storage

**Option A: AWS S3 (Recommended)**
```bash
npm install aws-sdk multer-s3
```

Update your upload route:
```typescript
import AWS from 'aws-sdk';
import multerS3 from 'multer-s3';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET,
    key: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, `documents/${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|jpg|jpeg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, DOCX, JPG, JPEG, and PNG files are allowed'));
    }
  }
});
```

**Option B: Render Disk (Temporary)**
For quick deployment, you can use Render's disk storage, but files will be lost on deployments.

### 5. Deployment Steps

#### 5.1 Connect Repository
1. Go to [render.com](https://render.com)
2. Click "New +" → "Blueprint"
3. Connect your GitHub repository
4. Select your repository

#### 5.2 Deploy Database
1. Create a new PostgreSQL service
2. Name it `tms-database`
3. Choose the `starter` plan
4. Note the connection string

#### 5.3 Deploy API
1. Create a new Web Service
2. Connect to your repository
3. Configure:
   - **Build Command**: `npm run build:api`
   - **Start Command**: `cd apps/api && npm start`
   - **Environment**: Node
   - **Plan**: Starter

4. Add environment variables:
   - `NODE_ENV=production`
   - `PORT=10000`
   - `DATABASE_URL` (from your database service)
   - `JWT_SECRET` (generate a secure secret)
   - `JWT_EXPIRES_IN=7d`

#### 5.4 Deploy Frontend
1. Create another Web Service
2. Configure:
   - **Build Command**: `npm run build:web`
   - **Start Command**: `cd apps/web && npm start`
   - **Environment**: Node
   - **Plan**: Starter

3. Add environment variables:
   - `NODE_ENV=production`
   - `PORT=10000`
   - `NEXT_PUBLIC_API_URL` (your API service URL)

### 6. Custom Domain Setup

#### 6.1 Add Custom Domain
1. Go to your service settings
2. Click "Custom Domains"
3. Add your domain (e.g., `api.yourdomain.com`)
4. Follow DNS configuration instructions

#### 6.2 SSL Certificate
Render automatically provides SSL certificates for custom domains.

### 7. Monitoring and Logs

#### 7.1 View Logs
- Go to your service dashboard
- Click "Logs" tab
- Monitor real-time logs

#### 7.2 Health Checks
Your API already has a health check endpoint at `/api/health`.

### 8. Production Optimizations

#### 8.1 Performance
- Enable gzip compression
- Set up CDN for static assets
- Optimize database queries
- Implement caching

#### 8.2 Security
- Use environment variables for secrets
- Enable CORS properly
- Implement rate limiting
- Regular security updates

#### 8.3 Scaling
- Upgrade to higher plans as needed
- Implement horizontal scaling
- Use load balancers for multiple instances

### 9. Backup Strategy

#### 9.1 Database Backups
- Render provides automatic PostgreSQL backups
- Set up additional backup strategies
- Test restore procedures

#### 9.2 File Backups
- If using S3, enable versioning
- Set up cross-region replication
- Regular backup testing

### 10. Troubleshooting

#### 10.1 Common Issues
- **Build Failures**: Check build logs and dependencies
- **Database Connection**: Verify DATABASE_URL format
- **File Upload Issues**: Check cloud storage configuration
- **CORS Errors**: Verify API URL configuration

#### 10.2 Debug Commands
```bash
# Check service status
curl https://your-api.onrender.com/api/health

# Test database connection
curl https://your-api.onrender.com/api/inventory

# Check frontend
curl https://your-web.onrender.com
```

## 🎯 Final Checklist

- [ ] Repository is connected to Render
- [ ] Database service is running
- [ ] API service is deployed and healthy
- [ ] Frontend service is deployed
- [ ] Environment variables are set
- [ ] File storage is configured
- [ ] Custom domain is set up (optional)
- [ ] SSL certificate is active
- [ ] Monitoring is in place
- [ ] Backup strategy is implemented

## 💰 Cost Estimation

**Render Pricing (as of 2024):**
- **PostgreSQL Starter**: $7/month
- **Web Service Starter**: $7/month × 2 = $14/month
- **Total**: ~$21/month

**Additional Costs:**
- **AWS S3**: ~$1-5/month (depending on usage)
- **Custom Domain**: Free (you provide the domain)
- **SSL Certificate**: Free (provided by Render)

## 🚀 Next Steps

1. **Immediate**: Deploy with local file storage
2. **Short-term**: Migrate to AWS S3
3. **Long-term**: Implement advanced features like:
   - Redis caching
   - CDN for static assets
   - Advanced monitoring
   - Auto-scaling

Your TMS is now ready for production deployment on Render! 🎉

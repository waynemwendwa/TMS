# 🚀 Quick Render Deployment Guide

## TL;DR - Deploy in 15 minutes

### 1. Prepare Your Code
```bash
# Run the deployment preparation script
./deploy-to-render.sh

# Commit everything to GitHub
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### 2. Create Render Services

#### Step 1: Database
1. Go to [render.com](https://render.com) → "New +" → "PostgreSQL"
2. Name: `tms-database`
3. Plan: `Starter` ($7/month)
4. Click "Create Database"
5. **Copy the connection string** (you'll need it)

#### Step 2: API Service
1. "New +" → "Web Service"
2. Connect GitHub repo
3. Configure:
   - **Name**: `tms-api`
   - **Build Command**: `npm run build:api`
   - **Start Command**: `cd apps/api && npm start`
   - **Plan**: `Starter` ($7/month)

4. Environment Variables:
   ```
   NODE_ENV=production
   PORT=10000
   DATABASE_URL=<paste from database>
   JWT_SECRET=<generate secure secret>
   JWT_EXPIRES_IN=7d
   ```

5. Click "Create Web Service"

#### Step 3: Frontend Service
1. "New +" → "Web Service"
2. Connect same GitHub repo
3. Configure:
   - **Name**: `tms-web`
   - **Build Command**: `npm run build:web`
   - **Start Command**: `cd apps/web && npm start`
   - **Plan**: `Starter` ($7/month)

4. Environment Variables:
   ```
   NODE_ENV=production
   PORT=10000
   NEXT_PUBLIC_API_URL=https://tms-api.onrender.com
   ```

5. Click "Create Web Service"

### 3. Test Your Deployment

#### Test API
```bash
curl https://tms-api.onrender.com/api/health
# Should return: {"status":"ok"}
```

#### Test Frontend
Visit: `https://tms-web.onrender.com`

### 4. Fix File Storage (Important!)

**Current Issue**: Files are stored locally and will be lost on deployments.

**Quick Fix**: Update your upload route to use a cloud service.

#### Option A: AWS S3 (Recommended)
1. Create AWS S3 bucket
2. Get access keys
3. Add to API environment variables:
   ```
   AWS_ACCESS_KEY_ID=your_key
   AWS_SECRET_ACCESS_KEY=your_secret
   AWS_REGION=us-east-1
   AWS_S3_BUCKET=your-bucket-name
   ```

#### Option B: Temporary Fix
For now, files will work but be lost on deployments. This is fine for testing.

### 5. Custom Domain (Optional)

1. Go to your service settings
2. Click "Custom Domains"
3. Add your domain
4. Update DNS records as instructed

## 🎯 What You'll Have

- **Frontend**: `https://tms-web.onrender.com`
- **API**: `https://tms-api.onrender.com`
- **Database**: Managed PostgreSQL
- **Cost**: ~$21/month

## 🚨 Common Issues & Fixes

### Build Fails
- Check build logs in Render dashboard
- Ensure all dependencies are in package.json
- Run `npm install` locally to test

### Database Connection Error
- Verify DATABASE_URL format
- Check if database service is running
- Ensure connection string is correct

### CORS Errors
- Update CORS settings in API
- Check NEXT_PUBLIC_API_URL is correct

### File Upload Not Working
- Files are stored locally (will be lost)
- Implement cloud storage for production

## 📞 Need Help?

1. Check Render logs in dashboard
2. Test locally first
3. Verify environment variables
4. Check the full DEPLOYMENT.md guide

## 🎉 Success!

Once deployed, your TMS will be accessible worldwide with:
- ✅ User authentication
- ✅ Document management
- ✅ Inventory tracking
- ✅ Persistent data storage
- ✅ Automatic SSL certificates
- ✅ 99.9% uptime SLA

**Total setup time**: ~15 minutes
**Monthly cost**: ~$21
**Global availability**: Yes!

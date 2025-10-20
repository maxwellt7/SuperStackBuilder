# SuperStackBuilder - Railway Deployment Quick Start

✅ **Your code is now on GitHub and ready for Railway!**

Repository: https://github.com/maxwellt7/SuperStackBuilder

---

## 🚀 Quick Deployment Steps

### 1. Create Railway Project (2 minutes)
1. Go to [railway.app](https://railway.app) and sign in
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select **maxwellt7/SuperStackBuilder**
4. Railway will start building automatically

### 2. Add PostgreSQL Database (1 minute)
1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"Add PostgreSQL"**
3. `DATABASE_URL` will be auto-configured ✅

### 3. Get Your API Keys (5 minutes)

#### Anthropic (Claude AI)
- Visit: https://console.anthropic.com
- Go to API Keys → Create Key
- Copy the key: `sk-ant-api03-...`

#### Cohere (Embeddings)
- Visit: https://dashboard.cohere.com
- Go to API Keys
- Copy your key

#### Clerk (Authentication) - **NEW!**
- Visit: https://dashboard.clerk.com
- Create a new application
- Go to API Keys and copy **both**:
  - **Publishable Key**: `pk_test_...`
  - **Secret Key**: `sk_test_...`

#### MongoDB Atlas (Vector Search)
- Visit: https://cloud.mongodb.com
- Go to your cluster → Connect → Connect your application
- Copy connection string
- Replace `<password>` with your actual password
- Ensure it ends with `/mindgrowth`

### 4. Set Environment Variables (3 minutes)
In Railway → Your Service → **Variables** tab, add:

```bash
# AI APIs
ANTHROPIC_API_KEY=sk-ant-api03-your-key
COHERE_API_KEY=your-cohere-key

# Clerk Authentication
CLERK_SECRET_KEY=sk_test_your-secret-key
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your-publishable-key

# MongoDB
MONGODB_ATLAS_URI=mongodb+srv://user:pass@cluster.mongodb.net/mindgrowth

# System (Railway sets these automatically)
NODE_ENV=production
PORT=5000
```

**Note**: `DATABASE_URL` is automatically set by Railway PostgreSQL - don't add it manually!

### 5. Push Database Schema (2 minutes)
After Railway completes its first deployment:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and link to your project
railway login
railway link

# Push database schema
railway run npm run db:push
```

### 6. Configure MongoDB Vector Search (5 minutes)
1. In MongoDB Atlas → **Atlas Search** tab
2. Click **"Create Search Index"** → **"JSON Editor"**
3. Database: `mindgrowth`, Collection: `message_embeddings`
4. Index name: `vector_index`
5. Paste this config:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 1024,
      "similarity": "dotProduct"
    },
    {
      "type": "filter",
      "path": "userId"
    },
    {
      "type": "filter",
      "path": "sessionId"
    }
  ]
}
```

6. Wait for status to become **"Active"** (~2 minutes)

### 7. Configure Clerk Domain (1 minute)
1. In Clerk Dashboard → **Domains**
2. Add your Railway domain (e.g., `your-app.railway.app`)
3. Clerk will automatically handle authentication

### 8. Test Your Deployment! 🎉
1. Visit your Railway URL
2. Click **"Get Started"** - you should see Clerk's sign-up modal
3. Create an account
4. Start your first Stack session!

---

## ✅ Deployment Checklist

- [ ] Railway project created from GitHub
- [ ] PostgreSQL database added
- [ ] All API keys configured in Railway
- [ ] Database schema pushed with `railway run npm run db:push`
- [ ] MongoDB Atlas connected
- [ ] MongoDB Vector Search index created and **Active**
- [ ] Clerk domain added to dashboard
- [ ] App is accessible at Railway URL
- [ ] Can sign up/sign in with Clerk
- [ ] Can create and complete a Stack session

---

## 🎨 What Changed: Clerk Authentication

Your app now uses **Clerk** instead of Replit Auth:

### ✅ Benefits
- **Production-ready**: Enterprise-grade authentication
- **Beautiful UI**: Pre-built, customizable sign-in/sign-up
- **Social logins**: Add Google, GitHub, etc. with one click
- **Security**: 2FA, passwordless, session management included
- **No backend work**: Clerk handles everything

### 🔧 What Was Changed
- ✅ Installed `@clerk/express`, `@clerk/clerk-react`, `@clerk/backend`
- ✅ Created `server/clerkAuth.ts` middleware
- ✅ Updated all backend routes to use Clerk authentication
- ✅ Wrapped React app with `<ClerkProvider>`
- ✅ Replaced all login/logout buttons with Clerk components
- ✅ Auto-sync Clerk users to PostgreSQL database

### 🚫 What Was Removed
- ❌ Replit Auth dependencies
- ❌ `server/replitAuth.ts`
- ❌ Session management code (Clerk handles it)
- ❌ `/api/login` and `/api/logout` endpoints

---

## 📚 Useful Resources

- **Full Deployment Guide**: See `RAILWAY_DEPLOYMENT.md`
- **MongoDB Vector Setup**: See `MONGODB_VECTOR_SETUP.md`
- **Environment Variables**: See `ENV_TEMPLATE.md`
- **Clerk Docs**: https://clerk.com/docs
- **Railway Docs**: https://docs.railway.app

---

## 🆘 Quick Troubleshooting

### Build Fails
- Check Railway logs for specific errors
- Ensure all environment variables are set
- Verify keys don't have extra spaces

### Can't Sign In
- Verify `CLERK_SECRET_KEY` and `VITE_CLERK_PUBLISHABLE_KEY` match
- Check Railway domain is added in Clerk Dashboard → Domains
- Try in incognito mode to rule out cache issues

### Database Connection Issues
- Verify MongoDB connection string has correct password
- Ensure PostgreSQL is connected in Railway
- Run `railway run npm run db:push` to initialize schema

### Vector Search Not Working
- Check MongoDB Atlas index status is "Active"
- Verify `COHERE_API_KEY` is valid
- First Stack session will create the collection automatically

---

## 💰 Estimated Monthly Cost

- **Railway**: $5-10 (Hobby plan + PostgreSQL)
- **MongoDB Atlas**: Free (M0 tier)
- **Anthropic API**: Pay per use (~$0.01-0.10 per Stack session)
- **Cohere**: Free tier (50 API calls/minute)
- **Clerk**: Free (up to 10,000 monthly active users)

**Total**: ~$5-15/month for low-medium traffic

---

## 🎉 You're All Set!

Your SuperStackBuilder app is now:
- ✅ Deployed to Railway
- ✅ Using production-grade authentication
- ✅ Connected to PostgreSQL and MongoDB
- ✅ Powered by AI (Claude + Cohere)
- ✅ Ready for users!

**Next Steps**:
1. Test the full user journey
2. Add social logins in Clerk (optional)
3. Set up custom domain (optional)
4. Monitor usage and costs
5. Share your app! 🚀

---

Good luck! 🎊


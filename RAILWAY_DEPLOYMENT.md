# Railway Deployment Guide for SuperStackBuilder

This guide will walk you through deploying SuperStackBuilder to Railway.

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Repository**: Your code should be pushed to GitHub (✅ Done!)
3. **Database Services**: MongoDB Atlas and PostgreSQL accounts

---

## Step 1: Create a New Railway Project

1. Go to [railway.app](https://railway.app) and log in
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your **maxwellt7/SuperStackBuilder** repository
5. Railway will automatically detect it's a Node.js app

---

## Step 2: Add PostgreSQL Database

Your app uses PostgreSQL for user data and sessions.

1. In your Railway project, click **"+ New"**
2. Select **"Database" → "Add PostgreSQL"**
3. Railway will automatically:
   - Create a PostgreSQL database
   - Add a `DATABASE_URL` environment variable to your app
4. ✅ PostgreSQL is now connected!

### Initialize Database Schema

After deployment, you'll need to push your Drizzle schema:

```bash
# Install Railway CLI locally
npm install -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link

# Push database schema
railway run npm run db:push
```

---

## Step 3: Configure Environment Variables

Your app requires several API keys and configuration values. In Railway:

1. Go to your service → **"Variables"** tab
2. Add the following environment variables:

### Required Environment Variables

#### Database & Storage
```bash
# DATABASE_URL - Automatically set by Railway PostgreSQL
# Don't manually set this if you added PostgreSQL from Railway

MONGODB_ATLAS_URI=mongodb+srv://username:password@cluster.mongodb.net/mindgrowth?retryWrites=true&w=majority
```

#### AI Services
```bash
ANTHROPIC_API_KEY=sk-ant-api03-...  # Get from console.anthropic.com
COHERE_API_KEY=...                  # Get from dashboard.cohere.com
```

#### Authentication (Replit Auth)
```bash
SESSION_SECRET=your-super-secret-random-string-here-min-32-chars

# For Replit Auth (if continuing to use it)
REPLIT_DOMAINS=your-railway-domain.railway.app
REPL_ID=your-repl-id  # From your Replit project
ISSUER_URL=https://replit.com/oidc  # Optional, defaults to this
```

#### Other
```bash
NODE_ENV=production
PORT=5000  # Railway sets this automatically, but can be explicit
```

---

## Step 4: Get API Keys

### Anthropic API Key
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign in/up
3. Go to **API Keys** → **Create Key**
4. Copy the key starting with `sk-ant-api03-...`

### Cohere API Key
1. Go to [dashboard.cohere.com](https://dashboard.cohere.com)
2. Sign in/up
3. Navigate to **API Keys**
4. Copy your API key

### MongoDB Atlas URI
1. Go to [cloud.mongodb.com](https://cloud.mongodb.com)
2. Navigate to your cluster
3. Click **"Connect"** → **"Connect your application"**
4. Copy the connection string
5. Replace `<password>` with your actual password
6. Ensure database name is `mindgrowth`

---

## Step 5: MongoDB Atlas Vector Search Setup

Your app uses MongoDB for semantic search. You need to create a vector search index:

1. In MongoDB Atlas, go to your cluster
2. Click **"Atlas Search"** tab
3. Click **"Create Search Index"** → **"JSON Editor"**
4. Select:
   - **Database**: `mindgrowth`
   - **Collection**: `message_embeddings`
   - **Index Name**: `vector_index`

5. Paste this configuration:
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
    },
    {
      "type": "filter",
      "path": "metadata.stackType"
    },
    {
      "type": "filter",
      "path": "metadata.core4Domain"
    },
    {
      "type": "filter",
      "path": "createdAt"
    }
  ]
}
```

6. Click **"Create Search Index"**
7. Wait for status to become **"Active"** (~1-2 minutes)

See `MONGODB_VECTOR_SETUP.md` for more details.

---

## Step 6: Authentication Considerations

Your app currently uses **Replit Auth**. For Railway, you have two options:

### Option A: Continue Using Replit Auth (Quick)
1. Keep your Replit project active
2. Set `REPLIT_DOMAINS` to your Railway domain
3. Update `REPL_ID` with your Replit project ID
4. ⚠️ Users will still authenticate through Replit

### Option B: Switch to Standard Auth (Recommended)
Consider migrating to a standard auth provider:
- **Auth0**: Enterprise-grade, easy integration
- **Clerk**: Developer-friendly, great UX
- **NextAuth.js**: Open source, flexible
- **Passport.js** with local strategy: Self-hosted

For production apps, switching to a standard auth provider is recommended.

---

## Step 7: Deploy!

1. After adding all environment variables, Railway will automatically redeploy
2. Watch the **"Deployments"** tab for build progress
3. Once deployed, click **"View Logs"** to monitor startup
4. Your app will be available at: `https://your-project.railway.app`

---

## Step 8: Set Up Custom Domain (Optional)

1. In Railway, go to **"Settings"** → **"Domains"**
2. Click **"Generate Domain"** or **"Custom Domain"**
3. Follow Railway's instructions to configure DNS
4. Update `REPLIT_DOMAINS` environment variable with your new domain

---

## Post-Deployment Checklist

- [ ] PostgreSQL database connected
- [ ] Database schema pushed (`railway run npm run db:push`)
- [ ] MongoDB Atlas connected and accessible
- [ ] MongoDB Vector Search index created and active
- [ ] All API keys configured
- [ ] `SESSION_SECRET` set (min 32 random characters)
- [ ] Auth domains configured correctly
- [ ] App deploys successfully
- [ ] Can access the landing page
- [ ] Can log in (test authentication)
- [ ] Can create a Stack session (test full flow)

---

## Troubleshooting

### Build Fails
```bash
# Check Railway logs for specific error
# Common issues:
# - Missing environment variables
# - Node version mismatch
```

### Database Connection Issues
```bash
# Verify DATABASE_URL is set
# Test connection: railway run npm run db:push
```

### Auth Errors
```bash
# Check REPLIT_DOMAINS matches your Railway domain
# Verify SESSION_SECRET is set
# Check REPL_ID is correct
```

### MongoDB Vector Search Not Working
```bash
# Ensure vector index is "Active" in Atlas
# Verify COHERE_API_KEY is valid
# Check MongoDB connection string has correct credentials
```

### Check Logs
```bash
# In Railway dashboard
railway logs

# Or link locally and run
railway logs --follow
```

---

## Cost Considerations

**Railway:**
- Free tier: $5/month in credits
- Hobby plan: $5/month + usage
- PostgreSQL: ~$5-10/month

**External Services:**
- MongoDB Atlas: Free tier (M0) available
- Anthropic API: Pay per token usage
- Cohere: Free tier available

**Total estimated cost**: $10-20/month for low traffic

---

## Environment Variable Template

Copy this template to keep track of your values:

```bash
# Database
DATABASE_URL=                    # Auto-set by Railway PostgreSQL
MONGODB_ATLAS_URI=              # From MongoDB Atlas

# AI APIs
ANTHROPIC_API_KEY=              # From console.anthropic.com
COHERE_API_KEY=                 # From dashboard.cohere.com

# Auth & Security
SESSION_SECRET=                 # Generate: openssl rand -base64 32
REPLIT_DOMAINS=                 # Your Railway domain
REPL_ID=                        # From Replit (if using Replit Auth)
ISSUER_URL=https://replit.com/oidc  # Optional

# System
NODE_ENV=production
PORT=5000                       # Auto-set by Railway
```

---

## Next Steps

1. **Monitor**: Watch Railway logs for any errors
2. **Test**: Go through the full user journey
3. **Scale**: Enable autoscaling if needed
4. **Backup**: Set up automated backups for PostgreSQL
5. **Analytics**: Consider adding error tracking (Sentry, LogRocket)

---

## Support Resources

- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **Railway Discord**: [discord.gg/railway](https://discord.gg/railway)
- **Your Repo**: [github.com/maxwellt7/SuperStackBuilder](https://github.com/maxwellt7/SuperStackBuilder)

---

Good luck with your deployment! 🚀


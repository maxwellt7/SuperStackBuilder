# Environment Variables Template

Copy this template to create your `.env` file for local development or configure these variables in your Railway dashboard for production.

## Database Configuration

```bash
# PostgreSQL connection string (auto-set by Railway if using their PostgreSQL)
DATABASE_URL=postgresql://user:password@host:5432/database

# MongoDB Atlas connection string for vector search
MONGODB_ATLAS_URI=mongodb+srv://username:password@cluster.mongodb.net/mindgrowth?retryWrites=true&w=majority
```

## AI Service API Keys

```bash
# Anthropic API Key
# Get from: https://console.anthropic.com
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here

# Cohere API Key
# Get from: https://dashboard.cohere.com
COHERE_API_KEY=your-cohere-key-here
```

## Clerk Authentication

```bash
# Clerk Secret Key (Backend)
# Get from: https://dashboard.clerk.com/last-active?path=api-keys
CLERK_SECRET_KEY=sk_test_your-secret-key-here

# Clerk Publishable Key (Frontend - for Vite)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your-publishable-key-here
```

## Application Configuration

```bash
NODE_ENV=development  # Use 'production' in Railway
PORT=5000
```

## Notes

- **Never commit your `.env` file** - it's already in `.gitignore`
- For Railway deployment, add these variables in the Railway dashboard under your service's Variables tab
- Clerk keys must match (same project) - get both from the same Clerk dashboard
- MongoDB URI should include the database name `mindgrowth`


# MongoDB Atlas Vector Search Setup Instructions

## Overview
MindGrowth now uses MongoDB Atlas Vector Search instead of Pinecone for semantic search and insights. This guide will help you create the required vector search index.

## Prerequisites
✅ MongoDB Atlas connection working
✅ Database: `mindgrowth`
✅ Collection: `message_embeddings` (created automatically)

## Create Vector Search Index

### Step 1: Access MongoDB Atlas
1. Go to https://cloud.mongodb.com
2. Navigate to your cluster
3. Click **"Atlas Search"** tab

### Step 2: Create Vector Search Index
1. Click **"Create Search Index"**
2. Select **"JSON Editor"**
3. Click **"Next"**

### Step 3: Configure Index
**Database:** `mindgrowth`
**Collection:** `message_embeddings`
**Index Name:** `vector_index`

**Paste this JSON configuration:**
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

### Step 4: Create and Wait
1. Click **"Create Search Index"**
2. Wait for status to become **"Active"** (usually 1-2 minutes)
3. ✅ Your vector search is now ready!

## What This Enables

With the vector search index active, MindGrowth can:

- **Semantic Search**: Find messages by meaning, not just keywords
- **Pattern Analysis**: Discover recurring themes across Stack sessions
- **Cognitive Insights**: Identify belief patterns and emotional triggers
- **Similar Messages**: Find related reflections from past sessions
- **Personalized Recommendations**: AI-powered growth suggestions

## Technical Details

- **Embedding Model**: Cohere embed-english-v3.0
- **Vector Dimensions**: 1024
- **Similarity Metric**: Dot Product (optimized for Cohere embeddings)
- **Filters**: userId, sessionId, stackType, core4Domain, timestamp

## Verify Index Creation

Once the index status shows **"Active"**, your MindGrowth app will automatically:
- Generate embeddings for all new Stack messages
- Enable semantic search in the Insights page
- Power pattern analysis in Advanced Analytics
- Generate personalized recommendations

No code changes needed - the migration is complete!

## Troubleshooting

**Index creation failed?**
- Ensure collection `message_embeddings` exists (it's created on first Stack session)
- Verify you have Atlas Search enabled on your cluster (free tier M0 supports it!)

**Index shows "Building"?**
- This is normal, wait 1-2 minutes for it to become "Active"

**App errors after setup?**
- Restart the MindGrowth application
- Check that index name is exactly `vector_index`
- Verify dimensions are `1024` (not 1536 or other values)

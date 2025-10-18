import { MongoClient, Collection, Document } from 'mongodb';
import { CohereClient } from 'cohere-ai';

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY || '',
});

let mongoClient: MongoClient | null = null;
const COLLECTION_NAME = 'message_embeddings';
const DIMENSION = 1024; // Cohere embed-english-v3.0 dimension

interface VectorDocument {
  _id: string;
  embedding: number[];
  userId: string;
  sessionId: string;
  content: string;
  metadata: Record<string, any>;
  createdAt: Date;
}

export async function initMongoDB() {
  if (mongoClient) return mongoClient;

  const uri = process.env.MONGODB_ATLAS_URI;
  if (!uri) {
    throw new Error('MONGODB_ATLAS_URI environment variable is not set');
  }

  mongoClient = new MongoClient(uri);
  await mongoClient.connect();
  
  console.log('✅ Connected to MongoDB Atlas');
  
  // Create vector search index if needed
  // Note: Vector search indexes must be created via Atlas UI or API
  // They cannot be created programmatically via the driver
  console.log('ℹ️  Vector search index must be created in Atlas UI');
  console.log('ℹ️  Index name: vector_index');
  console.log('ℹ️  Field: embedding');
  console.log('ℹ️  Dimensions: 1024');
  console.log('ℹ️  Similarity: dotProduct');

  return mongoClient;
}

export function getCollection(): Collection<VectorDocument> {
  if (!mongoClient) {
    throw new Error('MongoDB client not initialized. Call initMongoDB() first.');
  }
  
  const db = mongoClient.db('mindgrowth');
  return db.collection<VectorDocument>(COLLECTION_NAME);
}

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // Use Cohere's embed API for high-quality semantic embeddings
    const response = await cohere.embed({
      texts: [text.substring(0, 8000)], // Limit to avoid token limits
      model: 'embed-english-v3.0',
      inputType: 'search_document',
      embeddingTypes: ['float'],
    });

    // Cohere returns embeddings in response.embeddings
    let embedding: number[] | undefined;
    
    if (typeof response.embeddings === 'object' && response.embeddings !== null && 'float' in response.embeddings) {
      embedding = (response.embeddings as any).float?.[0];
    } else if (Array.isArray(response.embeddings)) {
      embedding = response.embeddings[0];
    }
    
    if (!Array.isArray(embedding) || embedding.length !== DIMENSION) {
      throw new Error(`Invalid embedding dimension: ${embedding?.length}, expected ${DIMENSION}`);
    }
    
    return embedding;
  } catch (error) {
    console.error('Error generating embedding with Cohere:', error);
    throw error;
  }
}

export async function upsertMessageEmbedding(
  messageId: string,
  userId: string,
  sessionId: string,
  content: string,
  metadata: Record<string, any>
) {
  try {
    await initMongoDB();
    const collection = getCollection();
    
    const embedding = await generateEmbedding(content);
    
    const document: VectorDocument = {
      _id: messageId,
      embedding,
      userId,
      sessionId,
      content: content.substring(0, 500), // Store preview
      metadata,
      createdAt: new Date(),
    };
    
    await collection.updateOne(
      { _id: messageId },
      { $set: document },
      { upsert: true }
    );
    
    console.log(`✅ Upserted embedding for message ${messageId}`);
  } catch (error) {
    console.error('Error upserting message embedding:', error);
    // Don't throw - embedding failures shouldn't break the app
  }
}

export async function semanticSearch(
  userId: string,
  query: string,
  topK: number = 10,
  filter?: Record<string, any>
) {
  try {
    await initMongoDB();
    const collection = getCollection();
    
    const queryEmbedding = await generateEmbedding(query);
    
    // Build filter with userId
    const searchFilter: any = { userId };
    if (filter) {
      Object.assign(searchFilter, filter);
    }
    
    // MongoDB Atlas Vector Search using $vectorSearch aggregation
    const pipeline = [
      {
        $vectorSearch: {
          index: 'vector_index',
          path: 'embedding',
          queryVector: queryEmbedding,
          numCandidates: topK * 10, // Search more candidates for better results
          limit: topK,
          filter: searchFilter,
        },
      },
      {
        $project: {
          _id: 1,
          userId: 1,
          sessionId: 1,
          content: 1,
          metadata: 1,
          createdAt: 1,
          score: { $meta: 'vectorSearchScore' },
        },
      },
    ];
    
    const results = await collection.aggregate(pipeline).toArray();
    
    // Transform to Pinecone-compatible format
    return results.map((doc) => ({
      id: doc._id,
      score: doc.score,
      metadata: {
        userId: doc.userId,
        sessionId: doc.sessionId,
        content: doc.content,
        ...doc.metadata,
        timestamp: doc.createdAt?.toISOString(),
      },
    }));
  } catch (error) {
    console.error('Error performing semantic search:', error);
    return []; // Return empty results on error
  }
}

export async function findSimilarMessages(
  userId: string,
  messageContent: string,
  sessionId?: string,
  topK: number = 5
) {
  const filter = sessionId ? { sessionId: { $ne: sessionId } } : undefined;
  return await semanticSearch(userId, messageContent, topK, filter);
}

export async function analyzePatterns(userId: string, theme: string) {
  const results = await semanticSearch(userId, theme, 20);
  
  return results.map((match) => ({
    sessionId: match.metadata?.sessionId,
    content: match.metadata?.content,
    similarity: match.score,
    timestamp: match.metadata?.timestamp,
  }));
}

// Graceful shutdown
export async function closeMongoDB() {
  if (mongoClient) {
    await mongoClient.close();
    mongoClient = null;
    console.log('MongoDB connection closed');
  }
}

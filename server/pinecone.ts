import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

let pineconeClient: Pinecone | null = null;
const INDEX_NAME = 'mindgrowth-stacks';
const DIMENSION = 1536; // OpenAI text-embedding-3-small dimension

export async function initPinecone() {
  if (pineconeClient) return pineconeClient;

  pineconeClient = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY || '',
  });

  try {
    // Check if index exists
    const indexes = await pineconeClient.listIndexes();
    const indexExists = indexes.indexes?.some((idx) => idx.name === INDEX_NAME);

    if (!indexExists) {
      // Create index
      await pineconeClient.createIndex({
        name: INDEX_NAME,
        dimension: DIMENSION,
        metric: 'cosine',
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-east-1',
          },
        },
      });
      console.log(`Created Pinecone index: ${INDEX_NAME}`);
      
      // Wait for index to be ready
      let ready = false;
      let attempts = 0;
      const maxAttempts = 30;
      
      while (!ready && attempts < maxAttempts) {
        try {
          const indexDescription = await pineconeClient.describeIndex(INDEX_NAME);
          ready = indexDescription.status?.ready || false;
          
          if (!ready) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            attempts++;
          }
        } catch (err) {
          console.error('Error checking index readiness:', err);
          await new Promise(resolve => setTimeout(resolve, 2000));
          attempts++;
        }
      }
      
      if (!ready) {
        console.warn('Index may not be ready yet, proceeding anyway');
      } else {
        console.log(`Pinecone index ${INDEX_NAME} is ready`);
      }
    }
  } catch (error) {
    console.error('Error initializing Pinecone:', error);
    throw error;
  }

  return pineconeClient;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // Use OpenAI's text-embedding API for high-quality semantic embeddings
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text.substring(0, 8000), // Limit to avoid token limits
      encoding_format: 'float',
    });

    const embedding = response.data[0].embedding;
    
    if (!Array.isArray(embedding) || embedding.length !== DIMENSION) {
      throw new Error(`Invalid embedding dimension: ${embedding.length}, expected ${DIMENSION}`);
    }
    
    return embedding;
  } catch (error) {
    console.error('Error generating embedding with OpenAI:', error);
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
  const pinecone = await initPinecone();
  const index = pinecone.index(INDEX_NAME);
  
  const embedding = await generateEmbedding(content);
  
  await index.upsert([
    {
      id: messageId,
      values: embedding,
      metadata: {
        userId,
        sessionId,
        content: content.substring(0, 500), // Store preview
        ...metadata,
      },
    },
  ]);
}

export async function semanticSearch(
  userId: string,
  query: string,
  topK: number = 10,
  filter?: Record<string, any>
) {
  const pinecone = await initPinecone();
  const index = pinecone.index(INDEX_NAME);
  
  const queryEmbedding = await generateEmbedding(query);
  
  const searchFilter = {
    userId: { $eq: userId },
    ...filter,
  };
  
  const results = await index.query({
    vector: queryEmbedding,
    topK,
    filter: searchFilter,
    includeMetadata: true,
  });
  
  return results.matches || [];
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

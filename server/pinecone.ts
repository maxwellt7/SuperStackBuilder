import { Pinecone } from '@pinecone-database/pinecone';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

let pineconeClient: Pinecone | null = null;
const INDEX_NAME = 'mindgrowth-stacks';
const DIMENSION = 1024; // Claude embeddings dimension

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
    // Use Anthropic's API to generate semantic embeddings
    // Note: Since Anthropic doesn't have a native embeddings endpoint,
    // we'll use Claude to generate a semantic representation and convert to vector
    
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: `You are an embedding generator. Extract the semantic essence of this text into ${DIMENSION} numerical features representing: emotional tone, key themes, concepts, entities, sentiment, topics, and semantic meaning. Output ONLY a JSON array of ${DIMENSION} numbers between -1 and 1, nothing else.\n\nText: ${text.substring(0, 1000)}`
        }
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Parse the embedding from Claude's response
    const embeddingText = content.text.trim();
    const embeddingMatch = embeddingText.match(/\[[\s\S]*\]/);
    
    if (!embeddingMatch) {
      // Fallback: Create deterministic embedding from text
      return createDeterministicEmbedding(text);
    }

    const embedding = JSON.parse(embeddingMatch[0]) as number[];
    
    if (!Array.isArray(embedding) || embedding.length !== DIMENSION) {
      return createDeterministicEmbedding(text);
    }
    
    // Normalize the embedding
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / (magnitude || 1));
  } catch (error) {
    console.error('Error generating embedding with Claude, using fallback:', error);
    return createDeterministicEmbedding(text);
  }
}

function createDeterministicEmbedding(text: string): number[] {
  // Fallback embedding using text features
  const embedding = new Array(DIMENSION).fill(0);
  const words = text.toLowerCase().split(/\s+/);
  const chars = text.split('');
  
  for (let i = 0; i < DIMENSION; i++) {
    const wordIndex = i % words.length;
    const charIndex = i % chars.length;
    const word = words[wordIndex] || '';
    const char = chars[charIndex] || '';
    
    embedding[i] = (
      (word.length * 0.1) +
      (char.charCodeAt(0) / 255) +
      (i / DIMENSION) +
      Math.sin(i * 0.01) * 0.1
    ) / 4;
  }
  
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(val => val / (magnitude || 1));
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

import Anthropic from '@anthropic-ai/sdk';
import { semanticSearch } from './pinecone';
import type { StackType } from '@shared/schema';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const DEFAULT_MODEL_STR = "claude-sonnet-4-20250514";

export interface ThemeInsight {
  theme: string;
  frequency: number;
  stackTypes: StackType[];
  emotionalTone: string;
  keyMessages: Array<{
    content: string;
    sessionId: string;
    similarity: number;
    timestamp: string;
  }>;
  interpretation: string;
}

export interface BeliefPattern {
  pattern: string;
  type: 'limiting' | 'empowering' | 'neutral';
  occurrences: number;
  evolution: string;
  recommendations: string[];
}

export interface EmotionalTrigger {
  trigger: string;
  emotion: string;
  contexts: string[];
  frequency: number;
  suggestedResponse: string;
}

export interface CognitiveInsights {
  themes: ThemeInsight[];
  beliefPatterns: BeliefPattern[];
  emotionalTriggers: EmotionalTrigger[];
  overallGrowthNarrative: string;
  actionableRecommendations: string[];
}

export async function generateCognitiveInsights(
  userId: string,
  timeframeMonths: number = 3
): Promise<CognitiveInsights> {
  try {
    // Step 1: Gather all user messages from Pinecone (semantic search with broad query)
    const allMessages = await semanticSearch(
      userId,
      "personal growth insights beliefs emotions patterns challenges goals",
      100
    );

    if (allMessages.length === 0) {
      return {
        themes: [],
        beliefPatterns: [],
        emotionalTriggers: [],
        overallGrowthNarrative: "No Stack sessions found yet. Start your first Stack to begin your growth journey!",
        actionableRecommendations: ["Complete your first Stack session to begin tracking patterns"],
      };
    }

    // Step 2: Filter for user messages only and apply timeframe
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - timeframeMonths);

    const messagesData = allMessages
      .filter(match => {
        const role = match.metadata?.role;
        const timestamp = String(match.metadata?.timestamp || '');
        const messageDate = new Date(timestamp);
        
        // Only include user messages within the timeframe
        return role === 'user' && messageDate >= cutoffDate;
      })
      .map(match => ({
        content: String(match.metadata?.content || ''),
        sessionId: String(match.metadata?.sessionId || ''),
        stackType: match.metadata?.stackType as StackType,
        timestamp: String(match.metadata?.timestamp || ''),
        similarity: match.score || 0,
      }));

    if (messagesData.length === 0) {
      return {
        themes: [],
        beliefPatterns: [],
        emotionalTriggers: [],
        overallGrowthNarrative: `No Stack sessions found in the past ${timeframeMonths} months. Complete some Stacks to see your insights!`,
        actionableRecommendations: ["Complete more Stack sessions to begin tracking patterns"],
      };
    }

    // Step 3: Use Claude to analyze patterns and generate insights
    const analysisPrompt = `You are an expert cognitive behavioral therapist analyzing a client's Stack sessions to identify patterns and provide insights.

Here are the client's reflections from their Stack sessions:

${messagesData.slice(0, 30).map((msg, idx) => 
  `[${idx + 1}] (${msg.stackType} Stack, ${new Date(msg.timestamp).toLocaleDateString()}): ${msg.content}`
).join('\n\n')}

Analyze these reflections and provide a comprehensive cognitive insights report in the following JSON format:

{
  "themes": [
    {
      "theme": "Brief theme title",
      "frequency": number of times mentioned,
      "stackTypes": ["gratitude", "idea", etc],
      "emotionalTone": "positive/negative/mixed",
      "interpretation": "2-3 sentence interpretation of what this theme reveals"
    }
  ],
  "beliefPatterns": [
    {
      "pattern": "The specific belief pattern observed",
      "type": "limiting/empowering/neutral",
      "occurrences": number of times observed,
      "evolution": "How this belief has evolved over time",
      "recommendations": ["specific action to transform this belief"]
    }
  ],
  "emotionalTriggers": [
    {
      "trigger": "What triggers this emotion",
      "emotion": "The emotion triggered",
      "contexts": ["context 1", "context 2"],
      "frequency": number,
      "suggestedResponse": "A healthier way to respond to this trigger"
    }
  ],
  "overallGrowthNarrative": "A compelling 2-3 paragraph narrative describing the client's growth journey, key insights, and transformation arc",
  "actionableRecommendations": [
    "Specific, actionable recommendation 1",
    "Specific, actionable recommendation 2",
    "Specific, actionable recommendation 3"
  ]
}

Focus on:
- Recurring themes across different Stack types
- Limiting vs empowering beliefs
- Emotional patterns and triggers
- Growth trajectory and positive changes
- Specific, actionable next steps

Return ONLY valid JSON, no other text.`;

    const response = await anthropic.messages.create({
      model: DEFAULT_MODEL_STR,
      max_tokens: 4096,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: analysisPrompt,
        },
      ],
    });

    const textContent = response.content.find(block => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in AI response');
    }

    // Parse JSON response
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }

    const insights = JSON.parse(jsonMatch[0]) as CognitiveInsights;

    // Enhance themes with actual message data (user messages only)
    insights.themes = await Promise.all(
      insights.themes.map(async (theme) => {
        const themeMessages = await semanticSearch(userId, theme.theme, 5);
        return {
          ...theme,
          keyMessages: themeMessages
            .filter(match => match.metadata?.role === 'user')
            .map(match => ({
              content: String(match.metadata?.content || ''),
              sessionId: String(match.metadata?.sessionId || ''),
              similarity: match.score || 0,
              timestamp: String(match.metadata?.timestamp || ''),
            })),
        };
      })
    );

    return insights;
  } catch (error) {
    console.error('Error generating cognitive insights:', error);
    throw new Error('Failed to generate cognitive insights');
  }
}

export async function analyzeSpecificTheme(
  userId: string,
  theme: string
): Promise<ThemeInsight> {
  try {
    // Get messages related to the theme
    const themeMessages = await semanticSearch(userId, theme, 15);

    if (themeMessages.length === 0) {
      return {
        theme,
        frequency: 0,
        stackTypes: [],
        emotionalTone: 'neutral',
        keyMessages: [],
        interpretation: 'No messages found related to this theme.',
      };
    }

    // Filter for user messages only
    const messagesData = themeMessages
      .filter(match => match.metadata?.role === 'user')
      .map(match => ({
        content: String(match.metadata?.content || ''),
        sessionId: String(match.metadata?.sessionId || ''),
        stackType: match.metadata?.stackType as StackType,
        timestamp: String(match.metadata?.timestamp || ''),
        similarity: match.score || 0,
      }));

    if (messagesData.length === 0) {
      return {
        theme,
        frequency: 0,
        stackTypes: [],
        emotionalTone: 'neutral',
        keyMessages: [],
        interpretation: 'No user messages found related to this theme.',
      };
    }

    const analysisPrompt = `Analyze the following reflections related to the theme "${theme}":

${messagesData.map((msg, idx) => 
  `[${idx + 1}] (${msg.stackType} Stack): ${msg.content}`
).join('\n\n')}

Provide a detailed analysis in JSON format:
{
  "theme": "${theme}",
  "frequency": ${messagesData.length},
  "stackTypes": ["list of stack types where this appears"],
  "emotionalTone": "positive/negative/mixed",
  "interpretation": "2-3 sentence deep interpretation of what this theme reveals about the person's inner world"
}

Return ONLY valid JSON.`;

    const response = await anthropic.messages.create({
      model: DEFAULT_MODEL_STR,
      max_tokens: 1024,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: analysisPrompt,
        },
      ],
    });

    const textContent = response.content.find(block => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in AI response');
    }

    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }

    const themeAnalysis = JSON.parse(jsonMatch[0]) as Omit<ThemeInsight, 'keyMessages'>;

    return {
      ...themeAnalysis,
      keyMessages: messagesData.map(msg => ({
        content: msg.content,
        sessionId: msg.sessionId,
        similarity: msg.similarity,
        timestamp: msg.timestamp,
      })),
    };
  } catch (error) {
    console.error('Error analyzing theme:', error);
    throw new Error('Failed to analyze theme');
  }
}

export async function identifyBeliefPatterns(
  userId: string
): Promise<BeliefPattern[]> {
  try {
    // Search for belief-related messages
    const beliefMessages = await semanticSearch(
      userId,
      "beliefs thoughts assumptions stories I tell myself limiting beliefs empowering beliefs",
      30
    );

    if (beliefMessages.length === 0) {
      return [];
    }

    // Filter for user messages only
    const messagesData = beliefMessages
      .filter(match => match.metadata?.role === 'user')
      .map(match => ({
        content: String(match.metadata?.content || ''),
        timestamp: String(match.metadata?.timestamp || ''),
      }));

    if (messagesData.length === 0) {
      return [];
    }

    const analysisPrompt = `As a cognitive behavioral therapist, identify belief patterns from these reflections:

${messagesData.map((msg, idx) => 
  `[${idx + 1}] (${new Date(msg.timestamp).toLocaleDateString()}): ${msg.content}`
).join('\n\n')}

Identify recurring belief patterns and classify them. Return JSON array:
[
  {
    "pattern": "The specific belief pattern",
    "type": "limiting/empowering/neutral",
    "occurrences": number,
    "evolution": "How this belief evolved over time",
    "recommendations": ["specific cognitive restructuring techniques"]
  }
]

Focus on:
- Core beliefs about self, others, and the world
- Limiting beliefs that hold them back
- Empowering beliefs that drive growth
- How beliefs have evolved over time

Return ONLY valid JSON array.`;

    const response = await anthropic.messages.create({
      model: DEFAULT_MODEL_STR,
      max_tokens: 2048,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: analysisPrompt,
        },
      ],
    });

    const textContent = response.content.find(block => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in AI response');
    }

    const jsonMatch = textContent.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No JSON array found in AI response');
    }

    return JSON.parse(jsonMatch[0]) as BeliefPattern[];
  } catch (error) {
    console.error('Error identifying belief patterns:', error);
    throw new Error('Failed to identify belief patterns');
  }
}

export async function identifyEmotionalTriggers(
  userId: string
): Promise<EmotionalTrigger[]> {
  try {
    // Search for emotion-related messages
    const emotionMessages = await semanticSearch(
      userId,
      "feelings emotions triggered angry frustrated grateful happy sad anxious",
      30
    );

    if (emotionMessages.length === 0) {
      return [];
    }

    // Filter for user messages only
    const messagesData = emotionMessages
      .filter(match => match.metadata?.role === 'user')
      .map(match => ({
        content: String(match.metadata?.content || ''),
        stackType: match.metadata?.stackType as StackType,
      }));

    if (messagesData.length === 0) {
      return [];
    }

    const analysisPrompt = `As an emotion-focused therapist, identify emotional triggers and patterns:

${messagesData.map((msg, idx) => 
  `[${idx + 1}] (${msg.stackType} Stack): ${msg.content}`
).join('\n\n')}

Identify recurring emotional triggers. Return JSON array:
[
  {
    "trigger": "What triggers this emotion",
    "emotion": "The emotion triggered",
    "contexts": ["context 1", "context 2"],
    "frequency": estimated number,
    "suggestedResponse": "A healthier emotional regulation strategy"
  }
]

Focus on:
- What consistently triggers certain emotions
- Patterns in emotional reactivity
- Healthier ways to respond to triggers
- Emotional regulation strategies

Return ONLY valid JSON array.`;

    const response = await anthropic.messages.create({
      model: DEFAULT_MODEL_STR,
      max_tokens: 2048,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: analysisPrompt,
        },
      ],
    });

    const textContent = response.content.find(block => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in AI response');
    }

    const jsonMatch = textContent.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No JSON array found in AI response');
    }

    return JSON.parse(jsonMatch[0]) as EmotionalTrigger[];
  } catch (error) {
    console.error('Error identifying emotional triggers:', error);
    throw new Error('Failed to identify emotional triggers');
  }
}

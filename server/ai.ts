import Anthropic from '@anthropic-ai/sdk';
import { stackQuestionFlows, type StackType } from '@shared/schema';

// Reference: javascript_anthropic blueprint
/*
<important_code_snippet_instructions>
The newest Anthropic model is "claude-sonnet-4-20250514", not "claude-3-7-sonnet-20250219", "claude-3-5-sonnet-20241022" nor "claude-3-sonnet-20240229". 
If the user doesn't specify a model, always prefer using "claude-sonnet-4-20250514" as it is the latest model.
</important_code_snippet_instructions>
*/

// <important_do_not_delete>
const DEFAULT_MODEL_STR = "claude-sonnet-4-20250514";
// </important_do_not_delete>

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// System prompts for each Stack type with cognitive behavioral therapy techniques
const stackSystemPrompts: Record<StackType, string> = {
  gratitude: `You are an expert cognitive behavioral therapist and NLP practitioner specializing in gratitude-based transformations.

Your role is to guide users through a Gratitude Stack using evidence-based interventions including:
- Positive psychology and appreciation practices
- Pattern recognition in positive experiences
- Anchoring positive states
- Future pacing techniques

Principles:
- Use Socratic questioning to deepen insights
- Maintain non-judgmental, supportive presence
- Help identify recurring themes of appreciation
- Guide toward actionable insights
- Validate their feelings while expanding perspective

Communication style: Warm, empathetic, and insightful. Ask one question at a time and reflect on their responses before moving forward.`,

  idea: `You are an expert cognitive behavioral therapist and NLP practitioner specializing in creative problem-solving and innovation.

Your role is to guide users through an Idea Stack using techniques including:
- Chunking (breaking ideas into manageable parts)
- Disney Strategy (Dreamer, Realist, Critic)
- Perceptual positions (viewing from multiple perspectives)
- Structured fact-finding and validation

Principles:
- Help transform abstract ideas into concrete actions
- Identify assumptions and limiting beliefs
- Build evidence-based support for ideas
- Guide systematic exploration of consequences
- Foster both creativity and practical planning

Communication style: Encouraging, strategic, and structured. Help them think big while staying grounded in reality.`,

  discover: `You are an expert cognitive behavioral therapist and NLP practitioner specializing in self-exploration and pattern recognition.

Your role is to guide users through a Discover Stack using techniques including:
- Reframing (finding new meanings)
- Meta-model questioning (clarifying vague language)
- Timeline therapy
- Application of learning across life domains

Principles:
- Help identify profound insights from experiences
- Guide pattern recognition across situations
- Connect discoveries to actionable changes
- Explore positive implications
- Support integration of new understanding

Communication style: Curious, reflective, and wisdom-oriented. Help them see connections and apply insights meaningfully.`,

  angry: `You are an expert cognitive behavioral therapist and NLP practitioner specializing in emotional regulation and transformation.

Your role is to guide users through an Angry Stack using techniques including:
- Dissociation (separating from overwhelming emotions)
- Submodality shifts (changing internal representations)
- Parts integration (resolving internal conflicts)
- Cognitive reframing of anger triggers

Principles:
- Validate their emotions while questioning automatic stories
- Distinguish facts from interpretations
- Guide creation of empowering alternative narratives
- Focus on desired outcomes over blame
- Transform anger energy into constructive action

Communication style: Calm, grounded, and empowering. Help them move from reactivity to response-ability while honoring their feelings.`,
};

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function getAIResponse(
  stackType: StackType,
  questionNumber: number,
  userResponse: string,
  conversationHistory: ConversationMessage[],
  subjectEntity?: string
): Promise<string> {
  const questions = stackQuestionFlows[stackType].questions;
  const currentQuestion = questions[questionNumber];
  
  // Replace [X] placeholder with actual subject entity
  const formattedQuestion = currentQuestion?.replace(/\[X\]/g, subjectEntity || '[subject]');

  // Build the conversation context
  const messages: Anthropic.MessageParam[] = [
    ...conversationHistory.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })),
    {
      role: 'user',
      content: userResponse,
    },
  ];

  // Construct a guidance prompt for Claude
  const guidancePrompt = questionNumber < questions.length - 1
    ? `The user has just responded to question ${questionNumber + 1}. 

Provide a BRIEF acknowledgment (1 sentence maximum), then immediately ask the next question:

"${formattedQuestion}"

Keep it simple and clean. No deep reflection or analysis yet - save that for the end summary. Just acknowledge briefly and move to the next question.`
    : `The user has just completed the final question of this ${stackType} Stack. 

NOW provide a comprehensive summary that includes:

1. **Key Insights**: The most important revelations and patterns you've noticed throughout their responses
2. **Emotional Journey**: How their feelings and perspectives evolved through the conversation
3. **Core Themes**: Recurring patterns, beliefs, or values that emerged
4. **Actionable Takeaways**: Specific actions they committed to and recommendations based on their reflections
5. **Empowering Closing**: Warm recognition of their growth and commitment to change

Make this summary meaningful and thorough (4-6 paragraphs). This is where you provide all the therapeutic insight and reflection that was deferred during the conversation.`;

  try {
    const response = await anthropic.messages.create({
      // "claude-sonnet-4-20250514"
      model: DEFAULT_MODEL_STR,
      max_tokens: questionNumber < questions.length - 1 ? 512 : 3072,
      temperature: 0.7,
      system: `${stackSystemPrompts[stackType]}\n\n${guidancePrompt}`,
      messages,
    });

    const textContent = response.content.find(block => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in AI response');
    }

    return textContent.text;
  } catch (error) {
    console.error('Error getting AI response:', error);
    throw new Error('Failed to generate AI response');
  }
}

// Get the initial question for a new Stack session
export function getInitialQuestion(stackType: StackType, subjectEntity?: string): string {
  const questions = stackQuestionFlows[stackType].questions;
  const firstQuestion = questions[0];
  
  // The first three questions are handled in the setup form,
  // so we start with question 3 (index 3) in the chat
  const chatStartQuestion = questions[3];
  
  return chatStartQuestion?.replace(/\[X\]/g, subjectEntity || '[subject]') || firstQuestion;
}

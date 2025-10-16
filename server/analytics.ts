import { storage } from './storage';
import { semanticSearch } from './pinecone';
import { generateCognitiveInsights } from './insights';
import type { StackType } from '@shared/schema';

export interface EmotionalRegulationMetrics {
  currentScore: number; // 0-100
  trend: 'improving' | 'stable' | 'declining';
  averageResponseTime: number; // days between anger/negative triggers and processing
  emotionalBalance: {
    positive: number;
    negative: number;
    neutral: number;
  };
  regulationStrategies: string[];
}

export interface SelfAwarenessScore {
  overallScore: number; // 0-100
  reflectionDepth: number; // 0-100, based on message length and complexity
  patternRecognition: number; // 0-100, based on identified themes
  insightQuality: number; // 0-100, based on revelations
  consistencyScore: number; // 0-100, based on regular engagement
  breakdown: {
    cognitiveClarity: number;
    emotionalIntelligence: number;
    behavioralAwareness: number;
  };
}

export interface ResilienceMetrics {
  resilienceScore: number; // 0-100
  completionRate: number; // percentage of started Stacks completed
  consistencyStreak: number; // days of continuous engagement
  longestStreak: number;
  recoveryTime: number; // average time between negative and positive Stacks
  challengeProcessingRate: number; // how quickly they process difficult emotions
  adaptabilityScore: number; // variety in Stack types used
}

export interface GrowthTrajectory {
  overallGrowth: number; // 0-100
  trajectoryDirection: 'accelerating' | 'steady' | 'plateauing' | 'declining';
  milestones: Array<{
    date: string;
    achievement: string;
    impact: 'major' | 'moderate' | 'minor';
  }>;
  strengthAreas: string[];
  growthAreas: string[];
  predictedNextBreakthrough: string;
  weeklyProgress: Array<{
    week: string;
    score: number;
    stacksCompleted: number;
  }>;
}

export interface AdvancedAnalytics {
  emotionalRegulation: EmotionalRegulationMetrics;
  selfAwareness: SelfAwarenessScore;
  resilience: ResilienceMetrics;
  growthTrajectory: GrowthTrajectory;
  summary: {
    overallWellbeingScore: number;
    keyInsight: string;
    recommendedFocus: string;
  };
}

export async function calculateEmotionalRegulation(userId: string): Promise<EmotionalRegulationMetrics> {
  try {
    const sessions = await storage.getUserStackSessions(userId);
    const now = new Date();
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    
    // Sort sessions chronologically (oldest first) before any temporal calculations
    const recentSessions = sessions
      .filter(s => s.createdAt && new Date(s.createdAt) >= threeMonthsAgo)
      .sort((a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime());

    if (recentSessions.length === 0) {
      return {
        currentScore: 50,
        trend: 'stable',
        averageResponseTime: 0,
        emotionalBalance: { positive: 0, negative: 0, neutral: 0 },
        regulationStrategies: ['Complete more Stacks to track emotional regulation'],
      };
    }

    // Calculate emotional balance from Stack types
    const angryStacks = recentSessions.filter(s => s.stackType === 'angry').length;
    const gratitudeStacks = recentSessions.filter(s => s.stackType === 'gratitude').length;
    const discoverStacks = recentSessions.filter(s => s.stackType === 'discover').length;
    const ideaStacks = recentSessions.filter(s => s.stackType === 'idea').length;

    const total = recentSessions.length;
    const emotionalBalance = {
      positive: Math.round(((gratitudeStacks + ideaStacks) / total) * 100),
      negative: Math.round((angryStacks / total) * 100),
      neutral: Math.round((discoverStacks / total) * 100),
    };

    // Calculate average response time (time between angry Stack and next Stack)
    let totalResponseTime = 0;
    let responseCount = 0;
    
    for (let i = 0; i < recentSessions.length - 1; i++) {
      if (recentSessions[i].stackType === 'angry' && recentSessions[i].createdAt && recentSessions[i + 1].createdAt) {
        const timeDiff = new Date(recentSessions[i + 1].createdAt!).getTime() - new Date(recentSessions[i].createdAt!).getTime();
        totalResponseTime += timeDiff;
        responseCount++;
      }
    }

    const averageResponseTime = responseCount > 0 
      ? Math.round(totalResponseTime / responseCount / (1000 * 60 * 60 * 24))
      : 0;

    // Calculate current score based on multiple factors
    const completionRate = recentSessions.filter(s => s.status === 'completed').length / total;
    const balanceScore = 100 - Math.abs(50 - emotionalBalance.positive); // Closer to 50% positive is better
    const responseScore = averageResponseTime > 0 ? Math.max(0, 100 - averageResponseTime * 5) : 80;
    
    const currentScore = Math.round(
      (completionRate * 30) + 
      (balanceScore * 0.4) + 
      (responseScore * 0.3)
    );

    // Determine trend by comparing first half vs second half of period
    const midpoint = Math.floor(recentSessions.length / 2);
    const firstHalfAngry = recentSessions.slice(0, midpoint).filter(s => s.stackType === 'angry').length;
    const secondHalfAngry = recentSessions.slice(midpoint).filter(s => s.stackType === 'angry').length;
    
    let trend: 'improving' | 'stable' | 'declining';
    if (secondHalfAngry < firstHalfAngry * 0.7) trend = 'improving';
    else if (secondHalfAngry > firstHalfAngry * 1.3) trend = 'declining';
    else trend = 'stable';

    return {
      currentScore,
      trend,
      averageResponseTime,
      emotionalBalance,
      regulationStrategies: [
        angryStacks > 0 ? 'Processing anger through structured reflection' : 'Maintaining emotional balance',
        gratitudeStacks > 2 ? 'Building positive patterns through gratitude' : 'Consider more gratitude practices',
        completionRate > 0.8 ? 'Consistent completion of reflections' : 'Focus on completing started Stacks',
      ].filter(Boolean),
    };
  } catch (error) {
    console.error('Error calculating emotional regulation:', error);
    throw error;
  }
}

export async function calculateSelfAwareness(userId: string): Promise<SelfAwarenessScore> {
  try {
    const sessions = await storage.getUserStackSessions(userId);
    const insights = await generateCognitiveInsights(userId, 3);
    
    if (sessions.length === 0) {
      return {
        overallScore: 0,
        reflectionDepth: 0,
        patternRecognition: 0,
        insightQuality: 0,
        consistencyScore: 0,
        breakdown: {
          cognitiveClarity: 0,
          emotionalIntelligence: 0,
          behavioralAwareness: 0,
        },
      };
    }

    // Calculate reflection depth based on message complexity
    const allMessages = await semanticSearch(userId, 'reflection insight learning growth', 50);
    const userMessages = allMessages.filter(m => m.metadata?.role === 'user');
    
    const avgMessageLength = userMessages.reduce((sum, msg) => {
      const content = String(msg.metadata?.content || '');
      return sum + content.length;
    }, 0) / (userMessages.length || 1);
    
    // Deeper reflections typically have longer, more thoughtful responses
    const reflectionDepth = Math.min(100, Math.round((avgMessageLength / 200) * 100));

    // Pattern recognition based on identified themes and beliefs
    const patternRecognition = Math.min(100, 
      (insights.themes.length * 15) + 
      (insights.beliefPatterns.length * 20)
    );

    // Insight quality based on revelations and transformations
    const empoweringBeliefs = insights.beliefPatterns.filter(b => b.type === 'empowering').length;
    const totalBeliefs = insights.beliefPatterns.length || 1;
    const insightQuality = Math.round((empoweringBeliefs / totalBeliefs) * 100);

    // Consistency based on regular engagement
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentSessions = sessions.filter(s => s.createdAt && new Date(s.createdAt) >= thirtyDaysAgo);
    const consistencyScore = Math.min(100, recentSessions.length * 20);

    const overallScore = Math.round(
      (reflectionDepth * 0.25) +
      (patternRecognition * 0.30) +
      (insightQuality * 0.25) +
      (consistencyScore * 0.20)
    );

    return {
      overallScore,
      reflectionDepth,
      patternRecognition,
      insightQuality,
      consistencyScore,
      breakdown: {
        cognitiveClarity: Math.round((reflectionDepth + insightQuality) / 2),
        emotionalIntelligence: Math.round((insightQuality + patternRecognition) / 2),
        behavioralAwareness: Math.round((consistencyScore + reflectionDepth) / 2),
      },
    };
  } catch (error) {
    console.error('Error calculating self-awareness:', error);
    throw error;
  }
}

export async function calculateResilience(userId: string): Promise<ResilienceMetrics> {
  try {
    const allSessions = await storage.getUserStackSessions(userId);
    
    // Sort sessions chronologically (oldest first) before any temporal calculations
    const sessions = allSessions
      .filter(s => s.createdAt)
      .sort((a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime());
    
    if (sessions.length === 0) {
      return {
        resilienceScore: 0,
        completionRate: 0,
        consistencyStreak: 0,
        longestStreak: 0,
        recoveryTime: 0,
        challengeProcessingRate: 0,
        adaptabilityScore: 0,
      };
    }

    // Completion rate
    const completedCount = sessions.filter(s => s.status === 'completed').length;
    const completionRate = Math.round((completedCount / sessions.length) * 100);

    // Calculate consistency streaks (sessions within 7 days of each other)
    const sortedSessions = sessions;

    let currentStreak = 1;
    let longestStreak = 1;
    let tempStreak = 1;

    for (let i = 1; i < sortedSessions.length; i++) {
      const prevDate = new Date(sortedSessions[i - 1].createdAt!);
      const currDate = new Date(sortedSessions[i].createdAt!);
      const daysDiff = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

      if (daysDiff <= 7) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }

    // Current streak
    const lastSession = sortedSessions[sortedSessions.length - 1];
    const daysSinceLastSession = (new Date().getTime() - new Date(lastSession.createdAt!).getTime()) / (1000 * 60 * 60 * 24);
    currentStreak = daysSinceLastSession <= 7 ? tempStreak : 0;

    // Recovery time (angry Stack to any other Stack)
    let totalRecoveryTime = 0;
    let recoveryCount = 0;

    for (let i = 0; i < sortedSessions.length - 1; i++) {
      if (sortedSessions[i].stackType === 'angry' && sortedSessions[i].createdAt && sortedSessions[i + 1].createdAt) {
        const timeDiff = new Date(sortedSessions[i + 1].createdAt!).getTime() - new Date(sortedSessions[i].createdAt!).getTime();
        totalRecoveryTime += timeDiff / (1000 * 60 * 60 * 24);
        recoveryCount++;
      }
    }

    const recoveryTime = recoveryCount > 0 ? Math.round(totalRecoveryTime / recoveryCount) : 0;

    // Challenge processing rate (percentage of angry Stacks that are completed)
    const angryStacks = sessions.filter(s => s.stackType === 'angry');
    const completedAngryStacks = angryStacks.filter(s => s.status === 'completed');
    const challengeProcessingRate = angryStacks.length > 0 
      ? Math.round((completedAngryStacks.length / angryStacks.length) * 100)
      : 100;

    // Adaptability (diversity in Stack types used)
    const uniqueStackTypes = new Set(sessions.map(s => s.stackType)).size;
    const adaptabilityScore = Math.round((uniqueStackTypes / 4) * 100); // 4 total Stack types

    const resilienceScore = Math.round(
      (completionRate * 0.30) +
      (Math.min(longestStreak * 10, 100) * 0.20) +
      ((100 - Math.min(recoveryTime * 10, 100)) * 0.20) +
      (challengeProcessingRate * 0.15) +
      (adaptabilityScore * 0.15)
    );

    return {
      resilienceScore,
      completionRate,
      consistencyStreak: currentStreak,
      longestStreak,
      recoveryTime,
      challengeProcessingRate,
      adaptabilityScore,
    };
  } catch (error) {
    console.error('Error calculating resilience:', error);
    throw error;
  }
}

export async function calculateGrowthTrajectory(userId: string): Promise<GrowthTrajectory> {
  try {
    const allSessions = await storage.getUserStackSessions(userId);
    const insights = await generateCognitiveInsights(userId, 6);
    
    // Sort sessions chronologically (oldest first) before any temporal calculations
    const sessions = allSessions
      .filter(s => s.createdAt)
      .sort((a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime());
    
    if (sessions.length === 0) {
      return {
        overallGrowth: 0,
        trajectoryDirection: 'plateauing',
        milestones: [],
        strengthAreas: ['Begin your growth journey by completing your first Stack'],
        growthAreas: ['Self-reflection', 'Pattern recognition', 'Emotional awareness'],
        predictedNextBreakthrough: 'Complete your first Stack to begin tracking growth',
        weeklyProgress: [],
      };
    }

    // Calculate weekly progress
    const now = new Date();
    const twelveWeeksAgo = new Date(now.getTime() - 84 * 24 * 60 * 60 * 1000);
    const recentSessions = sessions.filter(s => new Date(s.createdAt!).getTime() >= twelveWeeksAgo.getTime());

    const weeklyProgress: Array<{ week: string; score: number; stacksCompleted: number }> = [];
    for (let i = 0; i < 12; i++) {
      const weekStart = new Date(now.getTime() - (i * 7 * 24 * 60 * 60 * 1000));
      const weekEnd = new Date(now.getTime() - ((i - 1) * 7 * 24 * 60 * 60 * 1000));
      
      const weekSessions = recentSessions.filter(s => {
        const sessionDate = new Date(s.createdAt!);
        return sessionDate >= weekStart && sessionDate < weekEnd;
      });

      const completedCount = weekSessions.filter(s => s.status === 'completed').length;
      const score = Math.min(100, completedCount * 25);

      weeklyProgress.unshift({
        week: weekStart.toISOString().split('T')[0],
        score,
        stacksCompleted: completedCount,
      });
    }

    // Determine trajectory direction
    const recentWeeks = weeklyProgress.slice(-4);
    const olderWeeks = weeklyProgress.slice(0, 4);
    
    const recentAvg = recentWeeks.reduce((sum, w) => sum + w.score, 0) / recentWeeks.length;
    const olderAvg = olderWeeks.reduce((sum, w) => sum + w.score, 0) / (olderWeeks.length || 1);

    let trajectoryDirection: 'accelerating' | 'steady' | 'plateauing' | 'declining';
    if (recentAvg > olderAvg * 1.2) trajectoryDirection = 'accelerating';
    else if (recentAvg < olderAvg * 0.8) trajectoryDirection = 'declining';
    else if (Math.abs(recentAvg - olderAvg) < 10) trajectoryDirection = 'plateauing';
    else trajectoryDirection = 'steady';

    // Identify milestones
    const milestones: Array<{ date: string; achievement: string; impact: 'major' | 'moderate' | 'minor' }> = [];
    
    if (sessions.length >= 1) {
      milestones.push({
        date: sessions[0].createdAt?.toISOString().split('T')[0] || '',
        achievement: 'Completed first Stack session',
        impact: 'major',
      });
    }
    
    if (sessions.length >= 10) {
      const tenthSession = sessions.slice(0, 10).reverse()[0];
      milestones.push({
        date: tenthSession.createdAt?.toISOString().split('T')[0] || '',
        achievement: 'Reached 10 Stack sessions',
        impact: 'major',
      });
    }

    const empoweringBeliefs = insights.beliefPatterns.filter(b => b.type === 'empowering').length;
    if (empoweringBeliefs >= 3) {
      milestones.push({
        date: new Date().toISOString().split('T')[0],
        achievement: `Developed ${empoweringBeliefs} empowering belief patterns`,
        impact: 'moderate',
      });
    }

    // Identify strength and growth areas
    const strengthAreas: string[] = [];
    const growthAreas: string[] = [];

    const stackTypeCounts = sessions.reduce((acc, s) => {
      acc[s.stackType] = (acc[s.stackType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostUsedType = Object.entries(stackTypeCounts).sort((a, b) => b[1] - a[1])[0];
    if (mostUsedType) {
      strengthAreas.push(`Strong engagement with ${mostUsedType[0]} Stacks`);
    }

    if (insights.beliefPatterns.filter(b => b.type === 'empowering').length > 0) {
      strengthAreas.push('Building empowering beliefs');
    }

    if (insights.beliefPatterns.filter(b => b.type === 'limiting').length > 2) {
      growthAreas.push('Transform limiting beliefs');
    }

    if (sessions.filter(s => s.status === 'in_progress').length > 2) {
      growthAreas.push('Complete in-progress Stacks');
    }

    const overallGrowth = Math.round(
      (sessions.length * 5) +
      (empoweringBeliefs * 15) +
      (recentAvg * 0.3)
    );

    return {
      overallGrowth: Math.min(100, overallGrowth),
      trajectoryDirection,
      milestones: milestones.slice(0, 5),
      strengthAreas: strengthAreas.length > 0 ? strengthAreas : ['Building self-awareness'],
      growthAreas: growthAreas.length > 0 ? growthAreas : ['Increase Stack completion rate'],
      predictedNextBreakthrough: recentAvg > 50 
        ? 'Major belief transformation imminent'
        : 'Continue consistent practice for breakthrough',
      weeklyProgress,
    };
  } catch (error) {
    console.error('Error calculating growth trajectory:', error);
    throw error;
  }
}

export async function generateAdvancedAnalytics(userId: string): Promise<AdvancedAnalytics> {
  try {
    const [emotionalRegulation, selfAwareness, resilience, growthTrajectory] = await Promise.all([
      calculateEmotionalRegulation(userId),
      calculateSelfAwareness(userId),
      calculateResilience(userId),
      calculateGrowthTrajectory(userId),
    ]);

    const overallWellbeingScore = Math.round(
      (emotionalRegulation.currentScore * 0.30) +
      (selfAwareness.overallScore * 0.25) +
      (resilience.resilienceScore * 0.25) +
      (growthTrajectory.overallGrowth * 0.20)
    );

    // Generate key insight
    let keyInsight = '';
    if (emotionalRegulation.trend === 'improving') {
      keyInsight = 'Your emotional regulation is improving significantly';
    } else if (selfAwareness.overallScore > 70) {
      keyInsight = 'You demonstrate high self-awareness and insight';
    } else if (resilience.resilienceScore > 70) {
      keyInsight = 'Your resilience and consistency are exceptional';
    } else {
      keyInsight = 'Continue building your foundation through consistent practice';
    }

    // Determine recommended focus
    let recommendedFocus = '';
    const scores = [
      { area: 'Emotional Regulation', score: emotionalRegulation.currentScore },
      { area: 'Self-Awareness', score: selfAwareness.overallScore },
      { area: 'Resilience', score: resilience.resilienceScore },
    ];
    const lowestScore = scores.sort((a, b) => a.score - b.score)[0];
    recommendedFocus = `Focus on ${lowestScore.area}`;

    return {
      emotionalRegulation,
      selfAwareness,
      resilience,
      growthTrajectory,
      summary: {
        overallWellbeingScore,
        keyInsight,
        recommendedFocus,
      },
    };
  } catch (error) {
    console.error('Error generating advanced analytics:', error);
    throw error;
  }
}

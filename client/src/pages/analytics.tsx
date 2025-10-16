import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Brain, 
  Heart, 
  Shield, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Award,
  Target,
  Zap,
  Calendar
} from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';

interface AdvancedAnalytics {
  emotionalRegulation: {
    currentScore: number;
    trend: 'improving' | 'stable' | 'declining';
    averageResponseTime: number;
    emotionalBalance: {
      positive: number;
      negative: number;
      neutral: number;
    };
    regulationStrategies: string[];
  };
  selfAwareness: {
    overallScore: number;
    reflectionDepth: number;
    patternRecognition: number;
    insightQuality: number;
    consistencyScore: number;
    breakdown: {
      cognitiveClarity: number;
      emotionalIntelligence: number;
      behavioralAwareness: number;
    };
  };
  resilience: {
    resilienceScore: number;
    completionRate: number;
    consistencyStreak: number;
    longestStreak: number;
    recoveryTime: number;
    challengeProcessingRate: number;
    adaptabilityScore: number;
  };
  growthTrajectory: {
    overallGrowth: number;
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
  };
  summary: {
    overallWellbeingScore: number;
    keyInsight: string;
    recommendedFocus: string;
  };
}

export default function Analytics() {
  const { data: analytics, isLoading } = useQuery<AdvancedAnalytics>({
    queryKey: ['/api/analytics/advanced'],
  });

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'declining': return <TrendingDown className="w-4 h-4 text-red-600" />;
      default: return <Minus className="w-4 h-4 text-blue-600" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-600';
    if (score >= 50) return 'text-blue-600';
    if (score >= 25) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getImpactBadge = (impact: string) => {
    const variants = {
      major: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      moderate: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      minor: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    };
    return variants[impact as keyof typeof variants] || variants.minor;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-96" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Brain className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No analytics data available yet.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight" data-testid="text-analytics-title">
          Advanced Analytics Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive metrics tracking your emotional and cognitive growth
        </p>
      </div>

      {/* Overall Wellbeing Score */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-6 h-6" />
            Overall Wellbeing Score
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-4xl font-bold" data-testid="text-wellbeing-score">
              {analytics.summary.overallWellbeingScore}
              <span className="text-lg text-muted-foreground">/100</span>
            </div>
            <Progress value={analytics.summary.overallWellbeingScore} className="w-1/2" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium" data-testid="text-key-insight">
              <Zap className="w-4 h-4 inline mr-1" />
              {analytics.summary.keyInsight}
            </p>
            <p className="text-sm text-muted-foreground" data-testid="text-recommended-focus">
              <Target className="w-4 h-4 inline mr-1" />
              {analytics.summary.recommendedFocus}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Core Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Emotional Regulation */}
        <Card>
          <CardHeader className="gap-1 space-y-0 pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Heart className="w-5 h-5" />
              Emotional Regulation
            </CardTitle>
            <div className="flex items-center gap-2">
              {getTrendIcon(analytics.emotionalRegulation.trend)}
              <span className="text-xs capitalize">{analytics.emotionalRegulation.trend}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className={`text-3xl font-bold ${getScoreColor(analytics.emotionalRegulation.currentScore)}`} data-testid="text-emotional-score">
                {analytics.emotionalRegulation.currentScore}
              </div>
              <Progress value={analytics.emotionalRegulation.currentScore} className="mt-2" />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Emotional Balance</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-lg font-semibold text-green-600">{analytics.emotionalRegulation.emotionalBalance.positive}%</div>
                  <div className="text-xs text-muted-foreground">Positive</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-blue-600">{analytics.emotionalRegulation.emotionalBalance.neutral}%</div>
                  <div className="text-xs text-muted-foreground">Neutral</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-red-600">{analytics.emotionalRegulation.emotionalBalance.negative}%</div>
                  <div className="text-xs text-muted-foreground">Negative</div>
                </div>
              </div>
            </div>

            {analytics.emotionalRegulation.averageResponseTime > 0 && (
              <div className="text-sm">
                <span className="text-muted-foreground">Avg Response Time: </span>
                <span className="font-medium">{analytics.emotionalRegulation.averageResponseTime} days</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Self-Awareness */}
        <Card>
          <CardHeader className="gap-1 space-y-0 pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Self-Awareness
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className={`text-3xl font-bold ${getScoreColor(analytics.selfAwareness.overallScore)}`} data-testid="text-awareness-score">
                {analytics.selfAwareness.overallScore}
              </div>
              <Progress value={analytics.selfAwareness.overallScore} className="mt-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Reflection Depth</span>
                <span className="font-medium">{analytics.selfAwareness.reflectionDepth}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pattern Recognition</span>
                <span className="font-medium">{analytics.selfAwareness.patternRecognition}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Insight Quality</span>
                <span className="font-medium">{analytics.selfAwareness.insightQuality}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Consistency</span>
                <span className="font-medium">{analytics.selfAwareness.consistencyScore}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resilience */}
        <Card>
          <CardHeader className="gap-1 space-y-0 pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Resilience
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className={`text-3xl font-bold ${getScoreColor(analytics.resilience.resilienceScore)}`} data-testid="text-resilience-score">
                {analytics.resilience.resilienceScore}
              </div>
              <Progress value={analytics.resilience.resilienceScore} className="mt-2" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-2xl font-semibold">{analytics.resilience.completionRate}%</div>
                <div className="text-xs text-muted-foreground">Completion Rate</div>
              </div>
              <div>
                <div className="text-2xl font-semibold">{analytics.resilience.consistencyStreak}</div>
                <div className="text-xs text-muted-foreground">Current Streak</div>
              </div>
              <div>
                <div className="text-2xl font-semibold">{analytics.resilience.longestStreak}</div>
                <div className="text-xs text-muted-foreground">Longest Streak</div>
              </div>
              <div>
                <div className="text-2xl font-semibold">{analytics.resilience.adaptabilityScore}%</div>
                <div className="text-xs text-muted-foreground">Adaptability</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Self-Awareness Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Self-Awareness Breakdown</CardTitle>
          <CardDescription>Detailed analysis of your cognitive patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Cognitive Clarity</span>
                <span className="text-sm font-bold">{analytics.selfAwareness.breakdown.cognitiveClarity}%</span>
              </div>
              <Progress value={analytics.selfAwareness.breakdown.cognitiveClarity} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Emotional Intelligence</span>
                <span className="text-sm font-bold">{analytics.selfAwareness.breakdown.emotionalIntelligence}%</span>
              </div>
              <Progress value={analytics.selfAwareness.breakdown.emotionalIntelligence} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Behavioral Awareness</span>
                <span className="text-sm font-bold">{analytics.selfAwareness.breakdown.behavioralAwareness}%</span>
              </div>
              <Progress value={analytics.selfAwareness.breakdown.behavioralAwareness} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Growth Trajectory */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Growth Trajectory
            </CardTitle>
            <CardDescription className="capitalize">
              {analytics.growthTrajectory.trajectoryDirection} growth pattern
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-3xl font-bold" data-testid="text-growth-score">
                {analytics.growthTrajectory.overallGrowth}
                <span className="text-lg text-muted-foreground">/100</span>
              </div>
              <Progress value={analytics.growthTrajectory.overallGrowth} className="mt-2" />
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Strength Areas</p>
                <div className="flex flex-wrap gap-1">
                  {analytics.growthTrajectory.strengthAreas.map((area, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Growth Opportunities</p>
                <div className="flex flex-wrap gap-1">
                  {analytics.growthTrajectory.growthAreas.map((area, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="pt-2 border-t">
                <p className="text-sm">
                  <Zap className="w-3 h-3 inline mr-1" />
                  <span className="font-medium">Next Breakthrough: </span>
                  <span className="text-muted-foreground">{analytics.growthTrajectory.predictedNextBreakthrough}</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Progress</CardTitle>
            <CardDescription>Last 12 weeks of activity</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                score: { label: "Score", color: "hsl(var(--chart-1))" },
              }}
              className="h-[200px]"
            >
              <LineChart data={analytics.growthTrajectory.weeklyProgress}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="week" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="hsl(var(--chart-1))" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Milestones */}
      {analytics.growthTrajectory.milestones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Recent Milestones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.growthTrajectory.milestones.map((milestone, idx) => (
                <div 
                  key={idx} 
                  className="flex items-start gap-3 p-3 rounded-lg border hover-elevate"
                  data-testid={`milestone-${idx}`}
                >
                  <div className="shrink-0">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{milestone.achievement}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(milestone.date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                  <Badge className={getImpactBadge(milestone.impact)}>
                    {milestone.impact}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Regulation Strategies */}
      {analytics.emotionalRegulation.regulationStrategies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Regulation Strategies</CardTitle>
            <CardDescription>Patterns in your emotional processing</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analytics.emotionalRegulation.regulationStrategies.map((strategy, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <span>{strategy}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

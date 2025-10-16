import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Target, 
  TrendingUp, 
  Lightbulb, 
  CheckCircle2, 
  ArrowRight, 
  Calendar,
  BookOpen,
  Zap
} from 'lucide-react';
import { Link } from 'wouter';

interface TransformationOpportunity {
  area: string;
  currentPattern: string;
  desiredPattern: string;
  specificActions: string[];
  difficulty: 'easy' | 'moderate' | 'challenging';
  expectedImpact: 'low' | 'medium' | 'high';
  relatedThemes: string[];
}

interface PersonalizedRecommendations {
  transformationOpportunities: TransformationOpportunity[];
  priorityActions: Array<{
    action: string;
    rationale: string;
    timeframe: string;
    resources: string[];
  }>;
  growthMetrics: {
    beliefShiftPotential: number;
    emotionalRegulationImprovement: number;
    overallGrowthTrajectory: string;
  };
  nextStackRecommendation: {
    stackType: string;
    focus: string;
    reason: string;
  };
}

export default function Recommendations() {
  const { data: recommendations, isLoading } = useQuery<PersonalizedRecommendations>({
    queryKey: ['/api/insights/recommendations'],
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'challenging': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'medium': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'low': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getTrajectoryIcon = (trajectory: string) => {
    if (trajectory.includes('accelerating')) return <TrendingUp className="w-5 h-5 text-green-600" />;
    if (trajectory.includes('steady')) return <ArrowRight className="w-5 h-5 text-blue-600" />;
    return <Lightbulb className="w-5 h-5 text-yellow-600" />;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-80" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!recommendations) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No recommendations available yet. Complete more Stacks to receive personalized guidance.</p>
            <Button asChild className="mt-4" data-testid="button-start-stack">
              <Link href="/dashboard">Start a Stack</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight" data-testid="text-recommendations-title">
          Your Transformation Plan
        </h1>
        <p className="text-muted-foreground mt-2">
          AI-powered recommendations based on your growth patterns
        </p>
      </div>

      {/* Growth Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Belief Shift Potential</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-belief-potential">
              {recommendations.growthMetrics.beliefShiftPotential}%
            </div>
            <Progress 
              value={recommendations.growthMetrics.beliefShiftPotential} 
              className="mt-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emotional Regulation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-emotional-regulation">
              {recommendations.growthMetrics.emotionalRegulationImprovement}%
            </div>
            <Progress 
              value={recommendations.growthMetrics.emotionalRegulationImprovement} 
              className="mt-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Trajectory</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2" data-testid="text-growth-trajectory">
              {getTrajectoryIcon(recommendations.growthMetrics.overallGrowthTrajectory)}
              <span className="text-xl font-semibold capitalize">
                {recommendations.growthMetrics.overallGrowthTrajectory}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Next Stack Recommendation */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Recommended Next Stack
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-4">
            <Badge variant="default" data-testid="badge-stack-type" className="capitalize">
              {recommendations.nextStackRecommendation.stackType} Stack
            </Badge>
            <span className="text-sm font-medium" data-testid="text-stack-focus">
              Focus: {recommendations.nextStackRecommendation.focus}
            </span>
          </div>
          <p className="text-sm text-muted-foreground" data-testid="text-stack-reason">
            {recommendations.nextStackRecommendation.reason}
          </p>
          <Button asChild data-testid="button-start-recommended-stack">
            <Link href="/new-stack">Start This Stack</Link>
          </Button>
        </CardContent>
      </Card>

      {/* Priority Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            Priority Actions
          </CardTitle>
          <CardDescription>Start with these high-impact steps</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-4">
              {recommendations.priorityActions.map((action, index) => (
                <div 
                  key={index} 
                  className="p-4 rounded-lg border space-y-3 hover-elevate"
                  data-testid={`priority-action-${index}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold" data-testid={`text-action-${index}`}>
                      {action.action}
                    </h4>
                    <Badge variant="outline" className="shrink-0">
                      <Calendar className="w-3 h-3 mr-1" />
                      {action.timeframe}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground" data-testid={`text-rationale-${index}`}>
                    {action.rationale}
                  </p>
                  
                  {action.resources.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        Resources:
                      </p>
                      <ul className="text-xs space-y-1 ml-4">
                        {action.resources.map((resource, idx) => (
                          <li key={idx} className="list-disc" data-testid={`text-resource-${index}-${idx}`}>
                            {resource}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Transformation Opportunities */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Target className="w-6 h-6" />
          Transformation Opportunities
        </h2>
        
        <div className="grid gap-4 md:grid-cols-2">
          {recommendations.transformationOpportunities.map((opportunity, index) => (
            <Card key={index} data-testid={`transformation-${index}`}>
              <CardHeader className="gap-1 space-y-0 pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg" data-testid={`text-area-${index}`}>
                    {opportunity.area}
                  </CardTitle>
                  <div className="flex gap-1 shrink-0">
                    <Badge className={getDifficultyColor(opportunity.difficulty)} data-testid={`badge-difficulty-${index}`}>
                      {opportunity.difficulty}
                    </Badge>
                    <Badge className={getImpactColor(opportunity.expectedImpact)} data-testid={`badge-impact-${index}`}>
                      {opportunity.expectedImpact} impact
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-medium text-muted-foreground shrink-0">Current:</span>
                    <p className="text-sm" data-testid={`text-current-${index}`}>
                      {opportunity.currentPattern}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground mx-auto" />
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-medium text-muted-foreground shrink-0">Desired:</span>
                    <p className="text-sm font-medium" data-testid={`text-desired-${index}`}>
                      {opportunity.desiredPattern}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Specific Actions:</p>
                  <ul className="space-y-1">
                    {opportunity.specificActions.map((action, actionIdx) => (
                      <li 
                        key={actionIdx} 
                        className="text-sm flex items-start gap-2"
                        data-testid={`text-specific-action-${index}-${actionIdx}`}
                      >
                        <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-green-600" />
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>

                {opportunity.relatedThemes.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {opportunity.relatedThemes.map((theme, themeIdx) => (
                      <Badge 
                        key={themeIdx} 
                        variant="secondary" 
                        className="text-xs"
                        data-testid={`badge-theme-${index}-${themeIdx}`}
                      >
                        {theme}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

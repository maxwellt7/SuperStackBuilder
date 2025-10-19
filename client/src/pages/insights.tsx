import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Brain, Heart, Lightbulb, TrendingUp, AlertCircle, BarChart3 } from 'lucide-react';
import { Link } from 'wouter';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

interface ThemeInsight {
  theme: string;
  frequency: number;
  stackTypes: string[];
  emotionalTone: string;
  keyMessages: Array<{
    content: string;
    sessionId: string;
    similarity: number;
    timestamp: string;
  }>;
  interpretation: string;
}

interface BeliefPattern {
  pattern: string;
  type: 'limiting' | 'empowering' | 'neutral';
  occurrences: number;
  evolution: string;
  recommendations: string[];
}

interface EmotionalTrigger {
  trigger: string;
  emotion: string;
  contexts: string[];
  frequency: number;
  suggestedResponse: string;
}

interface CognitiveInsights {
  themes: ThemeInsight[];
  beliefPatterns: BeliefPattern[];
  emotionalTriggers: EmotionalTrigger[];
  overallGrowthNarrative: string;
  actionableRecommendations: string[];
}

export default function Insights() {
  const { data: insights, isLoading } = useQuery<CognitiveInsights>({
    queryKey: ['/api/insights/cognitive'],
    staleTime: 60000, // Cache insights for 1 minute (expensive AI computation)
    select: (data) => data, // Enable structural sharing
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Brain className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No insights available yet. Complete more Stacks to see your patterns.</p>
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
        <h1 className="text-3xl font-bold mb-2" data-testid="text-insights-title">Cognitive Insights</h1>
        <p className="text-muted-foreground">AI-powered analysis of your growth journey</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Your Growth Journey
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="leading-relaxed whitespace-pre-line" data-testid="text-growth-narrative">
            {insights.overallGrowthNarrative}
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="visualizations" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="visualizations" data-testid="tab-visualizations">
            <BarChart3 className="w-4 h-4 mr-2" />
            Charts
          </TabsTrigger>
          <TabsTrigger value="themes" data-testid="tab-themes">
            <Lightbulb className="w-4 h-4 mr-2" />
            Themes
          </TabsTrigger>
          <TabsTrigger value="beliefs" data-testid="tab-beliefs">
            <Brain className="w-4 h-4 mr-2" />
            Beliefs
          </TabsTrigger>
          <TabsTrigger value="triggers" data-testid="tab-triggers">
            <Heart className="w-4 h-4 mr-2" />
            Triggers
          </TabsTrigger>
          <TabsTrigger value="actions" data-testid="tab-actions">
            <AlertCircle className="w-4 h-4 mr-2" />
            Actions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visualizations" className="space-y-4">
          {/* Stack Type Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Stack Type Distribution</CardTitle>
              <CardDescription>Your reflection patterns across different Stack types</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  count: { label: "Theme Count", color: "hsl(var(--chart-1))" },
                }}
                className="h-[300px]"
              >
                <BarChart
                  data={(() => {
                    const stackCounts: Record<string, number> = {};
                    insights.themes.forEach(theme => {
                      theme.stackTypes.forEach(type => {
                        stackCounts[type] = (stackCounts[type] || 0) + theme.frequency;
                      });
                    });
                    return Object.entries(stackCounts).map(([name, count]) => ({ 
                      name: name.charAt(0).toUpperCase() + name.slice(1), 
                      count 
                    }));
                  })()}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="hsl(var(--chart-1))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Belief Pattern Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Belief Pattern Types</CardTitle>
              <CardDescription>Distribution of limiting, empowering, and neutral beliefs</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  limiting: { label: "Limiting", color: "hsl(var(--destructive))" },
                  empowering: { label: "Empowering", color: "hsl(var(--chart-1))" },
                  neutral: { label: "Neutral", color: "hsl(var(--muted-foreground))" },
                }}
                className="h-[300px]"
              >
                <PieChart>
                  <Pie
                    data={(() => {
                      const typeCounts = insights.beliefPatterns.reduce((acc, belief) => {
                        acc[belief.type] = (acc[belief.type] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>);
                      const colors = {
                        limiting: "hsl(var(--destructive))",
                        empowering: "hsl(var(--chart-1))",
                        neutral: "hsl(var(--muted-foreground))",
                      };
                      return Object.entries(typeCounts).map(([name, value]) => ({ 
                        name, 
                        value,
                        fill: colors[name as keyof typeof colors]
                      }));
                    })()}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Emotional Tone Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Emotional Tone Distribution</CardTitle>
              <CardDescription>Balance of positive, negative, and mixed emotions</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  count: { label: "Theme Count", color: "hsl(var(--chart-1))" },
                }}
                className="h-[300px]"
              >
                <BarChart
                  data={(() => {
                    const toneCounts = insights.themes.reduce((acc, theme) => {
                      acc[theme.emotionalTone] = (acc[theme.emotionalTone] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>);
                    return Object.entries(toneCounts).map(([name, count]) => ({ 
                      name: name.charAt(0).toUpperCase() + name.slice(1), 
                      count 
                    }));
                  })()}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="hsl(var(--chart-1))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Theme Frequency */}
          <Card>
            <CardHeader>
              <CardTitle>Top Recurring Themes</CardTitle>
              <CardDescription>Most frequently appearing themes in your reflections</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  frequency: { label: "Frequency", color: "hsl(var(--chart-2))" },
                }}
                className="h-[300px]"
              >
                <BarChart
                  data={insights.themes.slice(0, 5).map(theme => ({
                    name: theme.theme.length > 20 ? theme.theme.substring(0, 20) + '...' : theme.theme,
                    frequency: theme.frequency,
                  }))}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={150} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="frequency" fill="hsl(var(--chart-2))" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="themes" className="space-y-4">
          {insights.themes.map((theme, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl" data-testid={`text-theme-${index}`}>
                      {theme.theme}
                    </CardTitle>
                    <CardDescription>
                      Appeared {theme.frequency} times across {theme.stackTypes.length} Stack types
                    </CardDescription>
                  </div>
                  <Badge 
                    variant={theme.emotionalTone === 'positive' ? 'default' : theme.emotionalTone === 'negative' ? 'destructive' : 'secondary'}
                    data-testid={`badge-emotion-${index}`}
                  >
                    {theme.emotionalTone}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground" data-testid={`text-interpretation-${index}`}>
                  {theme.interpretation}
                </p>
                
                <div className="flex flex-wrap gap-2">
                  {theme.stackTypes.map((stackType) => (
                    <Badge key={stackType} variant="outline" data-testid={`badge-stack-${stackType}`}>
                      {stackType}
                    </Badge>
                  ))}
                </div>

                {theme.keyMessages.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Related reflections:</h4>
                    <ScrollArea className="h-32">
                      <div className="space-y-2">
                        {theme.keyMessages.map((msg, msgIdx) => (
                          <Link key={msgIdx} href={`/stack/${msg.sessionId}`}>
                            <div className="text-sm p-2 rounded-md bg-muted hover-elevate active-elevate-2 cursor-pointer" data-testid={`link-message-${msgIdx}`}>
                              {msg.content.substring(0, 150)}...
                            </div>
                          </Link>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="beliefs" className="space-y-4">
          {insights.beliefPatterns.map((belief, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-xl" data-testid={`text-belief-${index}`}>
                    {belief.pattern}
                  </CardTitle>
                  <Badge 
                    variant={
                      belief.type === 'limiting' ? 'destructive' : 
                      belief.type === 'empowering' ? 'default' : 
                      'secondary'
                    }
                    data-testid={`badge-belief-type-${index}`}
                  >
                    {belief.type}
                  </Badge>
                </div>
                <CardDescription>
                  Observed {belief.occurrences} times
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Evolution:</h4>
                  <p className="text-muted-foreground" data-testid={`text-evolution-${index}`}>
                    {belief.evolution}
                  </p>
                </div>
                
                {belief.recommendations.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Recommendations:</h4>
                    <ul className="space-y-1">
                      {belief.recommendations.map((rec, recIdx) => (
                        <li key={recIdx} className="text-sm text-muted-foreground flex items-start" data-testid={`text-recommendation-${recIdx}`}>
                          <span className="mr-2">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="triggers" className="space-y-4">
          {insights.emotionalTriggers.map((trigger, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-xl" data-testid={`text-trigger-${index}`}>
                  {trigger.trigger}
                </CardTitle>
                <CardDescription>
                  Triggers: <span className="font-semibold">{trigger.emotion}</span> • Frequency: {trigger.frequency}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Contexts:</h4>
                  <div className="flex flex-wrap gap-2">
                    {trigger.contexts.map((context, ctxIdx) => (
                      <Badge key={ctxIdx} variant="outline" data-testid={`badge-context-${ctxIdx}`}>
                        {context}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="p-3 rounded-md bg-muted">
                  <h4 className="text-sm font-semibold mb-2">Suggested Response:</h4>
                  <p className="text-sm" data-testid={`text-suggested-response-${index}`}>
                    {trigger.suggestedResponse}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Actionable Recommendations</CardTitle>
              <CardDescription>
                Take these steps to continue your growth journey
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {insights.actionableRecommendations.map((action, index) => (
                  <li 
                    key={index} 
                    className="flex items-start p-3 rounded-md bg-muted"
                    data-testid={`text-action-${index}`}
                  >
                    <span className="mr-3 mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

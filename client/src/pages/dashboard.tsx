import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Heart, Lightbulb, Sparkles, Flame, Plus, History, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import type { StackSession } from "@shared/schema";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: recentSessions = [] } = useQuery<StackSession[]>({
    queryKey: ["/api/stacks/recent"],
    enabled: isAuthenticated,
  });

  const { data: stats } = useQuery<{
    totalStacks: number;
    completedStacks: number;
    inProgressStacks: number;
  }>({
    queryKey: ["/api/stacks/stats"],
    enabled: isAuthenticated,
  });

  const stackTypes = [
    {
      type: "gratitude",
      icon: Heart,
      title: "Gratitude Stack",
      description: "Cultivate appreciation and positive patterns",
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
      borderColor: "border-l-chart-1",
    },
    {
      type: "idea",
      icon: Lightbulb,
      title: "Idea Stack",
      description: "Transform insights into actionable plans",
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
      borderColor: "border-l-chart-2",
    },
    {
      type: "discover",
      icon: Sparkles,
      title: "Discover Stack",
      description: "Explore and apply transformative lessons",
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
      borderColor: "border-l-chart-3",
    },
    {
      type: "angry",
      icon: Flame,
      title: "Angry Stack",
      description: "Transform anger into empowerment",
      color: "text-chart-5",
      bgColor: "bg-chart-5/10",
      borderColor: "border-l-chart-5",
    },
  ];

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card data-testid="card-stats-total">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stacks</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{stats?.totalStacks || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All reflection sessions
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-stats-completed">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{stats?.completedStacks || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Transformations achieved
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-stats-progress">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{stats?.inProgressStacks || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Continue your journey
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Stack Type Cards */}
      <div>
        <h2 className="text-2xl font-semibold mb-6">Start a New Stack</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {stackTypes.map((stack) => (
            <Card key={stack.type} className="hover-elevate" data-testid={`card-stack-${stack.type}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-lg ${stack.bgColor} flex items-center justify-center`}>
                    <stack.icon className={`h-6 w-6 ${stack.color}`} />
                  </div>
                  <Button asChild size="sm" data-testid={`button-start-${stack.type}`}>
                    <Link href={`/stack/new/${stack.type}`}>
                      <Plus className="h-4 w-4 mr-1" />
                      Start
                    </Link>
                  </Button>
                </div>
                <CardTitle className="text-xl mt-4">{stack.title}</CardTitle>
                <CardDescription>{stack.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Sessions */}
      {recentSessions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">Recent Sessions</h2>
            <Button variant="outline" asChild data-testid="button-view-all-history">
              <Link href="/history">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="space-y-4">
            {recentSessions.slice(0, 5).map((session) => {
              const stackType = stackTypes.find(s => s.type === session.stackType);
              const StackIcon = stackType?.icon || Brain;

              return (
                <Card
                  key={session.id}
                  className={`hover-elevate border-l-4 ${stackType?.borderColor || ''}`}
                  data-testid={`card-session-${session.id}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`w-10 h-10 rounded-lg ${stackType?.bgColor} flex items-center justify-center flex-shrink-0`}>
                          <StackIcon className={`h-5 w-5 ${stackType?.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate">{session.title}</CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <span className="capitalize">{session.core4Domain}</span>
                            <span>•</span>
                            <span>{new Date(session.createdAt!).toLocaleDateString()}</span>
                          </CardDescription>
                        </div>
                      </div>
                      <Button
                        variant={session.status === "completed" ? "outline" : "default"}
                        size="sm"
                        asChild
                        data-testid={`button-session-${session.id}`}
                      >
                        <Link href={`/stack/${session.id}`}>
                          {session.status === "completed" ? "View" : "Continue"}
                        </Link>
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

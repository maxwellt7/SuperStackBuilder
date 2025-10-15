import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Heart, Lightbulb, Sparkles, Flame, Search, Brain, CheckCircle2, Clock } from "lucide-react";
import { Link } from "wouter";
import type { StackSession } from "@shared/schema";

export default function History() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

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

  const { data: sessions = [] } = useQuery<StackSession[]>({
    queryKey: ["/api/stacks/all"],
    enabled: isAuthenticated,
  });

  const stackTypes = {
    gratitude: {
      icon: Heart,
      title: "Gratitude",
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
      borderColor: "border-l-chart-1",
    },
    idea: {
      icon: Lightbulb,
      title: "Idea",
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
      borderColor: "border-l-chart-2",
    },
    discover: {
      icon: Sparkles,
      title: "Discover",
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
      borderColor: "border-l-chart-3",
    },
    angry: {
      icon: Flame,
      title: "Angry",
      color: "text-chart-5",
      bgColor: "bg-chart-5/10",
      borderColor: "border-l-chart-5",
    },
  };

  const filteredSessions = sessions.filter((session) => {
    const matchesSearch = session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          session.subjectEntity?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === "all" || session.stackType === filterType;
    return matchesSearch && matchesFilter;
  });

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Stack History</h1>
        <p className="text-muted-foreground mt-2">
          Review and revisit your reflection journeys
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by title or subject..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          data-testid="input-search"
        />
      </div>

      {/* Filter Tabs */}
      <Tabs value={filterType} onValueChange={setFilterType}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="all" data-testid="tab-all">All Stacks</TabsTrigger>
          <TabsTrigger value="gratitude" data-testid="tab-gratitude">
            <Heart className="h-4 w-4 mr-1" />
            Gratitude
          </TabsTrigger>
          <TabsTrigger value="idea" data-testid="tab-idea">
            <Lightbulb className="h-4 w-4 mr-1" />
            Idea
          </TabsTrigger>
          <TabsTrigger value="discover" data-testid="tab-discover">
            <Sparkles className="h-4 w-4 mr-1" />
            Discover
          </TabsTrigger>
          <TabsTrigger value="angry" data-testid="tab-angry">
            <Flame className="h-4 w-4 mr-1" />
            Angry
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filterType} className="space-y-4 mt-6">
          {filteredSessions.length === 0 ? (
            <Card className="p-12 text-center">
              <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No stacks found</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery
                  ? "Try adjusting your search terms"
                  : "Start your first Stack to begin your journey"}
              </p>
              <Button asChild data-testid="button-start-first">
                <Link href="/dashboard">Start a Stack</Link>
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredSessions.map((session) => {
                const stackType = stackTypes[session.stackType as keyof typeof stackTypes];
                const StackIcon = stackType?.icon || Brain;

                return (
                  <Card
                    key={session.id}
                    className={`hover-elevate border-l-4 ${stackType?.borderColor || ''}`}
                    data-testid={`card-session-${session.id}`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <div className={`w-12 h-12 rounded-lg ${stackType?.bgColor} flex items-center justify-center flex-shrink-0`}>
                            <StackIcon className={`h-6 w-6 ${stackType?.color}`} />
                          </div>
                          <div className="flex-1 min-w-0 space-y-2">
                            <CardTitle className="text-xl truncate">{session.title}</CardTitle>
                            <CardDescription className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="secondary" className="capitalize">
                                  {session.core4Domain}
                                </Badge>
                                <span className="text-muted-foreground">•</span>
                                <span>{session.subjectEntity}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                {session.status === "completed" ? (
                                  <>
                                    <CheckCircle2 className="h-3 w-3" />
                                    <span>Completed</span>
                                  </>
                                ) : (
                                  <>
                                    <Clock className="h-3 w-3" />
                                    <span>In Progress</span>
                                  </>
                                )}
                                <span>•</span>
                                <span>{new Date(session.createdAt!).toLocaleDateString()}</span>
                              </div>
                            </CardDescription>
                          </div>
                        </div>
                        <Button
                          variant={session.status === "completed" ? "outline" : "default"}
                          asChild
                          data-testid={`button-view-${session.id}`}
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
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

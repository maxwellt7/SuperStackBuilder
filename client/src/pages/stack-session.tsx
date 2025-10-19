import { useEffect, useState, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Lightbulb, Sparkles, Flame, Send, CheckCircle2, Loader2, Download } from "lucide-react";
import type { StackSession, StackMessage } from "@shared/schema";

export default function StackSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [userInput, setUserInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
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
  }, [isAuthenticated, authLoading, toast]);

  const { data: session, isLoading: sessionLoading } = useQuery<StackSession>({
    queryKey: ["/api/stacks/session", sessionId],
    enabled: isAuthenticated && !!sessionId,
    staleTime: 30000, // Consider session data fresh for 30 seconds
    select: (data) => data, // Enable structural sharing
  });

  const { data: messages = [] } = useQuery<StackMessage[]>({
    queryKey: ["/api/stacks/messages", sessionId],
    enabled: isAuthenticated && !!sessionId,
    staleTime: 10000, // Consider messages fresh for 10 seconds
    select: (data) => data, // Enable structural sharing
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest("POST", `/api/stacks/${sessionId}/message`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stacks/session", sessionId] });
      queryClient.invalidateQueries({ queryKey: ["/api/stacks/messages", sessionId] });
      setUserInput("");
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const completeStackMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/stacks/${sessionId}/complete`, {});
    },
    onSuccess: () => {
      toast({
        title: "Stack Completed!",
        description: "Congratulations on completing your reflection journey.",
      });
      navigate("/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/stacks/${sessionId}/export`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to export transcript");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${session?.title || 'stack'}-transcript.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export Successful",
        description: "Your Stack transcript has been downloaded.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Could not export the transcript. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(userInput);
  };

  const stackConfig = {
    gratitude: {
      icon: Heart,
      title: "Gratitude Stack",
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
      borderColor: "border-chart-1",
    },
    idea: {
      icon: Lightbulb,
      title: "Idea Stack",
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
      borderColor: "border-chart-2",
    },
    discover: {
      icon: Sparkles,
      title: "Discover Stack",
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
      borderColor: "border-chart-3",
    },
    angry: {
      icon: Flame,
      title: "Angry Stack",
      color: "text-chart-5",
      bgColor: "bg-chart-5/10",
      borderColor: "border-chart-5",
    },
  }[session?.stackType || "gratitude"];

  if (authLoading || sessionLoading || !isAuthenticated || !session || !stackConfig) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const StackIcon = stackConfig.icon;
  const isCompleted = session.status === "completed";
  const currentQuestion = messages.filter(m => m.role === "assistant").length;

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col max-w-4xl mx-auto">
      {/* Header */}
      <div className={`border-b-4 ${stackConfig.borderColor} bg-card p-6 space-y-2`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${stackConfig.bgColor} flex items-center justify-center`}>
              <StackIcon className={`h-5 w-5 ${stackConfig.color}`} />
            </div>
            <div>
              <h1 className="text-xl font-semibold">{session.title}</h1>
              <p className="text-sm text-muted-foreground capitalize">
                {session.core4Domain} • {session.subjectEntity}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {messages.length > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExport}
                data-testid="button-export"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            )}
            {isCompleted ? (
              <Badge variant="secondary" className="gap-1" data-testid="badge-completed">
                <CheckCircle2 className="h-3 w-3" />
                Completed
              </Badge>
            ) : (
              <Badge variant="secondary" data-testid="badge-progress">
                Question {currentQuestion} / {session.currentQuestionIndex + 1}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6" data-testid="messages-container">
        {messages.map((message, index) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            data-testid={`message-${message.role}-${index}`}
          >
            {message.role === "assistant" ? (
              <Card className="max-w-2xl p-6 space-y-3">
                {message.questionNumber !== null && (
                  <Badge variant="outline" className="text-xs">
                    Question {message.questionNumber}
                  </Badge>
                )}
                <p className="text-lg leading-relaxed whitespace-pre-wrap">{message.content}</p>
              </Card>
            ) : (
              <div className="max-w-lg bg-primary text-primary-foreground rounded-2xl px-6 py-4">
                <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
              </div>
            )}
          </div>
        ))}

        {sendMessageMutation.isPending && (
          <div className="flex justify-start" data-testid="typing-indicator">
            <Card className="max-w-2xl p-6">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing your response...</span>
              </div>
            </Card>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {!isCompleted && (
        <div className="border-t border-border bg-background p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              placeholder="Type your response..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              className="min-h-24 resize-none"
              disabled={sendMessageMutation.isPending}
              data-testid="input-message"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Press Enter to send, Shift+Enter for new line
              </p>
              <Button
                type="submit"
                disabled={!userInput.trim() || sendMessageMutation.isPending}
                data-testid="button-send"
              >
                {sendMessageMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending
                  </>
                ) : (
                  <>
                    Send
                    <Send className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      )}

      {isCompleted && (
        <div className="border-t border-border bg-muted/30 p-6 text-center space-y-4">
          <div className="space-y-2">
            <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
            <h3 className="text-xl font-semibold">Stack Completed!</h3>
            <p className="text-muted-foreground">
              You've completed this reflection journey. Your insights have been saved.
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate("/history")} data-testid="button-view-history">
              View History
            </Button>
            <Button onClick={() => navigate("/dashboard")} data-testid="button-new-stack">
              Start New Stack
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Heart, Lightbulb, Sparkles, Flame, ArrowRight } from "lucide-react";
import { stackQuestionFlows, type StackType, type Core4Domain } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title must be less than 100 characters"),
  core4Domain: z.enum(["mind", "body", "being", "balance"], {
    required_error: "Please select a CORE 4 domain",
  }),
  subjectEntity: z.string().min(2, "Subject must be at least 2 characters").max(100, "Subject must be less than 100 characters"),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewStack() {
  const { stackType } = useParams<{ stackType: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      core4Domain: undefined,
      subjectEntity: "",
    },
  });

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

  const createStackMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const response = await apiRequest("POST", "/api/stacks/create", {
        title: values.title,
        stackType: stackType as StackType,
        core4Domain: values.core4Domain,
        subjectEntity: values.subjectEntity,
      });
      return await response.json();
    },
    onSuccess: (data: any) => {
      navigate(`/stack/${data.sessionId}`);
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

  const stackConfig = {
    gratitude: {
      icon: Heart,
      title: "Gratitude Stack",
      description: "Cultivate appreciation and recognize positive patterns",
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
    },
    idea: {
      icon: Lightbulb,
      title: "Idea Stack",
      description: "Transform insights into actionable plans",
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
    },
    discover: {
      icon: Sparkles,
      title: "Discover Stack",
      description: "Explore and apply transformative lessons",
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
    },
    angry: {
      icon: Flame,
      title: "Angry Stack",
      description: "Transform anger into empowerment",
      color: "text-chart-5",
      bgColor: "bg-chart-5/10",
    },
  }[stackType as StackType];

  if (isLoading || !isAuthenticated || !stackConfig) {
    return null;
  }

  const StackIcon = stackConfig.icon;
  const questionCount = stackQuestionFlows[stackType as StackType]?.totalQuestions || 0;

  const onSubmit = (values: FormValues) => {
    createStackMutation.mutate(values);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="space-y-4">
        <div className={`w-16 h-16 rounded-lg ${stackConfig.bgColor} flex items-center justify-center`}>
          <StackIcon className={`h-8 w-8 ${stackConfig.color}`} />
        </div>
        <div>
          <h1 className="text-3xl font-semibold">{stackConfig.title}</h1>
          <p className="text-muted-foreground mt-2">{stackConfig.description}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {questionCount} guided questions
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Set Up Your Stack</CardTitle>
          <CardDescription>
            Answer these initial questions to personalize your reflection journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What are you going to title this {stackConfig.title}?</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Morning Gratitude Practice, New Business Idea, etc."
                        data-testid="input-title"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="core4Domain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What domain of CORE 4 are you Stacking?</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-domain">
                          <SelectValue placeholder="Select a domain" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="mind" data-testid="option-mind">Mind</SelectItem>
                        <SelectItem value="body" data-testid="option-body">Body</SelectItem>
                        <SelectItem value="being" data-testid="option-being">Being</SelectItem>
                        <SelectItem value="balance" data-testid="option-balance">Balance</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose the life domain this Stack focuses on
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subjectEntity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Who/What are you stacking?</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., My partner, My health routine, A colleague, etc."
                        data-testid="input-subject"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      The person, situation, or thing this Stack is about
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={createStackMutation.isPending}
                data-testid="button-begin-stack"
              >
                {createStackMutation.isPending ? (
                  "Creating Stack..."
                ) : (
                  <>
                    Begin Stack
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

import { SignInButton, SignUpButton } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Lightbulb, Heart, Flame, ArrowRight, Sparkles, Target, TrendingUp } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Landing() {
  const stackTypes = [
    {
      icon: Heart,
      title: "Gratitude Stack",
      description: "Cultivate appreciation and recognize positive patterns in your life",
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
      questions: 15,
    },
    {
      icon: Lightbulb,
      title: "Idea Stack",
      description: "Transform creative insights into actionable plans with structured reflection",
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
      questions: 25,
    },
    {
      icon: Sparkles,
      title: "Discover Stack",
      description: "Explore new insights and apply transformative lessons to your life",
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
      questions: 14,
    },
    {
      icon: Flame,
      title: "Angry Stack",
      description: "Transform anger into understanding and create empowering new narratives",
      color: "text-chart-5",
      bgColor: "bg-chart-5/10",
      questions: 22,
    },
  ];

  const features = [
    {
      icon: Brain,
      title: "AI-Guided Reflection",
      description: "Claude AI guides you through evidence-based cognitive techniques",
    },
    {
      icon: Target,
      title: "CORE 4 Framework",
      description: "Organize growth across Mind, Body, Being, and Balance domains",
    },
    {
      icon: TrendingUp,
      title: "Track Your Journey",
      description: "See patterns emerge and measure your transformation over time",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border backdrop-blur-md bg-background/80">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-primary" />
              <span className="text-xl font-semibold">MindGrowth</span>
            </div>
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <SignInButton mode="modal">
                <Button data-testid="button-login">Get Started</Button>
              </SignInButton>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-8">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight">
              Transform Your Thinking
              <span className="block text-primary mt-2">One Stack at a Time</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              AI-powered cognitive reprogramming platform that helps you identify and transform
              limiting beliefs through structured reflection frameworks backed by psychology.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <SignUpButton mode="modal">
                <Button size="lg" data-testid="button-hero-start">
                  Begin Your Journey
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </SignUpButton>
            </div>
          </div>
        </div>
      </section>

      {/* Stack Types Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-semibold">Four Powerful Stack Types</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Each Stack uses structured questions to guide deep reflection and cognitive transformation
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {stackTypes.map((stack) => (
              <Card key={stack.title} className="hover-elevate" data-testid={`card-stack-${stack.title.toLowerCase().split(' ')[0]}`}>
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg ${stack.bgColor} flex items-center justify-center mb-4`}>
                    <stack.icon className={`h-6 w-6 ${stack.color}`} />
                  </div>
                  <CardTitle className="text-2xl">{stack.title}</CardTitle>
                  <CardDescription className="text-base">{stack.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    {stack.questions} guided questions
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-semibold">How It Works</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Combining AI technology with proven psychological techniques
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={feature.title} className="text-center space-y-4" data-testid={`feature-${index}`}>
                <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
                  <feature.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary/5">
        <div className="container mx-auto max-w-4xl text-center space-y-8">
          <h2 className="text-3xl sm:text-4xl font-semibold">
            Ready to Begin Your Transformation?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join others who are reshaping their thinking patterns and unlocking their potential
          </p>
          <SignUpButton mode="modal">
            <Button size="lg" data-testid="button-cta-start">
              Start Your First Stack
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </SignUpButton>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-2">
              <Brain className="h-6 w-6 text-primary" />
              <span className="font-semibold">MindGrowth</span>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2025 MindGrowth. Transform your thinking, transform your life.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

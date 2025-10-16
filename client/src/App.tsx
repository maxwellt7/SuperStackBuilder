import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/app-layout";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import NewStack from "@/pages/new-stack";
import StackSessionPage from "@/pages/stack-session";
import History from "@/pages/history";
import Settings from "@/pages/settings";
import Insights from "@/pages/insights";
import Recommendations from "@/pages/recommendations";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/stack/new/:stackType" component={NewStack} />
          <Route path="/stack/:sessionId" component={StackSessionPage} />
          <Route path="/history" component={History} />
          <Route path="/insights" component={Insights} />
          <Route path="/recommendations" component={Recommendations} />
          <Route path="/settings" component={Settings} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <>
      <Toaster />
      {!isLoading && isAuthenticated ? (
        <AppLayout>
          <Router />
        </AppLayout>
      ) : (
        <Router />
      )}
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="mindgrowth-theme">
        <TooltipProvider>
          <AppContent />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

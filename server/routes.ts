import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { getAIResponse, getInitialQuestion } from "./ai";
import { insertStackSessionSchema, insertStackMessageSchema, stackQuestionFlows, type StackType } from "@shared/schema";
import { z } from "zod";
import { upsertMessageEmbedding, semanticSearch, findSimilarMessages, analyzePatterns } from "./mongodb-vector";
import { generatePersonalizedRecommendations } from "./insights";
import { generateAdvancedAnalytics } from "./analytics";
import { 
  getAllAirtableUsers, 
  getAllAirtableSubscriptions, 
  updateUserActivity,
  syncSubscriptionToAirtable 
} from "./airtable";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Create new Stack session
  app.post("/api/stacks/create", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { title, stackType, core4Domain, subjectEntity } = req.body;

      // Validate input
      if (!title || !stackType || !core4Domain || !subjectEntity) {
        return res.status(400).json({ message: "All fields are required" });
      }

      const sessionData = insertStackSessionSchema.parse({
        userId,
        title,
        stackType,
        core4Domain,
        subjectEntity,
        currentQuestionIndex: 0, // Start at question 0
        status: "in_progress",
      });

      // Create session
      const session = await storage.createStackSession(sessionData);

      // Questions 0-2 were answered in the form (title, domain, subject)
      // So we start the chat with question 3 (index 3)
      const initialQuestion = getInitialQuestion(stackType as StackType, subjectEntity);
      await storage.createStackMessage({
        sessionId: session.id,
        role: "assistant",
        content: initialQuestion,
        questionNumber: 4, // Display as question 4 (1-indexed for user)
      });

      // Update currentQuestionIndex to 3 since we're showing question 4
      await storage.updateStackSession(session.id, {
        currentQuestionIndex: 3,
      });

      res.json({ sessionId: session.id });
    } catch (error) {
      console.error("Error creating stack session:", error);
      res.status(500).json({ message: "Failed to create stack session" });
    }
  });

  // Get Stack session
  app.get("/api/stacks/session/:sessionId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { sessionId } = req.params;

      const session = await storage.getStackSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      // Verify ownership
      if (session.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(session);
    } catch (error) {
      console.error("Error fetching session:", error);
      res.status(500).json({ message: "Failed to fetch session" });
    }
  });

  // Get session messages
  app.get("/api/stacks/messages/:sessionId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { sessionId } = req.params;

      const session = await storage.getStackSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      // Verify ownership
      if (session.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const messages = await storage.getSessionMessages(sessionId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Send message in Stack session
  app.post("/api/stacks/:sessionId/message", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { sessionId } = req.params;
      const { content } = req.body;

      if (!content || typeof content !== 'string' || !content.trim()) {
        return res.status(400).json({ message: "Message content is required" });
      }

      const session = await storage.getStackSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      // Verify ownership
      if (session.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Check if session is already completed
      if (session.status === "completed") {
        return res.status(400).json({ message: "Session is already completed" });
      }

      // Save user message
      const userMessage = await storage.createStackMessage({
        sessionId: session.id,
        role: "user",
        content: content.trim(),
        questionNumber: null,
      });

      // Create embedding for semantic search (async, don't await)
      upsertMessageEmbedding(
        userMessage.id,
        userId,
        session.id,
        content.trim(),
        {
          role: "user",
          stackType: session.stackType,
          core4Domain: session.core4Domain,
          timestamp: new Date().toISOString(),
        }
      ).catch(err => console.error("Error creating embedding:", err));

      // Get conversation history
      const allMessages = await storage.getSessionMessages(sessionId);
      const conversationHistory = allMessages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));

      // Get AI response
      const questions = stackQuestionFlows[session.stackType as StackType].questions;
      const currentQuestionIndex = session.currentQuestionIndex;
      
      const aiResponse = await getAIResponse(
        session.stackType as StackType,
        currentQuestionIndex,
        content.trim(),
        conversationHistory,
        session.subjectEntity || undefined
      );

      // Determine next question number
      const nextQuestionIndex = currentQuestionIndex + 1;
      const isLastQuestion = nextQuestionIndex >= questions.length;

      // Save AI response
      const assistantMessage = await storage.createStackMessage({
        sessionId: session.id,
        role: "assistant",
        content: aiResponse,
        questionNumber: isLastQuestion ? null : nextQuestionIndex + 1,
      });

      // Create embedding for AI response (async, don't await)
      upsertMessageEmbedding(
        assistantMessage.id,
        userId,
        session.id,
        aiResponse,
        {
          role: "assistant",
          stackType: session.stackType,
          core4Domain: session.core4Domain,
          questionNumber: nextQuestionIndex + 1,
          timestamp: new Date().toISOString(),
        }
      ).catch(err => console.error("Error creating embedding:", err));

      // Update session progress
      if (!isLastQuestion) {
        await storage.updateStackSession(session.id, {
          currentQuestionIndex: nextQuestionIndex,
        });
      } else {
        // Auto-complete if last question
        await storage.completeStackSession(session.id);
        
        // Update user activity in Airtable (completely detached, truly non-blocking)
        setImmediate(() => {
          storage.getUserStackSessions(userId).then(userSessions => {
            const totalStacks = userSessions.length;
            const completedStacks = userSessions.filter(s => s.status === 'completed').length;
            updateUserActivity(userId, totalStacks, completedStacks).catch(err => 
              console.error('Airtable activity update error:', err)
            );
          }).catch(err => console.error('Error fetching sessions for Airtable update:', err));
        });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Complete Stack session
  app.post("/api/stacks/:sessionId/complete", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { sessionId } = req.params;

      const session = await storage.getStackSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      // Verify ownership
      if (session.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.completeStackSession(sessionId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error completing session:", error);
      res.status(500).json({ message: "Failed to complete session" });
    }
  });

  // Get all user sessions
  app.get("/api/stacks/all", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sessions = await storage.getUserStackSessions(userId);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });

  // Get recent user sessions
  app.get("/api/stacks/recent", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sessions = await storage.getRecentUserStackSessions(userId, 5);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching recent sessions:", error);
      res.status(500).json({ message: "Failed to fetch recent sessions" });
    }
  });

  // Get user stack stats
  app.get("/api/stacks/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getUserStackStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Semantic search across user's Stacks
  app.post("/api/stacks/search", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { query, limit = 10 } = req.body;

      if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: "Search query is required" });
      }

      const results = await semanticSearch(userId, query, limit);
      res.json(results);
    } catch (error) {
      console.error("Error searching stacks:", error);
      res.status(500).json({ message: "Failed to search stacks" });
    }
  });

  // Find similar messages to a given message
  app.get("/api/stacks/similar/:messageId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { messageId } = req.params;
      const { sessionId } = req.query;

      if (!sessionId) {
        return res.status(400).json({ message: "Session ID is required" });
      }

      // Verify session ownership first
      const session = await storage.getStackSession(sessionId as string);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      if (session.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Now safe to get messages
      const messages = await storage.getSessionMessages(sessionId as string);
      const message = messages.find(m => m.id === messageId);

      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }

      const similar = await findSimilarMessages(userId, message.content, sessionId as string);
      res.json(similar);
    } catch (error) {
      console.error("Error finding similar messages:", error);
      res.status(500).json({ message: "Failed to find similar messages" });
    }
  });

  // Analyze patterns for a theme
  app.post("/api/stacks/patterns", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { theme } = req.body;

      if (!theme || typeof theme !== 'string') {
        return res.status(400).json({ message: "Theme is required" });
      }

      const patterns = await analyzePatterns(userId, theme);
      res.json(patterns);
    } catch (error) {
      console.error("Error analyzing patterns:", error);
      res.status(500).json({ message: "Failed to analyze patterns" });
    }
  });

  // Cognitive Insights - Generate comprehensive insights
  app.get("/api/insights/cognitive", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const timeframeMonths = parseInt(req.query.timeframe as string) || 3;

      const { generateCognitiveInsights } = await import('./insights');
      const insights = await generateCognitiveInsights(userId, timeframeMonths);
      res.json(insights);
    } catch (error) {
      console.error("Error generating cognitive insights:", error);
      res.status(500).json({ message: "Failed to generate cognitive insights" });
    }
  });

  // Analyze specific theme
  app.post("/api/insights/theme", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { theme } = req.body;

      if (!theme || typeof theme !== 'string') {
        return res.status(400).json({ message: "Theme is required" });
      }

      const { analyzeSpecificTheme } = await import('./insights');
      const themeInsight = await analyzeSpecificTheme(userId, theme);
      res.json(themeInsight);
    } catch (error) {
      console.error("Error analyzing theme:", error);
      res.status(500).json({ message: "Failed to analyze theme" });
    }
  });

  // Identify belief patterns
  app.get("/api/insights/beliefs", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      const { identifyBeliefPatterns } = await import('./insights');
      const beliefs = await identifyBeliefPatterns(userId);
      res.json(beliefs);
    } catch (error) {
      console.error("Error identifying belief patterns:", error);
      res.status(500).json({ message: "Failed to identify belief patterns" });
    }
  });

  // Identify emotional triggers
  app.get("/api/insights/triggers", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      const { identifyEmotionalTriggers } = await import('./insights');
      const triggers = await identifyEmotionalTriggers(userId);
      res.json(triggers);
    } catch (error) {
      console.error("Error identifying emotional triggers:", error);
      res.status(500).json({ message: "Failed to identify emotional triggers" });
    }
  });

  // Get personalized recommendations
  app.get("/api/insights/recommendations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      const recommendations = await generatePersonalizedRecommendations(userId);
      res.json(recommendations);
    } catch (error) {
      console.error("Error generating recommendations:", error);
      res.status(500).json({ message: "Failed to generate recommendations" });
    }
  });

  // Get advanced analytics
  app.get("/api/analytics/advanced", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      const analytics = await generateAdvancedAnalytics(userId);
      res.json(analytics);
    } catch (error) {
      console.error("Error generating advanced analytics:", error);
      res.status(500).json({ message: "Failed to generate advanced analytics" });
    }
  });

  // Admin: Get all Airtable users
  app.get("/api/admin/airtable/users", isAuthenticated, async (req: any, res) => {
    try {
      const result = await getAllAirtableUsers();
      res.json(result);
    } catch (error: any) {
      console.error("Error fetching Airtable users:", error);
      res.status(500).json({ message: "Failed to fetch Airtable users" });
    }
  });

  // Admin: Get all Airtable subscriptions
  app.get("/api/admin/airtable/subscriptions", isAuthenticated, async (req: any, res) => {
    try {
      const result = await getAllAirtableSubscriptions();
      res.json(result);
    } catch (error: any) {
      console.error("Error fetching Airtable subscriptions:", error);
      res.status(500).json({ message: "Failed to fetch Airtable subscriptions" });
    }
  });

  // Admin: Update subscription for a user
  app.post("/api/admin/subscriptions", isAuthenticated, async (req: any, res) => {
    try {
      const { userId, planType, status, expiresAt, autoRenew } = req.body;

      if (!userId || !planType || !status) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Check if Airtable is configured
      const airtableEnabled = !!(process.env.AIRTABLE_API_KEY && process.env.AIRTABLE_BASE_ID);
      
      if (!airtableEnabled) {
        return res.status(503).json({ 
          message: "Airtable integration is not configured",
          configured: false 
        });
      }

      await syncSubscriptionToAirtable(
        userId,
        planType,
        status,
        new Date(),
        expiresAt ? new Date(expiresAt) : undefined,
        autoRenew ?? true
      );

      res.json({ message: "Subscription updated successfully", configured: true });
    } catch (error) {
      console.error("Error updating subscription:", error);
      res.status(500).json({ message: "Failed to update subscription" });
    }
  });

  // Export Stack transcript
  app.get("/api/stacks/:sessionId/export", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { sessionId } = req.params;

      const session = await storage.getStackSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      // Verify ownership
      if (session.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const messages = await storage.getSessionMessages(sessionId);

      // Generate text transcript
      const timestamp = new Date().toISOString().split('T')[0];
      let transcript = `MindGrowth Stack Transcript\n`;
      transcript += `================================\n\n`;
      transcript += `Title: ${session.title}\n`;
      transcript += `Stack Type: ${session.stackType.charAt(0).toUpperCase() + session.stackType.slice(1)}\n`;
      transcript += `CORE 4 Domain: ${session.core4Domain.charAt(0).toUpperCase() + session.core4Domain.slice(1)}\n`;
      transcript += `Subject: ${session.subjectEntity}\n`;
      transcript += `Date: ${timestamp}\n`;
      transcript += `Status: ${session.status === "completed" ? "Completed" : "In Progress"}\n`;
      transcript += `\n================================\n\n`;

      messages.forEach((message, index) => {
        if (message.role === "assistant") {
          transcript += `Question ${message.questionNumber || index + 1}:\n`;
          transcript += `${message.content}\n\n`;
        } else {
          transcript += `Your Response:\n`;
          transcript += `${message.content}\n\n`;
          transcript += `---\n\n`;
        }
      });

      transcript += `\n================================\n`;
      transcript += `End of Transcript\n`;
      transcript += `Generated: ${new Date().toISOString()}\n`;

      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="${session.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-transcript.txt"`);
      res.send(transcript);
    } catch (error) {
      console.error("Error exporting transcript:", error);
      res.status(500).json({ message: "Failed to export transcript" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}

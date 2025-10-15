import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { getAIResponse, getInitialQuestion } from "./ai";
import { insertStackSessionSchema, insertStackMessageSchema, stackQuestionFlows, type StackType } from "@shared/schema";
import { z } from "zod";

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
      await storage.createStackMessage({
        sessionId: session.id,
        role: "user",
        content: content.trim(),
        questionNumber: null,
      });

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
      await storage.createStackMessage({
        sessionId: session.id,
        role: "assistant",
        content: aiResponse,
        questionNumber: isLastQuestion ? null : nextQuestionIndex + 1,
      });

      // Update session progress
      if (!isLastQuestion) {
        await storage.updateStackSession(session.id, {
          currentQuestionIndex: nextQuestionIndex,
        });
      } else {
        // Auto-complete if last question
        await storage.completeStackSession(session.id);
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

  const httpServer = createServer(app);

  return httpServer;
}

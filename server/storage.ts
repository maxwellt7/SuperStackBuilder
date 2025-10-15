import {
  users,
  stackSessions,
  stackMessages,
  type User,
  type UpsertUser,
  type StackSession,
  type InsertStackSession,
  type StackMessage,
  type InsertStackMessage,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Stack session operations
  createStackSession(session: InsertStackSession): Promise<StackSession>;
  getStackSession(id: string): Promise<StackSession | undefined>;
  getUserStackSessions(userId: string): Promise<StackSession[]>;
  getRecentUserStackSessions(userId: string, limit: number): Promise<StackSession[]>;
  updateStackSession(id: string, updates: Partial<StackSession>): Promise<StackSession>;
  completeStackSession(id: string): Promise<StackSession>;

  // Stack message operations
  createStackMessage(message: InsertStackMessage): Promise<StackMessage>;
  getSessionMessages(sessionId: string): Promise<StackMessage[]>;

  // Stats
  getUserStackStats(userId: string): Promise<{
    totalStacks: number;
    completedStacks: number;
    inProgressStacks: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Stack session operations
  async createStackSession(session: InsertStackSession): Promise<StackSession> {
    const [newSession] = await db
      .insert(stackSessions)
      .values(session)
      .returning();
    return newSession;
  }

  async getStackSession(id: string): Promise<StackSession | undefined> {
    const [session] = await db
      .select()
      .from(stackSessions)
      .where(eq(stackSessions.id, id));
    return session;
  }

  async getUserStackSessions(userId: string): Promise<StackSession[]> {
    const sessions = await db
      .select()
      .from(stackSessions)
      .where(eq(stackSessions.userId, userId))
      .orderBy(desc(stackSessions.createdAt));
    return sessions;
  }

  async getRecentUserStackSessions(userId: string, limit: number): Promise<StackSession[]> {
    const sessions = await db
      .select()
      .from(stackSessions)
      .where(eq(stackSessions.userId, userId))
      .orderBy(desc(stackSessions.createdAt))
      .limit(limit);
    return sessions;
  }

  async updateStackSession(id: string, updates: Partial<StackSession>): Promise<StackSession> {
    const [updated] = await db
      .update(stackSessions)
      .set(updates)
      .where(eq(stackSessions.id, id))
      .returning();
    return updated;
  }

  async completeStackSession(id: string): Promise<StackSession> {
    const [completed] = await db
      .update(stackSessions)
      .set({
        status: "completed",
        completedAt: new Date(),
      })
      .where(eq(stackSessions.id, id))
      .returning();
    return completed;
  }

  // Stack message operations
  async createStackMessage(message: InsertStackMessage): Promise<StackMessage> {
    const [newMessage] = await db
      .insert(stackMessages)
      .values(message)
      .returning();
    return newMessage;
  }

  async getSessionMessages(sessionId: string): Promise<StackMessage[]> {
    const messages = await db
      .select()
      .from(stackMessages)
      .where(eq(stackMessages.sessionId, sessionId))
      .orderBy(stackMessages.createdAt);
    return messages;
  }

  // Stats
  async getUserStackStats(userId: string): Promise<{
    totalStacks: number;
    completedStacks: number;
    inProgressStacks: number;
  }> {
    const allSessions = await db
      .select()
      .from(stackSessions)
      .where(eq(stackSessions.userId, userId));

    const totalStacks = allSessions.length;
    const completedStacks = allSessions.filter(s => s.status === "completed").length;
    const inProgressStacks = allSessions.filter(s => s.status === "in_progress").length;

    return {
      totalStacks,
      completedStacks,
      inProgressStacks,
    };
  }
}

export const storage = new DatabaseStorage();

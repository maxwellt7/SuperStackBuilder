import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Stack types: gratitude, idea, discover, angry
export const stackTypeEnum = ["gratitude", "idea", "discover", "angry"] as const;
export type StackType = typeof stackTypeEnum[number];

// CORE 4 domains
export const core4DomainEnum = ["mind", "body", "being", "balance"] as const;
export type Core4Domain = typeof core4DomainEnum[number];

// Stack status
export const stackStatusEnum = ["in_progress", "completed"] as const;
export type StackStatus = typeof stackStatusEnum[number];

// Stack sessions table
export const stackSessions = pgTable("stack_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  stackType: varchar("stack_type", { length: 20 }).notNull(),
  core4Domain: varchar("core4_domain", { length: 20 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("in_progress"),
  currentQuestionIndex: integer("current_question_index").notNull().default(0),
  subjectEntity: text("subject_entity"), // Who/What they are stacking
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Messages in a Stack session
export const stackMessages = pgTable("stack_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id")
    .notNull()
    .references(() => stackSessions.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 10 }).notNull(), // 'user' or 'assistant'
  content: text("content").notNull(),
  questionNumber: integer("question_number"), // Which question this relates to
  createdAt: timestamp("created_at").defaultNow(),
});

// Subscription plan types
export const planTypeEnum = ["free", "pro", "premium"] as const;
export type PlanType = typeof planTypeEnum[number];

// Subscription status
export const subscriptionStatusEnum = ["active", "cancelled", "expired"] as const;
export type SubscriptionStatus = typeof subscriptionStatusEnum[number];

// Subscriptions table
export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  planType: varchar("plan_type", { length: 20 }).notNull().default("free"),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  startedAt: timestamp("started_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
  autoRenew: boolean("auto_renew").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  stackSessions: many(stackSessions),
  subscriptions: many(subscriptions),
}));

export const stackSessionsRelations = relations(stackSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [stackSessions.userId],
    references: [users.id],
  }),
  messages: many(stackMessages),
}));

export const stackMessagesRelations = relations(stackMessages, ({ one }) => ({
  session: one(stackSessions, {
    fields: [stackMessages.sessionId],
    references: [stackSessions.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}));

// Zod schemas for validation
export const insertStackSessionSchema = createInsertSchema(stackSessions).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertStackMessageSchema = createInsertSchema(stackMessages).omit({
  id: true,
  createdAt: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type StackSession = typeof stackSessions.$inferSelect;
export type InsertStackSession = z.infer<typeof insertStackSessionSchema>;
export type StackMessage = typeof stackMessages.$inferSelect;
export type InsertStackMessage = z.infer<typeof insertStackMessageSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;

// Stack question flows - structured questions from superstack.pdf
export interface StackQuestions {
  questions: string[];
  totalQuestions: number;
}

export const stackQuestionFlows: Record<StackType, StackQuestions> = {
  gratitude: {
    totalQuestions: 15,
    questions: [
      "What are you going to title this Gratitude Stack?",
      "What domain of CORE 4 are you Stacking? (Mind, Body, Being, or Balance)",
      "Who/What are you stacking?",
      "In this moment, why has [X] triggered you to feel grateful?",
      "What is the story you're telling yourself, created by this trigger, about [X] and the situation?",
      "Describe the single word feelings that arise for you when you tell yourself that story.",
      "Describe the specific thoughts and actions that arise for you when you tell yourself this story.",
      "What are the non-emotional FACTS about the situation with [X] that triggered you to feel grateful?",
      "Empowered by your gratitude trigger with [X] and the original story you are telling yourself, what do you truly want for you in and beyond this situation?",
      "What do you want for [X] in and beyond this situation?",
      "What do you want for [X] and YOU in and beyond this situation?",
      "Stepping back from what you have created so far, why has this gratitude trigger been extremely positive?",
      "Looking at how positive this gratitude trigger has been, what is the singular lesson on life you are taking from this Stack?",
      "What is the most significant REVELATION or INSIGHT you are leaving this Gratitude Stack with, and why do you feel that way?",
      "What immediate ACTIONS are you committed to taking leaving this Stack?",
    ],
  },
  idea: {
    totalQuestions: 25,
    questions: [
      "What are you going to title this Idea Stack?",
      "What domain of CORE 4 are you Stacking? (Mind, Body, Being, or Balance)",
      "Who/What are you stacking?",
      "In this moment, what Idea has [X] activated in you?",
      "What is the story you're telling yourself about this new idea?",
      "Describe the single word feelings that arise for you when you tell yourself that story.",
      "Describe the specific thoughts and actions that arise for you when you tell yourself this story.",
      "If this productive idea is executed on, what are the positive benefits to your world and those you are connected to?",
      "If this productive idea is not executed on, what are the possible negative side effects to your world and those you are connected to?",
      "What is the first measurable FACT?",
      "Why do you feel selecting this FACT is significant?",
      "What is a simple TITLE you could give this FACT?",
      "What is the second measurable FACT?",
      "Why do you feel selecting this FACT is significant?",
      "What is a simple TITLE you could give this FACT?",
      "What is the third measurable FACT?",
      "Why do you feel selecting this FACT is significant?",
      "What is a simple TITLE you could give this FACT?",
      "What is the fourth measurable FACT?",
      "Why do you feel selecting this FACT is significant?",
      "What is a simple TITLE you could give this FACT?",
      "Stepping back from this Idea Stack, why has this productive idea been extremely positive?",
      "Looking at how positive this productive idea has been, what is the singular lesson about life you are taking from this Stack?",
      "What is the most significant REVELATION or INSIGHT you are leaving this Idea Stack with, and why do you feel that way?",
      "What immediate actions are you committed to taking leaving this Stack?",
    ],
  },
  discover: {
    totalQuestions: 14,
    questions: [
      "What are you going to title this Discover Stack?",
      "What domain of CORE 4 are you Stacking? (Mind, Body, Being, or Balance)",
      "Who/What are you stacking?",
      "In this moment, what Discovery has [X] activated in you?",
      "What is the story you're telling yourself about this discovery?",
      "Describe the single word feelings that arise for you when you tell yourself that story.",
      "Describe the specific thoughts and actions that arise for you when you tell yourself this story.",
      "Stepping back from what you have discovered, why has this discovery been extremely positive?",
      "Looking at how positive this discovery trigger has been, what is the singular lesson about life you are taking from this Stack?",
      "What Category of life would you like to apply this discovery?",
      "The lesson you learned was: [fill in based on your previous answer]",
      "How does this lesson apply to your chosen CORE 4 domain?",
      "What is the most significant REVELATION, or INSIGHT, that you are leaving this Discover Stack with? Why do you feel that way?",
      "What immediate actions are you committed to taking leaving this Discover Stack?",
    ],
  },
  angry: {
    totalQuestions: 22,
    questions: [
      "What are you going to title this Angry Stack?",
      "What domain of CORE 4 are you stacking? (Mind, Body, Being, or Balance)",
      "Who/What are you stacking?",
      "In this moment, why has [X] triggered you to feel anger?",
      "What is the story you're telling yourself, created by this trigger, about [X] and the situation?",
      "Describe the single word feelings that arise for you when you tell yourself that story.",
      "Describe the specific thoughts and actions that arise for you when you tell yourself this story.",
      "What evidence do you have to support this story as absolutely true?",
      "What are the non-emotional facts about the situation with [X] that triggered you to feel anger?",
      "Regardless of your anger trigger with [X] and the original story you are telling yourself, what do you truly want for you in and beyond this situation?",
      "What do you want for [X] in and beyond this situation?",
      "What do you want for [X] and YOU in and beyond this situation?",
      "If you keep telling yourself this original story, will it ultimately give you what you want?",
      "Are you ready to let go of the original story, to expand your mind and reality around this trigger and create a new power story that will assure you get what you want?",
      "Letting go of the original story and reviewing what you want, and knowing you can ultimately create any story you desire — what is your new DESIRED VERSION of the story?",
      "What evidence can you see to prove this DESIRED STORY is accurate, so you can weaponize yourself to move forward today?",
      "Stepping back and reviewing what you want, will telling yourself this desired story give you what you want?",
      "Stepping back from what you have created so far, why has this anger trigger been extremely positive?",
      "Looking at how positive this anger trigger has been, what is the singular lesson on life you are taking from this Stack?",
      "What is the most significant revelation or insight you are leaving this Angry Stack with, and why do you feel that way?",
      "Compared to how you felt when you started this Angry Stack, what singular words would you use to describe how you feel now completing it?",
      "What immediate actions are you committed to taking leaving this Stack?",
    ],
  },
};

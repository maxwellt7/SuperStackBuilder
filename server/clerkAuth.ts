import { clerkMiddleware, requireAuth, getAuth, clerkClient } from "@clerk/express";
import type { Express, RequestHandler } from "express";
import { storage } from "./storage";

export async function setupAuth(app: Express) {
  // Add Clerk middleware to all routes
  app.use(clerkMiddleware());
}

// Middleware to ensure user is authenticated
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const auth = getAuth(req);
  
  if (!auth.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Attach user info to request for convenience
  (req as any).userId = auth.userId;
  
  // Sync user from Clerk to our database on every authenticated request
  try {
    const clerkUser = await clerkClient.users.getUser(auth.userId);
    await upsertUserFromClerk(auth.userId, clerkUser);
  } catch (error) {
    console.error("Error syncing user from Clerk:", error);
    // Continue even if sync fails
  }
  
  next();
};

// Helper to get or create user from Clerk
export async function upsertUserFromClerk(userId: string, clerkUser: any) {
  const userData = {
    id: userId,
    email: clerkUser.emailAddresses?.[0]?.emailAddress || '',
    firstName: clerkUser.firstName || '',
    lastName: clerkUser.lastName || '',
    profileImageUrl: clerkUser.imageUrl || '',
  };
  
  await storage.upsertUser(userData);
  return userData;
}


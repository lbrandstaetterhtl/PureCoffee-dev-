import { User, Post, Comment, Report, InsertUser, InsertDiscussionPost, InsertMediaPost } from "@shared/schema";
import session from "express-session";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users, posts, comments, reports, postLikes, verificationTokens } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import { log } from "./vite";

const PostgresSessionStore = connectPg(session);

// Initialize postgres client with proper configuration
const queryClient = postgres(process.env.DATABASE_URL!, {
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  idle_timeout: 30,
  connect_timeout: 10,
  connection: {
    application_name: "coffee-social-app"
  }
});

log("Database client initialized");

const db = drizzle(queryClient);

export class DatabaseStorage implements IStorage {
  public sessionStore: session.Store;
  private isConnected: boolean = false;
  private connectionRetryTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      conObject: {
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false
        }
      },
      createTableIfMissing: true,
    });

    // Test database connection asynchronously
    this.testConnection();
  }

  private async testConnection() {
    try {
      await db.select().from(users).limit(1);
      this.isConnected = true;
      log("Database connection test successful");
      if (this.connectionRetryTimeout) {
        clearTimeout(this.connectionRetryTimeout);
        this.connectionRetryTimeout = null;
      }
    } catch (error) {
      console.error("Database connection test failed:", error);
      this.isConnected = false;
      // Retry connection after 5 seconds
      this.connectionRetryTimeout = setTimeout(() => this.testConnection(), 5000);
    }
  }

  private async ensureConnection() {
    if (!this.isConnected) {
      throw new Error("Database connection not available");
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    try {
      await this.ensureConnection();
      const result = await db.select().from(users).where(eq(users.id, id));
      return result[0];
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      await this.ensureConnection();
      const result = await db.select().from(users).where(eq(users.username, username));
      return result[0];
    } catch (error) {
      console.error('Error getting user by username:', error);
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      await this.ensureConnection();
      const result = await db.select().from(users).where(eq(users.email, email));
      return result[0];
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw error;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      await this.ensureConnection();
      const result = await db.insert(users).values(insertUser).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUserProfile(id: number, profile: Partial<{ username: string; email: string }>): Promise<User> {
    try {
      await this.ensureConnection();
      const result = await db.update(users).set(profile).where(eq(users.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  async updateUserPassword(id: number, password: string): Promise<User> {
    try {
      await this.ensureConnection();
      const result = await db.update(users).set({ password }).where(eq(users.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error('Error updating user password:', error);
      throw error;
    }
  }

  async updateUserKarma(id: number, karma: number): Promise<User> {
    try {
      await this.ensureConnection();
      const result = await db.update(users).set({ karma }).where(eq(users.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error('Error updating user karma:', error);
      throw error;
    }
  }

  async createPost(post: Omit<Post, "id" | "createdAt" | "karma">): Promise<Post> {
    try {
      await this.ensureConnection();
      const result = await db.insert(posts).values(post).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }

  async getPosts(category?: string): Promise<Post[]> {
    try {
      await this.ensureConnection();
      if (category) {
        return db.select().from(posts).where(eq(posts.category, category));
      }
      return db.select().from(posts);
    } catch (error) {
      console.error('Error getting posts:', error);
      throw error;
    }
  }

  async getPost(id: number): Promise<Post | undefined> {
    try {
      await this.ensureConnection();
      const result = await db.select().from(posts).where(eq(posts.id, id));
      return result[0];
    } catch (error) {
      console.error('Error getting post:', error);
      throw error;
    }
  }

  async updatePostKarma(id: number, karma: number): Promise<Post> {
    try {
      await this.ensureConnection();
      const result = await db.update(posts).set({ karma }).where(eq(posts.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error('Error updating post karma:', error);
      throw error;
    }
  }

  async createComment(comment: Omit<Comment, "id" | "createdAt" | "karma">): Promise<Comment> {
    try {
      await this.ensureConnection();
      const result = await db.insert(comments).values(comment).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating comment:', error);
      throw error;
    }
  }

  async getComments(postId: number): Promise<Comment[]> {
    try {
      await this.ensureConnection();
      return db.select().from(comments).where(eq(comments.postId, postId));
    } catch (error) {
      console.error('Error getting comments:', error);
      throw error;
    }
  }

  async updateCommentKarma(id: number, karma: number): Promise<Comment> {
    try {
      await this.ensureConnection();
      const result = await db.update(comments).set({ karma }).where(eq(comments.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error('Error updating comment karma:', error);
      throw error;
    }
  }

  async createReport(report: Omit<Report, "id" | "createdAt" | "status">): Promise<Report> {
    try {
      await this.ensureConnection();
      const result = await db.insert(reports).values(report).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating report:', error);
      throw error;
    }
  }

  async getReports(): Promise<Report[]> {
    try {
      await this.ensureConnection();
      return db.select().from(reports);
    } catch (error) {
      console.error('Error getting reports:', error);
      throw error;
    }
  }

  async updateReportStatus(id: number, status: string): Promise<Report> {
    try {
      await this.ensureConnection();
      const result = await db.update(reports).set({ status }).where(eq(reports.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error('Error updating report status:', error);
      throw error;
    }
  }

  async createVerificationToken(token: { token: string; userId: number; expiresAt: Date }): Promise<void> {
    try {
      await this.ensureConnection();
      await db.insert(verificationTokens).values(token);
    } catch (error) {
      console.error('Error creating verification token:', error);
      throw error;
    }
  }

  async getVerificationToken(token: string) {
    try {
      await this.ensureConnection();
      const result = await db.select().from(verificationTokens).where(eq(verificationTokens.token, token));
      return result[0];
    } catch (error) {
      console.error('Error getting verification token:', error);
      throw error;
    }
  }

  async deleteVerificationToken(token: string): Promise<void> {
    try {
      await this.ensureConnection();
      await db.delete(verificationTokens).where(eq(verificationTokens.token, token));
    } catch (error) {
      console.error('Error deleting verification token:', error);
      throw error;
    }
  }

  async verifyUserEmail(userId: number): Promise<void> {
    try {
      await this.ensureConnection();
      await db.update(users).set({ emailVerified: true }).where(eq(users.id, userId));
    } catch (error) {
      console.error('Error verifying user email:', error);
      throw error;
    }
  }

  async createPostLike(userId: number, postId: number, isLike: boolean): Promise<void> {
    try {
      await this.ensureConnection();
      await db.insert(postLikes).values({ userId, postId, isLike });
    } catch (error) {
      console.error('Error creating post like:', error);
      throw error;
    }
  }

  async removePostReaction(userId: number, postId: number): Promise<void> {
    try {
      await this.ensureConnection();
      await db.delete(postLikes).where(
        and(
          eq(postLikes.userId, userId),
          eq(postLikes.postId, postId)
        )
      );
    } catch (error) {
      console.error('Error removing post reaction:', error);
      throw error;
    }
  }

  async getUserPostReaction(userId: number, postId: number): Promise<{ isLike: boolean } | null> {
    try {
      await this.ensureConnection();
      const result = await db.select().from(postLikes).where(
        and(
          eq(postLikes.userId, userId),
          eq(postLikes.postId, postId)
        )
      );
      return result[0] ? { isLike: result[0].isLike } : null;
    } catch (error) {
      console.error('Error getting user post reaction:', error);
      throw error;
    }
  }

  async getPostReactions(postId: number): Promise<{ likes: number; dislikes: number }> {
    try {
      await this.ensureConnection();
      const reactions = await db.select().from(postLikes).where(eq(postLikes.postId, postId));
      return {
        likes: reactions.filter(r => r.isLike).length,
        dislikes: reactions.filter(r => !r.isLike).length
      };
    } catch (error) {
      console.error('Error getting post reactions:', error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
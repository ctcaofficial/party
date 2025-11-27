import { pgTable, text, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const threads = pgTable("threads", {
  id: integer("id").primaryKey(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  posterName: text("poster_name").notNull().default("Anonymous"),
  posterId: text("poster_id").notNull(),
  imageUrl: text("image_url"),
  imageName: text("image_name"),
  imageSize: integer("image_size"),
  imageWidth: integer("image_width"),
  imageHeight: integer("image_height"),
  replyCount: integer("reply_count").notNull().default(0),
  imageCount: integer("image_count").notNull().default(0),
  isSticky: boolean("is_sticky").notNull().default(false),
  bumpedAt: timestamp("bumped_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const replies = pgTable("replies", {
  id: integer("id").primaryKey(),
  threadId: integer("thread_id").notNull(),
  message: text("message").notNull(),
  posterName: text("poster_name").notNull().default("Anonymous"),
  posterId: text("poster_id").notNull(),
  imageUrl: text("image_url"),
  imageName: text("image_name"),
  imageSize: integer("image_size"),
  imageWidth: integer("image_width"),
  imageHeight: integer("image_height"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertThreadSchema = createInsertSchema(threads).omit({
  id: true,
  replyCount: true,
  imageCount: true,
  isSticky: true,
  bumpedAt: true,
  createdAt: true,
});

export const insertReplySchema = createInsertSchema(replies).omit({
  id: true,
  createdAt: true,
});

export type InsertThread = z.infer<typeof insertThreadSchema>;
export type Thread = typeof threads.$inferSelect;
export type InsertReply = z.infer<typeof insertReplySchema>;
export type Reply = typeof replies.$inferSelect;

export interface ThreadWithReplies extends Thread {
  replies: Reply[];
}

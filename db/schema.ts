import {
  pgTable,
  uuid,
  text,
  varchar,
  integer,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/**
 * users — application accounts (NextAuth Credentials provider).
 * `password` stores a bcrypt hash, never plaintext.
 */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * boards — a single whiteboard owned by one user. The board id doubles
 * as the Liveblocks roomId and the shareable link segment.
 */
export const boards = pgTable("boards", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * strokes — persisted freehand strokes for a board. `points` is a JSON
 * array of { x, y } captured along the pointer path.
 */
export const strokes = pgTable("strokes", {
  id: uuid("id").primaryKey().defaultRandom(),
  boardId: uuid("board_id")
    .notNull()
    .references(() => boards.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  points: jsonb("points").$type<{ x: number; y: number }[]>().notNull(),
  color: varchar("color", { length: 32 }).notNull().default("#000000"),
  width: integer("width").notNull().default(4),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- Relations (used by Drizzle's relational query API) ---

export const usersRelations = relations(users, ({ many }) => ({
  boards: many(boards),
  strokes: many(strokes),
}));

export const boardsRelations = relations(boards, ({ one, many }) => ({
  owner: one(users, {
    fields: [boards.ownerId],
    references: [users.id],
  }),
  strokes: many(strokes),
}));

export const strokesRelations = relations(strokes, ({ one }) => ({
  board: one(boards, {
    fields: [strokes.boardId],
    references: [boards.id],
  }),
  user: one(users, {
    fields: [strokes.userId],
    references: [users.id],
  }),
}));

// --- Inferred types for use across the app ---

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Board = typeof boards.$inferSelect;
export type NewBoard = typeof boards.$inferInsert;
export type Stroke = typeof strokes.$inferSelect;
export type NewStroke = typeof strokes.$inferInsert;

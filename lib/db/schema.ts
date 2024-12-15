import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  timestamp,
  uuid,
  text,
  primaryKey,
  foreignKey,
  boolean,
} from 'drizzle-orm/pg-core';

export const user = pgTable('User', {
  id: uuid().primaryKey().notNull().defaultRandom(),

  email: varchar('email', { length: 64 }).notNull(),
  password: varchar('password', { length: 64 }),
});

export type User = InferSelectModel<typeof user>;

export const chat = pgTable('Chat', {
  id: uuid().primaryKey().notNull().defaultRandom(),

  userId: uuid('userId').notNull().references(() => user.id),

  title: text().notNull(),
  visibility: varchar('visibility', { enum: ['public', 'private'] }).notNull().default('private'),

  createdAt: timestamp('createdAt').defaultNow().notNull(),
});

export type Chat = InferSelectModel<typeof chat>;

export const vote = pgTable(
  'Vote',
  {
    chatId: uuid('chatId').notNull().references(() => chat.id),
    messageId: varchar('messageId', { length: 24 }).notNull(),
    isUpvoted: boolean('isUpvoted').notNull(),

    createdAt: timestamp('createdAt').defaultNow().notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.messageId] }),
    };
  },
);

export type Vote = InferSelectModel<typeof vote>;
export type VoteInsert = InferInsertModel<typeof vote>;

export const document = pgTable(
  'Document',
  {
    id: uuid().notNull().defaultRandom(),

    userId: uuid('userId').notNull().references(() => user.id),

    title: text('title').notNull(),
    content: text('content'),

    createdAt: timestamp('createdAt').defaultNow().notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.id, table.createdAt] }),
    };
  },
);

export type Document = InferSelectModel<typeof document>;

export const suggestion = pgTable(
  'Suggestion',
  {
    id: uuid().notNull().defaultRandom(),

    userId: uuid('userId').notNull().references(() => user.id),

    documentId: uuid('documentId').notNull(),
    documentCreatedAt: timestamp('documentCreatedAt').notNull(),
    originalText: text('originalText').notNull(),
    suggestedText: text('suggestedText').notNull(),
    description: text(),
    isResolved: boolean('isResolved').notNull().default(false),

    createdAt: timestamp('createdAt').defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    documentRef: foreignKey({
      columns: [table.documentId, table.documentCreatedAt],
      foreignColumns: [document.id, document.createdAt],
    }),
  }),
);

export type Suggestion = InferSelectModel<typeof suggestion>;
export type SuggestionInsert = InferInsertModel<typeof suggestion>;

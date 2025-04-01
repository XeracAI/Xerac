import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  timestamp,
  uuid,
  text,
  primaryKey,
  foreignKey,
  smallint,
  boolean,
  uniqueIndex,
  serial,
  bigint,
  jsonb,
  customType,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';

type NumericConfig = {
  precision?: number;
  scale?: number;
};

export const numericCasted = customType<{
  data: number;
  driverData: string;
  config: NumericConfig;
}>({
  dataType: (config) => {
    if (config?.precision && config?.scale) {
      return `numeric(${config.precision}, ${config.scale})`;
    }
    return 'numeric';
  },
  fromDriver: (value: string) => Number.parseFloat(value),
  toDriver: (value: number) => value.toString(),
});

export const user = pgTable(
  'User',
  {
    id: uuid().primaryKey().notNull().defaultRandom(),

    email: varchar('email', { length: 64 }),

    phoneNumber: varchar('phoneNumber', { length: 15 }).notNull(),
    countryCode: varchar('countryCode', { length: 4 }).notNull(),
    isPhoneNumberVerified: boolean('isPhoneNumberVerified')
      .notNull()
      .default(false),

    otp: varchar('otp', { length: 5 }),
    lastSMSSent: timestamp('lastSMSSent'),
    otpExpires: timestamp('otpExpires'),
    failedTries: smallint('failedTries').notNull().default(0),
    lockedUntil: timestamp('lockedUntil'),

    password: varchar('password', { length: 64 }),

    firstName: varchar('firstName', { length: 50 }),
    lastName: varchar('lastName', { length: 50 }),

  referralCode: varchar('referralCode', { length: 10 }).unique(),
  referrer: uuid().references((): AnyPgColumn => user.id),
  referrerDiscountUsed: boolean('referrerDiscountUsed').notNull().default(false),

    isAdmin: boolean('isAdmin').default(false).notNull(),

    dateCreated: timestamp('dateCreated').notNull().defaultNow(),
  },
  (t) => [uniqueIndex('phone_unique_idx').on(t.phoneNumber, t.countryCode)],
);

export type UserWithAllFields = InferSelectModel<typeof user>;
export type User = Omit<Omit<UserWithAllFields, 'password'>, 'otp'>;

export const chat = pgTable('Chat', {
  id: uuid().primaryKey().notNull().defaultRandom(),

  userId: uuid('userId')
    .notNull()
    .references(() => user.id),

  title: text().notNull(),
  visibility: varchar('visibility', { enum: ['public', 'private'] })
    .notNull()
    .default('private'),

  createdAt: timestamp('createdAt').defaultNow().notNull(),
});

export type Chat = InferSelectModel<typeof chat>;

export const vote = pgTable(
  'Vote',
  {
    chatId: uuid('chatId')
      .notNull()
      .references(() => chat.id),
    messageId: varchar('messageId', { length: 24 }).notNull(),
    isUpvoted: boolean('isUpvoted').notNull(),

    createdAt: timestamp('createdAt').defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.chatId, t.messageId] })],
);

export type Vote = InferSelectModel<typeof vote>;
export type VoteInsert = InferInsertModel<typeof vote>;

export const document = pgTable(
  'Document',
  {
    id: uuid().notNull().defaultRandom(),

    userId: uuid('userId')
      .notNull()
      .references(() => user.id),

    title: text('title').notNull(),
    content: text('content'),

    createdAt: timestamp('createdAt').defaultNow().notNull(),
    kind: varchar('text', { enum: ['text', 'code', 'image', 'sheet'] })
      .notNull()
      .default('text'),
  },
  (t) => [primaryKey({ columns: [t.id, t.createdAt] })],
);

export type Document = InferSelectModel<typeof document>;

export const suggestion = pgTable(
  'Suggestion',
  {
    id: uuid().notNull().defaultRandom(),

    userId: uuid('userId')
      .notNull()
      .references(() => user.id),

    documentId: uuid('documentId').notNull(),
    documentCreatedAt: timestamp('documentCreatedAt').notNull(),
    originalText: text('originalText').notNull(),
    suggestedText: text('suggestedText').notNull(),
    description: text(),
    isResolved: boolean('isResolved').notNull().default(false),

    createdAt: timestamp('createdAt').defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.id] }),
    foreignKey({
      columns: [t.documentId, t.documentCreatedAt],
      foreignColumns: [document.id, document.createdAt],
    }),
  ],
);

export type Suggestion = InferSelectModel<typeof suggestion>;
export type SuggestionInsert = InferInsertModel<typeof suggestion>;

export const feature = pgTable('Feature', {
  id: varchar('id', { length: 50 }).primaryKey().notNull(),

  name: varchar('name', { length: 100 }).notNull(),
  description: text('description').notNull(),
  icon: varchar('icon', { length: 50 }).notNull(),
  color: varchar('color', { length: 50 }).notNull(),
});

export type Feature = InferSelectModel<typeof feature>;

export const model = pgTable('Model', {
  id: varchar('id', { length: 50 }).primaryKey().notNull(),

  label: varchar('label', { length: 50 }).notNull(),

  provider: varchar('provider', { length: 50 }).notNull(),
  apiIdentifier: varchar('apiIdentifier', { length: 100 }).notNull(),

  description: text('description').notNull(),

  inputTypes: varchar('inputTypes', {
    enum: ['Text', 'Image', 'Audio', 'Video'],
  })
    .array()
    .notNull(),
  outputTypes: varchar('outputTypes', {
    enum: ['Text', 'Image', 'Audio', 'Video', 'Embedding'],
  })
    .array()
    .notNull(),

  contextWindow: bigint('contextWindow', { mode: 'number' }),
  maxOutput: bigint('maxOutput', { mode: 'number' }),

  // For 1 million tokens
  inputCost: numericCasted('inputCost', { precision: 10, scale: 6 }),
  outputCost: numericCasted('outputCost', { precision: 10, scale: 6 }),
  cacheWriteCost: numericCasted('cacheWriteCost', { precision: 10, scale: 6 }),
  cacheReadCost: numericCasted('cacheReadCost', { precision: 10, scale: 6 }),

  knowledgeCutoff: timestamp('knowledgeCutoff'),
  releaseDate: timestamp('releaseDate'),

  extraMetadata: jsonb('extraMetadata'),

  status: varchar('status', {
    enum: ['enabled', 'coming-soon', 'disabled'],
  }).notNull(),

  createdAt: timestamp('createdAt').defaultNow().notNull(),
});

export type Model = InferSelectModel<typeof model>;

export const tag = pgTable('Tag', {
  id: uuid().primaryKey().notNull().defaultRandom(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  description: text('description'),
});

export type Tag = InferSelectModel<typeof tag>;

export const modelFeature = pgTable(
  'ModelFeature',
  {
    modelId: varchar('modelId', { length: 70 })
      .notNull()
      .references(() => model.id),
    featureId: varchar('featureId')
      .notNull()
      .references(() => feature.id),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.modelId, t.featureId] })],
);

export type ModelFeature = InferSelectModel<typeof modelFeature>;

export const modelTag = pgTable(
  'ModelTag',
  {
    modelId: varchar('modelId', { length: 70 })
      .notNull()
      .references(() => model.id),
    tagId: uuid('tagId')
      .notNull()
      .references(() => tag.id),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.modelId, t.tagId] })],
);

export type ModelTag = InferSelectModel<typeof modelTag>;

export const modelGroup = pgTable(
  'ModelGroup',
  {
    id: uuid().primaryKey().notNull().defaultRandom(),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
    title: varchar('title', { length: 50 }).notNull(),
    order: serial('order').notNull(),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex('user_title_unique_idx').on(t.userId, t.title),
    uniqueIndex('user_order_unique_idx').on(t.userId, t.order),
  ],
);

export type ModelGroup = Omit<
  Omit<InferSelectModel<typeof modelGroup>, 'userId'>,
  'createdAt'
>;

export const modelGroupModel = pgTable(
  'ModelGroupModel',
  {
    modelId: varchar('modelId', { length: 70 })
      .notNull()
      .references(() => model.id),
    modelGroupId: uuid('modelGroupId')
      .notNull()
      .references(() => modelGroup.id),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.modelId, t.modelGroupId] })],
);

export type ModelGroupModel = InferSelectModel<typeof modelGroupModel>;

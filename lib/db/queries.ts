import 'server-only';

import { genSaltSync, hashSync } from 'bcrypt-ts';
import { and, asc, desc, eq, gt, lt, type SQLWrapper, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import type mongoose from 'mongoose';
import type { FlattenMaps } from 'mongoose';

import {
  user,
  chat,
  document,
  suggestion,
  vote,
  model,
  feature,
  modelFeature,
  modelTag,
  modelGroup,
  modelGroupModel,
  tag,
  type User,
  type UserWithAllFields,
  type SuggestionInsert,
  type Model,
  type Feature,
  type Tag,
} from './schema';
import type { ArtifactKind } from '@/components/artifact';

import { type IMessage, type IMessageInsert, Message } from './mongoose-schema';
import dbConnect from './connect';
import type { PgTableWithColumns, TableConfig } from 'drizzle-orm/pg-core';
import { generateUniqueCode } from '@/lib/codes';

import type { ModelWithFeaturesAndTags, ModelGroupWithModelIDs } from './types';

const client = postgres(process.env.POSTGRES_URL!, { max: 1 });
const db = drizzle(client);

export async function getUserWithAllFields(
  phoneNumber: string,
  countryCode: string,
): Promise<UserWithAllFields | null> {
  try {
    const users = await db
      .select()
      .from(user)
      .where(
        and(
          eq(user.phoneNumber, phoneNumber),
          eq(user.countryCode, countryCode),
        ),
      );
    return users.length ? users[0] : null;
  } catch (error) {
    console.error('Failed to get user from database', error);
    throw error;
  }
}

export async function getUser(
  phoneNumber: string,
  countryCode: string,
): Promise<User | null> {
  try {
    const users = await db
      .select({
        id: user.id,

        email: user.email,

        phoneNumber: user.phoneNumber,
        countryCode: user.countryCode,
        isPhoneNumberVerified: user.isPhoneNumberVerified,

        otp: user.otp,
        lastSMSSent: user.lastSMSSent,
        otpExpires: user.otpExpires,
        failedTries: user.failedTries,
        lockedUntil: user.lockedUntil,

        firstName: user.firstName,
        lastName: user.lastName,

        referralCode: user.referralCode,
        referrer: user.referrer,
        referrerDiscountUsed: user.referrerDiscountUsed,

        balance: user.balance,

        isAdmin: user.isAdmin,

        dateCreated: user.dateCreated,
      })
      .from(user)
      .where(
        and(
          eq(user.phoneNumber, phoneNumber),
          eq(user.countryCode, countryCode),
        ),
      );
    return users.length ? users[0] : null;
  } catch (error) {
    console.error('Failed to get user from database', error);
    throw error;
  }
}

export async function getUserByReferralCode(
  referralCode: string,
): Promise<User | null> {
  try {
    const users = await db
      .select()
      .from(user)
      .where(eq(user.referralCode, referralCode));
    return users.length ? users[0] : null;
  } catch (error) {
    console.error('Failed to get user from database', error);
    throw error;
  }
}

export async function createUser({
  phoneNumber,
  countryCode,
  password,
  email,
  isPhoneNumberVerified,
}: {
  phoneNumber: string;
  countryCode: string;
  password?: string;
  email?: string;
  isPhoneNumberVerified?: boolean;
}): Promise<UserWithAllFields> {
  let hash: string | undefined;
  if (password) {
    const salt = genSaltSync(10);
    hash = hashSync(password, salt);
  }

  try {
    return (
      await db
        .insert(user)
        .values({
          phoneNumber,
          countryCode,
          password: hash,
          email,
          isPhoneNumberVerified,
          referralCode: await generateUniqueCode(user, 'referralCode'),
        })
        .returning()
    )[0];
  } catch (error) {
    console.error('Failed to create user in database');
    throw error;
  }
}

export async function updateUserOTP(
  userId: string,
  otp: string,
  otpExpires: Date,
) {
  try {
    return await db
      .update(user)
      .set({ otp, otpExpires, lastSMSSent: new Date() })
      .where(eq(user.id, userId));
  } catch (error) {
    console.error('Failed to update user OTP in database');
    throw error;
  }
}

export async function updateUserFailedTries(
  userId: string,
  failedTries: number,
  lockedUntil?: Date,
) {
  try {
    return await db
      .update(user)
      .set({ failedTries, lockedUntil })
      .where(eq(user.id, userId));
  } catch (error) {
    console.error("Failed to update user's failed tries in database");
    throw error;
  }
}

export async function updateUserVerification(
  userId: string,
  isVerified: boolean,
) {
  try {
    return await db
      .update(user)
      .set({ isPhoneNumberVerified: isVerified })
      .where(eq(user.id, userId));
  } catch (error) {
    console.error('Failed to update user verification status in database');
    throw error;
  }
}

export async function updateUserPassword(userId: string, password: string) {
  try {
    const salt = genSaltSync(10);
    const hash = hashSync(password, salt);

    return await db
      .update(user)
      .set({ password: hash })
      .where(eq(user.id, userId));
  } catch (error) {
    console.error('Failed to update user password in database');
    throw error;
  }
}

export async function updateUserInfo(
  userId: string,
  firstName: string,
  lastName: string,
  referrer?: string,
) {
  try {
    return await db
      .update(user)
      .set({ firstName, lastName, referrer })
      .where(eq(user.id, userId));
  } catch (error) {
    console.error('Failed to update user info in database');
    throw error;
  }
}

export async function saveChat({
  id,
  userId,
  title,
}: { id: string; userId: string; title: string }) {
  try {
    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      userId,
      title,
    });
  } catch (error) {
    console.error('Failed to save chat in database');
    throw error;
  }
}

export async function updateChatById({
  id,
  title,
}: { id: string; title: string }) {
  try {
    return await db.update(chat).set({ title }).where(eq(chat.id, id));
  } catch (error) {
    console.error('Failed to update chat by id in database');
    throw error;
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    await dbConnect();
    await Message.deleteMany({ chatId: id }).exec();
    await db.delete(vote).where(eq(vote.chatId, id));
    return await db.delete(chat).where(eq(chat.id, id));
  } catch (error) {
    console.error('Failed to delete chat by id from database');
    throw error;
  }
}

export async function getChatsByUserId({
  id,
  cursor,
  limit,
}: { id: string; cursor?: Date; limit: number }) {
  try {
    const query = cursor
      ? db
          .select()
          .from(chat)
          .where(and(eq(chat.userId, id), lt(chat.createdAt, cursor)))
          .orderBy(desc(chat.createdAt))
          .limit(limit)
      : db
          .select()
          .from(chat)
          .where(eq(chat.userId, id))
          .orderBy(desc(chat.createdAt))
          .limit(limit);

    return await query;
  } catch (error) {
    console.error('Failed to get chats by user from database');
    throw error;
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    return selectedChat;
  } catch (error) {
    console.error('Failed to get chat by id from database');
    throw error;
  }
}

export async function getMessagesByChatId({
  id,
}: { id: string }): Promise<Array<FlattenMaps<IMessage>>> {
  try {
    await dbConnect();
    return await Message.find({ chatId: id })
      .select('-__v')
      .sort({ createdAt: 'asc' })
      .lean<Array<FlattenMaps<IMessage>>>()
      .exec();
  } catch (error) {
    console.error('Failed to get messages by chat id from database', error);
    throw error;
  }
}

export async function saveMessages({
  messages,
}: { messages: Array<IMessageInsert> }) {
  try {
    await dbConnect();
    return await Message.insertMany(messages);
  } catch (error) {
    console.error('Failed to save messages in database', error);
    throw error;
  }
}

export async function updateMessage(
  messageId: string,
  message: Partial<IMessageInsert>,
) {
  try {
    await dbConnect();
    return await Message.updateOne({ _id: messageId }, message).exec();
  } catch (error) {
    console.error('Failed to update message in database', error);
    throw error;
  }
}

export async function addChildToMessage(
  messageId: mongoose.Types.ObjectId,
  childId: mongoose.Types.ObjectId,
) {
  try {
    await dbConnect();
    return await Message.updateOne(
      { _id: messageId },
      { $push: { children: childId } },
    ).exec();
  } catch (error) {
    console.error('Failed to update message in database', error);
    throw error;
  }
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: { chatId: string; messageId: string; type: 'up' | 'down' }) {
  try {
    const [existingVote] = await db
      .select()
      .from(vote)
      .where(and(eq(vote.messageId, messageId)));

    if (existingVote) {
      return await db
        .update(vote)
        .set({ isUpvoted: type === 'up' })
        .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));
    }
    return await db.insert(vote).values({
      chatId,
      messageId,
      isUpvoted: type === 'up',
    });
  } catch (error) {
    console.error('Failed to upvote message in database', error);
    throw error;
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await db.select().from(vote).where(eq(vote.chatId, id));
  } catch (error) {
    console.error('Failed to get votes by chat id from database', error);
    throw error;
  }
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
}) {
  try {
    return await db.insert(document).values({
      id,
      title,
      kind,
      content,
      userId,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Failed to save document in database');
    throw error;
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt));
  } catch (error) {
    console.error('Failed to get document by id from database');
    throw error;
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const [selectedDocument] = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt));

    return selectedDocument;
  } catch (error) {
    console.error('Failed to get document by id from database');
    throw error;
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: { id: string; timestamp: Date }) {
  try {
    await db
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gt(suggestion.documentCreatedAt, timestamp),
        ),
      );

    return await db
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)));
  } catch (error) {
    console.error(
      'Failed to delete documents by id after timestamp from database',
    );
    throw error;
  }
}

export async function saveSuggestions({
  suggestions,
}: { suggestions: Array<SuggestionInsert> }) {
  try {
    return await db.insert(suggestion).values(suggestions);
  } catch (error) {
    console.error('Failed to save suggestions in database');
    throw error;
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: { documentId: string }) {
  try {
    return await db
      .select()
      .from(suggestion)
      .where(and(eq(suggestion.documentId, documentId)));
  } catch (error) {
    console.error(
      'Failed to get suggestions by document version from database',
    );
    throw error;
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    await dbConnect();
    return await Message.findById(id)
      .select('-__v')
      .lean<FlattenMaps<IMessage>>()
      .exec();
  } catch (error) {
    console.error('Failed to get message by id from database');
    throw error;
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: { chatId: string; timestamp: Date }) {
  try {
    await dbConnect();
    return await Message.deleteMany({
      chatId,
      createdAt: { $gte: timestamp },
    }).exec();
  } catch (error) {
    console.error(
      'Failed to delete messages by id after timestamp from database',
    );
    throw error;
  }
}

export async function updateChatVisiblityById({
  chatId,
  visibility,
}: { chatId: string; visibility: 'private' | 'public' }) {
  try {
    return await db.update(chat).set({ visibility }).where(eq(chat.id, chatId));
  } catch (error) {
    console.error('Failed to update chat visibility in database');
    throw error;
  }
}

// AI Models queries
export async function getModels(): Promise<Model[]> {
  try {
    return await db.select().from(model);
  } catch (error) {
    console.error('Failed to get all models from database', error);
    throw error;
  }
}

export async function getModelById(id: string): Promise<Model | undefined> {
  try {
    const [selectedModel] = await db
      .select()
      .from(model)
      .where(eq(model.id, id));
    return selectedModel;
  } catch (error) {
    console.error('Failed to get model by id from database', error);
    throw error;
  }
}

export async function getModelFeatures(modelId: string): Promise<Feature[]> {
  try {
    const features = await db
      .select({
        feature: feature,
      })
      .from(modelFeature)
      .where(eq(modelFeature.modelId, modelId))
      .innerJoin(feature, eq(modelFeature.featureId, feature.id));

    return features.map((f) => f.feature);
  } catch (error) {
    console.error('Failed to get model features from database', error);
    throw error;
  }
}

export async function getModelsWithFeatures() {
  try {
    const models = await getModels();
    return await Promise.all(
      models.map(async (model) => {
        const features = await getModelFeatures(model.id);
        return {
          ...model,
          features,
        };
      }),
    );
  } catch (error) {
    console.error('Failed to get models with features from database', error);
    throw error;
  }
}

export async function getModelTags(modelId: string): Promise<Tag[]> {
  try {
    const tags = await db
      .select({
        tag,
      })
      .from(modelTag)
      .where(eq(modelTag.modelId, modelId))
      .innerJoin(tag, eq(modelTag.tagId, tag.id));

    return tags.map((t) => t.tag);
  } catch (error) {
    console.error('Failed to get model tags from database', error);
    throw error;
  }
}

export async function getModelsWithFeaturesAndTags(): Promise<
  ModelWithFeaturesAndTags[]
> {
  try {
    const models = await getModels();
    return await Promise.all(
      models.map(async (model) => {
        const features = await getModelFeatures(model.id);
        const tags = await getModelTags(model.id);
        return {
          ...model,
          features,
          tags,
        };
      }),
    );
  } catch (error) {
    console.error(
      'Failed to get models with features and tags from database',
      error,
    );
    throw error;
  }
}

/**
 * Gets all model groups for a user with their associated models
 * @param userId The user's ID
 * @returns Array of model groups with their models' IDs
 */
export async function getUserModelGroups(
  userId: string,
): Promise<ModelGroupWithModelIDs[]> {
  try {
    // Get all model groups with their models in a single query
    const results = await db
      .select({
        groupId: modelGroup.id,
        groupTitle: modelGroup.title,
        groupOrder: modelGroup.order,
        modelId: modelGroupModel.modelId,
      })
      .from(modelGroup)
      .leftJoin(
        modelGroupModel,
        eq(modelGroup.id, modelGroupModel.modelGroupId),
      )
      .where(eq(modelGroup.userId, userId))
      .orderBy(asc(modelGroup.order));

    if (results.length === 0) {
      return [];
    }

    // Process the flat results into a nested structure
    const groupMap = new Map<string, ModelGroupWithModelIDs>();

    for (const row of results) {
      if (!groupMap.has(row.groupId)) {
        groupMap.set(row.groupId, {
          id: row.groupId,
          title: row.groupTitle || '',
          order: row.groupOrder || 0,
          models: [],
        });
      }

      if (row.modelId) {
        groupMap.get(row.groupId)!.models.push(row.modelId);
      }
    }

    return Array.from(groupMap.values());
  } catch (error) {
    console.error('Failed to get user model groups from database', error);
    return [];
  }
}

/**
 * Checks if a user has a positive balance
 * @param userId The user's ID
 * @returns Boolean indicating if the user has a balance greater than 0
 */
export async function hasBalance(userId: string): Promise<boolean> {
  try {
    const [result] = await db
      .select({ hasBalance: gt(user.balance, 0) })
      .from(user)
      .where(eq(user.id, userId));

    return result ? !!result.hasBalance : false;
  } catch (error) {
    console.error('Failed to check user balance from database', error);
    return false;
  }
}

/**
 * Deducts an amount from a user's balance
 * @param userId The user's ID
 * @param amount The amount to deduct (must be positive)
 * @returns Whether the deduction was successful
 */
export async function deductBalance(
  userId: string,
  amount: number,
): Promise<boolean> {
  if (amount <= 0) {
    throw new Error('Amount to deduct must be positive');
  }

  try {
    // Start transaction
    await db.execute('BEGIN');

    try {
      // Check if user exists using Drizzle ORM
      const users = await db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.id, userId))
        .for('update'); // FOR UPDATE lock

      if (users.length === 0) {
        // User not found
        await db.execute('ROLLBACK');
        return false;
      }

      // Update the balance using Drizzle ORM
      await db
        .update(user)
        .set({
          balance: sql`${user.balance} - ${amount}`,
        })
        .where(eq(user.id, userId));

      // Commit the transaction
      await db.execute('COMMIT');
      return true;
    } catch (error) {
      // Roll back the transaction on error
      await db.execute('ROLLBACK');
      console.error('Failed to deduct from user balance', error);
      return false;
    }
  } catch (error) {
    console.error('Failed to execute transaction', error);
    return false;
  }
}

export async function count<T extends TableConfig>(
  table: PgTableWithColumns<T>,
) {
  try {
    return await db.$count(table);
  } catch (error) {
    console.error('Failed to count number of rows of table');
    throw error;
  }
}

export async function execute(query: SQLWrapper | string) {
  try {
    return await db.execute(query);
  } catch (error) {
    console.error('Failed to count number of rows of table');
    throw error;
  }
}

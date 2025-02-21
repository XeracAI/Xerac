import 'server-only'

import {genSaltSync, hashSync} from 'bcrypt-ts'
import {and, asc, desc, eq, gt, lt, SQLWrapper} from 'drizzle-orm'
import {drizzle} from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import {
  user,
  chat,
  type User,
  document,
  type SuggestionInsert,
  suggestion,
  vote,
  UserWithAllFields,
} from './schema';
import { ArtifactKind } from '@/components/artifact';

import {IMessage, IMessageInsert, Message} from './mongoose-schema'
import dbConnect from './connect'
import {PgTableWithColumns, TableConfig} from 'drizzle-orm/pg-core'
import { generateUniqueCode } from '../codes'
import mongoose, { FlattenMaps } from 'mongoose'

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!)
const db = drizzle(client)

export async function getUserWithAllFields(phoneNumber: string, countryCode: string): Promise<UserWithAllFields | null> {
  try {
    const users = await db
      .select()
      .from(user)
      .where(and(eq(user.phoneNumber, phoneNumber), eq(user.countryCode, countryCode)))
    return users.length ? users[0] : null
  } catch (error) {
    console.error('Failed to get user from database', error)
    throw error
  }
}

export async function getUser(phoneNumber: string, countryCode: string): Promise<User | null> {
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

        dateCreated: user.dateCreated,
      })
      .from(user)
      .where(and(eq(user.phoneNumber, phoneNumber), eq(user.countryCode, countryCode)))
    return users.length ? users[0] : null
  } catch (error) {
    console.error('Failed to get user from database', error)
    throw error
  }
}

export async function getUserByReferralCode(referralCode: string): Promise<User | null> {
  try {
    const users = await db
      .select()
      .from(user)
      .where(eq(user.referralCode, referralCode))
    return users.length ? users[0] : null
  } catch (error) {
    console.error('Failed to get user from database', error)
    throw error
  }
}

export async function createUser({
  phoneNumber,
  countryCode,
  password,
  email,
  isPhoneNumberVerified,
}: {
  phoneNumber: string
  countryCode: string
  password?: string
  email?: string
  isPhoneNumberVerified?: boolean
}): Promise<UserWithAllFields> {
  let hash;
  if (password) {
    const salt = genSaltSync(10)
    hash = hashSync(password, salt)
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
    )[0]
  } catch (error) {
    console.error('Failed to create user in database')
    throw error
  }
}

export async function updateUserOTP(userId: string, otp: string, otpExpires: Date) {
  try {
    return await db.update(user).set({otp, otpExpires, lastSMSSent: new Date()}).where(eq(user.id, userId))
  } catch (error) {
    console.error('Failed to update user OTP in database')
    throw error
  }
}

export async function updateUserFailedTries(userId: string, failedTries: number, lockedUntil?: Date) {
  try {
    return await db.update(user).set({failedTries, lockedUntil}).where(eq(user.id, userId))
  } catch (error) {
    console.error("Failed to update user's failed tries in database")
    throw error
  }
}

export async function updateUserVerification(userId: string, isVerified: boolean) {
  try {
    return await db.update(user).set({isPhoneNumberVerified: isVerified}).where(eq(user.id, userId))
  } catch (error) {
    console.error('Failed to update user verification status in database')
    throw error
  }
}

export async function updateUserPassword(userId: string, password: string) {
  try {
    const salt = genSaltSync(10)
    const hash = hashSync(password, salt)

    return await db.update(user).set({password: hash}).where(eq(user.id, userId))
  } catch (error) {
    console.error('Failed to update user password in database')
    throw error
  }
}

export async function updateUserInfo(userId: string, firstName: string, lastName: string, referrer?: string) {
  try {
    return await db.update(user).set({firstName, lastName, referrer}).where(eq(user.id, userId))
  } catch (error) {
    console.error('Failed to update user info in database')
    throw error
  }
}

export async function saveChat({id, userId, title}: {id: string; userId: string; title: string}) {
  try {
    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      userId,
      title,
    })
  } catch (error) {
    console.error('Failed to save chat in database')
    throw error
  }
}

export async function updateChatById({id, title}: {id: string; title: string}) {
  try {
    return await db.update(chat).set({title}).where(eq(chat.id, id))
  } catch (error) {
    console.error('Failed to update chat by id in database')
    throw error
  }
}

export async function deleteChatById({id}: {id: string}) {
  try {
    await dbConnect()
    await Message.deleteMany({chatId: id}).exec()
    await db.delete(vote).where(eq(vote.chatId, id))
    return await db.delete(chat).where(eq(chat.id, id))
  } catch (error) {
    console.error('Failed to delete chat by id from database')
    throw error
  }
}

export async function getChatsByUserId({id, cursor, limit}: {id: string; cursor?: Date; limit: number}) {
  try {
    const query = cursor
      ? db
          .select()
          .from(chat)
          .where(and(eq(chat.userId, id), lt(chat.createdAt, cursor)))
          .orderBy(desc(chat.createdAt))
          .limit(limit)
      : db.select().from(chat).where(eq(chat.userId, id)).orderBy(desc(chat.createdAt)).limit(limit)

    return await query
  } catch (error) {
    console.error('Failed to get chats by user from database')
    throw error
  }
}

export async function getChatById({id}: {id: string}) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id))
    return selectedChat
  } catch (error) {
    console.error('Failed to get chat by id from database')
    throw error
  }
}

export async function getMessagesByChatId({id}: {id: string}): Promise<Array<FlattenMaps<IMessage>>> {
  try {
    await dbConnect()
    return await Message.find({chatId: id}).select('-__v').sort({createdAt: 'asc'}).lean<Array<FlattenMaps<IMessage>>>().exec()
  } catch (error) {
    console.error('Failed to get messages by chat id from database', error)
    throw error
  }
}

export async function saveMessages({messages}: {messages: Array<IMessageInsert>}) {
  try {
    await dbConnect()
    return await Message.insertMany(messages)
  } catch (error) {
    console.error('Failed to save messages in database', error)
    throw error
  }
}

export async function updateMessage(messageId: string, message: Partial<IMessageInsert>) {
  try {
    await dbConnect()
    return await Message.updateOne({_id: messageId}, message).exec()
  } catch (error) {
    console.error('Failed to update message in database', error)
    throw error
  }
}

export async function addChildToMessage(messageId: mongoose.Types.ObjectId, childId: mongoose.Types.ObjectId) {
  try {
    await dbConnect()
    return await Message.updateOne({_id: messageId}, {$push: {children: childId}}).exec()
  } catch (error) {
    console.error('Failed to update message in database', error)
    throw error
  }
}

export async function voteMessage({chatId, messageId, type}: {chatId: string; messageId: string; type: 'up' | 'down'}) {
  try {
    const [existingVote] = await db
      .select()
      .from(vote)
      .where(and(eq(vote.messageId, messageId)))

    if (existingVote) {
      return await db
        .update(vote)
        .set({isUpvoted: type === 'up'})
        .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)))
    }
    return await db.insert(vote).values({
      chatId,
      messageId,
      isUpvoted: type === 'up',
    })
  } catch (error) {
    console.error('Failed to upvote message in database', error)
    throw error
  }
}

export async function getVotesByChatId({id}: {id: string}) {
  try {
    return await db.select().from(vote).where(eq(vote.chatId, id))
  } catch (error) {
    console.error('Failed to get votes by chat id from database', error)
    throw error
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
    })
  } catch (error) {
    console.error('Failed to save document in database')
    throw error
  }
}

export async function getDocumentsById({id}: {id: string}) {
  try {
    return await db.select().from(document).where(eq(document.id, id)).orderBy(asc(document.createdAt))
  } catch (error) {
    console.error('Failed to get document by id from database')
    throw error
  }
}

export async function getDocumentById({id}: {id: string}) {
  try {
    const [selectedDocument] = await db.select().from(document).where(eq(document.id, id)).orderBy(desc(document.createdAt))

    return selectedDocument
  } catch (error) {
    console.error('Failed to get document by id from database')
    throw error
  }
}

export async function deleteDocumentsByIdAfterTimestamp({id, timestamp}: {id: string; timestamp: Date}) {
  try {
    await db.delete(suggestion).where(and(eq(suggestion.documentId, id), gt(suggestion.documentCreatedAt, timestamp)))

    return await db.delete(document).where(and(eq(document.id, id), gt(document.createdAt, timestamp)))
  } catch (error) {
    console.error('Failed to delete documents by id after timestamp from database')
    throw error
  }
}

export async function saveSuggestions({suggestions}: {suggestions: Array<SuggestionInsert>}) {
  try {
    return await db.insert(suggestion).values(suggestions)
  } catch (error) {
    console.error('Failed to save suggestions in database')
    throw error
  }
}

export async function getSuggestionsByDocumentId({documentId}: {documentId: string}) {
  try {
    return await db
      .select()
      .from(suggestion)
      .where(and(eq(suggestion.documentId, documentId)))
  } catch (error) {
    console.error('Failed to get suggestions by document version from database')
    throw error
  }
}

export async function getMessageById({id}: {id: string}) {
  try {
    await dbConnect()
    return await Message.findById(id).select('-__v').lean<FlattenMaps<IMessage>>().exec()
  } catch (error) {
    console.error('Failed to get message by id from database')
    throw error
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({chatId, timestamp}: {chatId: string; timestamp: Date}) {
  try {
    await dbConnect()
    return await Message.deleteMany({
      chatId,
      createdAt: {$gte: timestamp},
    }).exec()
  } catch (error) {
    console.error('Failed to delete messages by id after timestamp from database')
    throw error
  }
}

export async function updateChatVisiblityById({chatId, visibility}: {chatId: string; visibility: 'private' | 'public'}) {
  try {
    return await db.update(chat).set({visibility}).where(eq(chat.id, chatId))
  } catch (error) {
    console.error('Failed to update chat visibility in database')
    throw error
  }
}

export async function count<T extends TableConfig>(table: PgTableWithColumns<T>) {
  try {
    return await db.$count(table)
  } catch (error) {
    console.error('Failed to count number of rows of table')
    throw error
  }
}

export async function execute(query: SQLWrapper | string) {
  try {
    return await db.execute(query)
  } catch (error) {
    console.error('Failed to count number of rows of table')
    throw error
  }
}

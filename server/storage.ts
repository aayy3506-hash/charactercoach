import { users, characters, conversations, messages, type User, type Character, type Conversation, type Message, type InsertUser, type InsertCharacter, type InsertConversation, type InsertMessage } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";
import { authStorage } from "./replit_integrations/auth/storage";

export interface IStorage {
  // Characters
  getCharacters(): Promise<Character[]>;
  getCharacter(id: number): Promise<Character | undefined>;
  createCharacter(character: InsertCharacter): Promise<Character>;

  // Conversations
  getConversations(userId: string): Promise<(Conversation & { characterName: string; avatarUrl: string | null })[]>;
  getConversation(id: number): Promise<Conversation | undefined>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  deleteConversation(id: number, userId: string): Promise<void>;

  // Messages
  getMessages(conversationId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;

  // Auth (delegate)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: InsertUser): Promise<User>;
}

export class DatabaseStorage implements IStorage {
  // Auth delegation
  async getUser(id: string) { return authStorage.getUser(id); }
  async upsertUser(user: InsertUser) { return authStorage.upsertUser(user); }

  // Characters
  async getCharacters(): Promise<Character[]> {
    return await db.select().from(characters).where(eq(characters.isPublic, true));
  }

  async getCharacter(id: number): Promise<Character | undefined> {
    const [character] = await db.select().from(characters).where(eq(characters.id, id));
    return character;
  }

  async createCharacter(insertCharacter: InsertCharacter): Promise<Character> {
    const [character] = await db.insert(characters).values(insertCharacter).returning();
    return character;
  }

  // Conversations
  async getConversations(userId: string): Promise<(Conversation & { characterName: string; avatarUrl: string | null })[]> {
    const rows = await db.select({
      id: conversations.id,
      userId: conversations.userId,
      characterId: conversations.characterId,
      title: conversations.title,
      createdAt: conversations.createdAt,
      updatedAt: conversations.updatedAt,
      characterName: characters.name,
      avatarUrl: characters.avatarUrl,
    })
    .from(conversations)
    .innerJoin(characters, eq(conversations.characterId, characters.id))
    .where(eq(conversations.userId, userId))
    .orderBy(desc(conversations.updatedAt));

    return rows;
  }

  async getConversation(id: number): Promise<Conversation | undefined> {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conversation;
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const [conversation] = await db.insert(conversations).values(insertConversation).returning();
    return conversation;
  }

  async deleteConversation(id: number, userId: string): Promise<void> {
    // Ensure user owns conversation
    await db.delete(conversations).where(and(eq(conversations.id, id), eq(conversations.userId, userId)));
  }

  // Messages
  async getMessages(conversationId: number): Promise<Message[]> {
    return await db.select().from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values(insertMessage).returning();
    
    // Update conversation timestamp
    await db.update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, insertMessage.conversationId));

    return message;
  }
}

export const storage = new DatabaseStorage();

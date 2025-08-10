// services/supabase/conversation.ts
import { BaseDBService } from "./base";
import { Message, Conversation } from "@/types";
import { apiGet, apiPost, apiDelete } from "../api/core/apiClient";
import { supabase } from "@/lib/supabaseClient";

export class ConversationService extends BaseDBService {
  /**
   * Create a new conversation with the first message
   */
  async createConversation(params: {
    userId: string;
    title: string;
    firstMessage: string;
    configName: string;
  }): Promise<Conversation> {
    try {
      console.log("📤 Creating conversation with params:", params);

      // Call backend API to create conversation
      const data = await apiPost<Conversation>("/db/conversations", {
        title: params.title,
        firstMessage: params.firstMessage,
        configName: params.configName,
      });

      console.log("📥 Conversation creation complete:", data);
      return data;
    } catch (error) {
      console.error("Error creating conversation:", error);
      return this.handleError(error);
    }
  }

  /**
   * Get all messages for a conversation
   */
  async getConversationMessages(conversationId: string): Promise<Message[]> {
    try {
      console.log(`Getting messages for conversation: ${conversationId}`);

      // Call backend API to get conversation messages
      const data = await apiGet<Message[]>(
        `/db/conversations/${conversationId}/messages`
      );

      return data;
    } catch (error) {
      console.error(`Error getting conversation messages: ${error}`);
      return this.handleError(error);
    }
  }

  /**
   * Get a conversation by ID
   */
  async getConversation(conversationId: string): Promise<Conversation> {
    try {
      console.log(`Getting conversation: ${conversationId}`);

      // Call backend API to get conversation
      const data = await apiGet<Conversation>(
        `/db/conversations/${conversationId}`
      );

      return data;
    } catch (error) {
      console.error(`Error getting conversation: ${error}`);
      return this.handleError(error);
    }
  }

  /**
   * Create an onboarding conversation with a specific ID
   */
  async createOnboardingConversation(params: {
    userId: string;
    sessionId: string;
    configName: string;
  }): Promise<Conversation> {
    try {
      console.log("📤 Creating onboarding conversation:", params);

      // Call backend API to create onboarding conversation
      const data = await apiPost<Conversation>("/db/conversations/onboarding", {
        sessionId: params.sessionId,
        configName: params.configName,
      });

      console.log("📥 Onboarding conversation created:", data);
      return data;
    } catch (error) {
      console.error("Error creating onboarding conversation:", error);
      return this.handleError(error);
    }
  }

  /**
   * Get all active conversations for a user
   */
  async getUserConversations(): Promise<Conversation[]> {
    try {
      console.log("Getting user conversations");

      // Call backend API to get user conversations
      const data = await apiGet<Conversation[]>("/db/conversations");

      return data;
    } catch (error) {
      console.error("Error getting user conversations:", error);
      return this.handleError(error);
    }
  }

  /**
   * Soft delete a conversation by setting status to 'deleted'
   */
  async deleteConversation(conversationId: string): Promise<void> {
    try {
      console.log(`Deleting conversation: ${conversationId}`);

      // Call backend API to delete conversation
      await apiDelete(`/db/conversations/${conversationId}`);

      console.log(`Successfully deleted conversation: ${conversationId}`);
    } catch (error) {
      console.error(`Error deleting conversation: ${error}`);
      return this.handleError(error);
    }
  }

  /**
   * Save a message to a conversation
   */
  async saveMessage(params: {
    conversationId: string;
    content: string;
    sender: "user" | "assistant";
  }): Promise<Message> {
    try {
      console.log(
        `Saving ${params.sender} message to conversation: ${params.conversationId}`
      );

      // Call backend API to save message
      const data = await apiPost<Message>(
        `/db/conversations/${params.conversationId}/messages`,
        {
          content: params.content,
          sender: params.sender,
        }
      );

      return data;
    } catch (error) {
      console.error("Error saving message:", error);
      return this.handleError(error);
    }
  }

  async getConversationsWithRecentMessages(userId: string): Promise<{
    conversations: Conversation[];
    messages: Record<string, Message[]>;
  }> {
    const { data, error } = await supabase.rpc(
      "get_conversations_with_recent_messages",
      { p_user_id: userId }
    );

    if (error) throw error;

    return {
      conversations: data.conversations || [],
      messages: data.messages || {},
    };
  }
}

export const conversationService = new ConversationService();

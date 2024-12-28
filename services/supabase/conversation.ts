import { PostgrestSingleResponse, PostgrestError } from '@supabase/supabase-js';
import { BaseService } from './base';
import { Message, Conversation } from '@/types';

export class ConversationService extends BaseService {
  async createConversation(params: {
    userId: string;
    title: string;
    firstMessage: string;
    configName: string;  // Add this parameter
  }): Promise<Conversation> {
    const operation = async () => {
      const response = await this.supabase
        .rpc('create_conversation_with_message', {
          p_user_id: params.userId,
          p_title: params.title,
          p_first_message: params.firstMessage,
          p_config_name: params.configName  // Add to RPC call
        });

      if (response.error) throw response.error;
      if (!response.data) throw new Error('No data returned');
      
      return response as PostgrestSingleResponse<Conversation>;
    };

    return this.withRetry(operation);
  }

  async getConversationMessages(conversationId: string): Promise<Message[]> {
    const operation = async (): Promise<PostgrestSingleResponse<Message[]>> => {
      const response = await this.supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('conversation_sequence', { ascending: true });

      if (response.error) throw response.error;
      
      return {
        data: response.data || [],
        error: null,
        count: null,
        status: 200,
        statusText: 'OK'
      } as PostgrestSingleResponse<Message[]>;
    };

    return this.withRetry(operation);
  }

  async getConversation(conversationId: string): Promise<Conversation> {
    const operation = async () => {
      const response = await this.supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();
  
      if (response.error) throw response.error;
      if (!response.data) throw new Error('No conversation found');
      
      return response as PostgrestSingleResponse<Conversation>;
    };
  
    return this.withRetry(operation);
  }  

  // services/conversation.ts
async getUserConversations(): Promise<Conversation[]> {
  const operation = async () => {
    const response = await this.supabase
      .from('conversations')
      .select('*')
      .eq('status', 'active')
      .order('updated_at', { ascending: false });

    if (response.error) throw response.error;
    return {
      data: response.data || [],
      error: null,
      count: null,
      status: 200,
      statusText: 'OK'
    } as PostgrestSingleResponse<Conversation[]>;
  };

  return this.withRetry(operation);
}

  async saveMessage(params: {
    conversationId: string;
    content: string;
    sender: 'user' | 'assistant';
  }): Promise<Message> {
    const operation = async () => {
      const response = await this.supabase
        .from('messages')
        .insert({
          conversation_id: params.conversationId,
          content: params.content,
          sender: params.sender
        })
        .select()
        .single();

      if (response.error) throw response.error;
      if (!response.data) throw new Error('No data returned from insert');
      
      return response as PostgrestSingleResponse<Message>;
    };

    return this.withRetry(operation);
  }
}
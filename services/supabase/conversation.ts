import { PostgrestSingleResponse } from '@supabase/supabase-js';
import { BaseService } from './base';
import { Message, Conversation } from '@/types';

export class ConversationService extends BaseService {
  async createConversation(params: {
    userId: string;
    title: string;
    firstMessage: string;
    configName: string;
  }): Promise<Conversation> {
    const operation = async () => {
      console.log('📤 Creating conversation with params:', params);
      
      const { data: conversationId, error } = await this.supabase
        .rpc('create_conversation_with_message', {
          p_user_id: params.userId,
          p_title: params.title,
          p_first_message: params.firstMessage,
          p_config_name: params.configName
        });
  
      if (error) throw error;
      if (!conversationId) throw new Error('No conversation ID returned');
  
      const response = await this.supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();
  
      if (response.error) throw response.error;
      if (!response.data) throw new Error('Failed to fetch created conversation');
  
      console.log('📥 Conversation creation complete:', response.data);
      return response as PostgrestSingleResponse<Conversation>;
    };
  
    const result = await this.withRetry(operation);
    return result as Conversation;
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

  // In conversation.ts
async createOnboardingConversation(params: {
  userId: string;
  sessionId: string;  // The UUID we generated
  configName: string;
}): Promise<Conversation> {
  const operation = async () => {
    console.log('📤 Creating onboarding conversation:', params);
    
    // Use a direct insert instead of the RPC since we need to specify the ID
    const { data, error } = await this.supabase
      .from('conversations')
      .insert({
        id: params.sessionId,
        user_id: params.userId,
        title: 'Onboarding Session',
        config_name: params.configName,
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to create onboarding conversation');

    console.log('📥 Onboarding conversation created:', data);
    return { data, error: null, count: null, status: 200, statusText: 'OK' };
  };

  return this.withRetry(operation);
}

async getUserConversations(): Promise<Conversation[]> {
  const operation = async () => {
    const response = await this.supabase
      .from('conversations')
      .select('*')
      .eq('status', 'active')
      .not('config_name', 'eq', 'onboarding') 
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
async deleteConversation(conversationId: string): Promise<void> {
  const operation = async (): Promise<PostgrestSingleResponse<any>> => {
    const response = await this.supabase
      .from('conversations')  
      .update({ status: 'deleted' })
      .eq('id', conversationId)
      .select()
      .single();

    if (response.error) throw response.error;
    return response;
  };

  await this.withRetry(operation);
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
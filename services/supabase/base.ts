import { PostgrestError, PostgrestSingleResponse } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';

export class BaseService {
  protected supabase = supabase;

  protected async handleError(error: unknown): Promise<never> {
    if (error instanceof Error || this.isPostgrestError(error)) {
      console.error('Service Error:', error);
      throw error;
    }
    // If it's an unknown error type, wrap it in an Error object
    throw new Error(String(error));
  }

  private isPostgrestError(error: unknown): error is PostgrestError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      'message' in error &&
      'details' in error
    );
  }

  protected async withRetry<T>(
    operation: () => Promise<PostgrestSingleResponse<T>>,
    retries = 3
  ): Promise<T> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const { data, error } = await operation();
        if (error) throw error;
        if (!data) throw new Error('No data returned');
        return data;
      } catch (error) {
        if (attempt === retries) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    throw new Error('Retry failed');
  }
}
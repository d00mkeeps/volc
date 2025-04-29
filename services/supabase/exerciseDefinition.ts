// services/exerciseDefinition.ts
import { PostgrestSingleResponse } from '@supabase/supabase-js';
import { BaseService } from './base';
import { ExerciseDefinition } from '@/types/workout';

export class ExerciseDefinitionService extends BaseService {
  async getAllExerciseDefinitions(): Promise<ExerciseDefinition[]> {
    const operation = async (): Promise<PostgrestSingleResponse<ExerciseDefinition[]>> => {
      console.log('📤 Fetching all exercise definitions');
      
      const response = await this.supabase
        .from('exercise_definitions')
        .select('*')
        .order('standard_name', { ascending: true });

      if (response.error) throw response.error;
      
      console.log(`📥 Fetched ${response.data?.length || 0} exercise definitions`);
      
      return {
        data: response.data || [],
        error: null,
        count: null,
        status: 200,
        statusText: 'OK'
      } as PostgrestSingleResponse<ExerciseDefinition[]>;
    };

    return this.withRetry(operation);
  }
  
  async createExerciseDefinition(exercise: Omit<ExerciseDefinition, 'id' | 'created_at' | 'updated_at'>): Promise<ExerciseDefinition> {
    const operation = async () => {
      console.log('📤 Creating new exercise definition:', exercise);
      
      const response = await this.supabase
        .from('exercise_definitions')
        .insert(exercise)
        .select()
        .single();

      if (response.error) throw response.error;
      if (!response.data) throw new Error('No data returned from insert');
      
      console.log('📥 Exercise definition created:', response.data);
      return response as PostgrestSingleResponse<ExerciseDefinition>;
    };

    return this.withRetry(operation);
  }

  async getExerciseDefinitionById(id: string): Promise<ExerciseDefinition> {
    const operation = async () => {
      const response = await this.supabase
        .from('exercise_definitions')
        .select('*')
        .eq('id', id)
        .single();

      if (response.error) throw response.error;
      if (!response.data) throw new Error('Exercise definition not found');
      
      return response as PostgrestSingleResponse<ExerciseDefinition>;
    };

    return this.withRetry(operation);
  }
}
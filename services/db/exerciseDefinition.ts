// services/supabase/exerciseDefinition.ts
import { BaseService } from './base';
import { ExerciseDefinition } from '@/types/workout';
import { apiGet, apiPost } from '../api/core/apiClient';

export class ExerciseDefinitionService extends BaseService {
  /**
   * Get all exercise definitions
   */
  async getAllExerciseDefinitions(): Promise<ExerciseDefinition[]> {
    try {
      console.log('📤 Fetching all exercise definitions');
      
      // Call backend API to get all exercise definitions
      const data = await apiGet<ExerciseDefinition[]>('/db/exercise-definitions');
      
      console.log(`📥 Fetched ${data.length} exercise definitions`);
      return data;
    } catch (error) {
      console.error('Error fetching exercise definitions:', error);
      return this.handleError(error);
    }
  }

  /**
   * Create a new exercise definition
   */
  async createExerciseDefinition(exercise: Omit<ExerciseDefinition, 'id' | 'created_at' | 'updated_at'>): Promise<ExerciseDefinition> {
    try {
      console.log('📤 Creating new exercise definition:', exercise);
      
      // Call backend API to create exercise definition
      const data = await apiPost<ExerciseDefinition>('/db/exercise-definitions', exercise);
      
      console.log('📥 Exercise definition created:', data);
      return data;
    } catch (error) {
      console.error('Error creating exercise definition:', error);
      return this.handleError(error);
    }
  }

  /**
   * Get an exercise definition by ID
   */
  async getExerciseDefinitionById(id: string): Promise<ExerciseDefinition> {
    try {
      console.log(`Fetching exercise definition: ${id}`);
      
      // Call backend API to get exercise definition by ID
      const data = await apiGet<ExerciseDefinition>(`/db/exercise-definitions/${id}`);
      
      console.log('Exercise definition retrieved:', data);
      return data;
    } catch (error) {
      console.error(`Error fetching exercise definition ${id}:`, error);
      return this.handleError(error);
    }
  }
}

export const exerciseDefinitionService = new ExerciseDefinitionService();
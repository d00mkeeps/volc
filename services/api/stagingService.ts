// services/api/stagingService.ts
import { apiPost, apiGet, apiPatch } from "./core/apiClient";
import {
  StagedWorkout,
  StageWorkoutPayload,
  StagedWorkoutStatus,
  ParsedWorkoutData,
} from "@/types/staging";

export class StagingService {
  private BASE_ENDPOINT = "/workouts/stage";

  /**
   * Stage raw workout text for parsing and canonical exercise matching.
   */
  async stageWorkout(payload: StageWorkoutPayload): Promise<StagedWorkout> {
    try {
      console.log("[StagingService] Staging workout text length:", payload.raw_text.length);
      const res = await apiPost<StagedWorkout>(this.BASE_ENDPOINT, payload, {
        timeout: 45000,
      });
      console.log("[StagingService] Staged workout created:", res.id);
      return res;
    } catch (error) {
      console.error("[StagingService] Error staging workout:", error);
      throw error;
    }
  }

  /**
   * Get staged workout by ID.
   */
  async getStagedWorkout(id: string): Promise<StagedWorkout> {
    try {
      return await apiGet<StagedWorkout>(`${this.BASE_ENDPOINT}/${id}`, {}, { timeout: 15000 });
    } catch (error) {
      console.error(`[StagingService] Error fetching staged workout ${id}:`, error);
      throw error;
    }
  }

  /**
   * Update staged workout status or parsed payload.
   */
  async updateStagedWorkout(
    id: string,
    updates: {
      status?: StagedWorkoutStatus;
      parsed_workout?: ParsedWorkoutData;
    }
  ): Promise<StagedWorkout> {
    try {
      return await apiPatch<StagedWorkout>(`${this.BASE_ENDPOINT}/${id}`, updates, { timeout: 15000 });
    } catch (error) {
      console.error(`[StagingService] Error updating staged workout ${id}:`, error);
      throw error;
    }
  }

  /**
   * List staged workouts for the current user.
   */
  async listStagedWorkouts(
    status: StagedWorkoutStatus = "staging"
  ): Promise<StagedWorkout[]> {
    try {
      return await apiGet<StagedWorkout[]>(this.BASE_ENDPOINT, { status }, { timeout: 15000 });
    } catch (error) {
      console.error("[StagingService] Error listing staged workouts:", error);
      return [];
    }
  }
}

export const stagingService = new StagingService();

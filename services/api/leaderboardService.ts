import { BaseApiService } from "./baseService";

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  first_name: string;
  last_name: string;
  workout_id: string;
  exercise_id: string;
  definition_id: string;
  exercise_name: string;
  estimated_1rm: number;
  performed_at: string;
  verified: boolean;
}

export class LeaderboardService extends BaseApiService {
  constructor() {
    super("/api/leaderboard");
  }

  async getBicepLeaderboard(): Promise<LeaderboardEntry[]> {
    try {
      return await this.get<LeaderboardEntry[]>("/biceps");
    } catch (error) {
      this.handleError(error);
    }
  }
}

// Export singleton instance
export const leaderboardService = new LeaderboardService();

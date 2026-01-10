import { BaseApiService } from "./baseService";
import { LeaderboardEntry } from "@/types";

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

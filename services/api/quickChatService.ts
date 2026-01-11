import { BaseApiService } from "./baseService";
import { QuickAction } from "@/types";

interface QuickActionsResponse {
  actions: QuickAction[];
}

class QuickChatService extends BaseApiService {
  constructor() {
    super("/api/v1/chat");
  }

  async fetchQuickActions(
    authUserUuid: string,
    recentMessages?: Array<{ sender: "user" | "assistant"; content: string }>
  ): Promise<QuickActionsResponse> {
    try {
      const response = await this.post<QuickActionsResponse>(
        `/quick-actions/${authUserUuid}`,
        recentMessages && recentMessages.length > 0 ? recentMessages : undefined
      );

      return {
        actions: response?.actions || [],
      };
    } catch (error) {
      console.error("[QuickChatService] Failed to fetch quick actions:", error);
      return {
        actions: [],
      };
    }
  }
}

export const quickChatService = new QuickChatService();

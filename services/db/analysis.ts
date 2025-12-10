import { BaseDBService } from "./base";
import { AnalysisBundle } from "@/types/workout";
import { UserContextBundle } from "@/types";
import { apiGet, apiPost, apiDelete } from "../api/core/apiClient";

export class AnalysisBundleService extends BaseDBService {
  /**
   * Save a workout data bundle to the database
   */
  async saveAnalysisBundle(
    userId: string,
    bundle: AnalysisBundle
  ): Promise<void> {
    try {
      console.log(
        `[AnalysisBundleService] Saving analysis bundle: ${bundle.bundle_id}`
      );
      await apiPost("/db/analysis-bundles", bundle);
      console.log(
        `[AnalysisBundleService] Bundle saved successfully with conversation ID: ${bundle.conversationId}`
      );
    } catch (error) {
      console.error(
        `[AnalysisBundleService] Error in saveAnalysisBundle:`,
        error
      );
      return this.handleError(error);
    }
  }

  /**
   * Get all analysis bundles for a specific conversation
   */
  async getAnalysisBundlesByConversation(
    userId: string,
    conversationId: string
  ): Promise<AnalysisBundle[]> {
    try {
      console.log(
        `[AnalysisBundleService] Getting analysis bundles for conversation: ${conversationId}`
      );
      const bundles = await apiGet<AnalysisBundle[]>("/db/analysis-bundles", {
        conversation_id: conversationId,
      });
      console.log(
        `[AnalysisBundleService] Retrieved ${bundles.length} analysis bundles`
      );
      return bundles;
    } catch (error) {
      console.error(
        `[AnalysisBundleService] Error getting analysis bundles:`,
        error
      );
      return this.handleError(error);
    }
  }

  /**
   * Delete an analysis bundle
   */
  async deleteAnalysisBundle(userId: string, bundleId: string): Promise<void> {
    try {
      console.log(
        `[AnalysisBundleService] Deleting analysis bundle: ${bundleId}`
      );
      await apiDelete(`/db/analysis-bundles/${bundleId}`);
      console.log(
        `[AnalysisBundleService] Successfully deleted analysis bundle: ${bundleId}`
      );
    } catch (error) {
      console.error(
        `[AnalysisBundleService] Error deleting analysis bundle:`,
        error
      );
      return this.handleError(error);
    }
  }

  /**
   * Delete all analysis bundles for a conversation
   */
  async deleteConversationAnalysisBundles(
    userId: string,
    conversationId: string
  ): Promise<void> {
    try {
      console.log(
        `[AnalysisBundleService] Deleting all analysis bundles for conversation: ${conversationId}`
      );
      await apiDelete(`/db/analysis-bundles/conversation/${conversationId}`);
      console.log(
        `[AnalysisBundleService] Successfully deleted all analysis bundles for conversation: ${conversationId}`
      );
    } catch (error) {
      console.error(
        `[AnalysisBundleService] Error deleting conversation analysis bundles:`,
        error
      );
      return this.handleError(error);
    }
  }

  /**
   * Get the latest user context bundle
   */
  async getLatestUserContextBundle(userId: string): Promise<UserContextBundle | null> {
    try {
      console.log(`[AnalysisBundleService] Getting latest user context bundle`);
      const bundle = await apiGet<UserContextBundle | null>("/db/user-context/latest");
      
      if (bundle) {
        console.log(`[AnalysisBundleService] Retrieved latest user context bundle: ${bundle.id}`);
      } else {
        console.log(`[AnalysisBundleService] No user context bundle found`);
      }
      
      return bundle;
    } catch (error) {
      console.error(
        `[AnalysisBundleService] Error getting latest user context bundle:`,
        error
      );
      return this.handleError(error);
    }
  }
}

export const analysisBundleService = new AnalysisBundleService();

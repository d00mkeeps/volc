import { BaseDBService } from "./base";
import { apiGet } from "../api/core/apiClient";

export interface GlossaryTerm {
  id: string;
  term: string;
  description: string;
  metadata?: Record<string, any>;
}

export class GlossaryService extends BaseDBService {
  /**
   * Get all glossary terms
   */
  async getAllGlossaryTerms(): Promise<GlossaryTerm[]> {
    try {
      console.log("📤 Fetching all glossary terms");
      const data = await apiGet<GlossaryTerm[]>("/db/glossary-terms");
      console.log(`📥 Fetched ${data.length} glossary terms`);
      return data;
    } catch (error) {
      console.error("Error fetching glossary terms:", error);
      return this.handleError(error);
    }
  }

  /**
   * Get a glossary term by ID
   */
  async getGlossaryTermById(termId: string): Promise<GlossaryTerm> {
    try {
      console.log(`📤 Fetching glossary term: ${termId}`);
      const data = await apiGet<GlossaryTerm>(`/db/glossary-terms/${termId}`);
      console.log("📥 Glossary term retrieved:", data);
      return data;
    } catch (error) {
      console.error(`Error fetching glossary term ${termId}:`, error);
      return this.handleError(error);
    }
  }
}

export const glossaryService = new GlossaryService();

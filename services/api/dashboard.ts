import { AllTimeframeData } from "@/types/workout";
import { apiGet } from "./core/apiClient";

export const dashboardService = {
  getAllDashboardData: async (): Promise<AllTimeframeData> => {
    return apiGet<AllTimeframeData>("/api/dashboard");
  },
};

import { apiGet } from "./core/apiClient";

export interface EndpointStat {
  path: string;
  count: number;
  avg_latency: number;
  history: { timestamp: string; latency: number }[];
}

export interface AdminStats {
  total_requests: number;
  avg_latency: number;
  error_rate: number;
  top_endpoints: EndpointStat[];
}

export interface LLMStats {
  token_stats: {
    total_input_tokens: number;
    total_output_tokens: number;
    avg_input_tokens: number;
    avg_output_tokens: number;
    max_input_tokens: number;
    max_output_tokens: number;
  };
  latency_stats: {
    avg_latency: number;
    p50_latency: number;
    p95_latency: number;
    p99_latency: number;
  };
  volume_stats: {
    total_requests: number;
    requests_per_hour: { hour: string; count: number }[];
    by_model: { model: string; count: number }[];
    by_endpoint: { endpoint: string; count: number }[];
  };
}

export const adminService = {
  getStats: async (): Promise<AdminStats> => {
    return apiGet<AdminStats>("/api/admin/stats");
  },
  getLLMStats: async (): Promise<LLMStats> => {
    return apiGet<LLMStats>("/api/admin/llm-stats");
  },
};

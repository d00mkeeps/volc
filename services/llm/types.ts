export interface AnthropicResponse {
    content: Array<{
      text: string;
    }>;
    error?: {
      type: string;
      message: string;
    };
  }
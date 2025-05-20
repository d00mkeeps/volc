// import { TITLE_SYSTEM_PROMPT } from "@/lib/prompt/title";
// import { AnthropicResponse } from "./types";

// export class LLMService {
//     private apiKey: string = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || '';
  
//     constructor() {
//       if (!this.apiKey) {
//         throw new Error('ANTHROPIC_API_KEY not found');
//       }
//     }
  
//     async generateTitle(message: string): Promise<string> {
//       try {
//         const response = await fetch('https://api.anthropic.com/v1/messages', {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',  
//             'x-api-key': this.apiKey,
//             'anthropic-version': '2023-06-01'
//           },
//           body: JSON.stringify({
//             model: "claude-3-haiku-20240307",
//             system: TITLE_SYSTEM_PROMPT,
//             max_tokens: 30,
//             messages: [{role: "user", content: message}]
//           })
//         });
        
//         if (!response.ok) {
//           throw new Error(`API call failed: ${response.statusText}`);
//         }
  
//         const data = await response.json() as AnthropicResponse;
        
//         if (data.error) {
//           throw new Error(data.error.message);
//         }
  
//         if (!data.content?.[0]?.text) {
//           throw new Error('Invalid response format');
//         }
  
//         const title = data.content[0].text.trim();
//         console.log('🎯 LLM Title Generated:', { message, title });
//         return title;
//       } catch (error) {
//         console.error('❌ Title generation failed:', error);
//         return message.substring(0, 50);
//       }
//     }
//   }
  
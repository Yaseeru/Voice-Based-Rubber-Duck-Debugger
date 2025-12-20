/**
 * Gemini Service
 * Interface with Google Vertex AI Gemini for AI reasoning
 */

import { VertexAI } from '@google-cloud/vertexai';
import { ConversationTurn } from './sessionManager';

const SYSTEM_PROMPT = `You are a senior software engineer acting as a rubber duck debugger. 
Do not provide immediate solutions. First, reflect the user's explanation, 
highlight contradictions, and suggest a structured debugging path. 
Keep responses clear, concise, and spoken naturally.`;

const MAX_TOKENS = 500;
const TIMEOUT_MS = 10000; // 10 seconds
const RETRY_DELAY_MS = 1000; // 1 second

export interface GeminiConfig {
     projectId: string;
     location: string;
     model?: string;
}

class GeminiService {
     private vertexAI: VertexAI;
     private modelName: string;

     constructor(config: GeminiConfig) {
          this.vertexAI = new VertexAI({
               project: config.projectId,
               location: config.location,
          });
          this.modelName = config.model || 'gemini-2.0-flash-exp';
     }

     /**
      * Construct a full prompt with system instructions and conversation context
      * @param userInput - Current user input
      * @param conversationHistory - Previous conversation turns
      * @returns Formatted prompt string
      */
     constructPrompt(userInput: string, conversationHistory: ConversationTurn[]): string {
          let prompt = SYSTEM_PROMPT + '\n\n';

          // Add conversation history
          if (conversationHistory.length > 0) {
               prompt += 'Previous conversation:\n';
               conversationHistory.forEach((turn) => {
                    prompt += `User: ${turn.input}\n`;
                    prompt += `Assistant: ${turn.output}\n\n`;
               });
          }

          // Add current user input
          prompt += `User: ${userInput}\n`;
          prompt += 'Assistant:';

          return prompt;
     }

     /**
      * Generate a debugging response using Gemini
      * @param userInput - Current user input
      * @param conversationHistory - Previous conversation turns (up to 20)
      * @returns AI-generated debugging response
      */
     async generateResponse(
          userInput: string,
          conversationHistory: ConversationTurn[] = []
     ): Promise<string> {
          try {
               return await this.generateResponseWithTimeout(userInput, conversationHistory);
          } catch (error) {
               console.error('Gemini API failed on first attempt:', error);

               // Retry once after 1 second delay
               await this.delay(RETRY_DELAY_MS);

               try {
                    return await this.generateResponseWithTimeout(userInput, conversationHistory);
               } catch (retryError) {
                    console.error('Gemini API failed on retry:', retryError);
                    return "Sorry, I didn't fully understand, could you rephrase?";
               }
          }
     }

     /**
      * Generate response with timeout enforcement
      * @param userInput - Current user input
      * @param conversationHistory - Previous conversation turns
      * @returns AI-generated response
      */
     private async generateResponseWithTimeout(
          userInput: string,
          conversationHistory: ConversationTurn[]
     ): Promise<string> {
          const prompt = this.constructPrompt(userInput, conversationHistory);

          const timeoutPromise = new Promise<never>((_, reject) => {
               setTimeout(() => reject(new Error('Request timeout')), TIMEOUT_MS);
          });

          const generationPromise = this.callGeminiAPI(prompt);

          return Promise.race([generationPromise, timeoutPromise]);
     }

     /**
      * Call Gemini API with configured parameters
      * @param prompt - Full prompt with context
      * @returns Generated text response
      */
     private async callGeminiAPI(prompt: string): Promise<string> {
          const generativeModel = this.vertexAI.getGenerativeModel({
               model: this.modelName,
               generationConfig: {
                    maxOutputTokens: MAX_TOKENS,
                    temperature: 0.7,
               },
          });

          const result = await generativeModel.generateContent(prompt);
          const response = result.response;

          if (!response.candidates || response.candidates.length === 0) {
               throw new Error('No response candidates from Gemini');
          }

          const text = response.candidates[0].content.parts[0].text;

          if (!text) {
               throw new Error('Empty response from Gemini');
          }

          return text;
     }

     /**
      * Delay helper for retry logic
      * @param ms - Milliseconds to delay
      */
     private delay(ms: number): Promise<void> {
          return new Promise(resolve => setTimeout(resolve, ms));
     }

     /**
      * Get the current configuration
      * @returns Configuration object with model name and max tokens
      */
     getConfig(): { model: string; maxTokens: number; systemPrompt: string } {
          return {
               model: this.modelName,
               maxTokens: MAX_TOKENS,
               systemPrompt: SYSTEM_PROMPT,
          };
     }
}

// Export singleton instance (will be initialized with env vars)
let geminiService: GeminiService | null = null;

export function initializeGeminiService(config: GeminiConfig): GeminiService {
     geminiService = new GeminiService(config);
     return geminiService;
}

export function getGeminiService(): GeminiService {
     if (!geminiService) {
          throw new Error('Gemini service not initialized. Call initializeGeminiService first.');
     }
     return geminiService;
}

export default GeminiService;

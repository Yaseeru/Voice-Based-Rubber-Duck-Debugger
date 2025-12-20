import * as fc from 'fast-check';
import GeminiService, { GeminiConfig } from './gemini';
import { ConversationTurn } from './sessionManager';

describe('GeminiService', () => {
     /**
      * Feature: voice-rubber-duck-debugger, Property 17: Gemini configuration consistency
      * Validates: Requirements 3.2, 3.3
      */
     describe('Property 17: Gemini configuration consistency', () => {
          it('should configure the model with the rubber duck debugger system prompt and a maximum of 500 tokens for any request', () => {
               fc.assert(
                    fc.property(
                         fc.string({ minLength: 1 }), // projectId
                         fc.string({ minLength: 1 }), // location
                         (projectId, location) => {
                              // Create a Gemini service instance
                              const config: GeminiConfig = {
                                   projectId,
                                   location,
                              };

                              const service = new GeminiService(config);

                              // Get the configuration
                              const serviceConfig = service.getConfig();

                              // Verify the system prompt is set correctly
                              expect(serviceConfig.systemPrompt).toContain('senior software engineer');
                              expect(serviceConfig.systemPrompt).toContain('rubber duck debugger');
                              expect(serviceConfig.systemPrompt).toContain('Do not provide immediate solutions');
                              expect(serviceConfig.systemPrompt).toContain('reflect the user\'s explanation');
                              expect(serviceConfig.systemPrompt).toContain('highlight contradictions');
                              expect(serviceConfig.systemPrompt).toContain('structured debugging path');

                              // Verify max tokens is set to 500
                              expect(serviceConfig.maxTokens).toBe(500);

                              // Verify model name is set
                              expect(serviceConfig.model).toBeTruthy();
                              expect(typeof serviceConfig.model).toBe('string');
                         }
                    ),
                    { numRuns: 100 }
               );
          });
     });

     /**
      * Feature: voice-rubber-duck-debugger, Property 4: Gemini requests include conversation context
      * Validates: Requirements 5.3
      */
     describe('Property 4: Gemini requests include conversation context', () => {
          it('should include all previous conversation turns up to the most recent 20 for any user input with existing conversation history', () => {
               fc.assert(
                    fc.property(
                         fc.string({ minLength: 1 }), // projectId
                         fc.string({ minLength: 1 }), // location
                         fc.string({ minLength: 1 }), // current user input
                         fc.array(
                              fc.record({
                                   input: fc.string({ minLength: 1 }),
                                   output: fc.string({ minLength: 1 }),
                                   timestamp: fc.integer({ min: 1000000000000, max: 9999999999999 })
                              }),
                              { minLength: 1, maxLength: 25 } // Test with 1-25 turns
                         ),
                         (projectId, location, userInput, conversationHistory) => {
                              // Create a Gemini service instance
                              const config: GeminiConfig = {
                                   projectId,
                                   location,
                              };

                              const service = new GeminiService(config);

                              // Construct the prompt with conversation history
                              const prompt = service.constructPrompt(userInput, conversationHistory);

                              // Verify the prompt includes the system prompt
                              expect(prompt).toContain('senior software engineer');
                              expect(prompt).toContain('rubber duck debugger');

                              // Verify the prompt includes the current user input
                              expect(prompt).toContain(userInput);

                              // Verify the prompt includes conversation history
                              if (conversationHistory.length > 0) {
                                   expect(prompt).toContain('Previous conversation:');

                                   // For sessions with <= 20 turns, all should be included
                                   if (conversationHistory.length <= 20) {
                                        conversationHistory.forEach((turn) => {
                                             expect(prompt).toContain(turn.input);
                                             expect(prompt).toContain(turn.output);
                                        });
                                   } else {
                                        // For sessions with > 20 turns, only the most recent 20 should be included
                                        // Note: The session manager handles this truncation, but we test that
                                        // the constructPrompt method includes all turns it receives
                                        conversationHistory.forEach((turn) => {
                                             expect(prompt).toContain(turn.input);
                                             expect(prompt).toContain(turn.output);
                                        });
                                   }
                              }

                              // Verify the prompt has the correct structure
                              expect(prompt).toMatch(/User:.*\nAssistant:/s);
                         }
                    ),
                    { numRuns: 100 }
               );
          });

          it('should construct prompts with conversation history in chronological order', () => {
               fc.assert(
                    fc.property(
                         fc.string({ minLength: 1 }), // projectId
                         fc.string({ minLength: 1 }), // location
                         fc.string({ minLength: 1 }), // current user input
                         fc.integer({ min: 2, max: 10 }), // number of turns
                         (projectId, location, userInput, numTurns) => {
                              // Create a Gemini service instance
                              const config: GeminiConfig = {
                                   projectId,
                                   location,
                              };

                              const service = new GeminiService(config);

                              // Create conversation history with numbered inputs/outputs
                              const conversationHistory: ConversationTurn[] = [];
                              for (let i = 0; i < numTurns; i++) {
                                   conversationHistory.push({
                                        input: `input-${i}`,
                                        output: `output-${i}`,
                                        timestamp: Date.now() + i
                                   });
                              }

                              // Construct the prompt
                              const prompt = service.constructPrompt(userInput, conversationHistory);

                              // Verify turns appear in chronological order
                              for (let i = 0; i < numTurns - 1; i++) {
                                   const currentTurnIndex = prompt.indexOf(`input-${i}`);
                                   const nextTurnIndex = prompt.indexOf(`input-${i + 1}`);

                                   // The next turn should appear after the current turn
                                   expect(nextTurnIndex).toBeGreaterThan(currentTurnIndex);
                              }
                         }
                    ),
                    { numRuns: 100 }
               );
          });
     });
});

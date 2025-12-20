/**
 * Property-Based Tests for Debug Routes
 */

import * as fc from 'fast-check';
import request from 'supertest';
import express, { Express } from 'express';
import debugRouter from './debug';
import { initializeGeminiService } from '../services/gemini';
import { sessionManager } from '../services/sessionManager';

// Mock the services
jest.mock('../services/stt');
jest.mock('../services/gemini');
jest.mock('../services/tts');

import { getSttService } from '../services/stt';
import { getGeminiService } from '../services/gemini';
import { getTtsService } from '../services/tts';

describe('Debug Routes - Property-Based Tests', () => {
     let app: Express;

     beforeAll(() => {
          // Initialize Gemini service for tests
          initializeGeminiService({
               projectId: 'test-project',
               location: 'us-central1'
          });
     });

     beforeEach(() => {
          // Set up Express app with debug router
          app = express();
          app.use(express.json({ limit: '10mb' }));
          app.use('/debug', debugRouter);

          // Clear sessions before each test
          sessionManager.clearAllSessions();

          // Reset mocks
          jest.clearAllMocks();
     });

     /**
      * Feature: voice-rubber-duck-debugger, Property 8: Response structure completeness
      * Validates: Requirements 4.4, 11.3
      */
     describe('Property 8: Response structure completeness', () => {
          it('should return both textResponse and audioUrl for any successful request', async () => {
               await fc.assert(
                    fc.asyncProperty(
                         fc.string({ minLength: 1 }), // audio (base64)
                         fc.string({ minLength: 1 }), // userId
                         fc.string({ minLength: 1 }), // transcribed text
                         fc.string({ minLength: 1 }), // AI response
                         fc.string({ minLength: 1 }), // audio base64
                         async (audio, userId, transcribedText, aiResponse, audioBase64) => {
                              // Mock service responses
                              const mockSttService = {
                                   transcribe: jest.fn().mockResolvedValue(transcribedText)
                              };
                              const mockGeminiService = {
                                   generateResponse: jest.fn().mockResolvedValue(aiResponse)
                              };
                              const mockTtsService = {
                                   synthesize: jest.fn().mockResolvedValue(audioBase64)
                              };

                              (getSttService as jest.Mock).mockReturnValue(mockSttService);
                              (getGeminiService as jest.Mock).mockReturnValue(mockGeminiService);
                              (getTtsService as jest.Mock).mockReturnValue(mockTtsService);

                              // Make request
                              const response = await request(app)
                                   .post('/debug/voice')
                                   .send({ audio, userId });

                              // Verify response structure
                              expect(response.status).toBe(200);
                              expect(response.body).toHaveProperty('textResponse');
                              expect(response.body).toHaveProperty('audioUrl');
                              expect(typeof response.body.textResponse).toBe('string');
                              expect(typeof response.body.audioUrl).toBe('string');
                              expect(response.body.textResponse).toBe(aiResponse);
                              expect(response.body.audioUrl).toContain('data:audio/mpeg;base64,');
                         }
                    ),
                    { numRuns: 100 }
               );
          });
     });

     /**
      * Feature: voice-rubber-duck-debugger, Property 14: Request validation
      * Validates: Requirements 11.4
      */
     describe('Property 14: Request validation', () => {
          it('should validate that both audio and userId are present before processing', async () => {
               await fc.assert(
                    fc.asyncProperty(
                         fc.option(fc.string(), { nil: undefined }), // audio (may be undefined)
                         fc.option(fc.string(), { nil: undefined }), // userId (may be undefined)
                         async (audio, userId) => {
                              // Make request with potentially missing parameters
                              const response = await request(app)
                                   .post('/debug/voice')
                                   .send({ audio, userId });

                              // If either parameter is missing, should return 400
                              if (!audio || !userId) {
                                   expect(response.status).toBe(400);
                                   expect(response.body).toHaveProperty('error');
                                   expect(response.body).toHaveProperty('message');
                                   expect(response.body.message).toContain('audio and userId are required');
                              }
                         }
                    ),
                    { numRuns: 100 }
               );
          });
     });

     /**
      * Feature: voice-rubber-duck-debugger, Property 12: Error preservation of session state
      * Validates: Requirements 9.5
      */
     describe('Property 12: Error preservation of session state', () => {
          it('should preserve session context when an error occurs during processing', async () => {
               await fc.assert(
                    fc.asyncProperty(
                         fc.string({ minLength: 1 }), // audio (base64)
                         fc.string({ minLength: 1 }), // userId
                         fc.string({ minLength: 1 }), // transcribed text
                         fc.array(fc.record({
                              input: fc.string({ minLength: 1 }),
                              output: fc.string({ minLength: 1 }),
                              timestamp: fc.integer({ min: 0 })
                         }), { maxLength: 5 }), // existing conversation history
                         async (audio, userId, transcribedText, existingHistory) => {
                              // Set up session with existing history
                              const session = sessionManager.getSession(userId);
                              session.conversation = existingHistory;

                              // Mock STT to succeed but Gemini to fail
                              const mockSttService = {
                                   transcribe: jest.fn().mockResolvedValue(transcribedText)
                              };
                              const mockGeminiService = {
                                   generateResponse: jest.fn().mockRejectedValue(new Error('Gemini API failed'))
                              };
                              const mockTtsService = {
                                   synthesize: jest.fn()
                              };

                              (getSttService as jest.Mock).mockReturnValue(mockSttService);
                              (getGeminiService as jest.Mock).mockReturnValue(mockGeminiService);
                              (getTtsService as jest.Mock).mockReturnValue(mockTtsService);

                              // Make request (should fail)
                              await request(app)
                                   .post('/debug/voice')
                                   .send({ audio, userId });

                              // Verify session state is preserved (not corrupted)
                              const sessionAfterError = sessionManager.getSession(userId);
                              expect(sessionAfterError.conversation).toEqual(existingHistory);
                              expect(sessionAfterError.conversation.length).toBe(existingHistory.length);
                         }
                    ),
                    { numRuns: 100 }
               );
          });
     });

     /**
      * Feature: voice-rubber-duck-debugger, Property 2: STT transcription stores session context
      * Validates: Requirements 2.2
      */
     describe('Property 2: STT transcription stores session context', () => {
          it('should store transcribed text and AI response in session context after successful processing', async () => {
               await fc.assert(
                    fc.asyncProperty(
                         fc.string({ minLength: 1 }), // audio (base64)
                         fc.string({ minLength: 1 }), // userId
                         fc.string({ minLength: 1 }), // transcribed text
                         fc.string({ minLength: 1 }), // AI response
                         fc.string({ minLength: 1 }), // audio base64
                         async (audio, userId, transcribedText, aiResponse, audioBase64) => {
                              // Clear session before test
                              sessionManager.clearAllSessions();

                              // Mock service responses
                              const mockSttService = {
                                   transcribe: jest.fn().mockResolvedValue(transcribedText)
                              };
                              const mockGeminiService = {
                                   generateResponse: jest.fn().mockResolvedValue(aiResponse)
                              };
                              const mockTtsService = {
                                   synthesize: jest.fn().mockResolvedValue(audioBase64)
                              };

                              (getSttService as jest.Mock).mockReturnValue(mockSttService);
                              (getGeminiService as jest.Mock).mockReturnValue(mockGeminiService);
                              (getTtsService as jest.Mock).mockReturnValue(mockTtsService);

                              // Make request
                              await request(app)
                                   .post('/debug/voice')
                                   .send({ audio, userId });

                              // Verify session contains the transcribed text and AI response
                              const session = sessionManager.getSession(userId);
                              expect(session.conversation.length).toBeGreaterThan(0);

                              const lastTurn = session.conversation[session.conversation.length - 1];
                              expect(lastTurn.input).toBe(transcribedText);
                              expect(lastTurn.output).toBe(aiResponse);
                         }
                    ),
                    { numRuns: 100 }
               );
          });
     });
});

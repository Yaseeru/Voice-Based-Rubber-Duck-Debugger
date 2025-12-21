/**
 * STT Service Tests
 * Property-based tests for Speech-to-Text service
 */

import * as fc from 'fast-check';
import { STTService } from './stt';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock logger
jest.mock('../utils/logger', () => ({
     logger: {
          logSTT: jest.fn(),
          logError: jest.fn()
     }
}));

/**
 * Custom generator for valid audio base64 data
 * The STT service requires audio buffers >= 1000 bytes
 * Base64 encoding increases size by ~33%, so we need at least 750 chars of raw data
 * to get 1000 bytes after decoding. Using 1500 chars to be safe.
 */
const validAudioBase64 = fc.string({ minLength: 1500, maxLength: 3000 })
     .map(s => Buffer.from(s).toString('base64'));

const validUserId = fc.string({ minLength: 1, maxLength: 50 })
     .filter(s => s.trim().length > 0);

const validTranscribedText = fc.string({ minLength: 1, maxLength: 500 })
     .filter(s => s.trim().length > 0);

describe('STT Service', () => {
     beforeEach(() => {
          jest.clearAllMocks();
     });

     /**
      * Feature: voice-rubber-duck-debugger, Property 3: API retry behavior
      * Validates: Requirements 2.3, 4.3, 9.3
      * 
      * For any API call (STT, TTS, Gemini) that fails on the first attempt, 
      * the system should retry exactly once with a 1-second delay before returning an error.
      */
     describe('Property 3: API retry behavior', () => {
          it('should retry exactly once with delay when first attempt fails', async () => {
               await fc.assert(
                    fc.asyncProperty(
                         validAudioBase64,
                         validUserId,
                         async (audioBase64, userId) => {
                              const sttService = new STTService({
                                   apiKey: 'test-api-key',
                                   timeout: 10000,
                                   retryDelay: 100
                              });

                              const callTimes: number[] = [];
                              let callCount = 0;

                              mockedAxios.post.mockImplementation(async () => {
                                   callTimes.push(Date.now());
                                   callCount++;

                                   if (callCount === 1) {
                                        throw new Error('Network error');
                                   } else {
                                        return { data: { text: 'transcribed text' } };
                                   }
                              });

                              const result = await sttService.transcribe(audioBase64, userId);

                              expect(callCount).toBe(2);

                              if (callTimes.length === 2) {
                                   const delay = callTimes[1] - callTimes[0];
                                   expect(delay).toBeGreaterThanOrEqual(50);
                              }

                              expect(result).toBe('transcribed text');

                              jest.clearAllMocks();
                         }
                    ),
                    { numRuns: 10 }
               );
          }, 30000);

          it('should throw error after both attempts fail', async () => {
               await fc.assert(
                    fc.asyncProperty(
                         validAudioBase64,
                         validUserId,
                         async (audioBase64, userId) => {
                              const sttService = new STTService({
                                   apiKey: 'test-api-key',
                                   timeout: 10000,
                                   retryDelay: 100
                              });

                              let callCount = 0;

                              mockedAxios.post.mockImplementation(async () => {
                                   callCount++;
                                   throw new Error('Network error');
                              });

                              await expect(sttService.transcribe(audioBase64, userId))
                                   .rejects
                                   .toThrow("I couldn't hear that clearly. Please try again.");

                              expect(callCount).toBe(2);

                              jest.clearAllMocks();
                         }
                    ),
                    { numRuns: 10 }
               );
          }, 30000);

          it('should succeed on first attempt without retry', async () => {
               await fc.assert(
                    fc.asyncProperty(
                         validAudioBase64,
                         validUserId,
                         validTranscribedText,
                         async (audioBase64, userId, transcribedText) => {
                              const sttService = new STTService({
                                   apiKey: 'test-api-key',
                                   timeout: 10000,
                                   retryDelay: 100
                              });

                              let callCount = 0;

                              mockedAxios.post.mockImplementation(async () => {
                                   callCount++;
                                   return { data: { text: transcribedText } };
                              });

                              const result = await sttService.transcribe(audioBase64, userId);

                              expect(callCount).toBe(1);
                              expect(result).toBe(transcribedText);

                              jest.clearAllMocks();
                         }
                    ),
                    { numRuns: 10 }
               );
          });
     });

     /**
      * Feature: voice-rubber-duck-debugger, Property 11: Request timeout enforcement
      * Validates: Requirements 9.1
      * 
      * For any API request that exceeds 10 seconds, the system should terminate 
      * the request and return an error.
      */
     describe('Property 11: Request timeout enforcement', () => {
          it('should timeout requests that exceed configured timeout', async () => {
               await fc.assert(
                    fc.asyncProperty(
                         validAudioBase64,
                         validUserId,
                         async (audioBase64, userId) => {
                              const sttService = new STTService({
                                   apiKey: 'test-api-key',
                                   timeout: 100,
                                   retryDelay: 50
                              });

                              mockedAxios.post.mockImplementation(async () => {
                                   const error: any = new Error('timeout of 100ms exceeded');
                                   error.code = 'ECONNABORTED';
                                   throw error;
                              });

                              await expect(sttService.transcribe(audioBase64, userId))
                                   .rejects
                                   .toThrow();

                              jest.clearAllMocks();
                         }
                    ),
                    { numRuns: 10 }
               );
          }, 30000);

          it('should complete successfully when request finishes within timeout', async () => {
               await fc.assert(
                    fc.asyncProperty(
                         validAudioBase64,
                         validUserId,
                         validTranscribedText,
                         async (audioBase64, userId, transcribedText) => {
                              const sttService = new STTService({
                                   apiKey: 'test-api-key',
                                   timeout: 1000,
                                   retryDelay: 50
                              });

                              mockedAxios.post.mockImplementation(async () => {
                                   await new Promise(resolve => setTimeout(resolve, 50));
                                   return { data: { text: transcribedText } };
                              });

                              const result = await sttService.transcribe(audioBase64, userId);

                              expect(result).toBe(transcribedText);

                              jest.clearAllMocks();
                         }
                    ),
                    { numRuns: 10 }
               );
          }, 30000);
     });
});

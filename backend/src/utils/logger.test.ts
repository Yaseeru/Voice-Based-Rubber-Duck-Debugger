import * as fc from 'fast-check';
import Logger, { logger, LogLevel, LogEntry } from './logger';

describe('Logger', () => {
     let loggerInstance: Logger;
     let consoleLogSpy: jest.SpyInstance;
     let consoleErrorSpy: jest.SpyInstance;
     let originalNodeEnv: string | undefined;

     beforeEach(() => {
          // Save original NODE_ENV
          originalNodeEnv = process.env.NODE_ENV;

          // Set to development for testing
          process.env.NODE_ENV = 'development';

          // Create a new logger instance
          loggerInstance = new Logger();

          // Spy on console methods
          consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
          consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
     });

     afterEach(() => {
          // Restore original NODE_ENV
          if (originalNodeEnv !== undefined) {
               process.env.NODE_ENV = originalNodeEnv;
          } else {
               delete process.env.NODE_ENV;
          }

          // Restore console methods
          consoleLogSpy.mockRestore();
          consoleErrorSpy.mockRestore();
     });

     /**
      * Feature: voice-rubber-duck-debugger, Property 10: Comprehensive logging
      * Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5
      */
     describe('Property 10: Comprehensive logging', () => {
          it('should create log entries for request initiation, STT result, Gemini result, TTS result, and errors for any request processed', () => {
               fc.assert(
                    fc.property(
                         fc.string({ minLength: 1 }), // userId
                         fc.string({ minLength: 1 }), // endpoint
                         fc.string(), // transcribed text
                         fc.string(), // gemini response
                         fc.string(), // tts status
                         fc.string(), // error message
                         (userId, endpoint, transcribedText, geminiResponse, ttsStatus, errorMessage) => {
                              // Clear previous spy calls
                              consoleLogSpy.mockClear();
                              consoleErrorSpy.mockClear();

                              // Simulate a complete request flow with all logging points

                              // 1. Log request initiation (Requirement 8.1)
                              loggerInstance.logRequest(userId, endpoint);

                              // 2. Log STT transcription (Requirement 8.2)
                              loggerInstance.logSTT(userId, transcribedText);

                              // 3. Log Gemini response (Requirement 8.3)
                              loggerInstance.logGemini(userId, geminiResponse);

                              // 4. Log TTS result (Requirement 8.4)
                              loggerInstance.logTTS(userId, ttsStatus);

                              // 5. Log error (Requirement 8.5)
                              loggerInstance.logError(userId, errorMessage);

                              // Verify all log methods were called
                              // 4 INFO logs (request, STT, Gemini, TTS) + 1 ERROR log
                              expect(consoleLogSpy).toHaveBeenCalledTimes(4);
                              expect(consoleErrorSpy).toHaveBeenCalledTimes(1);

                              // Verify request log contains userId and endpoint
                              const requestLog = consoleLogSpy.mock.calls[0][0];
                              expect(requestLog).toContain(userId);
                              expect(requestLog).toContain('Request received');
                              expect(consoleLogSpy.mock.calls[0][1]).toMatchObject({ endpoint });

                              // Verify STT log contains userId and transcribed text
                              const sttLog = consoleLogSpy.mock.calls[1][0];
                              expect(sttLog).toContain(userId);
                              expect(sttLog).toContain('STT transcription completed');
                              expect(consoleLogSpy.mock.calls[1][1]).toMatchObject({ transcribedText });

                              // Verify Gemini log contains userId and response
                              const geminiLog = consoleLogSpy.mock.calls[2][0];
                              expect(geminiLog).toContain(userId);
                              expect(geminiLog).toContain('Gemini response generated');
                              expect(consoleLogSpy.mock.calls[2][1]).toMatchObject({ response: geminiResponse });

                              // Verify TTS log contains userId and status
                              const ttsLog = consoleLogSpy.mock.calls[3][0];
                              expect(ttsLog).toContain(userId);
                              expect(ttsLog).toContain(`TTS audio generation ${ttsStatus}`);
                              expect(consoleLogSpy.mock.calls[3][1]).toMatchObject({ status: ttsStatus });

                              // Verify error log contains userId and error message
                              const errorLog = consoleErrorSpy.mock.calls[0][0];
                              expect(errorLog).toContain('Error occurred');
                              expect(errorLog).toContain(errorMessage);
                              if (userId) {
                                   expect(errorLog).toContain(userId);
                              }
                         }
                    ),
                    { numRuns: 100 }
               );
          });

          it('should include timestamp in all log entries for any logged event', () => {
               fc.assert(
                    fc.property(
                         fc.string({ minLength: 1 }), // userId
                         fc.string(), // message content
                         (userId, message) => {
                              // Clear previous spy calls
                              consoleLogSpy.mockClear();
                              consoleErrorSpy.mockClear();

                              // Log different types of events
                              loggerInstance.logRequest(userId, '/test');
                              loggerInstance.logSTT(userId, message);
                              loggerInstance.logError(userId, message);

                              // Verify all logs contain timestamps
                              const allCalls = [
                                   ...consoleLogSpy.mock.calls,
                                   ...consoleErrorSpy.mock.calls
                              ];

                              allCalls.forEach(call => {
                                   const logString = call[0];
                                   // Check for ISO timestamp format in the log string
                                   expect(logString).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
                              });
                         }
                    ),
                    { numRuns: 100 }
               );
          });

          it('should include userId in all log entries when provided for any user operation', () => {
               fc.assert(
                    fc.property(
                         fc.string({ minLength: 1 }), // userId
                         fc.string(), // content
                         (userId, content) => {
                              // Clear previous spy calls
                              consoleLogSpy.mockClear();
                              consoleErrorSpy.mockClear();

                              // Log various operations with userId
                              loggerInstance.logRequest(userId, '/test');
                              loggerInstance.logSTT(userId, content);
                              loggerInstance.logGemini(userId, content);
                              loggerInstance.logTTS(userId, 'success');

                              // Verify all logs contain the userId
                              consoleLogSpy.mock.calls.forEach(call => {
                                   const logString = call[0];
                                   expect(logString).toContain(`[User: ${userId}]`);
                              });
                         }
                    ),
                    { numRuns: 100 }
               );
          });

          it('should use structured JSON format in production mode for any log entry', () => {
               fc.assert(
                    fc.property(
                         fc.string({ minLength: 1 }), // userId
                         fc.string(), // content
                         (userId, content) => {
                              // Clear previous spy calls
                              consoleLogSpy.mockClear();
                              consoleErrorSpy.mockClear();

                              // Set to production mode
                              process.env.NODE_ENV = 'production';
                              const prodLogger = new Logger();

                              // Log an event
                              prodLogger.logRequest(userId, '/test');

                              // Verify JSON format
                              expect(consoleLogSpy).toHaveBeenCalledTimes(1);
                              const logOutput = consoleLogSpy.mock.calls[0][0];

                              // Should be valid JSON
                              expect(() => JSON.parse(logOutput)).not.toThrow();

                              const parsed = JSON.parse(logOutput);
                              expect(parsed).toHaveProperty('timestamp');
                              expect(parsed).toHaveProperty('level');
                              expect(parsed).toHaveProperty('userId');
                              expect(parsed).toHaveProperty('message');
                              expect(parsed.userId).toBe(userId);

                              // Reset to development
                              process.env.NODE_ENV = 'development';
                         }
                    ),
                    { numRuns: 100 }
               );
          });

          it('should handle Error objects correctly when logging errors for any error type', () => {
               fc.assert(
                    fc.property(
                         fc.string({ minLength: 1 }), // userId
                         fc.string({ minLength: 1 }), // error message
                         (userId, errorMessage) => {
                              // Clear previous spy calls
                              consoleLogSpy.mockClear();
                              consoleErrorSpy.mockClear();

                              // Create an Error object
                              const error = new Error(errorMessage);

                              // Log the error
                              loggerInstance.logError(userId, error);

                              // Verify error was logged
                              expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
                              const errorLog = consoleErrorSpy.mock.calls[0][0];

                              // Should contain error message
                              expect(errorLog).toContain(errorMessage);
                              expect(errorLog).toContain('Error occurred');

                              // Metadata should contain stack trace
                              const metadata = consoleErrorSpy.mock.calls[0][1];
                              expect(metadata).toHaveProperty('stack');
                              expect(metadata.stack).toBeTruthy();
                         }
                    ),
                    { numRuns: 100 }
               );
          });
     });
});

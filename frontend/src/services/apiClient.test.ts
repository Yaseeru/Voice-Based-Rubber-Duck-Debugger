/**
 * Tests for API Client
 */

import ApiClient, { ApiError, DebugVoiceResponse } from './apiClient';

// Mock fetch globally
global.fetch = jest.fn();

describe('ApiClient', () => {
     let apiClient: ApiClient;

     beforeEach(() => {
          // Reset mocks before each test
          jest.clearAllMocks();
          apiClient = new ApiClient({ baseUrl: 'http://test-api.com', timeout: 5000 });
     });

     afterEach(() => {
          jest.restoreAllMocks();
     });

     describe('submitAudio', () => {
          const mockAudio = 'base64encodedaudiodata';
          const mockUserId = 'test-user-123';

          it('should successfully submit audio and return response', async () => {
               // Arrange
               const mockResponse: DebugVoiceResponse = {
                    textResponse: 'This is the AI response',
                    audioUrl: 'http://example.com/audio.mp3',
               };

               (global.fetch as jest.Mock).mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockResponse,
               });

               // Act
               const result = await apiClient.submitAudio(mockAudio, mockUserId);

               // Assert
               expect(global.fetch).toHaveBeenCalledWith(
                    'http://test-api.com/debug/voice',
                    expect.objectContaining({
                         method: 'POST',
                         headers: {
                              'Content-Type': 'application/json',
                         },
                         body: JSON.stringify({
                              audio: mockAudio,
                              userId: mockUserId,
                         }),
                    })
               );
               expect(result).toEqual(mockResponse);
          });

          it('should format request payload correctly', async () => {
               // Arrange
               const mockResponse: DebugVoiceResponse = {
                    textResponse: 'Response',
                    audioUrl: 'http://example.com/audio.mp3',
               };

               (global.fetch as jest.Mock).mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockResponse,
               });

               // Act
               await apiClient.submitAudio(mockAudio, mockUserId);

               // Assert
               const callArgs = (global.fetch as jest.Mock).mock.calls[0];
               const requestBody = JSON.parse(callArgs[1].body);
               expect(requestBody).toEqual({
                    audio: mockAudio,
                    userId: mockUserId,
               });
          });

          it('should parse response for textResponse and audioUrl', async () => {
               // Arrange
               const mockResponse: DebugVoiceResponse = {
                    textResponse: 'Debugging advice here',
                    audioUrl: 'http://example.com/response.mp3',
               };

               (global.fetch as jest.Mock).mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockResponse,
               });

               // Act
               const result = await apiClient.submitAudio(mockAudio, mockUserId);

               // Assert
               expect(result.textResponse).toBe('Debugging advice here');
               expect(result.audioUrl).toBe('http://example.com/response.mp3');
          });

          it('should throw ApiError when response is not ok', async () => {
               // Arrange
               const errorResponse = {
                    error: 'BadRequest',
                    message: 'Missing required parameters',
                    statusCode: 400,
               };

               (global.fetch as jest.Mock).mockResolvedValue({
                    ok: false,
                    status: 400,
                    json: async () => errorResponse,
               });

               // Act & Assert
               try {
                    await apiClient.submitAudio(mockAudio, mockUserId);
                    fail('Should have thrown an error');
               } catch (error) {
                    expect(error).toBeInstanceOf(ApiError);
                    expect((error as ApiError).message).toBe('Missing required parameters');
               }
          });

          it('should handle timeout errors', async () => {
               // Arrange
               const shortTimeoutClient = new ApiClient({ timeout: 100 });

               // Mock a request that simulates an abort error
               (global.fetch as jest.Mock).mockImplementationOnce((url, options) => {
                    return new Promise((_, reject) => {
                         // Simulate the abort signal triggering
                         options.signal.addEventListener('abort', () => {
                              const error = new Error('The operation was aborted');
                              error.name = 'AbortError';
                              reject(error);
                         });
                    });
               });

               // Act & Assert
               await expect(shortTimeoutClient.submitAudio(mockAudio, mockUserId))
                    .rejects.toThrow('timed out');
          });

          it('should throw ApiError for invalid response format', async () => {
               // Arrange - response missing audioUrl
               (global.fetch as jest.Mock).mockResolvedValue({
                    ok: true,
                    json: async () => ({
                         textResponse: 'Response text',
                         // audioUrl is missing
                    }),
               });

               // Act & Assert
               try {
                    await apiClient.submitAudio(mockAudio, mockUserId);
                    fail('Should have thrown an error');
               } catch (error) {
                    expect(error).toBeInstanceOf(ApiError);
                    expect((error as ApiError).message).toContain('Invalid response format');
               }
          });

          it('should handle network errors', async () => {
               // Arrange
               (global.fetch as jest.Mock).mockRejectedValue(new TypeError('Network error'));

               // Act & Assert
               try {
                    await apiClient.submitAudio(mockAudio, mockUserId);
                    throw new Error('Should have thrown an error');
               } catch (error) {
                    expect(error).toBeInstanceOf(ApiError);
                    expect((error as ApiError).message).toContain('Network error');
               }
          });

          it('should include abort signal for timeout support', async () => {
               // Arrange
               const mockResponse: DebugVoiceResponse = {
                    textResponse: 'Response',
                    audioUrl: 'http://example.com/audio.mp3',
               };

               (global.fetch as jest.Mock).mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockResponse,
               });

               // Act
               await apiClient.submitAudio(mockAudio, mockUserId);

               // Assert
               const callArgs = (global.fetch as jest.Mock).mock.calls[0];
               expect(callArgs[1].signal).toBeInstanceOf(AbortSignal);
          });
     });

     describe('Configuration methods', () => {
          it('should update base URL', () => {
               // Act
               apiClient.setBaseUrl('http://new-api.com');

               // Assert
               expect(apiClient.getConfig().baseUrl).toBe('http://new-api.com');
          });

          it('should update timeout', () => {
               // Act
               apiClient.setTimeout(10000);

               // Assert
               expect(apiClient.getConfig().timeout).toBe(10000);
          });

          it('should return current configuration', () => {
               // Act
               const config = apiClient.getConfig();

               // Assert
               expect(config).toHaveProperty('baseUrl');
               expect(config).toHaveProperty('timeout');
          });
     });
});

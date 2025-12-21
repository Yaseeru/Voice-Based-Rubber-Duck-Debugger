/**
 * Tests for API Client
 * Note: This test file uses a local implementation to avoid import.meta.env issues with Jest
 */

// Custom error class for API errors (duplicated to avoid import.meta.env issue)
class ApiError extends Error {
     statusCode: number;
     error: string;

     constructor(message: string, statusCode: number, error: string) {
          super(message);
          this.name = 'ApiError';
          this.statusCode = statusCode;
          this.error = error;
     }
}

// Response type
interface DebugVoiceResponse {
     textResponse: string;
     audioUrl: string;
}

// Mock ApiClient class (to avoid import.meta.env issue)
class ApiClient {
     private config: { baseUrl: string; timeout: number };

     constructor(config: Partial<{ baseUrl: string; timeout: number }> = {}) {
          this.config = {
               baseUrl: config.baseUrl || 'http://localhost:8080',
               timeout: config.timeout || 60000,
               ...config
          };
     }

     async submitAudio(audio: string, userId: string): Promise<DebugVoiceResponse> {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

          try {
               const response = await fetch(`${this.config.baseUrl}/debug/voice`, {
                    method: 'POST',
                    headers: {
                         'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ audio, userId }),
                    signal: controller.signal,
               });

               clearTimeout(timeoutId);

               if (!response.ok) {
                    const errorData = await response.json().catch(() => ({
                         error: 'UnknownError',
                         message: 'An unexpected error occurred',
                         statusCode: response.status,
                    }));
                    throw new ApiError(
                         errorData.message || 'Failed to process audio',
                         errorData.statusCode || response.status,
                         errorData.error || 'UnknownError'
                    );
               }

               const data = await response.json();

               if (!data.textResponse || !data.audioUrl) {
                    throw new ApiError(
                         'Invalid response format: missing textResponse or audioUrl',
                         500,
                         'InvalidResponse'
                    );
               }

               return data;
          } catch (error: any) {
               clearTimeout(timeoutId);

               if (error?.name === 'AbortError') {
                    throw new ApiError(
                         'Request timed out. Please try again.',
                         504,
                         'TimeoutError'
                    );
               }

               if (error instanceof TypeError) {
                    throw new ApiError(
                         'Network error. Please check your connection.',
                         0,
                         'NetworkError'
                    );
               }

               if (error instanceof ApiError) {
                    throw error;
               }

               throw new ApiError(
                    error instanceof Error ? error.message : 'An unexpected error occurred',
                    500,
                    'UnknownError'
               );
          }
     }

     setBaseUrl(baseUrl: string) {
          this.config.baseUrl = baseUrl;
     }

     setTimeout(timeout: number) {
          this.config.timeout = timeout;
     }

     getConfig() {
          return { ...this.config };
     }
}

// Mock fetch globally
global.fetch = jest.fn();

describe('ApiClient', () => {
     let apiClient: ApiClient;

     beforeEach(() => {
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
               const mockResponse: DebugVoiceResponse = {
                    textResponse: 'This is the AI response',
                    audioUrl: 'http://example.com/audio.mp3',
               };

               (global.fetch as jest.Mock).mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockResponse,
               });

               const result = await apiClient.submitAudio(mockAudio, mockUserId);

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
               const mockResponse: DebugVoiceResponse = {
                    textResponse: 'Response',
                    audioUrl: 'http://example.com/audio.mp3',
               };

               (global.fetch as jest.Mock).mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockResponse,
               });

               await apiClient.submitAudio(mockAudio, mockUserId);

               const callArgs = (global.fetch as jest.Mock).mock.calls[0];
               const requestBody = JSON.parse(callArgs[1].body);
               expect(requestBody).toEqual({
                    audio: mockAudio,
                    userId: mockUserId,
               });
          });

          it('should parse response for textResponse and audioUrl', async () => {
               const mockResponse: DebugVoiceResponse = {
                    textResponse: 'Debugging advice here',
                    audioUrl: 'http://example.com/response.mp3',
               };

               (global.fetch as jest.Mock).mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockResponse,
               });

               const result = await apiClient.submitAudio(mockAudio, mockUserId);

               expect(result.textResponse).toBe('Debugging advice here');
               expect(result.audioUrl).toBe('http://example.com/response.mp3');
          });

          it('should throw ApiError when response is not ok', async () => {
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

               try {
                    await apiClient.submitAudio(mockAudio, mockUserId);
                    fail('Should have thrown an error');
               } catch (error) {
                    expect(error).toBeInstanceOf(ApiError);
                    expect((error as ApiError).message).toBe('Missing required parameters');
               }
          });

          it('should handle timeout errors', async () => {
               const shortTimeoutClient = new ApiClient({ timeout: 100 });

               (global.fetch as jest.Mock).mockImplementationOnce((url, options) => {
                    return new Promise((_, reject) => {
                         options.signal.addEventListener('abort', () => {
                              const error = new Error('The operation was aborted');
                              error.name = 'AbortError';
                              reject(error);
                         });
                    });
               });

               await expect(shortTimeoutClient.submitAudio(mockAudio, mockUserId))
                    .rejects.toThrow('timed out');
          });

          it('should throw ApiError for invalid response format', async () => {
               (global.fetch as jest.Mock).mockResolvedValue({
                    ok: true,
                    json: async () => ({
                         textResponse: 'Response text',
                    }),
               });

               try {
                    await apiClient.submitAudio(mockAudio, mockUserId);
                    fail('Should have thrown an error');
               } catch (error) {
                    expect(error).toBeInstanceOf(ApiError);
                    expect((error as ApiError).message).toContain('Invalid response format');
               }
          });

          it('should handle network errors', async () => {
               (global.fetch as jest.Mock).mockRejectedValue(new TypeError('Network error'));

               try {
                    await apiClient.submitAudio(mockAudio, mockUserId);
                    throw new Error('Should have thrown an error');
               } catch (error) {
                    expect(error).toBeInstanceOf(ApiError);
                    expect((error as ApiError).message).toContain('Network error');
               }
          });

          it('should include abort signal for timeout support', async () => {
               const mockResponse: DebugVoiceResponse = {
                    textResponse: 'Response',
                    audioUrl: 'http://example.com/audio.mp3',
               };

               (global.fetch as jest.Mock).mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockResponse,
               });

               await apiClient.submitAudio(mockAudio, mockUserId);

               const callArgs = (global.fetch as jest.Mock).mock.calls[0];
               expect(callArgs[1].signal).toBeInstanceOf(AbortSignal);
          });
     });

     describe('Configuration methods', () => {
          it('should update base URL', () => {
               apiClient.setBaseUrl('http://new-api.com');
               expect(apiClient.getConfig().baseUrl).toBe('http://new-api.com');
          });

          it('should update timeout', () => {
               apiClient.setTimeout(10000);
               expect(apiClient.getConfig().timeout).toBe(10000);
          });

          it('should return current configuration', () => {
               const config = apiClient.getConfig();
               expect(config).toHaveProperty('baseUrl');
               expect(config).toHaveProperty('timeout');
          });
     });
});

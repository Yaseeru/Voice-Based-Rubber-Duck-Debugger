/**
 * API Client for Voice-Based Rubber Duck Debugger
 * Handles communication with the backend /debug/voice endpoint
 */

// Request/Response Type Definitions
export interface DebugVoiceRequest {
     audio: string; // base64 encoded audio
     userId: string;
}

export interface DebugVoiceResponse {
     textResponse: string;
     audioUrl: string;
}

export interface ErrorResponse {
     error: string;
     message: string;
     statusCode: number;
}

// API Client Configuration
interface ApiClientConfig {
     baseUrl: string;
     timeout: number; // in milliseconds
}

// Custom error class for API errors
export class ApiError extends Error {
     statusCode: number;
     error: string;

     constructor(message: string, statusCode: number, error: string) {
          super(message);
          this.name = 'ApiError';
          this.statusCode = statusCode;
          this.error = error;
     }
}

// Helper function to get environment variable (can be overridden in tests)
export const getApiBaseUrl = (): string => {
     // In Vite, environment variables are accessed via import.meta.env
     // Variables must be prefixed with VITE_ to be exposed to the client
     // In production, use relative URL since frontend and backend are served from same origin
     if (import.meta.env.PROD) {
          return '';  // Empty string means relative URL (same origin)
     }
     return import.meta.env.VITE_API_URL || 'http://localhost:8080';
};

// Default configuration
const DEFAULT_CONFIG: ApiClientConfig = {
     baseUrl: getApiBaseUrl(),
     timeout: 60000, // 60 seconds to accommodate STT + Gemini + TTS processing
};

/**
 * API Client class for backend communication
 */
class ApiClient {
     private config: ApiClientConfig;

     constructor(config: Partial<ApiClientConfig> = {}) {
          this.config = { ...DEFAULT_CONFIG, ...config };
     }

     /**
      * Submit audio for debugging with timeout support
      * @param audio - Base64 encoded audio data
      * @param userId - Unique user identifier
      * @returns Promise with text response and audio URL
      * @throws ApiError on failure
      */
     async submitAudio(audio: string, userId: string): Promise<DebugVoiceResponse> {
          // Format request payload
          const payload: DebugVoiceRequest = {
               audio,
               userId,
          };

          // Create abort controller for timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

          try {
               // Make POST request to /debug/voice
               const response = await fetch(`${this.config.baseUrl}/debug/voice`, {
                    method: 'POST',
                    headers: {
                         'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                    signal: controller.signal,
               });

               // Clear timeout on successful response
               clearTimeout(timeoutId);

               // Handle error responses
               if (!response.ok) {
                    const errorData: ErrorResponse = await response.json().catch(() => ({
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

               // Parse and return successful response
               const data: DebugVoiceResponse = await response.json();

               // Validate response structure
               if (!data.textResponse || !data.audioUrl) {
                    throw new ApiError(
                         'Invalid response format: missing textResponse or audioUrl',
                         500,
                         'InvalidResponse'
                    );
               }

               return data;
          } catch (error) {
               // Clear timeout on error
               clearTimeout(timeoutId);

               // Handle timeout errors
               if (error instanceof Error && error.name === 'AbortError') {
                    throw new ApiError(
                         'Request timed out. Please try again.',
                         504,
                         'TimeoutError'
                    );
               }

               // Handle network errors
               if (error instanceof TypeError) {
                    throw new ApiError(
                         'Network error. Please check your connection.',
                         0,
                         'NetworkError'
                    );
               }

               // Re-throw ApiError instances
               if (error instanceof ApiError) {
                    throw error;
               }

               // Handle unknown errors
               throw new ApiError(
                    error instanceof Error ? error.message : 'An unexpected error occurred',
                    500,
                    'UnknownError'
               );
          }
     }

     /**
      * Update the base URL configuration
      * @param baseUrl - New base URL
      */
     setBaseUrl(baseUrl: string): void {
          this.config.baseUrl = baseUrl;
     }

     /**
      * Update the timeout configuration
      * @param timeout - New timeout in milliseconds
      */
     setTimeout(timeout: number): void {
          this.config.timeout = timeout;
     }

     /**
      * Get current configuration
      * @returns Current API client configuration
      */
     getConfig(): ApiClientConfig {
          return { ...this.config };
     }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export class for testing purposes
export default ApiClient;

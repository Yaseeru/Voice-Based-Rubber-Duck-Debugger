/**
 * Environment Variable Validator
 * 
 * Validates required and optional environment variables on application startup.
 * Provides clear error messages and configuration logging.
 */

export interface EnvConfig {
     googleCloudProject: string;
     elevenLabsApiKey?: string;
     vertexAiLocation: string;
     sessionTimeout: number;
     frontendUrl: string;
     port: number;
     nodeEnv: string;
     redisUrl?: string;
}

export interface ValidationResult {
     isValid: boolean;
     config?: EnvConfig;
     errors: string[];
}

/**
 * Validates all required environment variables and returns configuration
 */ 
export function validateEnvironment(): ValidationResult {
     const errors: string[] = [];

     // Check required variables
     const googleCloudProject = process.env.GOOGLE_CLOUD_PROJECT;

     if (!googleCloudProject) {
          errors.push('GOOGLE_CLOUD_PROJECT is required');
     }

     // Optional: ElevenLabs API key (for TTS)
     const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;

     // Parse and validate optional variables with defaults
     const vertexAiLocation = process.env.VERTEX_AI_LOCATION || 'us-central1';
     const sessionTimeout = parseInt(process.env.SESSION_TIMEOUT || '3600000', 10);
     const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
     const port = parseInt(process.env.PORT || '8080', 10);
     const nodeEnv = process.env.NODE_ENV || 'development';
     const redisUrl = process.env.REDIS_URL;

     // Validate numeric values
     if (isNaN(sessionTimeout) || sessionTimeout <= 0) {
          errors.push('SESSION_TIMEOUT must be a positive number (milliseconds)');
     }

     if (isNaN(port) || port <= 0 || port > 65535) {
          errors.push('PORT must be a valid port number (1-65535)');
     }

     // Return validation result
     if (errors.length > 0) {
          return {
               isValid: false,
               errors
          };
     }

     return {
          isValid: true,
          config: {
               googleCloudProject: googleCloudProject!,
               elevenLabsApiKey: elevenLabsApiKey,
               vertexAiLocation,
               sessionTimeout,
               frontendUrl,
               port,
               nodeEnv,
               redisUrl
          },
          errors: []
     };
}

/**
 * Logs configuration details (without sensitive data)
 */
export function logConfiguration(config: EnvConfig): void {
     console.log('✅ Environment validation passed');
     console.log('Configuration:');
     console.log(`  - Google Cloud Project: ${config.googleCloudProject}`);
     console.log(`  - Vertex AI Location: ${config.vertexAiLocation}`);
     console.log(`  - ElevenLabs API Key: ${config.elevenLabsApiKey ? '***configured***' : 'not configured (TTS disabled)'}`);
     console.log(`  - Redis URL: ${config.redisUrl ? '***configured***' : 'not configured (using in-memory storage)'}`);
     console.log(`  - Session Timeout: ${config.sessionTimeout}ms (${config.sessionTimeout / 1000 / 60} minutes)`);
     console.log(`  - Port: ${config.port}`);
     console.log(`  - Frontend URL: ${config.frontendUrl}`);
     console.log(`  - Environment: ${config.nodeEnv}`);
     console.log('');
}

/**
 * Logs validation errors and exits the process
 */
export function handleValidationErrors(errors: string[]): never {
     console.error('❌ Environment validation failed!');
     console.error('\nMissing or invalid environment variables:');
     errors.forEach(error => console.error(`  - ${error}`));
     console.error('\nRequired variables:');
     console.error('  - GOOGLE_CLOUD_PROJECT: Your Google Cloud Project ID');
     console.error('\nOptional variables (with defaults):');
     console.error('  - ELEVENLABS_API_KEY: Your ElevenLabs API key (for TTS - optional)');
     console.error('  - VERTEX_AI_LOCATION: Vertex AI region (default: us-central1)');
     console.error('  - SESSION_TIMEOUT: Session timeout in ms (default: 3600000)');
     console.error('  - PORT: Server port (default: 8080)');
     console.error('  - FRONTEND_URL: Frontend URL for CORS (default: http://localhost:3000)');
     console.error('  - NODE_ENV: Environment mode (default: development)');
     console.error('  - REDIS_URL: Redis connection URL (optional)');
     console.error('\nRefer to .env.example for configuration details.');
     process.exit(1);
}

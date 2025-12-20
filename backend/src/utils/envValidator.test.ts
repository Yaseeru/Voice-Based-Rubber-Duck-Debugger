import { validateEnvironment, logConfiguration, EnvConfig } from './envValidator';

describe('Environment Validator', () => {
     const originalEnv = process.env;

     beforeEach(() => {
          // Reset environment before each test
          jest.resetModules();
          process.env = { ...originalEnv };
     });

     afterAll(() => {
          // Restore original environment
          process.env = originalEnv;
     });

     describe('validateEnvironment', () => {
          it('should pass validation with all required variables', () => {
               process.env.GOOGLE_CLOUD_PROJECT = 'test-project';

               const result = validateEnvironment();

               expect(result.isValid).toBe(true);
               expect(result.errors).toHaveLength(0);
               expect(result.config).toBeDefined();
               expect(result.config?.googleCloudProject).toBe('test-project');
          });

          it('should fail validation when GOOGLE_CLOUD_PROJECT is missing', () => {
               delete process.env.GOOGLE_CLOUD_PROJECT;

               const result = validateEnvironment();

               expect(result.isValid).toBe(false);
               expect(result.errors).toContain('GOOGLE_CLOUD_PROJECT is required');
               expect(result.config).toBeUndefined();
          });

          it('should use default values for optional variables', () => {
               process.env.GOOGLE_CLOUD_PROJECT = 'test-project';
               // Clear optional variables to test defaults
               delete process.env.VERTEX_AI_LOCATION;
               delete process.env.SESSION_TIMEOUT;
               delete process.env.FRONTEND_URL;
               delete process.env.PORT;
               delete process.env.REDIS_URL;

               const result = validateEnvironment();

               expect(result.isValid).toBe(true);
               expect(result.config?.vertexAiLocation).toBe('us-central1');
               expect(result.config?.sessionTimeout).toBe(3600000);
               expect(result.config?.frontendUrl).toBe('http://localhost:3000');
               expect(result.config?.port).toBe(8080);
               // NODE_ENV is set by Jest to 'test', so we check it exists
               expect(result.config?.nodeEnv).toBeDefined();
          });

          it('should use custom values when optional variables are provided', () => {
               process.env.GOOGLE_CLOUD_PROJECT = 'test-project';
               process.env.VERTEX_AI_LOCATION = 'europe-west1';
               process.env.SESSION_TIMEOUT = '7200000';
               process.env.FRONTEND_URL = 'https://example.com';
               process.env.PORT = '3000';
               process.env.NODE_ENV = 'production';
               process.env.REDIS_URL = 'redis://localhost:6379';

               const result = validateEnvironment();

               expect(result.isValid).toBe(true);
               expect(result.config?.vertexAiLocation).toBe('europe-west1');
               expect(result.config?.sessionTimeout).toBe(7200000);
               expect(result.config?.frontendUrl).toBe('https://example.com');
               expect(result.config?.port).toBe(3000);
               expect(result.config?.nodeEnv).toBe('production');
               expect(result.config?.redisUrl).toBe('redis://localhost:6379');
          });

          it('should fail validation for invalid SESSION_TIMEOUT', () => {
               process.env.GOOGLE_CLOUD_PROJECT = 'test-project';
               process.env.SESSION_TIMEOUT = 'invalid';

               const result = validateEnvironment();

               expect(result.isValid).toBe(false);
               expect(result.errors).toContain('SESSION_TIMEOUT must be a positive number (milliseconds)');
          });

          it('should fail validation for negative SESSION_TIMEOUT', () => {
               process.env.GOOGLE_CLOUD_PROJECT = 'test-project';
               process.env.SESSION_TIMEOUT = '-1000';

               const result = validateEnvironment();

               expect(result.isValid).toBe(false);
               expect(result.errors).toContain('SESSION_TIMEOUT must be a positive number (milliseconds)');
          });

          it('should fail validation for invalid PORT', () => {
               process.env.GOOGLE_CLOUD_PROJECT = 'test-project';
               process.env.PORT = 'invalid';

               const result = validateEnvironment();

               expect(result.isValid).toBe(false);
               expect(result.errors).toContain('PORT must be a valid port number (1-65535)');
          });

          it('should fail validation for PORT out of range', () => {
               process.env.GOOGLE_CLOUD_PROJECT = 'test-project';
               process.env.PORT = '70000';

               const result = validateEnvironment();

               expect(result.isValid).toBe(false);
               expect(result.errors).toContain('PORT must be a valid port number (1-65535)');
          });

          it('should fail validation for zero PORT', () => {
               process.env.GOOGLE_CLOUD_PROJECT = 'test-project';
               process.env.PORT = '0';

               const result = validateEnvironment();

               expect(result.isValid).toBe(false);
               expect(result.errors).toContain('PORT must be a valid port number (1-65535)');
          });
     });

     describe('logConfiguration', () => {
          it('should log configuration without exposing sensitive data', () => {
               const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

               const config: EnvConfig = {
                    googleCloudProject: 'test-project',
                    vertexAiLocation: 'us-central1',
                    sessionTimeout: 3600000,
                    frontendUrl: 'http://localhost:3000',
                    port: 8080,
                    nodeEnv: 'development'
               };

               logConfiguration(config);

               // Check that project info is logged
               const logOutput = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
               expect(logOutput).toContain('test-project');

               consoleSpy.mockRestore();
          });

          it('should indicate when Redis is not configured', () => {
               const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

               const config: EnvConfig = {
                    googleCloudProject: 'test-project',
                    vertexAiLocation: 'us-central1',
                    sessionTimeout: 3600000,
                    frontendUrl: 'http://localhost:3000',
                    port: 8080,
                    nodeEnv: 'development'
               };

               logConfiguration(config);

               const logOutput = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
               expect(logOutput).toContain('not configured (using in-memory storage)');

               consoleSpy.mockRestore();
          });

          it('should indicate when Redis is configured', () => {
               const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

               const config: EnvConfig = {
                    googleCloudProject: 'test-project',
                    vertexAiLocation: 'us-central1',
                    sessionTimeout: 3600000,
                    frontendUrl: 'http://localhost:3000',
                    port: 8080,
                    nodeEnv: 'development',
                    redisUrl: 'redis://localhost:6379'
               };

               logConfiguration(config);

               const logOutput = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
               expect(logOutput).toContain('Redis URL: ***configured***');
               expect(logOutput).not.toContain('redis://localhost:6379');

               consoleSpy.mockRestore();
          });
     });
});

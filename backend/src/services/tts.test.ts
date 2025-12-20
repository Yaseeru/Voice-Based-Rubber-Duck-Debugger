/**
 * TTS Service Tests
 * Unit tests for Text-to-Speech service
 */

import { TTSService } from './tts';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock logger
jest.mock('../utils/logger', () => ({
     logger: {
          logTTS: jest.fn(),
          logError: jest.fn()
     }
}));

describe('TTS Service', () => {
     beforeEach(() => {
          jest.clearAllMocks();
     });

     describe('Basic functionality', () => {
          it('should synthesize text to audio successfully', async () => {
               const ttsService = new TTSService({
                    apiKey: 'test-api-key',
                    timeout: 10000,
                    retryDelay: 1000
               });

               const mockAudioBuffer = Buffer.from('mock audio data');
               mockedAxios.post.mockResolvedValue({ data: mockAudioBuffer });

               const result = await ttsService.synthesize('Hello world', 'user123');

               expect(mockedAxios.post).toHaveBeenCalledTimes(1);
               expect(result).toBe(mockAudioBuffer.toString('base64'));
          });

          it('should retry once on failure and succeed', async () => {
               const ttsService = new TTSService({
                    apiKey: 'test-api-key',
                    timeout: 10000,
                    retryDelay: 100 // Reduced for testing
               });

               const mockAudioBuffer = Buffer.from('mock audio data');
               let callCount = 0;

               mockedAxios.post.mockImplementation(async () => {
                    callCount++;
                    if (callCount === 1) {
                         throw new Error('Network error');
                    }
                    return { data: mockAudioBuffer };
               });

               const result = await ttsService.synthesize('Hello world', 'user123');

               expect(callCount).toBe(2);
               expect(result).toBe(mockAudioBuffer.toString('base64'));
          });

          it('should throw error after both attempts fail', async () => {
               const ttsService = new TTSService({
                    apiKey: 'test-api-key',
                    timeout: 10000,
                    retryDelay: 100
               });

               mockedAxios.post.mockRejectedValue(new Error('Network error'));

               await expect(ttsService.synthesize('Hello world', 'user123'))
                    .rejects
                    .toThrow('Failed to generate audio response. Please try again.');

               expect(mockedAxios.post).toHaveBeenCalledTimes(2);
          });

          it('should handle timeout errors', async () => {
               const ttsService = new TTSService({
                    apiKey: 'test-api-key',
                    timeout: 100,
                    retryDelay: 50
               });

               const error: any = new Error('timeout of 100ms exceeded');
               error.code = 'ECONNABORTED';
               mockedAxios.post.mockRejectedValue(error);

               await expect(ttsService.synthesize('Hello world', 'user123'))
                    .rejects
                    .toThrow();

               expect(mockedAxios.post).toHaveBeenCalledTimes(2);
          });

          it('should throw error if API key is missing', () => {
               expect(() => {
                    new TTSService({ apiKey: '' });
               }).toThrow('ELEVENLABS_API_KEY is required for TTS service');
          });
     });

     describe('API request format', () => {
          it('should send correct request format to ElevenLabs API', async () => {
               const ttsService = new TTSService({
                    apiKey: 'test-api-key',
                    voiceId: 'test-voice-id',
                    timeout: 10000,
                    retryDelay: 1000
               });

               const mockAudioBuffer = Buffer.from('mock audio data');
               mockedAxios.post.mockResolvedValue({ data: mockAudioBuffer });

               await ttsService.synthesize('Test text', 'user123');

               expect(mockedAxios.post).toHaveBeenCalledWith(
                    'https://api.elevenlabs.io/v1/text-to-speech/test-voice-id',
                    {
                         text: 'Test text',
                         model_id: 'eleven_monolingual_v1',
                         voice_settings: {
                              stability: 0.5,
                              similarity_boost: 0.75
                         }
                    },
                    {
                         headers: {
                              'xi-api-key': 'test-api-key',
                              'Content-Type': 'application/json',
                              'Accept': 'audio/mpeg'
                         },
                         responseType: 'arraybuffer',
                         timeout: 10000
                    }
               );
          });
     });
});

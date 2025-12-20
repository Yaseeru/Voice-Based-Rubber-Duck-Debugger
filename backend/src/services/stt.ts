/**
 * Speech-to-Text Service
 * Interface with ElevenLabs STT API for audio transcription
 */

import axios, { AxiosError } from 'axios';
import FormData from 'form-data';
import { logger } from '../utils/logger';

export interface STTConfig {
     apiKey: string;
     timeout: number;
     retryDelay: number;
}

export class STTService {
     private apiKey: string;
     private timeout: number;
     private retryDelay: number;
     private apiEndpoint = 'https://api.elevenlabs.io/v1/speech-to-text';

     constructor(config?: Partial<STTConfig>) {
          this.apiKey = config?.apiKey || process.env.ELEVENLABS_API_KEY || '';
          this.timeout = config?.timeout || 30000;
          this.retryDelay = config?.retryDelay || 1000;

          if (!this.apiKey) {
               throw new Error('ELEVENLABS_API_KEY is required for STT service');
          }
     }

     /**
      * Convert base64 audio to Buffer
      * @param audioBase64 - Base64 encoded audio data
      * @returns Buffer containing audio data
      */
     private base64ToBuffer(audioBase64: string): Buffer {
          const base64Data = audioBase64.includes(',')
               ? audioBase64.split(',')[1]
               : audioBase64;

          return Buffer.from(base64Data, 'base64');
     }

     /**
      * Detect audio format from base64 data
      * @param audioBuffer - Audio data as Buffer
      * @returns Content-Type header value
      */
     private detectAudioFormat(audioBuffer: Buffer): string {
          // Check magic bytes for common audio formats
          const header = audioBuffer.subarray(0, 12);

          // MP3: FF FB or FF F3 or FF F2 or ID3
          if (header[0] === 0xFF && (header[1] & 0xE0) === 0xE0) {
               return 'audio/mpeg';
          }
          if (header[0] === 0x49 && header[1] === 0x44 && header[2] === 0x33) {
               return 'audio/mpeg';
          }

          // WAV: RIFF....WAVE
          if (header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46 &&
               header[8] === 0x57 && header[9] === 0x41 && header[10] === 0x56 && header[11] === 0x45) {
               return 'audio/wav';
          }

          // WebM: 1A 45 DF A3
          if (header[0] === 0x1A && header[1] === 0x45 && header[2] === 0xDF && header[3] === 0xA3) {
               return 'audio/webm';
          }

          // MP4/M4A: ftyp
          if (header[4] === 0x66 && header[5] === 0x74 && header[6] === 0x79 && header[7] === 0x70) {
               return 'audio/mp4';
          }

          // Default to mpeg (most compatible)
          return 'audio/mpeg';
     }

     /**
      * Make a single transcription attempt
      * @param audioBuffer - Audio data as Buffer
      * @returns Transcribed text
      */
     private async attemptTranscribe(audioBuffer: Buffer): Promise<string> {
          try {
               if (!audioBuffer || audioBuffer.length < 1000) {
                    throw new Error('Audio input is empty or too short');
               }

               const contentType = this.detectAudioFormat(audioBuffer);

               console.log(`[STT] Detected audio format: ${contentType}, size: ${audioBuffer.length} bytes`);

               const form = new FormData();
               form.append('file', audioBuffer, {
                    filename: 'audio.mp4',
                    contentType: contentType,
               });

               // REQUIRED
               form.append('model_id', 'scribe_v1');

               // OPTIONAL but recommended
               form.append('language', 'en');

               const response = await axios.post(
                    this.apiEndpoint,
                    form,
                    {
                         headers: {
                              'xi-api-key': this.apiKey,
                              ...form.getHeaders(),
                         },
                         timeout: this.timeout
                    }
               );

               return response.data.text || '';
          } catch (error) {
               if (axios.isAxiosError(error)) {
                    const axiosError = error as AxiosError;

                    console.log(`[STT] Error response:`, axiosError.response?.data);
                    console.log(`[STT] Error status:`, axiosError.response?.status);

                    if (axiosError.code === 'ECONNABORTED') {
                         throw new Error('STT API request timeout');
                    }
                    throw new Error(`STT API error: ${axiosError.message}`);
               }
               throw error;
          }
     }

     /**
      * Transcribe audio with retry logic
      * @param audioBase64 - Base64 encoded audio data
      * @param userId - User identifier for logging (optional)
      * @returns Transcribed text
      */
     async transcribe(audioBase64: string, userId?: string): Promise<string> {
          try {
               const audioBuffer = this.base64ToBuffer(audioBase64);

               try {
                    const text = await this.attemptTranscribe(audioBuffer);

                    if (userId) {
                         logger.logSTT(userId, text);
                    }

                    return text;
               } catch (firstError) {
                    if (userId) {
                         logger.logError(userId, `STT first attempt failed: ${firstError}`);
                    }

                    await new Promise(resolve => setTimeout(resolve, this.retryDelay));

                    try {
                         const text = await this.attemptTranscribe(audioBuffer);

                         if (userId) {
                              logger.logSTT(userId, text);
                         }

                         return text;
                    } catch (retryError) {
                         if (userId) {
                              logger.logError(userId, `STT retry failed: ${retryError}`);
                         }

                         throw new Error("I couldn't hear that clearly. Please try again.");
                    }
               }
          } catch (error) {
               if (userId) {
                    logger.logError(userId, error as Error);
               }
               throw error;
          }
     }
}

// Export singleton instance (lazy initialization)
let sttServiceInstance: STTService | null = null;

export const getSttService = (): STTService => {
     if (!sttServiceInstance) {
          sttServiceInstance = new STTService();
     }
     return sttServiceInstance;
};

export default STTService;

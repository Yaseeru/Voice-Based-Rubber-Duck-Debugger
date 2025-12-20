/**
 * Text-to-Speech Service
 * Interface with ElevenLabs TTS API for audio synthesis
 */

import axios from 'axios';
import { logger } from '../utils/logger';

export interface TTSConfig {
    apiKey: string;
    voiceId?: string;
    timeout?: number;
    retryDelay?: number;
}

export class TTSService {
    private apiKey: string;
    private voiceId: string;
    private timeout: number;
    private retryDelay: number;
    private apiEndpoint = 'https://api.elevenlabs.io/v1/text-to-speech';

    constructor(config?: Partial<TTSConfig>) {
        this.apiKey = config?.apiKey || process.env.ELEVENLABS_API_KEY || '';
        this.voiceId = config?.voiceId || process.env.ELEVENLABS_DEFAULT_VOICE || 'EXAVITQu4vr4xnSDxMaL'; // Default voice
        this.timeout = config?.timeout || 10000; // 10 seconds
        this.retryDelay = config?.retryDelay || 1000; // 1 second

        if (!this.apiKey) {
            console.warn('[TTS] ELEVENLABS_API_KEY not configured - TTS will be disabled');
        }
    }

    /**
     * Make a single synthesis attempt
     * @param text - Text to convert to speech
     * @returns Audio data as Buffer
     */
    private async attemptSynthesize(text: string): Promise<Buffer> {
        if (!this.apiKey) throw new Error('ELEVENLABS_API_KEY not set');

        try {
            const response = await axios.post(
                `${this.apiEndpoint}/${this.voiceId}`,
                {
                    text,
                    model_id: 'eleven_turbo_v2_5', // Latest free tier model
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.75
                    }
                },
                {
                    headers: {
                        'xi-api-key': this.apiKey,
                        'Content-Type': 'application/json',
                        'Accept': 'audio/mpeg'
                    },
                    responseType: 'arraybuffer',
                    timeout: this.timeout
                }
            );

            return Buffer.from(response.data);
        } catch (error: any) {
            if (axios.isAxiosError(error) && error.response) {
                console.error('[TTS] API Response Error:', {
                    status: error.response.status,
                    data: error.response.data
                });
                throw new Error(`TTS API error: ${error.response.status} ${JSON.stringify(error.response.data)}`);
            } else if (axios.isAxiosError(error)) {
                throw new Error(`TTS API error: ${error.message}`);
            }
            throw error;
        }
    }

    /**
     * Synthesize text to speech with retry logic
     * @param text - Text to convert to speech
     * @param userId - User identifier for logging (optional)
     * @returns Audio data as base64 encoded string
     */
    async synthesize(text: string, userId?: string): Promise<string> {
        if (!this.apiKey) {
            throw new Error('TTS_NOT_CONFIGURED');
        }

        try {
            const audioBuffer = await this.attemptSynthesize(text);
            const audioBase64 = audioBuffer.toString('base64');
            if (userId) logger.logTTS(userId, 'success');
            return audioBase64;
        } catch (firstError) {
            console.warn('[TTS] First attempt failed, retrying...', firstError);

            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, this.retryDelay));

            try {
                const audioBuffer = await this.attemptSynthesize(text);
                const audioBase64 = audioBuffer.toString('base64');
                if (userId) logger.logTTS(userId, 'success');
                return audioBase64;
            } catch (retryError) {
                console.error('[TTS] Retry attempt failed:', retryError);

                // Fallback: return base64 text if TTS fails completely
                return Buffer.from(text).toString('base64');
            }
        }
    }
}

// Singleton instance
let ttsServiceInstance: TTSService | null = null;

export const getTtsService = (): TTSService => {
    if (!ttsServiceInstance) {
        ttsServiceInstance = new TTSService();
    }
    return ttsServiceInstance;
};

export default TTSService;

/**
 * Debug Routes
 * API endpoints for voice-based debugging
 */

import { Router, Request, Response } from 'express';
import { getSttService } from '../services/stt';
import { getGeminiService } from '../services/gemini';
import { getTtsService } from '../services/tts';
import { sessionManager } from '../services/sessionManager';
import { logger } from '../utils/logger';

const router = Router();

interface DebugVoiceRequest {
     audio: string; // base64 encoded audio
     userId: string;
}

interface DebugVoiceResponse {
     textResponse: string;
     audioUrl: string;
}

/**
 * POST /debug/voice
 * Main endpoint for voice-based debugging
 * Orchestrates STT → Gemini → TTS pipeline
 */
router.post('/voice', async (req: Request, res: Response) => {
     const { audio, userId } = req.body as Partial<DebugVoiceRequest>;

     try {
          // Validate required parameters
          if (!audio || !userId) {
               return res.status(400).json({
                    error: 'ValidationError',
                    message: 'Both audio and userId are required',
                    statusCode: 400
               });
          }

          // Log incoming request
          logger.logRequest(userId, '/debug/voice');

          // Step 1: Transcribe audio using STT
          const sttService = getSttService();
          const transcribedText = await sttService.transcribe(audio, userId);

          console.log(`[DEBUG] Transcribed text: ${transcribedText}`);

          // Step 2: Retrieve session context
          const session = sessionManager.getSession(userId);
          const conversationHistory = session.conversation;

          // Step 3: Generate response using Gemini
          const geminiService = getGeminiService();
          const aiResponse = await geminiService.generateResponse(
               transcribedText,
               conversationHistory
          );

          console.log(`[DEBUG] Gemini response: ${aiResponse}`);

          // Log Gemini response
          logger.logGemini(userId, aiResponse);

          // Step 4: Generate audio using TTS (optional - gracefully handle failures)
          let audioBase64: string | null = null;
          try {
               const ttsService = getTtsService();
               audioBase64 = await ttsService.synthesize(aiResponse, userId);
               console.log(`[DEBUG] TTS successful`);
          } catch (ttsError) {
               // TTS is optional - just log as warning and continue
               console.warn(`[DEBUG] TTS unavailable, returning text-only response`);
               // Don't log as error since this is expected behavior when TTS is not configured
          }

          // Step 5: Store conversation turn in session
          sessionManager.updateSession(userId, transcribedText, aiResponse);

          // Step 6: Build and return response
          const response: DebugVoiceResponse = {
               textResponse: aiResponse,
               audioUrl: audioBase64 ? `data:audio/mpeg;base64,${audioBase64}` : ''
          };

          res.json(response);

     } catch (error) {
          // Log error
          logger.logError(userId, error as Error);

          // Determine appropriate error response
          const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';

          console.error(`[DEBUG] Error in /debug/voice:`, error);

          // Check if it's a timeout error
          if (errorMessage.includes('timeout')) {
               return res.status(504).json({
                    error: 'TimeoutError',
                    message: errorMessage,
                    statusCode: 504
               });
          }

          // Check if it's an API error
          if (errorMessage.includes('API')) {
               return res.status(503).json({
                    error: 'ServiceUnavailable',
                    message: errorMessage,
                    statusCode: 503
               });
          }

          // Generic server error
          res.status(500).json({
               error: 'InternalServerError',
               message: errorMessage,
               statusCode: 500
          });
     }
});

export default router;

/**
 * Logger Utility
 * Centralized logging for all operations with structured output
 */

export enum LogLevel {
     INFO = 'INFO',
     ERROR = 'ERROR',
     DEBUG = 'DEBUG'
}

export interface LogEntry {
     timestamp: string;
     level: LogLevel;
     userId?: string;
     message: string;
     metadata?: Record<string, any>;
}

class Logger {
     private isDevelopment: boolean;

     constructor() {
          this.isDevelopment = process.env.NODE_ENV !== 'production';
     }

     /**
      * Format and output a log entry
      * @param entry - The log entry to output
      */
     private log(entry: LogEntry): void {
          if (this.isDevelopment) {
               // Console output for development
               const logString = `[${entry.timestamp}] [${entry.level}]${entry.userId ? ` [User: ${entry.userId}]` : ''} ${entry.message}`;

               if (entry.level === LogLevel.ERROR) {
                    console.error(logString, entry.metadata || '');
               } else {
                    console.log(logString, entry.metadata || '');
               }
          } else {
               // Structured JSON output for Cloud Logging in production
               console.log(JSON.stringify(entry));
          }
     }

     /**
      * Log an incoming request
      * @param userId - User identifier
      * @param endpoint - API endpoint being called
      */
     logRequest(userId: string, endpoint: string): void {
          const entry: LogEntry = {
               timestamp: new Date().toISOString(),
               level: LogLevel.INFO,
               userId,
               message: `Request received`,
               metadata: { endpoint }
          };
          this.log(entry);
     }

     /**
      * Log STT transcription result
      * @param userId - User identifier
      * @param transcribedText - The transcribed text from STT
      */
     logSTT(userId: string, transcribedText: string): void {
          const entry: LogEntry = {
               timestamp: new Date().toISOString(),
               level: LogLevel.INFO,
               userId,
               message: `STT transcription completed`,
               metadata: { transcribedText }
          };
          this.log(entry);
     }

     /**
      * Log Gemini response
      * @param userId - User identifier
      * @param response - The response text from Gemini
      */
     logGemini(userId: string, response: string): void {
          const entry: LogEntry = {
               timestamp: new Date().toISOString(),
               level: LogLevel.INFO,
               userId,
               message: `Gemini response generated`,
               metadata: { response }
          };
          this.log(entry);
     }

     /**
      * Log TTS result
      * @param userId - User identifier
      * @param status - Success or failure status
      */
     logTTS(userId: string, status: string): void {
          const entry: LogEntry = {
               timestamp: new Date().toISOString(),
               level: LogLevel.INFO,
               userId,
               message: `TTS audio generation ${status}`,
               metadata: { status }
          };
          this.log(entry);
     }

     /**
      * Log error details
      * @param userId - User identifier (optional)
      * @param error - Error object or message
      */
     logError(userId: string | undefined, error: Error | string): void {
          const errorMessage = error instanceof Error ? error.message : error;
          const errorStack = error instanceof Error ? error.stack : undefined;

          const entry: LogEntry = {
               timestamp: new Date().toISOString(),
               level: LogLevel.ERROR,
               userId,
               message: `Error occurred: ${errorMessage}`,
               metadata: {
                    error: errorMessage,
                    stack: errorStack
               }
          };
          this.log(entry);
     }
}

// Export singleton instance
export const logger = new Logger();
export default Logger;

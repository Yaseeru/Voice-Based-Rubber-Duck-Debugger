/**
 * Session Manager Service
 * Manages conversation context per user with in-memory storage
 */

export interface ConversationTurn {
     input: string;
     output: string;
     timestamp: number;
}

export interface Session {
     userId: string;
     createdAt: number;
     lastAccessedAt: number;
     conversation: ConversationTurn[];
}

class SessionManager {
     private sessions: Map<string, Session>;
     private readonly MAX_TURNS = 20;
     private readonly SESSION_TIMEOUT: number;
     private cleanupInterval: NodeJS.Timeout | null = null;

     constructor(sessionTimeout?: number) {
          this.sessions = new Map();
          // Use provided timeout or environment variable or default to 1 hour
          this.SESSION_TIMEOUT = sessionTimeout || parseInt(process.env.SESSION_TIMEOUT || '3600000', 10);
          this.startCleanupTimer();
     }

     /**
      * Create a new session for a user
      * @param userId - Unique user identifier
      * @returns The created session
      */
     createSession(userId: string): Session {
          const session: Session = {
               userId,
               createdAt: Date.now(),
               lastAccessedAt: Date.now(),
               conversation: []
          };

          this.sessions.set(userId, session);
          return session;
     }

     /**
      * Retrieve a session by userId, creating one if it doesn't exist
      * @param userId - Unique user identifier
      * @returns The session for the user
      */
     getSession(userId: string): Session {
          let session = this.sessions.get(userId);

          if (!session) {
               session = this.createSession(userId);
          } else {
               // Update last accessed time
               session.lastAccessedAt = Date.now();
          }

          return session;
     }

     /**
      * Update a session with a new conversation turn
      * @param userId - Unique user identifier
      * @param input - User input text
      * @param output - AI output text
      */
     updateSession(userId: string, input: string, output: string): void {
          const session = this.getSession(userId);

          const turn: ConversationTurn = {
               input,
               output,
               timestamp: Date.now()
          };

          session.conversation.push(turn);

          // Enforce 20-turn limit by keeping only the most recent 20 turns
          if (session.conversation.length > this.MAX_TURNS) {
               session.conversation = session.conversation.slice(-this.MAX_TURNS);
          }

          session.lastAccessedAt = Date.now();
     }

     /**
      * Remove sessions that have been inactive for more than 1 hour
      */
     cleanupSessions(): void {
          const now = Date.now();
          const sessionsToDelete: string[] = [];

          this.sessions.forEach((session, userId) => {
               if (now - session.lastAccessedAt > this.SESSION_TIMEOUT) {
                    sessionsToDelete.push(userId);
               }
          });

          sessionsToDelete.forEach(userId => {
               this.sessions.delete(userId);
          });
     }

     /**
      * Start automatic cleanup timer
      * Runs cleanup every 5 minutes
      */
     private startCleanupTimer(): void {
          // Run cleanup every 5 minutes
          this.cleanupInterval = setInterval(() => {
               this.cleanupSessions();
          }, 5 * 60 * 1000);
     }

     /**
      * Stop the cleanup timer (useful for testing and shutdown)
      */
     stopCleanupTimer(): void {
          if (this.cleanupInterval) {
               clearInterval(this.cleanupInterval);
               this.cleanupInterval = null;
          }
     }

     /**
      * Get the number of active sessions (useful for monitoring)
      */
     getSessionCount(): number {
          return this.sessions.size;
     }

     /**
      * Clear all sessions (useful for testing)
      */
     clearAllSessions(): void {
          this.sessions.clear();
     }
}

// Export singleton instance
export const sessionManager = new SessionManager();
export default SessionManager;

import * as fc from 'fast-check';
import SessionManager, { Session, ConversationTurn } from './sessionManager';

describe('SessionManager', () => {
     let manager: SessionManager;

     beforeEach(() => {
          manager = new SessionManager();
          manager.clearAllSessions();
     });

     afterEach(() => {
          manager.stopCleanupTimer();
     });

     /**
      * Feature: voice-rubber-duck-debugger, Property 13: Session initialization
      * Validates: Requirements 5.1, 12.1
      */
     describe('Property 13: Session initialization', () => {
          it('should create a session with an empty conversation array and unique session identifier for any new user', () => {
               fc.assert(
                    fc.property(
                         fc.string({ minLength: 1 }), // Generate non-empty userId
                         (userId) => {
                              // Clear any existing sessions
                              manager.clearAllSessions();

                              // Create a new session
                              const session = manager.createSession(userId);

                              // Verify session has correct structure
                              expect(session.userId).toBe(userId);
                              expect(session.conversation).toEqual([]);
                              expect(Array.isArray(session.conversation)).toBe(true);
                              expect(session.createdAt).toBeGreaterThan(0);
                              expect(session.lastAccessedAt).toBeGreaterThan(0);
                              expect(typeof session.createdAt).toBe('number');
                              expect(typeof session.lastAccessedAt).toBe('number');
                         }
                    ),
                    { numRuns: 100 }
               );
          });
     });

     /**
      * Feature: voice-rubber-duck-debugger, Property 5: Conversation history growth
      * Validates: Requirements 5.4
      */
     describe('Property 5: Conversation history growth', () => {
          it('should grow conversation history by exactly one entry for any completed debugging turn', () => {
               fc.assert(
                    fc.property(
                         fc.string({ minLength: 1 }), // userId
                         fc.string(), // user input
                         fc.string(), // AI output
                         (userId, input, output) => {
                              // Clear any existing sessions
                              manager.clearAllSessions();

                              // Create a session
                              const session = manager.createSession(userId);
                              const initialLength = session.conversation.length;

                              // Update session with a conversation turn
                              manager.updateSession(userId, input, output);

                              // Get the updated session
                              const updatedSession = manager.getSession(userId);
                              const finalLength = updatedSession.conversation.length;

                              // Verify conversation history grew by exactly one
                              expect(finalLength).toBe(initialLength + 1);

                              // Verify the turn contains both input and output
                              const lastTurn = updatedSession.conversation[finalLength - 1];
                              expect(lastTurn.input).toBe(input);
                              expect(lastTurn.output).toBe(output);
                         }
                    ),
                    { numRuns: 100 }
               );
          });
     });

     /**
      * Feature: voice-rubber-duck-debugger, Property 6: Session size limit enforcement
      * Validates: Requirements 5.5
      */
     describe('Property 6: Session size limit enforcement', () => {
          it('should maintain only the most recent 20 turns for any session with more than 20 conversation turns', () => {
               fc.assert(
                    fc.property(
                         fc.string({ minLength: 1 }), // userId
                         fc.integer({ min: 21, max: 50 }), // number of turns (more than 20)
                         (userId, numTurns) => {
                              // Clear any existing sessions
                              manager.clearAllSessions();

                              // Create a session
                              manager.createSession(userId);

                              // Add multiple conversation turns
                              for (let i = 0; i < numTurns; i++) {
                                   manager.updateSession(userId, `input-${i}`, `output-${i}`);
                              }

                              // Get the session
                              const session = manager.getSession(userId);

                              // Verify only 20 turns are maintained
                              expect(session.conversation.length).toBe(20);

                              // Verify the most recent 20 turns are kept
                              // The first turn should be from index (numTurns - 20)
                              const firstTurn = session.conversation[0];
                              const expectedFirstIndex = numTurns - 20;
                              expect(firstTurn.input).toBe(`input-${expectedFirstIndex}`);
                              expect(firstTurn.output).toBe(`output-${expectedFirstIndex}`);

                              // The last turn should be from index (numTurns - 1)
                              const lastTurn = session.conversation[19];
                              expect(lastTurn.input).toBe(`input-${numTurns - 1}`);
                              expect(lastTurn.output).toBe(`output-${numTurns - 1}`);
                         }
                    ),
                    { numRuns: 100 }
               );
          });
     });

     /**
      * Feature: voice-rubber-duck-debugger, Property 15: Conversation turn structure
      * Validates: Requirements 12.2
      */
     describe('Property 15: Conversation turn structure', () => {
          it('should contain both user input text and AI output text fields for any conversation turn stored in a session', () => {
               fc.assert(
                    fc.property(
                         fc.string({ minLength: 1 }), // userId
                         fc.string(), // user input
                         fc.string(), // AI output
                         (userId, input, output) => {
                              // Clear any existing sessions
                              manager.clearAllSessions();

                              // Create a session and add a turn
                              manager.createSession(userId);
                              manager.updateSession(userId, input, output);

                              // Get the session
                              const session = manager.getSession(userId);

                              // Verify the turn has the correct structure
                              expect(session.conversation.length).toBe(1);
                              const turn = session.conversation[0];

                              // Verify both input and output fields exist
                              expect(turn).toHaveProperty('input');
                              expect(turn).toHaveProperty('output');
                              expect(turn).toHaveProperty('timestamp');

                              // Verify the values match
                              expect(turn.input).toBe(input);
                              expect(turn.output).toBe(output);
                              expect(typeof turn.timestamp).toBe('number');
                              expect(turn.timestamp).toBeGreaterThan(0);
                         }
                    ),
                    { numRuns: 100 }
               );
          });
     });

     /**
      * Feature: voice-rubber-duck-debugger, Property 9: Conversation chronological ordering
      * Validates: Requirements 7.2, 12.3
      */
     describe('Property 9: Conversation chronological ordering', () => {
          it('should store and display conversation turns in chronological order based on timestamp for any sequence of turns', () => {
               fc.assert(
                    fc.property(
                         fc.string({ minLength: 1 }), // userId
                         fc.integer({ min: 2, max: 15 }), // number of turns
                         (userId, numTurns) => {
                              // Clear any existing sessions
                              manager.clearAllSessions();

                              // Create a session
                              manager.createSession(userId);

                              // Add multiple conversation turns with small delays to ensure different timestamps
                              const timestamps: number[] = [];
                              for (let i = 0; i < numTurns; i++) {
                                   manager.updateSession(userId, `input-${i}`, `output-${i}`);
                                   const session = manager.getSession(userId);
                                   timestamps.push(session.conversation[session.conversation.length - 1].timestamp);
                              }

                              // Get the session
                              const session = manager.getSession(userId);

                              // Verify turns are in chronological order
                              for (let i = 0; i < session.conversation.length - 1; i++) {
                                   const currentTimestamp = session.conversation[i].timestamp;
                                   const nextTimestamp = session.conversation[i + 1].timestamp;

                                   // Each subsequent turn should have a timestamp >= previous turn
                                   expect(nextTimestamp).toBeGreaterThanOrEqual(currentTimestamp);
                              }

                              // Verify the order of inputs matches the order they were added
                              for (let i = 0; i < session.conversation.length; i++) {
                                   expect(session.conversation[i].input).toBe(`input-${i}`);
                                   expect(session.conversation[i].output).toBe(`output-${i}`);
                              }
                         }
                    ),
                    { numRuns: 100 }
               );
          });
     });
});

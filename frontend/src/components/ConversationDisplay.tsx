import React, { useEffect, useRef } from 'react';

export interface ConversationTurn {
     input: string;
     output: string;
     timestamp: number;
}

interface ConversationDisplayProps {
     conversationHistory: ConversationTurn[];
}

export const ConversationDisplay: React.FC<ConversationDisplayProps> = ({
     conversationHistory,
}) => {
     const containerRef = useRef<HTMLDivElement | null>(null);
     const previousLengthRef = useRef<number>(0);

     // Auto-scroll to latest message when new message is added
     useEffect(() => {
          if (conversationHistory.length > previousLengthRef.current) {
               scrollToLatest();
          }
          previousLengthRef.current = conversationHistory.length;
     }, [conversationHistory]);

     const scrollToLatest = () => {
          if (containerRef.current) {
               containerRef.current.scrollTop = containerRef.current.scrollHeight;
          }
     };

     if (conversationHistory.length === 0) {
          return (
               <div className="conversation-display empty" role="log" aria-live="polite">
                    <p className="empty-message">Your conversation will appear here...</p>
               </div>
          );
     }

     return (
          <div
               className="conversation-display"
               ref={containerRef}
               role="log"
               aria-live="polite"
               aria-label="Conversation history"
          >
               {conversationHistory.map((turn, index) => (
                    <div key={`turn-${turn.timestamp}-${index}`} className="conversation-turn">
                         <div className="user-message message">
                              <div className="message-header">
                                   <span className="message-icon" aria-hidden="true">
                                        👤
                                   </span>
                                   <span className="message-label">You</span>
                                   <span className="message-timestamp">
                                        {new Date(turn.timestamp).toLocaleTimeString()}
                                   </span>
                              </div>
                              <div className="message-content">{turn.input}</div>
                         </div>
                         <div className="ai-message message">
                              <div className="message-header">
                                   <span className="message-icon" aria-hidden="true">
                                        🦆
                                   </span>
                                   <span className="message-label">Rubber Duck</span>
                                   <span className="message-timestamp">
                                        {new Date(turn.timestamp).toLocaleTimeString()}
                                   </span>
                              </div>
                              <div className="message-content">{turn.output}</div>
                         </div>
                    </div>
               ))}
          </div>
     );
};

export default ConversationDisplay;

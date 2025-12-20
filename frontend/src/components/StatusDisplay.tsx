import React from 'react';

export type SystemStatus = 'listening' | 'thinking' | 'playing' | 'ready' | 'error';

interface StatusDisplayProps {
     status: SystemStatus;
     errorMessage?: string;
}

export const StatusDisplay: React.FC<StatusDisplayProps> = ({ status, errorMessage }) => {
     const getStatusContent = () => {
          switch (status) {
               case 'listening':
                    return {
                         message: 'Listening...',
                         icon: '🎤',
                         className: 'status-listening',
                    };
               case 'thinking':
                    return {
                         message: 'AI Thinking...',
                         icon: '🤔',
                         className: 'status-thinking',
                    };
               case 'playing':
                    return {
                         message: 'Playing response...',
                         icon: '🔊',
                         className: 'status-playing',
                    };
               case 'ready':
                    return {
                         message: 'Ready',
                         icon: '✓',
                         className: 'status-ready',
                    };
               case 'error':
                    return {
                         message: errorMessage || 'An error occurred',
                         icon: '⚠️',
                         className: 'status-error',
                    };
               default:
                    return {
                         message: 'Ready',
                         icon: '✓',
                         className: 'status-ready',
                    };
          }
     };

     const { message, icon, className } = getStatusContent();

     return (
          <div className={`status-display ${className}`} role="status" aria-live="polite">
               <span className="status-icon" aria-hidden="true">
                    {icon}
               </span>
               <span className="status-message">{message}</span>
               {status === 'thinking' && (
                    <span className="spinner" aria-label="Loading">
                         ⏳
                    </span>
               )}
          </div>
     );
};

export default StatusDisplay;

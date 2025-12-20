import { render, screen } from '@testing-library/react';
import ConversationDisplay, { ConversationTurn } from './ConversationDisplay';

describe('ConversationDisplay Component', () => {
     // Unit test for empty conversation
     it('should display empty message when conversation history is empty', () => {
          render(<ConversationDisplay conversationHistory={[]} />);
          expect(screen.getByText('Your conversation will appear here...')).toBeInTheDocument();
     });

     // Unit test for rendering messages
     it('should render messages in chronological order', () => {
          const conversationHistory: ConversationTurn[] = [
               {
                    input: 'First user message',
                    output: 'First AI response',
                    timestamp: 1000,
               },
               {
                    input: 'Second user message',
                    output: 'Second AI response',
                    timestamp: 2000,
               },
          ];

          render(<ConversationDisplay conversationHistory={conversationHistory} />);

          // Verify all messages are rendered
          expect(screen.getByText('First user message')).toBeInTheDocument();
          expect(screen.getByText('First AI response')).toBeInTheDocument();
          expect(screen.getByText('Second user message')).toBeInTheDocument();
          expect(screen.getByText('Second AI response')).toBeInTheDocument();

          // Verify chronological order by checking DOM order
          const messages = screen.getAllByText(/user message|AI response/);
          expect(messages[0]).toHaveTextContent('First user message');
          expect(messages[1]).toHaveTextContent('First AI response');
          expect(messages[2]).toHaveTextContent('Second user message');
          expect(messages[3]).toHaveTextContent('Second AI response');
     });

     // Unit test for message structure
     it('should display user and AI labels correctly', () => {
          const conversationHistory: ConversationTurn[] = [
               {
                    input: 'Test input',
                    output: 'Test output',
                    timestamp: Date.now(),
               },
          ];

          render(<ConversationDisplay conversationHistory={conversationHistory} />);

          // Verify labels are present
          const youLabels = screen.getAllByText('You');
          const duckLabels = screen.getAllByText('Rubber Duck');
          expect(youLabels.length).toBe(1);
          expect(duckLabels.length).toBe(1);
     });

     // Unit test for timestamps
     it('should display timestamps for messages', () => {
          const timestamp = new Date('2024-01-01T12:00:00').getTime();
          const conversationHistory: ConversationTurn[] = [
               {
                    input: 'Test input',
                    output: 'Test output',
                    timestamp: timestamp,
               },
          ];

          render(<ConversationDisplay conversationHistory={conversationHistory} />);

          // Verify timestamps are rendered (format may vary by locale)
          const expectedTime = new Date(timestamp).toLocaleTimeString();
          const timestamps = screen.getAllByText(expectedTime);
          expect(timestamps.length).toBeGreaterThan(0);
     });

     // Unit test for auto-scroll behavior
     it('should have scrollable container with proper attributes', () => {
          const conversationHistory: ConversationTurn[] = [
               {
                    input: 'Test input',
                    output: 'Test output',
                    timestamp: Date.now(),
               },
          ];

          render(<ConversationDisplay conversationHistory={conversationHistory} />);

          const container = screen.getByRole('log');
          expect(container).toBeInTheDocument();
          expect(container).toHaveAttribute('aria-live', 'polite');
          expect(container).toHaveAttribute('aria-label', 'Conversation history');
     });

     // Unit test for multiple turns
     it('should render multiple conversation turns correctly', () => {
          const conversationHistory: ConversationTurn[] = [
               { input: 'Message 1', output: 'Response 1', timestamp: 1000 },
               { input: 'Message 2', output: 'Response 2', timestamp: 2000 },
               { input: 'Message 3', output: 'Response 3', timestamp: 3000 },
          ];

          render(<ConversationDisplay conversationHistory={conversationHistory} />);

          // Verify all turns are rendered
          expect(screen.getByText('Message 1')).toBeInTheDocument();
          expect(screen.getByText('Response 1')).toBeInTheDocument();
          expect(screen.getByText('Message 2')).toBeInTheDocument();
          expect(screen.getByText('Response 2')).toBeInTheDocument();
          expect(screen.getByText('Message 3')).toBeInTheDocument();
          expect(screen.getByText('Response 3')).toBeInTheDocument();
     });

     // Unit test for icons
     it('should display user and AI icons', () => {
          const conversationHistory: ConversationTurn[] = [
               {
                    input: 'Test input',
                    output: 'Test output',
                    timestamp: Date.now(),
               },
          ];

          render(<ConversationDisplay conversationHistory={conversationHistory} />);

          // Verify icons are present
          expect(screen.getByText('👤')).toBeInTheDocument();
          expect(screen.getByText('🦆')).toBeInTheDocument();
     });
});

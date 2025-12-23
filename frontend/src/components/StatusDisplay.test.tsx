import { render, screen, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';
import StatusDisplay, { SystemStatus } from './StatusDisplay';

describe('StatusDisplay Component', () => {
     afterEach(() => {
          cleanup();
     });

     /**
      * Feature: voice-rubber-duck-debugger, Property 7: Status display reflects system state
      * Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5
      */
     it('should display the correct message and icon for each system state', () => {
          fc.assert(
               fc.property(
                    fc.constantFrom<SystemStatus>('listening', 'thinking', 'playing', 'ready', 'error'),
                    fc.option(
                         fc.string({ minLength: 1, maxLength: 100 })
                              .filter(s => s.trim().length > 0)
                              .map(s => s.trim()), // Trim the string to avoid whitespace issues
                         { nil: undefined }
                    ),
                    (status, errorMessage) => {
                         // Clean up before each iteration
                         cleanup();

                         const { unmount, container } = render(
                              <StatusDisplay status={status} errorMessage={errorMessage} />
                         );

                         // Verify the status display is rendered
                         const statusElement = container.querySelector('[role="status"]');
                         expect(statusElement).toBeInTheDocument();

                         // Verify the correct message is displayed based on status
                         switch (status) {
                              case 'listening':
                                   expect(screen.getByText('Listening...')).toBeInTheDocument();
                                   expect(screen.getByText('🎤')).toBeInTheDocument();
                                   expect(statusElement).toHaveClass('status-listening');
                                   break;
                              case 'thinking':
                                   expect(screen.getByText('AI Thinking...')).toBeInTheDocument();
                                   expect(screen.getByText('🤔')).toBeInTheDocument();
                                   expect(statusElement).toHaveClass('status-thinking');
                                   // Verify spinner is present for thinking state
                                   expect(screen.getByLabelText('Loading')).toBeInTheDocument();
                                   break;
                              case 'playing':
                                   expect(screen.getByText('Playing response...')).toBeInTheDocument();
                                   expect(screen.getByText('🔊')).toBeInTheDocument();
                                   expect(statusElement).toHaveClass('status-playing');
                                   break;
                              case 'ready':
                                   expect(screen.getByText('Ready')).toBeInTheDocument();
                                   expect(screen.getByText('✓')).toBeInTheDocument();
                                   expect(statusElement).toHaveClass('status-ready');
                                   break;
                              case 'error':
                                   const expectedMessage = errorMessage || 'An error occurred';
                                   expect(screen.getByText(expectedMessage)).toBeInTheDocument();
                                   expect(screen.getByText('⚠️')).toBeInTheDocument();
                                   expect(statusElement).toHaveClass('status-error');
                                   break;
                         }

                         unmount();
                    }
               ),
               { numRuns: 100 }
          );
     });

     // Unit test for specific status states
     it('should display "Listening..." when status is listening', () => {
          cleanup();
          render(<StatusDisplay status="listening" />);
          expect(screen.getByText('Listening...')).toBeInTheDocument();
          expect(screen.getByText('🎤')).toBeInTheDocument();
     });

     it('should display "AI Thinking..." with spinner when status is thinking', () => {
          cleanup();
          render(<StatusDisplay status="thinking" />);
          expect(screen.getByText('AI Thinking...')).toBeInTheDocument();
          expect(screen.getByText('🤔')).toBeInTheDocument();
          expect(screen.getByLabelText('Loading')).toBeInTheDocument();
     });

     it('should display "Playing response..." when status is playing', () => {
          cleanup();
          render(<StatusDisplay status="playing" />);
          expect(screen.getByText('Playing response...')).toBeInTheDocument();
          expect(screen.getByText('🔊')).toBeInTheDocument();
     });

     it('should display "Ready" when status is ready', () => {
          cleanup();
          render(<StatusDisplay status="ready" />);
          expect(screen.getByText('Ready')).toBeInTheDocument();
          expect(screen.getByText('✓')).toBeInTheDocument();
     });

     it('should display error message when status is error', () => {
          cleanup();
          const errorMessage = 'Something went wrong';
          render(<StatusDisplay status="error" errorMessage={errorMessage} />);
          expect(screen.getByText(errorMessage)).toBeInTheDocument();
          expect(screen.getByText('⚠️')).toBeInTheDocument();
     });

     it('should display default error message when status is error and no message provided', () => {
          cleanup();
          render(<StatusDisplay status="error" />);
          expect(screen.getByText('An error occurred')).toBeInTheDocument();
          expect(screen.getByText('⚠️')).toBeInTheDocument();
     });

     /**
      * Feature: voxduck-rebrand, Property 1: Status state color mapping
      * Validates: Requirements 2.1, 2.2, 2.3, 2.4
      */
     it('should apply correct brand color class for each status state', () => {
          fc.assert(
               fc.property(
                    fc.constantFrom<SystemStatus>('listening', 'thinking', 'playing', 'error'),
                    (status) => {
                         cleanup();

                         const { container, unmount } = render(<StatusDisplay status={status} />);
                         const statusElement = container.querySelector('.status-display');

                         expect(statusElement).toBeInTheDocument();

                         // Verify the correct status class is applied
                         // Each status class maps to a specific brand color via CSS:
                         // listening -> status-listening -> --color-status-listening (#22D3EE)
                         // thinking -> status-thinking -> --color-status-thinking (#7C3AED)
                         // playing -> status-playing -> --color-status-speaking (#10B981)
                         // error -> status-error -> --color-status-error (#EF4444)
                         const expectedClass = `status-${status}`;
                         expect(statusElement).toHaveClass(expectedClass);

                         unmount();
                    }
               ),
               { numRuns: 100 }
          );
     });
});

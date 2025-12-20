import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as fc from 'fast-check';
import AudioRecorder from './AudioRecorder';

// Mock MediaRecorder API
class MockMediaRecorder {
     state: 'inactive' | 'recording' | 'paused' = 'inactive';
     ondataavailable: ((event: { data: Blob }) => void) | null = null;
     onstop: (() => void) | null = null;
     stream: MediaStream;

     constructor(stream: MediaStream) {
          this.stream = stream;
     }

     start() {
          this.state = 'recording';
     }

     stop() {
          this.state = 'inactive';
          // Simulate data available event
          if (this.ondataavailable) {
               const audioData = new Blob(['mock audio data'], { type: 'audio/webm' });
               this.ondataavailable({ data: audioData });
          }
          // Trigger stop event
          if (this.onstop) {
               setTimeout(() => this.onstop!(), 0);
          }
     }
}

// Mock getUserMedia
const mockGetUserMedia = jest.fn();

describe('AudioRecorder Component', () => {
     beforeEach(() => {
          // Setup MediaRecorder mock
          global.MediaRecorder = MockMediaRecorder as any;

          // Setup getUserMedia mock
          Object.defineProperty(global.navigator, 'mediaDevices', {
               value: {
                    getUserMedia: mockGetUserMedia,
               },
               writable: true,
               configurable: true,
          });

          // Mock MediaStream
          const mockStream = {
               getTracks: () => [{ stop: jest.fn() }],
          } as any;
          mockGetUserMedia.mockResolvedValue(mockStream);

          // Mock FileReader for base64 conversion
          const mockFileReader = {
               readAsDataURL: jest.fn(function (this: any) {
                    this.onloadend?.();
               }),
               result: 'data:audio/webm;base64,bW9jayBhdWRpbyBkYXRh',
          };
          global.FileReader = jest.fn(() => mockFileReader) as any;
     });

     afterEach(() => {
          jest.clearAllMocks();
     });

     /**
      * Feature: voice-rubber-duck-debugger, Property 1: Audio recording triggers backend processing
      * Validates: Requirements 1.3
      */
     it('should trigger onRecordingComplete with base64 audio data when recording stops', async () => {
          await fc.assert(
               fc.asyncProperty(
                    fc.string({ minLength: 1, maxLength: 50 }), // Generate random user IDs
                    async (_userId) => {
                         const onRecordingComplete = jest.fn();
                         const onError = jest.fn();

                         const { unmount } = render(
                              <AudioRecorder
                                   onRecordingComplete={onRecordingComplete}
                                   onError={onError}
                              />
                         );

                         const button = screen.getByRole('button', { name: /start recording/i });

                         // Start recording
                         await userEvent.click(button);

                         // Wait for recording to start
                         await waitFor(() => {
                              expect(screen.getByRole('button', { name: /stop recording/i })).toBeInTheDocument();
                         });

                         // Stop recording
                         const stopButton = screen.getByRole('button', { name: /stop recording/i });
                         await userEvent.click(stopButton);

                         // Wait for onRecordingComplete to be called
                         await waitFor(() => {
                              expect(onRecordingComplete).toHaveBeenCalled();
                         }, { timeout: 1000 });

                         // Verify that onRecordingComplete was called with base64 string
                         expect(onRecordingComplete).toHaveBeenCalledWith(
                              expect.stringMatching(/^[A-Za-z0-9+/=]+$/)
                         );

                         // Verify no errors occurred
                         expect(onError).not.toHaveBeenCalled();

                         unmount();
                    }
               ),
               { numRuns: 100 }
          );
     }, 30000); // 30 second timeout for property-based test with 100 runs

     it('should handle microphone permission denied error', async () => {
          const onRecordingComplete = jest.fn();
          const onError = jest.fn();

          // Mock permission denied
          mockGetUserMedia.mockRejectedValueOnce(
               new DOMException('Permission denied', 'NotAllowedError')
          );

          render(
               <AudioRecorder
                    onRecordingComplete={onRecordingComplete}
                    onError={onError}
               />
          );

          const button = screen.getByRole('button', { name: /start recording/i });
          await userEvent.click(button);

          await waitFor(() => {
               expect(onError).toHaveBeenCalledWith(
                    'Microphone access denied. Please grant permission to use the microphone.'
               );
          });

          expect(onRecordingComplete).not.toHaveBeenCalled();
     });

     it('should reject audio files exceeding 10MB limit', async () => {
          const onRecordingComplete = jest.fn();
          const onError = jest.fn();

          // Create a mock MediaRecorder that produces large file
          class LargeFileMockMediaRecorder extends MockMediaRecorder {
               stop() {
                    this.state = 'inactive';
                    if (this.ondataavailable) {
                         // Create a blob larger than 10MB
                         const largeData = new Blob([new ArrayBuffer(11 * 1024 * 1024)], { type: 'audio/webm' });
                         this.ondataavailable({ data: largeData });
                    }
                    if (this.onstop) {
                         setTimeout(() => this.onstop!(), 0);
                    }
               }
          }

          global.MediaRecorder = LargeFileMockMediaRecorder as any;

          render(
               <AudioRecorder
                    onRecordingComplete={onRecordingComplete}
                    onError={onError}
               />
          );

          const button = screen.getByRole('button', { name: /start recording/i });
          await userEvent.click(button);

          await waitFor(() => {
               expect(screen.getByRole('button', { name: /stop recording/i })).toBeInTheDocument();
          });

          const stopButton = screen.getByRole('button', { name: /stop recording/i });
          await userEvent.click(stopButton);

          await waitFor(() => {
               expect(onError).toHaveBeenCalledWith(
                    'Audio file exceeds 10MB limit. Please record a shorter message.'
               );
          });

          expect(onRecordingComplete).not.toHaveBeenCalled();
     });
});

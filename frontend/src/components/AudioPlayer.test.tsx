import { render, waitFor } from '@testing-library/react';
import * as fc from 'fast-check';
import AudioPlayer from './AudioPlayer';

describe('AudioPlayer Component', () => {
     let mockPlay: jest.Mock;
     let mockPause: jest.Mock;
     let eventListeners: Map<string, EventListener[]>;

     beforeEach(() => {
          mockPlay = jest.fn().mockResolvedValue(undefined);
          mockPause = jest.fn();
          eventListeners = new Map();

          // Mock HTMLAudioElement
          window.HTMLAudioElement.prototype.play = mockPlay;
          window.HTMLAudioElement.prototype.pause = mockPause;

          // Mock addEventListener to store listeners
          window.HTMLAudioElement.prototype.addEventListener = jest.fn((event: string, listener: any) => {
               if (!eventListeners.has(event)) {
                    eventListeners.set(event, []);
               }
               eventListeners.get(event)!.push(listener);
          });

          // Mock removeEventListener
          window.HTMLAudioElement.prototype.removeEventListener = jest.fn((event: string, listener: any) => {
               const listeners = eventListeners.get(event);
               if (listeners) {
                    const index = listeners.indexOf(listener);
                    if (index > -1) {
                         listeners.splice(index, 1);
                    }
               }
          });
     });

     afterEach(() => {
          jest.clearAllMocks();
          eventListeners.clear();
     });

     /**
      * Feature: voice-rubber-duck-debugger, Property 18: Audio playback automation
      * Validates: Requirements 4.5
      */
     it('should automatically begin playback when autoPlay is true and audioUrl is provided', async () => {
          await fc.assert(
               fc.asyncProperty(
                    fc.webUrl(), // Generate random audio URLs
                    async (audioUrl) => {
                         // Reset mocks for each property test run
                         mockPlay.mockClear();
                         mockPause.mockClear();
                         eventListeners.clear();

                         const onPlaybackComplete = jest.fn();
                         const onError = jest.fn();

                         const { unmount } = render(
                              <AudioPlayer
                                   audioUrl={audioUrl}
                                   autoPlay={true}
                                   onPlaybackComplete={onPlaybackComplete}
                                   onError={onError}
                              />
                         );

                         // Wait for the component to mount and auto-play to trigger
                         await waitFor(() => {
                              expect(mockPlay).toHaveBeenCalled();
                         }, { timeout: 1000 });

                         // Verify that play was called at least once (indicating auto-play)
                         expect(mockPlay).toHaveBeenCalled();

                         // Verify no errors occurred during auto-play
                         expect(onError).not.toHaveBeenCalled();

                         unmount();
                    }
               ),
               { numRuns: 100 }
          );
     }, 30000); // 30 second timeout for property-based test with 100 runs

     it('should not auto-play when autoPlay is false', async () => {
          const audioUrl = 'https://example.com/audio.mp3';
          const onPlaybackComplete = jest.fn();
          const onError = jest.fn();

          const { unmount } = render(
               <AudioPlayer
                    audioUrl={audioUrl}
                    autoPlay={false}
                    onPlaybackComplete={onPlaybackComplete}
                    onError={onError}
               />
          );

          // Wait a bit to ensure play is not called
          await new Promise(resolve => setTimeout(resolve, 100));

          expect(mockPlay).not.toHaveBeenCalled();
          expect(onError).not.toHaveBeenCalled();

          unmount();
     });

     it('should call onPlaybackComplete when audio ends', async () => {
          const audioUrl = 'https://example.com/audio.mp3';
          const onPlaybackComplete = jest.fn();
          const onError = jest.fn();

          render(
               <AudioPlayer
                    audioUrl={audioUrl}
                    autoPlay={false}
                    onPlaybackComplete={onPlaybackComplete}
                    onError={onError}
               />
          );

          // Get the 'ended' event listeners
          const endedListeners = eventListeners.get('ended');
          expect(endedListeners).toBeDefined();
          expect(endedListeners!.length).toBeGreaterThan(0);

          // Trigger the 'ended' event
          endedListeners!.forEach(listener => listener(new Event('ended')));

          await waitFor(() => {
               expect(onPlaybackComplete).toHaveBeenCalled();
          });

          expect(onError).not.toHaveBeenCalled();
     });

     it('should call onError when audio fails to load', async () => {
          const audioUrl = 'https://example.com/audio.mp3';
          const onPlaybackComplete = jest.fn();
          const onError = jest.fn();

          render(
               <AudioPlayer
                    audioUrl={audioUrl}
                    autoPlay={false}
                    onPlaybackComplete={onPlaybackComplete}
                    onError={onError}
               />
          );

          // Get the 'error' event listeners
          const errorListeners = eventListeners.get('error');
          expect(errorListeners).toBeDefined();
          expect(errorListeners!.length).toBeGreaterThan(0);

          // Trigger the 'error' event
          errorListeners!.forEach(listener => listener(new Event('error')));

          await waitFor(() => {
               expect(onError).toHaveBeenCalledWith('Failed to play audio response.');
          });

          expect(onPlaybackComplete).not.toHaveBeenCalled();
     });

     it('should handle auto-play failure gracefully', async () => {
          const audioUrl = 'https://example.com/audio.mp3';
          const onPlaybackComplete = jest.fn();
          const onError = jest.fn();

          // Mock play to reject (simulating browser auto-play policy)
          mockPlay.mockRejectedValueOnce(
               new Error('Auto-play prevented by browser')
          );

          render(
               <AudioPlayer
                    audioUrl={audioUrl}
                    autoPlay={true}
                    onPlaybackComplete={onPlaybackComplete}
                    onError={onError}
               />
          );

          await waitFor(() => {
               expect(onError).toHaveBeenCalledWith(
                    'Failed to auto-play audio. Please click play manually.'
               );
          });
     });
});

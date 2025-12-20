import React, { useRef, useEffect } from 'react';

interface AudioPlayerProps {
     audioUrl: string;
     autoPlay?: boolean;
     onPlaybackComplete?: () => void;
     onError?: (error: string) => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
     audioUrl,
     autoPlay = false,
     onPlaybackComplete,
     onError,
}) => {
     const audioRef = useRef<HTMLAudioElement | null>(null);

     useEffect(() => {
          const audioElement = audioRef.current;
          if (!audioElement) return;

          // Set up event listeners
          const handleEnded = () => {
               if (onPlaybackComplete) {
                    onPlaybackComplete();
               }
          };

          const handleError = () => {
               if (onError) {
                    onError('Failed to play audio response.');
               }
          };

          audioElement.addEventListener('ended', handleEnded);
          audioElement.addEventListener('error', handleError);

          // Auto-play if enabled
          if (autoPlay && audioUrl) {
               audioElement.play().catch(() => {
                    if (onError) {
                         onError('Failed to auto-play audio. Please click play manually.');
                    }
               });
          }

          // Cleanup
          return () => {
               audioElement.removeEventListener('ended', handleEnded);
               audioElement.removeEventListener('error', handleError);
          };
     }, [audioUrl, autoPlay, onPlaybackComplete, onError]);

     const play = () => {
          if (audioRef.current) {
               audioRef.current.play().catch(() => {
                    if (onError) {
                         onError('Failed to play audio.');
                    }
               });
          }
     };

     const pause = () => {
          if (audioRef.current) {
               audioRef.current.pause();
          }
     };

     const replay = () => {
          if (audioRef.current) {
               audioRef.current.currentTime = 0;
               audioRef.current.play().catch(() => {
                    if (onError) {
                         onError('Failed to replay audio.');
                    }
               });
          }
     };

     return (
          <div className="audio-player">
               <audio ref={audioRef} src={audioUrl} preload="auto" />
               <div className="audio-controls">
                    <button
                         onClick={play}
                         className="control-button play-button"
                         aria-label="Play audio"
                    >
                         ▶️ Play
                    </button>
                    <button
                         onClick={pause}
                         className="control-button pause-button"
                         aria-label="Pause audio"
                    >
                         ⏸️ Pause
                    </button>
                    <button
                         onClick={replay}
                         className="control-button replay-button"
                         aria-label="Replay audio"
                    >
                         🔄 Replay
                    </button>
               </div>
          </div>
     );
};

export default AudioPlayer;

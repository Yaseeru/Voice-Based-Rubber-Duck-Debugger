import React, { useState, useRef } from 'react';

interface AudioRecorderProps {
     onRecordingComplete: (audioBase64: string) => void;
     onError: (error: string) => void;
     onRecordingStart?: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
     onRecordingComplete,
     onError,
     onRecordingStart,
}) => {
     const [isRecording, setIsRecording] = useState(false);
     const mediaRecorderRef = useRef<MediaRecorder | null>(null);
     const audioChunksRef = useRef<Blob[]>([]);

     const startRecording = async () => {
          try {
               // Request microphone access
               const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

               // Try to use audio/wav if supported, fallback to default
               let mimeType = 'audio/webm';
               if (MediaRecorder.isTypeSupported('audio/wav')) {
                    mimeType = 'audio/wav';
               } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
                    mimeType = 'audio/mp4';
               }

               // Create MediaRecorder instance with preferred format
               const mediaRecorder = new MediaRecorder(stream, { mimeType });
               mediaRecorderRef.current = mediaRecorder;
               audioChunksRef.current = [];

               // Collect audio data chunks
               mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                         audioChunksRef.current.push(event.data);
                    }
               };

               // Handle recording stop
               mediaRecorder.onstop = async () => {
                    const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

                    // Validate file size
                    if (audioBlob.size > MAX_FILE_SIZE) {
                         onError('Audio file exceeds 10MB limit. Please record a shorter message.');
                         // Stop all tracks to release microphone
                         stream.getTracks().forEach(track => track.stop());
                         return;
                    }

                    try {
                         const base64Audio = await convertToBase64(audioBlob);
                         onRecordingComplete(base64Audio);
                    } catch (error) {
                         onError('Failed to process audio recording.');
                    }

                    // Stop all tracks to release microphone
                    stream.getTracks().forEach(track => track.stop());
               };

               // Start recording
               mediaRecorder.start();
               setIsRecording(true);

               // Notify parent component that recording has started
               if (onRecordingStart) {
                    onRecordingStart();
               }
          } catch (error) {
               if (error instanceof DOMException && error.name === 'NotAllowedError') {
                    onError('Microphone access denied. Please grant permission to use the microphone.');
               } else {
                    onError('Failed to start recording. Please check your microphone.');
               }
          }
     };

     const stopRecording = () => {
          if (mediaRecorderRef.current && isRecording) {
               mediaRecorderRef.current.stop();
               setIsRecording(false);
          }
     };

     const convertToBase64 = (blob: Blob): Promise<string> => {
          return new Promise((resolve, reject) => {
               const reader = new FileReader();
               reader.onloadend = () => {
                    const result = reader.result as string;
                    // Remove the data URL prefix (e.g., "data:audio/webm;base64,")
                    const base64 = result.split(',')[1];
                    resolve(base64);
               };
               reader.onerror = reject;
               reader.readAsDataURL(blob);
          });
     };

     return (
          <div className="audio-recorder">
               <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`record-button ${isRecording ? 'recording' : ''}`}
                    aria-label={isRecording ? 'Stop recording' : 'Start recording'}
               >
                    <span className="microphone-icon">🎙️</span>
                    <span className="button-label">
                         {isRecording ? 'Stop Recording' : 'Explain Bug'}
                    </span>
               </button>
          </div>
     );
};

export default AudioRecorder;

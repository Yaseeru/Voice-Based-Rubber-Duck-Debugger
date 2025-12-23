import { useState, useEffect } from 'react';
import AudioRecorder from './components/AudioRecorder';
import StatusDisplay, { SystemStatus } from './components/StatusDisplay';
import AudioPlayer from './components/AudioPlayer';
import ConversationDisplay, { ConversationTurn } from './components/ConversationDisplay';
import { apiClient, ApiError } from './services/apiClient';
import Logo from './components/Logo';

function App() {
     // State management
     const [userId, setUserId] = useState<string>('');
     const [conversationHistory, setConversationHistory] = useState<ConversationTurn[]>([]);
     const [currentStatus, setCurrentStatus] = useState<SystemStatus>('ready');
     const [errorMessage, setErrorMessage] = useState<string>('');
     const [currentAudioUrl, setCurrentAudioUrl] = useState<string>('');

     // Initialize userId on component mount
     useEffect(() => {
          // Generate a unique user ID (simple implementation using timestamp + random)
          const generatedUserId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
          setUserId(generatedUserId);
     }, []);

     // Update status helper
     const updateStatus = (newStatus: SystemStatus, error?: string) => {
          setCurrentStatus(newStatus);
          if (newStatus === 'error' && error) {
               setErrorMessage(error);
          } else if (newStatus !== 'error') {
               setErrorMessage('');
          }
     };

     // Handle error display
     const handleError = (error: string) => {
          updateStatus('error', error);
          // Auto-reset to ready after 5 seconds
          setTimeout(() => {
               updateStatus('ready');
          }, 5000);
     };

     // Handle audio submission to backend API
     const handleAudioSubmit = async (audioBase64: string) => {
          try {
               // Update status to thinking
               updateStatus('thinking');

               // Use API client to submit audio
               const data = await apiClient.submitAudio(audioBase64, userId);

               // Add to conversation history
               const newTurn: ConversationTurn = {
                    input: 'Audio input', // We don't have the transcribed text yet
                    output: data.textResponse,
                    timestamp: Date.now(),
               };
               setConversationHistory((prev) => [...prev, newTurn]);

               // Set audio URL for playback
               setCurrentAudioUrl(data.audioUrl);

               // Update status to playing
               updateStatus('playing');
          } catch (error) {
               // Handle ApiError with specific error messages
               if (error instanceof ApiError) {
                    handleError(error.message);
               } else {
                    const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred';
                    handleError(errorMsg);
               }
          }
     };

     // Handle recording start
     const handleRecordingStart = () => {
          updateStatus('listening');
     };

     // Handle recording complete
     const handleRecordingComplete = (audioBase64: string) => {
          handleAudioSubmit(audioBase64);
     };

     // Handle recording error
     const handleRecordingError = (error: string) => {
          handleError(error);
     };

     // Handle playback complete
     const handlePlaybackComplete = () => {
          updateStatus('ready');
     };

     // Handle playback error
     const handlePlaybackError = (error: string) => {
          handleError(error);
     };

     return (
          <div className="App">
               <header className="app-header">
                    <Logo variant="full" />
                    <p className="tagline">Debug by talking it through.</p>
               </header>

               <main className="app-main">
                    {/* Status Display - Prominently positioned */}
                    <div className="status-section">
                         <StatusDisplay status={currentStatus} errorMessage={errorMessage} />
                    </div>

                    {/* Audio Recorder - Central focus with microphone emoji */}
                    <div className="recorder-section">
                         <AudioRecorder
                              onRecordingStart={handleRecordingStart}
                              onRecordingComplete={handleRecordingComplete}
                              onError={handleRecordingError}
                         />
                    </div>

                    {/* Conversation Display - Shows conversation history */}
                    <div className="conversation-section">
                         <ConversationDisplay conversationHistory={conversationHistory} />
                    </div>

                    {/* Audio Player - Integrated seamlessly when audio is available */}
                    {currentAudioUrl && (
                         <div className="player-section">
                              <AudioPlayer
                                   audioUrl={currentAudioUrl}
                                   autoPlay={true}
                                   onPlaybackComplete={handlePlaybackComplete}
                                   onError={handlePlaybackError}
                              />
                         </div>
                    )}
               </main>

               <footer className="app-footer">
                    <p>VoxDuck - Your voice-first debugging companion</p>
               </footer>
          </div>
     );
}

export default App;

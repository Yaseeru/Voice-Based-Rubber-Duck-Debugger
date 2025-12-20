# Implementation Plan

- [x] 1. Set up project structure and dependencies

  - Create monorepo structure with backend and frontend directories
  - Initialize Node.js backend with Express and TypeScript
  - Initialize React frontend with TypeScript and Vite
  - Install core dependencies: express, axios, dotenv, cors for backend
  - Install frontend dependencies: react, react-dom, axios
  - Install testing dependencies: jest, @testing-library/react, fast-check
  - Create .env.example file with required environment variables
  - Set up TypeScript configurations for both backend and frontend
  - Create Dockerfile for Cloud Run deployment
  - _Requirements: All requirements depend on proper project setup_

- [x] 2. Implement backend session management




  - [x] 2.1 Create session manager service with in-memory storage


    - Implement createSession, getSession, updateSession, cleanupSessions methods
    - Add session data structure with userId, timestamps, and conversation array
    - Implement 20-turn limit for conversation history
    - Add 1-hour inactivity cleanup logic

    - _Requirements: 5.1, 5.2, 5.4, 5.5, 12.1, 12.2, 12.3, 12.4_
  - [x] 2.2 Write property test for session initialization

    - **Property 13: Session initialization**
    - **Validates: Requirements 5.1, 12.1**
  - [x] 2.3 Write property test for conversation history growth


    - **Property 5: Conversation history growth**
    - **Validates: Requirements 5.4**
  - [x] 2.4 Write property test for session size limit


    - **Property 6: Session size limit enforcement**
    - **Validates: Requirements 5.5**
  - [x] 2.5 Write property test for conversation turn structure


    - **Property 15: Conversation turn structure**
    - **Validates: Requirements 12.2**
  - [x] 2.6 Write property test for chronological ordering


    - **Property 9: Conversation chronological ordering**
    - **Validates: Requirements 7.2, 12.3**

- [x] 3. Implement logging utility




  - [x] 3.1 Create logger service with structured logging


    - Implement logRequest, logSTT, logGemini, logTTS, logError methods
    - Add timestamp and userId to all log entries
    - Configure console output for development
    - Add Cloud Logging integration for production
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  - [x] 3.2 Write property test for comprehensive logging


    - **Property 10: Comprehensive logging**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**

- [-] 4. Implement ElevenLabs STT service



  - [x] 4.1 Create STT service with API integration


    - Implement transcribe method that calls ElevenLabs STT API
    - Add base64 audio to API request format conversion
    - Configure API endpoint and authentication headers
    - Add 10-second timeout for API requests
    - Implement retry logic with 1-second delay
    - Add error handling and logging
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 9.1, 9.3_


  - [-] 4.2 Write property test for API retry behavior

    - **Property 3: API retry behavior**
    - **Validates: Requirements 2.3, 4.3, 9.3**
  - [x] 4.3 Write property test for request timeout

    - **Property 11: Request timeout enforcement**
    - **Validates: Requirements 9.1**

- [x] 5. Implement Google Vertex AI Gemini service






  - [x] 5.1 Create Gemini service with API integration




    - Implement generateResponse method using Vertex AI SDK
    - Create constructPrompt method that builds full prompt with context
    - Add rubber duck debugger system prompt
    - Configure model with 500 token limit
    - Add 10-second timeout for API requests
    - Implement retry logic with 1-second delay
    - Add fallback message for API failures
    - Add error handling and logging
    - _Requirements: 3.1, 3.2, 3.3, 5.3, 9.1, 9.2, 9.3_

  - [x] 5.2 Write property test for Gemini configuration

    - **Property 17: Gemini configuration consistency**
    - **Validates: Requirements 3.2, 3.3**
  - [x] 5.3 Write property test for conversation context inclusion

    - **Property 4: Gemini requests include conversation context**
    - **Validates: Requirements 5.3**

- [x] 6. Implement ElevenLabs TTS service




  - [x] 6.1 Create TTS service with API integration


    - Implement synthesize method that calls ElevenLabs TTS API
    - Configure voice selection and audio format (mp3)
    - Add 10-second timeout for API requests
    - Implement retry logic with 1-second delay
    - Handle audio file storage or streaming
    - Add error handling and logging
    - _Requirements: 4.1, 4.2, 4.3, 9.1, 9.3_

- [-] 7. Implement main API endpoint


  - [x] 7.1 Create /debug/voice POST endpoint


    - Set up Express router for debug routes
    - Implement request validation for audio and userId
    - Orchestrate STT → Gemini → TTS pipeline
    - Integrate session manager for context retrieval and storage
    - Integrate logger for all operations
    - Build response with textResponse and audioUrl
    - Add comprehensive error handling
    - _Requirements: 2.1, 2.2, 3.1, 4.1, 4.2, 4.4, 5.2, 5.4, 8.1, 8.2, 8.3, 8.4, 9.5, 11.1, 11.2, 11.3, 11.4_
  - [x] 7.2 Write property test for response structure


    - **Property 8: Response structure completeness**
    - **Validates: Requirements 4.4, 11.3**
  - [x] 7.3 Write property test for request validation


    - **Property 14: Request validation**
    - **Validates: Requirements 11.4**
  - [x] 7.4 Write property test for error preservation

    - **Property 12: Error preservation of session state**
    - **Validates: Requirements 9.5**
  - [x] 7.5 Write property test for STT session storage

    - **Property 2: STT transcription stores session context**
    - **Validates: Requirements 2.2**

- [x] 8. Set up backend server and middleware





  - [x] 8.1 Create Express server with middleware


    - Configure CORS for frontend origin
    - Add body parser for JSON and large payloads
    - Add request logging middleware
    - Configure error handling middleware
    - Set up health check endpoint
    - Load environment variables
    - Start server on configured port
    - _Requirements: 11.1_

- [x] 9. Checkpoint - Ensure backend tests pass





  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Implement frontend audio recording

  - [x] 10.1 Create AudioRecorder component


    - Implement MediaRecorder API integration
    - Add startRecording method with microphone access
    - Add stopRecording method that returns audio blob
    - Implement convertToBase64 utility function
    - Add error handling for permission denied
    - Add file size validation (10MB limit)
    - Emit onRecordingComplete and onError events
    - _Requirements: 1.1, 1.3, 1.4, 1.5_
  - [x] 10.2 Write property test for recording trigger

    - **Property 1: Audio recording triggers backend processing**
    - **Validates: Requirements 1.3**

- [x] 11. Implement frontend status display




  - [x] 11.1 Create StatusDisplay component


    - Accept status prop (listening | thinking | playing | ready | error)
    - Render appropriate message for each status
    - Add visual indicators (spinner, icons)
    - Style for minimalist design
    - _Requirements: 1.2, 6.1, 6.2, 6.3, 6.4, 6.5_
  - [x] 11.2 Write property test for status display


    - **Property 7: Status display reflects system state**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

- [x] 12. Implement frontend audio playback




  - [x] 12.1 Create AudioPlayer component


    - Accept audioUrl and autoPlay props
    - Implement play, pause, replay methods
    - Add HTML5 audio element integration
    - Implement auto-play functionality
    - Emit onPlaybackComplete and onError events
    - _Requirements: 4.5_
  - [x] 12.2 Write property test for audio playback automation


    - **Property 18: Audio playback automation**
    - **Validates: Requirements 4.5**

- [x] 13. Implement frontend conversation display




  - [x] 13.1 Create ConversationDisplay component

    - Accept conversationHistory prop (array of turns)
    - Render messages in chronological order
    - Implement scrollToLatest method
    - Add auto-scroll on new message
    - Style for readability with minimalist design
    - _Requirements: 7.1, 7.2, 7.4_

- [x] 14. Implement main App component




  - [x] 14.1 Create App component with state management

    - Initialize userId on component mount
    - Manage conversationHistory state
    - Manage currentStatus state (listening | thinking | playing | ready | error)
    - Implement handleAudioSubmit that calls backend API
    - Implement updateStatus for UI state transitions
    - Implement handleError for error display
    - Integrate AudioRecorder, StatusDisplay, AudioPlayer, ConversationDisplay
    - Add loading states and error boundaries
    - _Requirements: 1.1, 1.2, 1.3, 6.1, 6.2, 6.3, 6.4, 6.5, 7.1_

- [x] 15. Implement frontend UI layout




  - [x] 15.1 Create main page layout

    - Design single-page layout with record button
    - Add microphone emoji (🎙️) with "Explain Bug" label
    - Position status display prominently
    - Add conversation display area
    - Integrate audio player controls
    - Apply minimalist styling focused on voice-first interaction
    - Ensure responsive design for different screen sizes
    - _Requirements: 10.1, 10.3_

- [x] 16. Implement API client service

  - [x] 16.1 Create API client for backend communication


    - Implement submitAudio method that posts to /debug/voice
    - Add request/response type definitions
    - Add error handling and timeout configuration
    - Format request payload with audio and userId
    - Parse response for textResponse and audioUrl
    - _Requirements: 1.3, 4.4, 11.2, 11.3_

- [x] 17. Checkpoint - Ensure frontend tests pass





  - Ensure all tests pass, ask the user if questions arise.

- [x] 18. Add environment configuration





  - [x] 18.1 Configure environment variables


    - Create .env.example with all required variables
    - Document ELEVENLABS_API_KEY configuration
    - Document GOOGLE_CLOUD_PROJECT configuration
    - Document VERTEX_AI_LOCATION configuration
    - Document optional REDIS_URL configuration
    - Add environment variable validation on startup
    - _Requirements: All requirements depend on proper configuration_

- [x] 19. Create deployment configuration






  - [x] 19.1 Set up Cloud Run deployment

    - Create Dockerfile with Node.js 18 Alpine base
    - Configure build steps for frontend and backend
    - Set up .dockerignore file
    - Create cloud-run.yaml with resource configuration
    - Document deployment commands
    - Configure health check endpoint
    - _Requirements: All requirements depend on successful deployment_

- [x] 20. Add documentation






  - [x] 20.1 Create comprehensive README

    - Add project overview and tagline
    - Document tech stack and architecture
    - Add setup instructions for local development
    - Document environment variables
    - Add API documentation for /debug/voice endpoint
    - Include deployment instructions
    - Add demo video instructions
    - Include license information
    - _Requirements: Documentation supports all requirements_

- [ ] 21. Final checkpoint - End-to-end testing
  - Ensure all tests pass, ask the user if questions arise.

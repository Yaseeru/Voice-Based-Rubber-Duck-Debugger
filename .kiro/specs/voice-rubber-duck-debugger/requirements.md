# Requirements Document

## Introduction

The Voice-Based Rubber Duck Debugger is a voice-first AI-powered debugging assistant for developers. Users explain their software bugs or issues verbally, and the AI listens, reflects the logic, highlights contradictions, and suggests structured debugging steps. All interaction is voice-driven using ElevenLabs for speech-to-text and text-to-speech, with Google Vertex AI Gemini providing the reasoning engine.

## Glossary

- **System**: The Voice-Based Rubber Duck Debugger application
- **User**: A software developer using the debugging assistant
- **STT**: Speech-to-Text conversion service (ElevenLabs)
- **TTS**: Text-to-Speech conversion service (ElevenLabs)
- **Gemini**: Google Vertex AI's Gemini language model for AI reasoning
- **Session**: A multi-turn conversation context associated with a specific user
- **Audio Input**: Voice recording from the user explaining a bug
- **Debugging Response**: AI-generated structured feedback and debugging suggestions
- **Frontend**: React-based web interface for user interaction
- **Backend**: Node.js server handling API integrations and business logic

## Requirements

### Requirement 1

**User Story:** As a developer, I want to explain my bug verbally to the system, so that I can articulate my problem naturally without typing.

#### Acceptance Criteria

1. WHEN a user clicks the record button, THE System SHALL capture audio input from the user's microphone
2. WHEN audio recording is in progress, THE System SHALL display visual feedback indicating "Listening..."
3. WHEN a user stops recording, THE System SHALL send the audio data to the backend for processing
4. WHEN the audio file size exceeds 10MB, THE System SHALL reject the recording and notify the user
5. WHEN microphone access is denied, THE System SHALL display an error message requesting permission

### Requirement 2

**User Story:** As a developer, I want the system to convert my speech to text accurately, so that the AI can understand my bug explanation.

#### Acceptance Criteria

1. WHEN the backend receives audio data, THE System SHALL send the audio to ElevenLabs STT API for transcription
2. WHEN the STT API returns transcribed text, THE System SHALL store the text with the user's session context
3. IF the STT API fails on first attempt, THEN THE System SHALL retry the request once before returning an error
4. WHEN the STT API fails after retry, THE System SHALL return a fallback message to the user
5. WHEN transcription completes successfully, THE System SHALL log the transcribed text for debugging purposes

### Requirement 3

**User Story:** As a developer, I want the AI to reflect my explanation and highlight contradictions, so that I can identify logical flaws in my thinking.

#### Acceptance Criteria

1. WHEN transcribed text is received, THE System SHALL send the text with session context to Gemini for reasoning
2. WHEN generating a response, THE System SHALL use a system prompt that instructs Gemini to act as a rubber duck debugger
3. WHEN Gemini processes the input, THE System SHALL configure the model to generate responses with a maximum of 500 tokens
4. WHEN Gemini identifies contradictions in the user's explanation, THE System SHALL include those contradictions in the response
5. WHEN Gemini generates a response, THE System SHALL avoid providing immediate solutions and instead suggest structured debugging steps

### Requirement 4

**User Story:** As a developer, I want to hear the AI's response in natural speech, so that I can continue the voice-first interaction without reading.

#### Acceptance Criteria

1. WHEN Gemini returns a text response, THE System SHALL send the text to ElevenLabs TTS API for audio generation
2. WHEN the TTS API generates audio, THE System SHALL return the audio to the frontend for playback
3. IF the TTS API fails on first attempt, THEN THE System SHALL retry the request once before returning an error
4. WHEN audio generation completes, THE System SHALL provide both the audio URL and text response to the frontend
5. WHEN the frontend receives audio, THE System SHALL automatically play the audio response

### Requirement 5

**User Story:** As a developer, I want to have multi-turn conversations with the AI, so that I can ask follow-up questions and provide clarifications.

#### Acceptance Criteria

1. WHEN a user starts a debugging session, THE System SHALL create a unique session identifier for that user
2. WHEN processing a user's input, THE System SHALL retrieve the conversation history associated with the user's session
3. WHEN sending context to Gemini, THE System SHALL include previous conversation turns to maintain context
4. WHEN a new turn is completed, THE System SHALL append the input and output to the session's conversation history
5. WHEN a session exceeds 20 conversation turns, THE System SHALL maintain only the most recent 20 turns to manage context size

### Requirement 6

**User Story:** As a developer, I want to see visual feedback during processing, so that I understand what the system is doing at each stage.

#### Acceptance Criteria

1. WHEN audio is being recorded, THE System SHALL display "Listening..." status
2. WHEN audio is being processed by STT and Gemini, THE System SHALL display "AI Thinking..." status
3. WHEN audio response is being played, THE System SHALL display "Playing response..." status
4. WHEN processing is complete, THE System SHALL return to the ready state with the record button enabled
5. WHEN an error occurs, THE System SHALL display a clear error message describing the issue

### Requirement 7

**User Story:** As a developer, I want to optionally view the text of the AI's response, so that I can reference specific debugging steps without replaying audio.

#### Acceptance Criteria

1. WHEN the System receives a response from Gemini, THE System SHALL display the text response on the frontend
2. WHEN multiple responses are received, THE System SHALL display all responses in chronological order
3. WHEN the user scrolls through responses, THE System SHALL maintain the conversation history visible on screen
4. WHEN a new response is added, THE System SHALL automatically scroll to show the latest response
5. WHERE text display is enabled, THE System SHALL format the response text for readability

### Requirement 8

**User Story:** As a system administrator, I want comprehensive logging of all API interactions, so that I can debug issues and monitor system performance.

#### Acceptance Criteria

1. WHEN the System processes a request, THE System SHALL log the user ID and timestamp
2. WHEN STT transcription completes, THE System SHALL log the transcribed text
3. WHEN Gemini generates a response, THE System SHALL log the full response text
4. WHEN TTS audio generation completes, THE System SHALL log the success status
5. WHEN any API call fails, THE System SHALL log the error details including API name and error message

### Requirement 9

**User Story:** As a developer, I want the system to handle errors gracefully, so that temporary API failures don't disrupt my debugging session.

#### Acceptance Criteria

1. WHEN an API request times out after 10 seconds, THE System SHALL terminate the request and return an error
2. IF the Gemini API fails, THEN THE System SHALL return the fallback message "Sorry, I didn't fully understand, could you rephrase?"
3. WHEN a retry is attempted, THE System SHALL wait 1 second before making the retry request
4. WHEN both initial and retry requests fail, THE System SHALL notify the user with a specific error message
5. WHEN an error occurs, THE System SHALL preserve the session context for the next request

### Requirement 10

**User Story:** As a developer, I want a simple and focused user interface, so that I can concentrate on explaining my bug without distractions.

#### Acceptance Criteria

1. WHEN the user loads the application, THE System SHALL display a single page with a prominent record button
2. WHEN the interface is rendered, THE System SHALL use a minimalist layout focused on voice-first interaction
3. WHEN displaying the record button, THE System SHALL use a microphone emoji (🎙️) with "Explain Bug" label
4. WHEN the user interacts with the interface, THE System SHALL provide clear visual hierarchy with status messages
5. WHERE audio playback controls are shown, THE System SHALL integrate them seamlessly into the minimalist design

### Requirement 11

**User Story:** As a system operator, I want the backend to expose a single API endpoint for voice debugging, so that the frontend integration is straightforward.

#### Acceptance Criteria

1. WHEN the backend starts, THE System SHALL expose a POST endpoint at /debug/voice
2. WHEN the endpoint receives a request, THE System SHALL accept audio file data in base64 format and a userId parameter
3. WHEN processing completes successfully, THE System SHALL return a JSON response containing textResponse and audioUrl fields
4. WHEN the endpoint is called, THE System SHALL validate that both audio and userId are provided
5. IF required parameters are missing, THEN THE System SHALL return a 400 status code with an error message

### Requirement 12

**User Story:** As a developer, I want my conversation context to persist across multiple interactions, so that the AI remembers our discussion.

#### Acceptance Criteria

1. WHEN a session is created, THE System SHALL initialize an empty conversation array for that session
2. WHEN storing conversation data, THE System SHALL include both user input text and AI output text
3. WHEN retrieving session data, THE System SHALL return the complete conversation history in chronological order
4. WHEN a session is inactive for 1 hour, THE System SHALL remove the session data to free memory
5. WHERE Redis is configured, THE System SHALL use Redis for session storage instead of in-memory storage

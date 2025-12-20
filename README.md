# 🎙️ Voice-Based Rubber Duck Debugger

> **Talk through your bugs, think out loud, and let AI guide you to the solution.**

A voice-first AI-powered debugging assistant that helps developers debug their code through natural conversation. Explain your bugs verbally, and the AI will reflect your explanation, highlight contradictions, and suggest structured debugging steps — just like a rubber duck, but smarter.

## ✨ Features

- **Voice-First Interaction**: Speak naturally to explain your bugs — no typing required
- **AI-Powered Reasoning**: Google Vertex AI Gemini analyzes your explanation and guides debugging
- **Natural Speech Responses**: ElevenLabs TTS converts AI responses to natural speech
- **Multi-Turn Conversations**: Maintains context across follow-up questions
- **Real-Time Feedback**: Visual status indicators show system state at each step
- **Session Persistence**: Conversation history preserved for continuous debugging sessions

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         User Browser                                 │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐  ┌───────────┐ │
│  │   Audio     │  │   Status     │  │ Conversation│  │   Audio   │ │
│  │  Recorder   │  │   Display    │  │   Display   │  │   Player  │ │
│  └──────┬──────┘  └──────────────┘  └─────────────┘  └─────┬─────┘ │
└─────────┼──────────────────────────────────────────────────┼───────┘
          │ Audio (base64)                          Audio URL │
          ▼                                                   │
┌─────────────────────────────────────────────────────────────────────┐
│                    Node.js Backend (Express)                         │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    POST /debug/voice                         │   │
│  │  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐  │   │
│  │  │   STT   │───▶│ Session │───▶│ Gemini  │───▶│   TTS   │  │   │
│  │  │ Service │    │ Manager │    │ Service │    │ Service │  │   │
│  │  └────┬────┘    └────┬────┘    └────┬────┘    └────┬────┘  │   │
│  └───────┼──────────────┼──────────────┼──────────────┼────────┘   │
└──────────┼──────────────┼──────────────┼──────────────┼────────────┘
           │              │              │              │
           ▼              ▼              ▼              ▼
    ┌────────────┐  ┌──────────┐  ┌────────────┐  ┌────────────┐
    │ ElevenLabs │  │  Redis/  │  │ Vertex AI  │  │ ElevenLabs │
    │    STT     │  │  Memory  │  │   Gemini   │  │    TTS     │
    └────────────┘  └──────────┘  └────────────┘  └────────────┘
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, Vite |
| **Backend** | Node.js 18, Express, TypeScript |
| **AI Services** | Google Vertex AI Gemini, ElevenLabs STT/TTS |
| **Testing** | Jest, fast-check (Property-Based Testing) |
| **Deployment** | Docker, Google Cloud Run |
| **Session Storage** | In-Memory / Redis (optional) |

## 📁 Project Structure

```
voice-rubber-duck-debugger/
├── backend/                    # Node.js Express backend
│   ├── src/
│   │   ├── routes/            # API route handlers
│   │   │   └── debug.ts       # /debug/voice endpoint
│   │   ├── services/          # Business logic services
│   │   │   ├── gemini.ts      # Vertex AI Gemini integration
│   │   │   ├── stt.ts         # ElevenLabs Speech-to-Text
│   │   │   ├── tts.ts         # ElevenLabs Text-to-Speech
│   │   │   └── sessionManager.ts  # Session management
│   │   └── utils/             # Utility functions
│   │       ├── logger.ts      # Structured logging
│   │       └── envValidator.ts # Environment validation
│   ├── jest.config.js
│   ├── package.json
│   └── tsconfig.json
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── AudioRecorder.tsx
│   │   │   ├── AudioPlayer.tsx
│   │   │   ├── StatusDisplay.tsx
│   │   │   └── ConversationDisplay.tsx
│   │   ├── services/          # API client
│   │   │   └── apiClient.ts
│   │   ├── App.tsx            # Main application
│   │   └── main.tsx           # Entry point
│   ├── jest.config.cjs
│   ├── package.json
│   └── vite.config.ts
├── .kiro/specs/               # Feature specifications
├── Dockerfile                 # Multi-stage Docker build
├── cloud-run.yaml            # Cloud Run configuration
├── .env.example              # Environment template
└── package.json              # Root workspace configuration
```

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+** and npm
- **Google Cloud Project** with Vertex AI API enabled
- **ElevenLabs API Key** (optional, for voice responses)
- **Google Cloud CLI** (for deployment)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Yaseeru/Voice-Based-Rubber-Duck-Debugger.git
   cd Voice-Based Rubber Duck Debugger
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your API keys:
   ```env
   GOOGLE_CLOUD_PROJECT=your_gcp_project_id
   VERTEX_AI_LOCATION=us-central1
   ELEVENLABS_API_KEY=your_elevenlabs_api_key  # Optional
   ```

3. **Install dependencies**
   ```bash
   npm run install:all
   ```

4. **Start the backend** (Terminal 1)
   ```bash
   npm run dev:backend
   ```

5. **Start the frontend** (Terminal 2)
   ```bash
   npm run dev:frontend
   ```

6. **Open the application**
   
   Navigate to http://localhost:3000 in your browser

### Google Cloud Authentication

For local development with Vertex AI:

```bash
# Login to Google Cloud
gcloud auth login

# Set application default credentials
gcloud auth application-default login

# Set your project
gcloud config set project YOUR_PROJECT_ID
```

## ⚙️ Environment Variables

### Required Variables

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLOUD_PROJECT` | Your Google Cloud Project ID |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VERTEX_AI_LOCATION` | `us-central1` | Vertex AI region |
| `ELEVENLABS_API_KEY` | - | ElevenLabs API key for TTS |
| `REDIS_URL` | - | Redis URL for session storage |
| `PORT` | `8080` | Backend server port |
| `SESSION_TIMEOUT` | `3600000` | Session timeout (1 hour) |
| `FRONTEND_URL` | `http://localhost:3000` | Frontend URL for CORS |
| `VITE_API_URL` | `http://localhost:8080` | Backend URL for frontend |
| `NODE_ENV` | `development` | Environment mode |

See `.env.example` for detailed documentation of each variable.

## 📡 API Documentation

### POST /debug/voice

Submit audio for AI-powered debugging assistance.

#### Request

```http
POST /debug/voice
Content-Type: application/json

{
  "audio": "base64_encoded_audio_data",
  "userId": "unique_user_identifier"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `audio` | string | Yes | Base64-encoded audio data |
| `userId` | string | Yes | Unique identifier for the user session |

#### Success Response (200 OK)

```json
{
  "textResponse": "I hear you're experiencing an issue with your loop not terminating. Let me reflect back what I understood...",
  "audioUrl": "data:audio/mpeg;base64,..."
}
```

| Field | Type | Description |
|-------|------|-------------|
| `textResponse` | string | AI-generated debugging response |
| `audioUrl` | string | Base64 data URL of audio response (empty if TTS unavailable) |

#### Error Responses

**400 Bad Request** - Missing required parameters
```json
{
  "error": "ValidationError",
  "message": "Both audio and userId are required",
  "statusCode": 400
}
```

**503 Service Unavailable** - External API failure
```json
{
  "error": "ServiceUnavailable",
  "message": "STT API request failed after retry",
  "statusCode": 503
}
```

**504 Gateway Timeout** - Request timeout
```json
{
  "error": "TimeoutError",
  "message": "API request timed out after 10 seconds",
  "statusCode": 504
}
```

### GET /health

Health check endpoint for monitoring.

#### Response (200 OK)

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456
}
```

## 🧪 Testing

The project uses Jest for unit testing and fast-check for property-based testing.

```bash
# Run all tests
npm test

# Run backend tests only
npm run test:backend

# Run frontend tests only
npm run test:frontend

# Run tests with coverage
npm run test:backend -- --coverage
```

### Property-Based Tests

Property-based tests verify correctness properties across many random inputs:

- Session initialization and management
- Conversation history growth and limits
- Request validation
- Response structure completeness
- Chronological ordering of conversations

## 🏗️ Building

```bash
# Build both frontend and backend
npm run build

# Build Docker image
docker build -t voice-rubber-duck-debugger .

# Test Docker image locally
docker run -p 8080:8080 \
  -e GOOGLE_CLOUD_PROJECT=your_project \
  -e VERTEX_AI_LOCATION=us-central1 \
  voice-rubber-duck-debugger
```

## ☁️ Deployment

### Deploy to Google Cloud Run

1. **Enable required APIs**
   ```bash
   gcloud services enable \
     run.googleapis.com \
     cloudbuild.googleapis.com \
     secretmanager.googleapis.com \
     aiplatform.googleapis.com
   ```

2. **Store secrets** (if using ElevenLabs)
   ```bash
   echo -n "your-elevenlabs-api-key" | \
     gcloud secrets create elevenlabs-api-key --data-file=-
   ```

3. **Build and deploy**
   ```bash
   # Build and push image
   gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/voice-rubber-duck-debugger

   # Deploy to Cloud Run
   gcloud run deploy voice-rubber-duck-debugger \
     --image gcr.io/YOUR_PROJECT_ID/voice-rubber-duck-debugger \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --memory 1Gi \
     --set-env-vars "NODE_ENV=production,GOOGLE_CLOUD_PROJECT=YOUR_PROJECT_ID"
   ```

4. **Get service URL**
   ```bash
   gcloud run services describe voice-rubber-duck-debugger \
     --region us-central1 \
     --format 'value(status.url)'
   ```

### Using cloud-run.yaml

For subsequent deployments, edit `cloud-run.yaml` with your project ID and deploy:

```bash
gcloud run services replace cloud-run.yaml --region=us-central1
```

## 🎬 Demo Video

To create a demo video of the Voice-Based Rubber Duck Debugger:

### Recording Setup

1. **Screen Recording**: Use OBS Studio, Loom, or your OS's built-in screen recorder
2. **Audio**: Ensure your microphone is working and audio is being captured
3. **Browser**: Use Chrome or Firefox for best Web Audio API support

### Demo Script

1. **Introduction** (10 seconds)
   - Show the application landing page
   - Highlight the minimalist, voice-first interface

2. **First Interaction** (30 seconds)
   - Click the "🎙️ Explain Bug" button
   - Speak: "I have a function that's supposed to sort an array, but it's returning the wrong order. The array has numbers like 1, 10, 2, and it's sorting them as 1, 10, 2 instead of 1, 2, 10."
   - Wait for the AI response
   - Show the text response appearing
   - Listen to the audio response

3. **Follow-up Question** (20 seconds)
   - Click record again
   - Speak: "Oh, I think I see the issue. Am I comparing them as strings instead of numbers?"
   - Show how the AI maintains context from the previous turn

4. **Show Features** (20 seconds)
   - Point out the status indicators (Listening, Thinking, Playing)
   - Scroll through the conversation history
   - Show the text transcript

5. **Conclusion** (10 seconds)
   - Summarize the rubber duck debugging experience
   - Show the final conversation state

### Video Specifications

- **Resolution**: 1920x1080 (1080p) recommended
- **Format**: MP4 with H.264 codec
- **Length**: 60-90 seconds
- **Audio**: Clear microphone audio, system audio for TTS playback

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 Voice-Based Rubber Duck Debugger

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 🙏 Acknowledgments

- [ElevenLabs](https://elevenlabs.io/) for Speech-to-Text and Text-to-Speech APIs
- [Google Cloud Vertex AI](https://cloud.google.com/vertex-ai) for Gemini AI model
- The rubber duck debugging technique, a time-honored tradition in software development

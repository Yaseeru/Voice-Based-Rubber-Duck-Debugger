# Voice-Based Rubber Duck Debugger

A voice-first AI-powered debugging assistant for developers. Explain your bugs verbally and get structured debugging guidance through natural conversation.

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **AI Services**: 
  - ElevenLabs (Speech-to-Text & Text-to-Speech)
  - Google Vertex AI Gemini (AI Reasoning)
- **Testing**: Jest + fast-check (Property-Based Testing)
- **Deployment**: Google Cloud Run

## Project Structure

```
.
├── backend/          # Node.js Express backend
│   ├── src/         # TypeScript source files
│   └── package.json
├── frontend/        # React frontend
│   ├── src/         # React components
│   └── package.json
├── Dockerfile       # Multi-stage Docker build
└── package.json     # Root workspace configuration
```

## Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- ElevenLabs API key
- Google Cloud Project with Vertex AI enabled

### Local Development

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in your API keys
3. Install dependencies:
   ```bash
   npm run install:all
   ```

4. Start the backend:
   ```bash
   npm run dev:backend
   ```

5. Start the frontend (in a new terminal):
   ```bash
   npm run dev:frontend
   ```

6. Open http://localhost:3000

## Environment Variables

The application requires specific environment variables to function. All configuration is validated on startup with clear error messages.

### Required Variables

- **`ELEVENLABS_API_KEY`**: Your ElevenLabs API key for Speech-to-Text and Text-to-Speech
  - Get your key from: https://elevenlabs.io/app/settings/api-keys
  
- **`GOOGLE_CLOUD_PROJECT`**: Your Google Cloud Project ID with Vertex AI enabled
  - Find this in: https://console.cloud.google.com/

### Optional Variables (with defaults)

- **`VERTEX_AI_LOCATION`**: Vertex AI region (default: `us-central1`)
  - Common values: `us-central1`, `us-east1`, `europe-west1`, `asia-southeast1`
  
- **`REDIS_URL`**: Redis connection URL for session storage (optional)
  - If not provided, uses in-memory session storage
  - Format: `redis://[username:password@]host:port[/database]`
  - Example: `redis://localhost:6379`
  
- **`PORT`**: Server port (default: `8080`)
  - Required to be `8080` for Google Cloud Run
  
- **`SESSION_TIMEOUT`**: Session timeout in milliseconds (default: `3600000` = 1 hour)
  
- **`FRONTEND_URL`**: Frontend URL for CORS configuration (default: `http://localhost:3000`)
  - In production, set this to your frontend domain
  
- **`NODE_ENV`**: Environment mode (default: `development`)
  - Values: `development`, `production`, `test`
  
- **`VITE_API_URL`**: Backend API URL for frontend (default: `http://localhost:8080`)
  - In production, set this to your backend domain

### Configuration File

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

The application will validate all environment variables on startup and provide clear error messages if any required variables are missing or invalid.

## Testing

Run all tests:
```bash
npm test
```

Run backend tests only:
```bash
npm run test:backend
```

Run frontend tests only:
```bash
npm run test:frontend
```

## Building

Build both frontend and backend:
```bash
npm run build
```

## Deployment

### Docker Build

```bash
docker build -t voice-debugger .
```

### Deploy to Google Cloud Run

```bash
gcloud run deploy voice-debugger \
  --image gcr.io/PROJECT_ID/voice-debugger \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars ELEVENLABS_API_KEY=your_key,GOOGLE_CLOUD_PROJECT=your_project
```

## API Documentation

### POST /debug/voice

Submit audio for debugging assistance.

**Request:**
```json
{
  "audio": "base64_encoded_audio_data",
  "userId": "unique_user_identifier"
}
```

**Response:**
```json
{
  "textResponse": "AI debugging response text",
  "audioUrl": "url_to_generated_audio_file"
}
```

## License

MIT

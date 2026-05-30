# TECHNICAL DESIGN SPECIFICATION

Project:
Founder Falcon

Architecture:

Frontend:

* Next.js 15
* TypeScript
* Tailwind CSS
* shadcn/ui
* Framer Motion

Backend:

* Node.js
* Express.js

AI Layer:

* Gemini 2.5 Flash

Voice Layer:

* Murf Falcon Streaming API

Database:

* Supabase PostgreSQL

Deployment:

* Vercel
* Railway

System Flow:

User Voice
→ Speech Recognition API
→ Backend
→ Gemini
→ Founder Falcon Prompt
→ Murf Falcon
→ Audio Stream
→ Browser Playback

Core Modules:

1. Conversation Engine

Responsibilities:

* Session memory
* Context tracking
* Founder persona

2. Validation Engine

Responsibilities:

* Market analysis
* Problem validation
* Startup scoring

3. Document Generator

Outputs:

* PRD
* TDS
* Roadmap
* Pitch

4. Voice Engine

Responsibilities:

* Murf API integration
* Audio streaming
* Playback management

Database Schema:

users

* id
* email
* created_at

sessions

* id
* user_id
* startup_name
* created_at

messages

* id
* session_id
* role
* content

generated_documents

* id
* session_id
* type
* content

API Endpoints:

POST /chat

POST /generate/prd

POST /generate/tds

POST /generate/roadmap

POST /generate/pitch

Security:

* Environment variables
* API rate limiting
* HTTPS
* JWT authentication

MVP Timeline:

Hour 1–2:
UI

Hour 3–4:
Gemini Integration

Hour 5–6:
Murf Integration

Hour 7–8:
Document Generation

Hour 9:
Testing

Hour 10:
Demo Recording

Hour 11:
Video Editing

Hour 12:
Submission

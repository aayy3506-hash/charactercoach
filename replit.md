# Hanzi Practice - Chinese Character Learning App

## Overview

This is a mobile-first Chinese character learning application that allows users to:
- Upload images of Chinese vocabulary lists and extract characters using OCR (powered by OpenAI)
- Practice pronunciation with text-to-speech functionality
- Review and edit extracted characters before practice sessions
- Track practice history across sessions
- Configure practice settings (repeat count, speech rate, auto-advance, etc.)

The app follows a screen-based navigation pattern optimized for mobile devices, with a tab bar for main navigation between Practice, History, and Settings screens.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
  - Routes: `/practice`, `/history`, `/settings`, `/review`, `/session`
  - Tab bar navigation for main screens (hidden on sub-screens)
- **State Management**: Zustand with persistence middleware for settings and session history
- **Styling**: Custom CSS with CSS variables for theming (supports dark mode via `prefers-color-scheme`)
- **Storage**: Browser localStorage for settings and session history

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ES modules
- **Build Tool**: esbuild for production bundling, Vite for development
- **API Design**: RESTful endpoints under `/api/*` prefix

### Key Design Patterns
1. **Screen-Based UI**: Mobile-first design with dedicated screen components:
   - `PracticeScreen`: Image upload and camera capture for OCR
   - `ReviewScreen`: Word editing, deletion, and manual addition
   - `PracticeSessionScreen`: Audio playback with repeat count and auto-advance
   - `HistoryScreen`: Session management with localStorage persistence
   - `SettingsScreen`: Customization of playback and display settings
2. **Local-First Storage**: Practice settings and session history stored in browser localStorage via Zustand persist
3. **Speech Synthesis**: Browser's native Web Speech API for Chinese (zh-CN) text-to-speech pronunciation
4. **Session Storage**: Review and session params passed between routes via sessionStorage

## Key Files

### Frontend
- `client/src/App.tsx` - Main app with wouter routing
- `client/src/screens/*.tsx` - Screen components
- `client/src/lib/api.ts` - API client for OCR endpoint
- `client/src/lib/speech.ts` - Web Speech API wrapper
- `client/src/lib/storage.ts` - Zustand stores for settings and history
- `client/src/types.ts` - TypeScript interfaces

### Backend
- `server/routes.ts` - OCR endpoint using OpenAI Vision API
- `server/index.ts` - Express server setup

### Styles
- `client/src/styles/global.css` - CSS variables and base styles
- `client/src/styles/App.css` - App container and tab bar styles
- `client/src/screens/*.css` - Screen-specific styles

## External Dependencies

### AI Services
- **OpenAI API**: Used for OCR processing of Chinese character images
  - Configured via `AI_INTEGRATIONS_OPENAI_API_KEY` and `AI_INTEGRATIONS_OPENAI_BASE_URL` environment variables
  - Model: `gpt-4o` for vision capabilities
  - Endpoint: `POST /api/ocr` processes base64 images and returns character/pinyin/definition data

### Browser APIs
- **Web Speech API**: Native browser text-to-speech for Chinese pronunciation
  - Uses `zh-CN` language code for Chinese voices
  - Configurable speech rate (0.5x - 2.0x)

### Third-Party Libraries
- **Zustand**: Lightweight client state management with persistence
- **Wouter**: Lightweight React router
- **OpenAI SDK**: Server-side API client for Vision API

## Features

### Practice Settings
- **Repeat Count**: 1-5 times per character
- **Pause Duration**: 1-10 seconds between repeats
- **Speech Rate**: 0.5x - 2.0x speed
- **Auto-Advance**: Automatically move to next character after repeats
- **Auto-Play**: Start playback automatically when entering session
- **Show Pinyin/Definitions**: Toggle visibility during practice

### Session Management
- Sessions automatically saved to localStorage
- Up to 50 sessions stored
- Sessions can be renamed or deleted
- Shuffle mode for randomized practice order

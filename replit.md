# MindGrowth - AI-Powered Cognitive Reprogramming Platform

## Overview

MindGrowth is a mental health and personal development platform that uses AI-guided conversations to help users identify and transform limiting beliefs through structured reflection exercises called "Stacks." The application leverages Claude AI (Anthropic) with cognitive behavioral therapy (CBT) and NLP techniques to guide users through four types of reflective journeys: Gratitude, Idea, Discover, and Angry Stacks. Each Stack type follows a specific question flow designed around the CORE 4 framework (Mind, Body, Being, Balance) to facilitate deep personal insights and behavioral change.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript using Vite as the build tool

**UI Component Library**: Shadcn UI (Radix UI primitives) with custom Material Design 3 adaptations
- Design philosophy balances professional credibility with emotional warmth suitable for mental health applications
- Tailwind CSS for styling with custom color palette optimized for calm, supportive user experience
- Light/dark mode support with theme persistence

**State Management**:
- TanStack Query (React Query) for server state management and caching
- React Context for theme and UI preferences
- React Hook Form with Zod validation for form handling

**Routing**: Wouter (lightweight client-side routing)

**Key Pages**:
- Landing page (unauthenticated users)
- Dashboard (overview of Stack sessions and statistics)
- New Stack creation form (collects title, CORE 4 domain, subject entity)
- Stack Session chat interface (AI-guided conversation)
- History (browsable list of all Stack sessions)
- Settings (user profile and preferences)

### Backend Architecture

**Runtime**: Node.js with Express.js

**API Design**: RESTful endpoints with JSON responses
- `/api/auth/*` - Authentication routes
- `/api/stacks/*` - Stack session CRUD operations
- `/api/stacks/:sessionId/message` - Chat message handling

**AI Integration**: Anthropic Claude API (claude-sonnet-4-20250514)
- Custom system prompts for each Stack type (gratitude, idea, discover, angry)
- Implements CBT and NLP techniques in conversation flow
- Structured question progression based on predefined flows in schema

**Session Management**: Express sessions with PostgreSQL session store
- Session-based authentication
- 7-day session TTL with HTTP-only secure cookies

### Database Architecture

**ORM**: Drizzle ORM with PostgreSQL dialect

**Database Provider**: Neon (serverless PostgreSQL) via `@neondatabase/serverless`

**Schema Design**:

1. **Users Table** (`users`)
   - Stores user profile information from Replit Auth
   - Fields: id, email, firstName, lastName, profileImageUrl, timestamps

2. **Stack Sessions Table** (`stack_sessions`)
   - Tracks individual Stack reflection sessions
   - Fields: id, userId, title, stackType (enum), core4Domain (enum), subjectEntity, currentQuestionIndex, status (in_progress/completed), timestamps
   - Maintains conversation state and progress tracking

3. **Stack Messages Table** (`stack_messages`)
   - Stores conversation history for each Stack session
   - Fields: id, sessionId, role (user/assistant), content, questionIndex, timestamps
   - Enables conversation replay and analysis

4. **Sessions Table** (`sessions`)
   - PostgreSQL session storage for connect-pg-simple
   - Manages authentication session persistence

**Data Flow**:
- Form submission creates Stack session with initial metadata (questions 0-2 answered via form)
- Chat begins at question index 3
- Each user message triggers AI processing with context from previous messages
- AI responses include next question based on Stack type question flow
- Session completion marked when all questions answered

### Authentication & Authorization

**Provider**: Replit Auth (OpenID Connect)
- Passport.js strategy for OIDC integration
- User profile synchronization on each login
- Protected routes require authentication middleware

**Authorization Pattern**:
- User ID from session claims (`req.user.claims.sub`)
- Row-level ownership validation (userId foreign keys)
- Middleware: `isAuthenticated` guard on all protected routes

### External Dependencies

**AI Services**:
- Anthropic Claude API (`@anthropic-ai/sdk`)
  - Model: claude-sonnet-4-20250514
  - Streaming responses not implemented (uses standard completion)
  - Custom system prompts per Stack type with therapeutic techniques

**Database**:
- Neon Serverless PostgreSQL
  - Connection via `DATABASE_URL` environment variable
  - WebSocket support for serverless environment
  - Drizzle ORM for type-safe queries

**Authentication**:
- Replit OIDC Provider
  - Discovery endpoint: `process.env.ISSUER_URL` or https://replit.com/oidc
  - Client ID: `process.env.REPL_ID`
  - Session secret: `process.env.SESSION_SECRET`

**UI Components**:
- Radix UI primitives (full suite: dialog, dropdown, popover, etc.)
- Lucide React icons
- Inter and JetBrains Mono fonts (Google Fonts)

**Development Tools**:
- Vite plugins for Replit integration (@replit/vite-plugin-cartographer, dev-banner)
- Runtime error overlay for development
- TSX for TypeScript execution in development

**Key Environment Variables**:
- `DATABASE_URL` - Neon PostgreSQL connection string
- `ANTHROPIC_API_KEY` - Claude AI API key
- `REPL_ID` - Replit application identifier
- `ISSUER_URL` - OIDC issuer endpoint
- `SESSION_SECRET` - Express session encryption key
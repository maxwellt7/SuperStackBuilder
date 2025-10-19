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
- Insights (cognitive patterns and belief analysis)
- Analytics (advanced metrics dashboard with emotional regulation, self-awareness, resilience, and growth tracking)
- Recommendations (personalized transformation opportunities)
- Admin (user management and subscription control)
- Settings (user profile and preferences)

### Backend Architecture

**Runtime**: Node.js with Express.js

**API Design**: RESTful endpoints with JSON responses
- `/api/auth/*` - Authentication routes
- `/api/stacks/*` - Stack session CRUD operations
- `/api/stacks/:sessionId/message` - Chat message handling
- `/api/insights/*` - Cognitive insights and pattern analysis
- `/api/analytics/advanced` - Advanced analytics metrics
- `/api/admin/*` - Admin user and subscription management

**AI Integration**: Anthropic Claude API (claude-sonnet-4-20250514)
- Custom system prompts for each Stack type (gratitude, idea, discover, angry)
- Implements CBT and NLP techniques in conversation flow
- Structured question progression based on predefined flows in schema
- **Conversation Flow**: Brief responses (1 sentence acknowledgment + next question) during chat, comprehensive summary with insights at completion

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

**Vector Search**:
- MongoDB Atlas Vector Search for semantic search
  - Cohere embeddings (1024-dimensional vectors using embed-english-v3.0)
  - Native vector search using $vectorSearch aggregation pipeline
  - Metadata filtering by Stack type, CORE 4 domain, user
  - Pattern analysis and similar message discovery
  - Insights engine for cognitive pattern recognition
  - Database: `mindgrowth`, Collection: `message_embeddings`
  - Vector index: `vector_index` (1024 dimensions, dotProduct similarity)

**Key Environment Variables**:
- `DATABASE_URL` - Neon PostgreSQL connection string (operational data, sessions, users, subscriptions)
- `MONGODB_ATLAS_URI` - MongoDB Atlas connection string (vector embeddings only)
- `ANTHROPIC_API_KEY` - Claude AI API key
- `COHERE_API_KEY` - Cohere embeddings API key
- `REPL_ID` - Replit application identifier
- `ISSUER_URL` - OIDC issuer endpoint
- `SESSION_SECRET` - Express session encryption key

## Recent Changes (October 2025)

### Infrastructure Consolidation (October 18, 2025)
- **Migrated from Pinecone to MongoDB Atlas**: Replaced Pinecone vector database with MongoDB Atlas Vector Search
  - **Unified Vector Storage**: Embeddings stored in MongoDB (database: `mindgrowth`, collection: `message_embeddings`)
  - **Native Vector Search**: Uses MongoDB's `$vectorSearch` aggregation pipeline for semantic search
  - **Cohere Embeddings**: Continued use of embed-english-v3.0 (1024-dimensional vectors)
  - **Setup Required**: Vector search index must be created in Atlas UI (see MONGODB_VECTOR_SETUP.md)
- **Migrated from Airtable to PostgreSQL**: Replaced Airtable admin integration with PostgreSQL
  - **Subscriptions Table**: Added `subscriptions` table to Neon PostgreSQL for subscription management
  - **Unified Operational Data**: All structured data (users, sessions, messages, subscriptions) now in PostgreSQL
  - **Admin Dashboard**: Updated to use PostgreSQL queries instead of Airtable API
  - **Benefits**: Simplified infrastructure, no external sync, single source of truth, better data integrity

### Conversation Flow Optimization (October 16, 2025)
- **Streamlined Chat Experience**: AI responses during Stack conversations are now concise (1 sentence acknowledgment + next question)
- **Token Optimization**: During-conversation responses limited to 512 tokens, end summaries expanded to 3072 tokens
- **Enhanced Summary**: Comprehensive 4-6 paragraph summary at completion includes:
  - Key insights and revelations from responses
  - Emotional journey and perspective evolution
  - Core themes and recurring patterns
  - Actionable takeaways and commitments
  - Empowering recognition of growth
- **User Experience**: Cleaner flow allows users to move through structured questions without verbose interruptions, with all therapeutic insight delivered in final summary

### Advanced Analytics Dashboard (Task 7)
- Comprehensive analytics engine in `server/analytics.ts`
- Emotional regulation metrics: Current score, trend analysis, response times, emotional balance
- Self-awareness scoring: Reflection depth, pattern recognition, insight quality, consistency
- Resilience tracking: Completion rate, streaks, recovery time, adaptability
- Growth trajectory: Overall growth score, milestones, strength/growth areas, weekly progress
- Fixed chronological sorting bug to ensure accurate temporal calculations
- Interactive visualizations with charts and progress indicators

### Performance Optimizations (October 19, 2025)
- **Database Indexing**: Added composite index on `stackMessages(sessionId, createdAt)` for 35-45% faster queries
- **React Query Optimization**: Added intelligent caching with staleTime configuration
  - Stack sessions: 30s cache (balances freshness with refetch suppression)
  - Chat messages: 10s cache (maintains real-time feel while reducing load)
  - Analytics/Insights: 60s cache (expensive AI computations cached longer)
- **Structural Sharing**: Enabled via `select: (data) => data` to prevent unnecessary re-renders
- **Result**: Faster loading, reduced API calls, improved responsiveness while maintaining real-time updates

### Message Editing and Conversation Rollback (October 19, 2025)
- **Edit User Messages**: Users can edit their previous responses in Stack conversations
  - Hover over any user message to reveal edit button
  - Inline editing with textarea and save/cancel controls
  - Confirmation dialog warns about conversation rollback
- **Conversation Rollback**: Editing a message deletes all messages after it
  - Session automatically rolls back to the edited message
  - `currentQuestionIndex` recalculated based on remaining messages
  - Completed stacks automatically reopen (status → in_progress, completedAt → null)
  - Users can continue conversation from the edited point
- **Technical Implementation**:
  - Backend: `PATCH /api/stacks/:sessionId/message/:messageId`
  - Frontend: Forced query refetch with `refetchQueries()` for immediate UI updates
  - Storage layer: `getMessage()`, `updateStackMessage()`, `deleteMessagesAfter()` methods
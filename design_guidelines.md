# MindGrowth Superstack - Design Guidelines

## Design Approach

**Selected Framework**: Material Design 3 foundation with custom mental health-focused adaptations

**Rationale**: Mental health platforms require a balance of professional credibility and emotional warmth. Material Design 3 provides excellent accessibility patterns, state management, and component consistency while allowing customization for the therapeutic context. The design prioritizes calm, focus, and trust.

**Core Design Principles**:
1. **Calm Confidence**: Visual design should feel safe, professional, and emotionally supportive
2. **Conversational Clarity**: The AI chat experience is central - minimize distractions
3. **Progress Transparency**: Users should clearly see their journey and growth
4. **Respectful Minimalism**: Every element serves the user's mental growth

---

## Color Palette

### Light Mode
**Primary Colors**: 
- Primary: 240 45% 50% (Calming blue-purple, trust and wisdom)
- Primary Variant: 240 50% 60% (Lighter for hover states)

**Accent Colors**:
- Gratitude: 150 40% 45% (Soft teal-green, growth and appreciation)
- Idea: 45 65% 55% (Warm amber, creativity and energy)  
- Discover: 200 50% 50% (Sky blue, exploration and clarity)
- Angry: 10 60% 50% (Muted red-orange, contained intensity)

**Neutral Palette**:
- Background: 0 0% 98%
- Surface: 0 0% 100%
- Surface Variant: 240 10% 95%
- Text Primary: 240 10% 15%
- Text Secondary: 240 5% 45%
- Border: 240 8% 85%

### Dark Mode
**Primary Colors**:
- Primary: 240 50% 65%
- Primary Variant: 240 45% 55%

**Accent Colors**: Same hues, adjusted lightness to 60-65% for dark backgrounds

**Neutral Palette**:
- Background: 240 8% 8%
- Surface: 240 8% 12%
- Surface Variant: 240 8% 16%
- Text Primary: 240 5% 95%
- Text Secondary: 240 5% 70%
- Border: 240 8% 22%

---

## Typography

**Font Family**: 
- Primary: Inter (Google Fonts) - Clean, highly legible, professional
- Monospace: JetBrains Mono (for timestamps, data)

**Type Scale**:
- Display: 3rem (48px), weight 600, line-height 1.1 - Hero headlines
- H1: 2rem (32px), weight 600, line-height 1.2 - Page titles
- H2: 1.5rem (24px), weight 600, line-height 1.3 - Section headers
- H3: 1.25rem (20px), weight 600, line-height 1.4 - Component headers
- Body Large: 1.125rem (18px), weight 400, line-height 1.6 - Chat messages
- Body: 1rem (16px), weight 400, line-height 1.6 - Default text
- Body Small: 0.875rem (14px), weight 400, line-height 1.5 - Labels, captions
- Caption: 0.75rem (12px), weight 500, line-height 1.4 - Timestamps, metadata

---

## Layout System

**Spacing Primitives**: Use Tailwind units of 2, 4, 6, 8, 12, 16, 20, 24, 32 exclusively

**Container Strategy**:
- Max-width: 1400px for dashboard views
- Max-width: 900px for chat interface (optimal reading/conversation width)
- Max-width: 600px for forms and onboarding

**Grid System**:
- Dashboard: 12-column grid (grid-cols-12) for insights and analytics
- Chat: Single column, centered
- History: 2-column on desktop (lg:grid-cols-2), single on mobile

---

## Component Library

### Navigation
**Header**: 
- Fixed top navigation with backdrop blur (backdrop-blur-md bg-background/80)
- Logo left, user profile right
- Height: h-16
- Border bottom: border-b border-border

**Sidebar** (Dashboard only):
- Width: w-64
- Stack type quick navigation with accent color indicators
- Collapsible on mobile (drawer)

### Chat Components

**Chat Container**:
- Centered column, max-w-3xl
- Full viewport height minus header (h-[calc(100vh-4rem)])
- Split into message area and input area

**Message Bubbles**:
- User messages: Right-aligned, primary color background, white text, rounded-2xl
- AI messages: Left-aligned, surface variant background, text primary, rounded-2xl
- Padding: p-4
- Max-width: max-w-lg for readability
- Spacing between messages: space-y-4

**Question Cards** (Structured Stack questions):
- Surface background with subtle border
- Numbered indicator (1/15, 2/15, etc.) in caption text
- Question text in Body Large
- Generous padding: p-6
- Rounded: rounded-xl
- Shadow: shadow-sm

**Input Area**:
- Fixed bottom, full width
- Backdrop blur background
- Textarea with auto-resize (max 5 rows)
- Send button with primary color
- Character count (subtle, caption text)

### Dashboard Components

**Insight Cards**:
- Surface background, rounded-lg, shadow-sm
- Header with icon and title (H3)
- Metric value (Display size for numbers)
- Trend indicator (subtle up/down arrows)
- Padding: p-6

**Progress Chart**:
- Line chart for growth metrics over time
- Soft, rounded lines (stroke-linecap: round)
- Accent colors for different metrics
- Gridlines in border color
- Tooltip on hover with specific values

**Session List Items**:
- Stack type color indicator (left border, border-l-4)
- Title (H3) and date (Caption)
- Preview text (Body Small, 2 lines, truncated)
- Hover state: slight elevation (shadow-md)

### Forms

**Input Fields**:
- Border: 2px solid border color
- Rounded: rounded-lg
- Focus: ring-2 ring-primary
- Padding: p-3
- Labels above fields (Body Small, weight 500)

**Buttons**:
- Primary: bg-primary text-white, rounded-lg, px-6 py-3
- Secondary: border-2 border-primary text-primary
- Ghost: text-primary hover:bg-surface-variant
- Disabled state: opacity-50, cursor-not-allowed

### Overlays

**Modal**:
- Centered, max-w-lg
- Background: surface
- Backdrop: backdrop-blur-sm bg-black/50
- Rounded: rounded-xl
- Padding: p-8
- Close button top-right

**Toast Notifications**:
- Bottom-right position
- Success: Gratitude accent color
- Error: Angry accent color  
- Info: Primary color
- Auto-dismiss: 4 seconds

---

## Animations

**Principles**: Minimal and purposeful only - this is a calm, focused environment

**Allowed Animations**:
- Message appearance: Gentle fade-in from bottom (duration-300)
- AI typing indicator: Subtle pulse animation
- Page transitions: Simple fade (duration-200)
- Hover states: Scale 1.02, duration-150

**Prohibited**:
- Flashy hero animations
- Parallax effects
- Confetti or celebration effects (distracting in therapy context)
- Auto-playing videos

---

## Images

**Hero Section** (Landing/Marketing page only):
- Large hero image showing serene, mindful environment (meditation space, calm nature, or abstract peaceful visuals)
- Image placement: Full-width, h-[600px], with gradient overlay (from-background/60 to-background/90)
- Text overlaid on right or left third
- Image style: Soft focus, calming tones, human-centered

**Dashboard**: No decorative images - focus on data and functionality

**Onboarding**: Simple abstract illustrations (not photographs) for each Stack type explanation

**Empty States**: Friendly line-art illustrations (minimalist style)

---

## Page-Specific Guidelines

### Landing Page
- Hero: Large image with centered headline, primary CTA
- Features: 3-column grid showcasing 4 Stack types with accent color icons
- How It Works: 3-step process, horizontal layout
- Testimonials: 2-column cards with user quotes
- CTA section: Centered, simple, gradient background (primary color, subtle)

### Chat Interface  
- Clean, distraction-free
- Stack type indicated by top bar with accent color
- Progress indicator (Question 3 of 15) always visible
- Previous messages scrollable above current question
- Input area pinned to bottom

### Dashboard
- Grid layout: 4 metric cards at top (Today's Mood, Streak, Total Stacks, Insights)
- Recent sessions below in 2-column grid
- Quick action buttons for each Stack type (large, prominent, accent colors)

### History
- Filterable by Stack type (tabs with accent colors)
- Search bar at top
- List view with Stack type indicators
- Click to expand full transcript in modal

### Settings
- Simple form layout, single column
- Grouped sections (Profile, Preferences, Privacy, Subscription)
- Toggle switches for preferences (dark mode, notifications, etc.)
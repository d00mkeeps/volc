# Volc Landing Page - Implementation Brief

## 1. Project Overview

### Purpose
Create a premium, conversion-focused landing page for Volc, an AI fitness coaching iOS app targeting fitness beginners who want personalized guidance without the cost of a personal trainer.

### Primary Goals
- Drive App Store downloads
- Clearly communicate value proposition and differentiation
- Build credibility and interest in the product
- Establish premium brand presence
- Foundation for future web expansion

### Target Audience
- Fitness beginners
- People who want PT-level guidance without the cost
- Users looking for personalized plans that fit their lifestyle
- Individuals who've struggled with generic fitness apps

### Tone & Feel
- **Premium** - sophisticated, high-quality
- **Approachable** - not intimidating for beginners
- **Confident** - without being aggressive
- **Modern** - clean, contemporary design

---

## 2. Design System

### Color Palette
Based on existing Tamagui app configuration:

**Primary Colors:**
- Primary: `#f84f3e` (coral red-orange)
- Primary Light: `#f86b5c`
- Primary Muted: `#d4412f`
- Primary Tint: `#fef7f6` (light mode) / `#2b1f1e` (dark mode)

**Neutral Colors:**
- Black: `#231f20`
- White: `#ffffff`

**Theme-Specific:**

*Dark Mode (Primary):*
- Background: `#231f20`
- Background Soft: `#2a2629`
- Background Muted: `#1a1718`
- Text: `#ffffff`
- Text Soft: `#b0abac`
- Text Muted: `#6b6466`
- Border: `rgba(255, 255, 255, 0.1)`

*Light Mode (Secondary):*
- Background: `#ffffff`
- Background Soft: `#f5f4f4`
- Background Muted: `#ebebeb`
- Text: `#231f20`
- Text Soft: `#6b6466`
- Text Muted: `#999999`
- Border: `#e5e5e5`

### Typography
- System fonts (iOS/macOS feel)
- Font sizes: 12px, 14px, 16px, 18px, 20px, 24px, 28px, 32px
- Hierarchy: Clear distinction between headlines, subheads, body

### Spacing Scale
Based on Tamagui tokens (4px base unit):
- 1: 4px
- 2: 8px
- 3: 12px
- 4: 16px
- 5: 20px
- 6: 24px
- 7: 30px
- 8: 36px
- 9: 42px
- 10: 50px

### Border Radius
- Small: 3px
- Medium: 5px
- Large: 7-9px

### Design Approach
- **Dark mode first** - matches app aesthetic, feels premium
- Clean, minimal, breathing room
- Strategic use of primary coral color for CTAs and accents
- App screenshots prominently featured
- Modern, contemporary layout

---

## 3. Page Structure

### Navigation (Fixed Top)
**Layout:**
- Logo (Volc icon + wordmark) - left
- Download on App Store button - right
- Dark background with subtle transparency/blur

**Behavior:**
- Sticky/fixed on scroll
- Minimal height (56-64px)
- Download button always accessible

---

### Section 1: Hero
**Layout:**
- Full viewport height
- Two-column layout on desktop, stacked on mobile
- Left: Content / Right: App mockup

**Content - Left Column:**
- **Headline:** "Fitness reimagined"
  - Large, bold typography (32-48px)
  - Primary text color
- **Subheadline:** [Placeholder: Brief expansion on personalized AI coaching that fits your lifestyle]
  - Medium typography (18-20px)
  - Softer text color
  - 1-2 sentences max
- **Primary CTA:** Download on App Store badge
  - Official Apple badge
  - Prominent placement
  - Primary coral color highlight/glow effect
- **Secondary info:** [Placeholder: "iOS only • Free to download"]
  - Small, muted text

**Visual - Right Column:**
- iPhone mockup showing app home screen
- Use the welcome screen screenshot with radar chart
- Subtle shadow/glow effect
- Possibly slight tilt for dynamism

**Background:**
- Dark (`#231f20`)
- Subtle gradient or texture
- Maybe abstract fitness-related shapes in background (very subtle)

---

### Section 2: Problem/Solution
**Layout:**
- Centered content, max-width container
- Clean, simple text-focused section

**Content:**
- **Small eyebrow text:** [Placeholder: "The Problem"]
- **Headline:** [Placeholder: Statement about the frustration of generic fitness plans or expensive PTs]
  - 24-32px typography
- **Body copy:** [Placeholder: 2-3 sentences expanding on how most solutions don't fit real life]
- **Transition statement:** [Placeholder: "That's where Volc comes in"]

**Visual Treatment:**
- Light background section (`#2a2629` or similar)
- Creates contrast with dark hero
- Breathing room, generous padding

---

### Section 3: Key Features
**Layout:**
- Three or four feature cards
- Grid layout (2x2 on desktop, stacked on mobile)
- Each card is equal size

**Feature Card Structure:**
Each card contains:
- Icon or small visual (coral accent color)
- Feature title (18-20px, bold)
- Feature description (14-16px)
- 2-3 sentences explaining the benefit

**Suggested Features:**
1. **Personalized Plans**
   - [Placeholder: Description of how AI creates custom workout plans based on user's schedule, goals, and experience level]
   
2. **Real-Time Coaching**
   - [Placeholder: Description of AI coach that guides through workouts, suggests adjustments, provides feedback]
   - Could reference the chat interface
   
3. **Progress Tracking**
   - [Placeholder: Description of how Volc tracks progress across muscle groups and adjusts plans accordingly]
   - Could reference the radar chart visualization
   
4. **Flexible & Adaptive**
   - [Placeholder: Description of how plans adapt to life changes, missed workouts, or changing goals]

**Visual Treatment:**
- Dark background (`#231f20`)
- Cards have subtle background (`#2a2629`)
- Hover states with slight elevation/glow
- Icons use primary coral color

---

### Section 4: How It Works
**Layout:**
- Horizontal timeline or vertical steps
- Three steps maximum (keep it simple)
- Each step shows progression

**Steps:**
1. **[Step 1 Title]**
   - [Placeholder: Brief description of onboarding/goal setting]
   - Small screenshot or illustration
   
2. **[Step 2 Title]**
   - [Placeholder: Brief description of getting personalized plan]
   - Small screenshot or illustration
   
3. **[Step 3 Title]**
   - [Placeholder: Brief description of working out with AI guidance]
   - Small screenshot or illustration

**Visual Treatment:**
- Light background section (creates rhythm with alternating sections)
- Connection lines between steps (coral color)
- Screenshots from actual app where relevant

---

### Section 5: App Showcase
**Layout:**
- Full-width or wide section
- Multiple app screenshots in sequence
- Horizontal scroll or arranged grid

**Screenshots to Feature:**
- Home screen with radar chart (already have)
- Workout in progress screen (already have)
- Chat interface (need this)
- Any other key screens that demonstrate value

**Visual Treatment:**
- Dark background
- iPhone mockups with subtle shadows
- Captions under each screenshot explaining what user is seeing
- Generous spacing between mockups

---

### Section 6: Social Proof (Placeholder)
**Note:** Skip for initial implementation, design to accommodate later

**Future Structure:**
- 2-3 testimonial cards
- User quote, name (optional photo)
- Star rating or metric
- Grid or carousel layout

**Placeholder Treatment:**
- Leave space in layout
- Comment in code for easy addition later
- OR implement with placeholder testimonials that can be swapped

---

### Section 7: Final CTA
**Layout:**
- Centered, focused section
- Simple, direct call to action

**Content:**
- **Headline:** [Placeholder: Direct CTA like "Ready to reach your fitness goals?"]
  - 28-36px typography
  - Centered
- **Subheadline:** [Placeholder: One sentence reinforcement]
  - Softer text
- **CTA Button:** Download on App Store
  - Large, prominent
  - Primary coral color
  - Centered

**Visual Treatment:**
- Can be dark or light background
- Generous padding top/bottom
- Could have subtle accent elements

---

### Footer
**Layout:**
- Simple, minimal footer
- Dark background (`#1a1718` or darker)

**Content:**
- Left: Volc logo/wordmark
- Center: Links
  - Privacy Policy
  - Terms of Service
  - Contact
- Right: Social media icons (if applicable)
- Bottom: Copyright © 2025 Volc

**Visual Treatment:**
- Muted text colors
- Small typography (12-14px)
- Subtle borders or dividers
- Compact height

---

## 4. Technical Specifications

### Framework & Tools
- **Next.js 14+** (App Router)
- **TypeScript**
- **Tailwind CSS** for styling
- **Shadcn/ui** for component primitives
- **Railway** for deployment

### Key Dependencies
```json
{
  "next": "^14.0.0",
  "react": "^18.0.0",
  "tailwindcss": "^3.0.0",
  "@radix-ui/react-*": "latest",
  "class-variance-authority": "latest",
  "clsx": "latest",
  "tailwind-merge": "latest"
}
```

### Project Structure
```
/app
  /page.tsx          # Main landing page
  /layout.tsx        # Root layout
  /globals.css       # Global styles
/components
  /ui                # Shadcn components
  /sections          # Page sections (Hero, Features, etc.)
  /Navigation.tsx
  /Footer.tsx
/public
  /images            # Screenshots, logo, icons
  /fonts             # If custom fonts needed
/lib
  /utils.ts          # Utility functions
```

### Responsive Breakpoints
Following Tamagui config:
- xs: max-width 660px (Mobile)
- sm: min-width 661px (Tablet+)
- Additional Tailwind breakpoints as needed

### Performance Considerations
- Optimize images (WebP format, multiple sizes)
- Lazy load below-the-fold content
- Minimal JavaScript for static landing page
- Fast initial load critical for conversions

### SEO Requirements
- Semantic HTML structure
- Meta tags (title, description, OG tags)
- Structured data for app
- Mobile-first responsive design
- Fast Core Web Vitals

### Deployment
- Railway for hosting
- Custom domain from Namecheap (DNS update only)
- Environment variables for any dynamic content
- CI/CD through Railway's GitHub integration

---

## 5. Assets & Content

### Assets Currently Available
- ✅ App icon/logo (volcicon2.png)
- ✅ Tamagui color configuration
- ✅ Screenshot: Home screen with radar chart
- ✅ Screenshot: Workout in progress screen

### Assets Needed
- ⏳ Chat interface screenshot (mentioned as important)
- ⏳ Any additional key app screens
- ⏳ Apple App Store badge (official download)
- ⏳ Favicon (can derive from app icon)

### Content Needed (Placeholders in Brief)
- ⏳ Hero subheadline copy
- ⏳ Problem/solution section copy
- ⏳ Feature descriptions (4 features)
- ⏳ How it works step descriptions
- ⏳ Final CTA copy
- ⏳ Any microcopy (nav, footer links, etc.)
- ⏳ Privacy Policy & Terms of Service URLs

### App Store Information
- App name: Volc
- Platform: iOS only
- Status: Live (v1.4 in review)
- Pricing: Free to download (payments not yet enabled)
- App Store URL: [To be added when available]

---

## 6. Implementation Notes

### Phase 1: Foundation
1. Set up Next.js project with TypeScript
2. Configure Tailwind with custom colors from Tamagui
3. Install and configure Shadcn/ui
4. Create basic layout and navigation
5. Set up responsive breakpoints

### Phase 2: Core Sections
1. Build Hero section with placeholder content
2. Implement Problem/Solution section
3. Create Feature cards grid
4. Build How It Works section
5. Add App Showcase with image gallery

### Phase 3: Polish
1. Add Final CTA section
2. Build Footer
3. Implement smooth scroll behavior
4. Add hover states and micro-interactions
5. Optimize images and performance

### Phase 4: Content & Review
1. Replace all placeholder content
2. Add actual screenshots
3. Test responsive behavior
4. Review copy and messaging
5. SEO optimization

### Phase 5: Deployment
1. Deploy to Railway
2. Update Namecheap DNS records
3. Test production site
4. Monitor analytics setup (future)

---

## 7. Design Principles for Implementation

### Do's
- ✅ Embrace negative space - let content breathe
- ✅ Use primary coral color sparingly for maximum impact
- ✅ Show actual app screenshots prominently
- ✅ Keep copy concise and benefit-focused
- ✅ Maintain dark aesthetic throughout
- ✅ Ensure fast loading times
- ✅ Make CTAs obvious and accessible

### Don'ts
- ❌ Overuse bright colors - stay minimal
- ❌ Include too much text - keep it scannable
- ❌ Use stock photos of gym people - focus on the app
- ❌ Add unnecessary animations - keep it clean
- ❌ Hide download buttons - always visible
- ❌ Make promises the app can't deliver
- ❌ Overwhelm beginners with technical jargon

---

## 8. Success Metrics (Future)

While not implementing analytics initially, consider these for future optimization:
- Click-through rate to App Store
- Time on page
- Scroll depth
- Mobile vs desktop traffic
- Traffic sources (for marketing campaign tracking)

---

## 9. Future Enhancements

Ideas for post-launch iteration:
- Email capture for marketing campaigns
- Blog section for content marketing
- Testimonials section with real user quotes
- Video demo or explainer
- Comparison table vs competitors
- FAQ section
- Press/media mentions
- Founder's discount promotion (when payments enabled)

---

## Version History
- v1.0 - Initial brief (November 2025)
- Next: Implementation and content finalization
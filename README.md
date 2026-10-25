# DevRelOS — AI-Powered Developer Relations Platform

DevRelOS is a modern, full-stack operating system for Developer Relations teams, developer advocates, open-source maintainers, and developer marketing leads. It streamlines ecosystem research, campaign strategy generation, technical content drafting, community events, and outreach pipelines in a unified workspace.

---

## 🚀 Features

1. **Executive Command Dashboard (Overview)**
   - Productivity summaries, active campaigns, events, and community pipeline counts.
   - Interactive Recharts telemetry: developer reach, SDK clones, and channel engagement distribution.
   - Live stream of autonomous agent background activities and upcoming event deadlines.

2. **AI Campaign Builder (Core Feature)**
   - Comprehensive campaign wizard: configure technology, target developer personas, objectives, duration, budget, and channels.
   - Automated generation of structured campaigns across 5 tabs:
     - **Overview**: Narrative pillars, differentiators, and target channels.
     - **Strategy**: Developer personas, pain points, watering holes, elevator pitch, and proof points.
     - **Content**: Scheduled multi-channel calendar, tutorial curricula, and ready-to-use social copy.
     - **Tasks**: Interactive execution checklist with assignee and completion tracking.
     - **Results**: Live KPI progress bars and conversion analysis.
   - Full CRUD: Create, duplicate, edit, filter, and delete campaigns.

3. **Research Lab**
   - In-depth ecosystem research with depth selectors (*Quick Brief*, *Deep Ecosystem Analysis*, *Competitive Landscape*, *Technical Benchmark*).
   - Findings organized into architectural themes with citations and benchmark references.
   - Actionable takeaways and one-click "Save to Campaign" linking.

4. **Content Studio**
   - 8 content format generators: Technical Tutorials, LinkedIn Posts, X Posts & Threads, Product Launches, Developer Documentation, Blog Articles, Workshop Outlines, and Event Descriptions.
   - Interactive Markdown editor with live preview toggle.
   - AI revision shortcuts (*Make Concise*, *+ Benchmark Code*, custom revision prompts).
   - Instant copy-to-clipboard and draft management.

5. **Events & Community**
   - Meetups, workshops, hackathons, and conferences management.
   - Dual List and Timeline/Roadmap views.
   - Built-in multi-session agenda builder with speaker tracking.
   - Pre-event task checklist and promotional copy drafts.
   - Post-event AI recap generator.

6. **Outreach & Pipeline**
   - CRM for speakers, conference sponsors, community champions, and OSS maintainers.
   - Status pipeline tracking (*Lead*, *Contacted*, *In Discussion*, *Confirmed*, *Declined*).
   - Automated personalized email pitch drafting with custom talk angles and follow-up tracking.

7. **Analytics & Telemetry**
   - Interactive Recharts visualization with time filters (*7D, 30D, Quarter, YTD*).
   - Conversion funnels: event registrations vs. actual attendance, community growth metrics.
   - AI strategic recommendations highlighting highest-converting formats.

8. **Integrations & Settings**
   - Pre-configured connectors for GitHub, Discord, X, Dev.to, Luma, PostHog, and AI Engines.
   - Vault modal to store API tokens and manage connections.
   - Workspace profile customization, team member roles, alert preferences, and JSON data backup export.

---

## 🛠 Tech Stack

- **Framework**: Next.js 16 (App Router with Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom DevRelOS design system (`#FF6B35` primary orange, `#202124` charcoal, `#F7F7F5` background)
- **Icons**: Lucide React
- **Charts**: Recharts
- **State & Storage**: React Context with automatic LocalStorage persistence & memory fallback

---

## 🏃 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Production Build
```bash
npm run build
npm run start
```

---

## 🔑 Environment Variables

To connect real AI completions via Groq or live integrations, configure `.env.local`:

```env
# Primary LLM Provider (Groq)
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-120b

# Optional: GitHub API Token (for public repo analysis)
GITHUB_TOKEN=your_github_token_here

# Optional: Live Research Search Grounding (Tavily or Serper)
TAVILY_API_KEY=
SERPER_API_KEY=
```

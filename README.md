# 🎬 Dramzy

**Stream the finest Korean, Japanese, Chinese, and Thai dramas — free forever.**

Dramzy is a full-stack K-drama streaming platform built with Next.js 15, powered by the Xyra Stream API, and styled for a premium cinematic experience. Watchlists, progress tracking, OAuth authentication, and a seamless video player — all in one.

---

## ✨ Features

### 🎥 Streaming
- **HLS video player** — ReactPlayer with hardware-accelerated playback
- **Resume watching** — progress saved per episode, auto-seek on return
- **Embed fallback** — if no direct stream, falls back to embedded player
- **"No stream" state** — friendly UI when a source is unavailable

### 🏠 Homepage
- **Hero carousel** — featured dramas with cinematic backdrop
- **Recently Added** — latest K-drama episodes (falls back to `/latest` when `latest_kdrama` is unavailable)
- **Trending Now** — most popular dramas this week
- **My Watchlist** — personalized row for logged-in users

### 🎭 Drama Pages
- **Cinematic backdrop** — blurred poster background
- **Full metadata** — title, genres, status, release year, other names, description
- **Episode grid** — scrollable horizontal list with thumbnails
- **Stats bar** — episode count, status, year, primary genre
- **Also Known As** — alternate titles
- **More Like This** — 8 related dramas from trending
- **Watchlist button** — add/remove, shows "Completed" when finished
- **Continue / Watch from Start** — smart button based on progress

### 🔍 Search
- Full-text search across the drama catalog
- Grid results with poster cards
- Empty state with helpful message

### 👤 Auth
- **Google OAuth** — sign in with Google
- **Discord OAuth** — sign in with Discord
- Session-based watchlist and progress tracking
- Cookie-based watchlist for guests

### 📋 Watchlist & Progress
- Add/remove dramas from watchlist
- Track watching / plan-to-watch / completed / dropped / on-hold
- Per-episode progress saved in seconds (auto-resume)

### 📄 Pages
| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/home` | Main dashboard |
| `/popular` | Popular dramas with infinite scroll |
| `/search` | Search page |
| `/drama/[slug]` | Drama detail + episodes |
| `/watch/[slug]` | Video player |
| `/about` | About Dramzy |
| `/privacy` | Privacy Policy |
| `/terms` | Terms & Conditions |
| `/dmca` | DMCA Takedown Policy |
| `/signin` | OAuth sign in |
| `/signout` | Sign out |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, RSC) |
| UI | React 19, Tailwind CSS 3, shadcn/ui |
| Fonts | Bebas Neue (headings), Inter (body) |
| Database | Neon PostgreSQL (serverless) |
| ORM | Drizzle ORM |
| Auth | NextAuth.js v5 (Google + Discord OAuth) |
| Video | ReactPlayer (HLS + embed fallback) |
| Cache | Redis (Upstash REST or standard redis://) |
| API | Xyra Stream API (dramacool data) |
| Deployment | Vercel |

---

## ⚙️ Setup

### 1. Install dependencies

```bash
npm install
# or
pnpm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
# Required
DATABASE_URL=postgresql://user:pass@host.neon.tech/dramzy?sslmode=require
NEXTAUTH_SECRET=your-secret-here          # openssl rand -base64 32
XYRA_API_KEY=key1                         # from Xyra Discord

# At least one OAuth provider
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=

# Optional
REDIS_URL=https://your-instance.upstash.io
REDIS_TOKEN=your-token
NEXT_PUBLIC_APP_URL=http://localhost:1999
```

### 3. Run database migrations

```bash
npm run db:generate
npm run db:push
```

### 4. Start dev server

```bash
npm run dev          # runs on :1999
```

---

## 🔑 API Configuration

Dramzy uses the **Xyra Stream API** for all drama data and streaming.

| Endpoint | Used for |
|----------|----------|
| `GET /home` | Hero carousel |
| `GET /latest_kdrama` | Recently aired episodes |
| `GET /latest` | Fallback for recently aired |
| `GET /popular` | Trending dramas |
| `GET /search` | Full-text search |
| `GET /info?id=` | Drama detail + episode list |
| `GET /stream?episode_id=` | HLS sources + subtitles |

Get your free API key from the [Xyra Discord](https://github.com/junioralive/dramacool-api).

---

## 📁 Project Structure

```
src/
├── app/
│   ├── (auth)/          signin, signout
│   ├── (marketing)/     landing page
│   └── (pages)/         home, popular, search, drama, watch, about, privacy, terms, dmca
├── components/
│   ├── layout/          site-header, site-footer, main-nav, mobile-nav
│   ├── ui/              button, badge, card, input, skeleton, section-heading, api-unavailable
│   ├── card.tsx         drama card with hover play overlay
│   ├── react-player.tsx HLS video player
│   └── video-player-wrapper.tsx  client wrapper (ssr: false)
├── lib/
│   ├── dramacool.ts     Xyra API client (all endpoints)
│   ├── slug.ts          ID normalisation utilities
│   ├── redis.ts         Upstash / ioredis / noop client
│   ├── auth.ts          NextAuth config
│   └── helpers/server.ts  watchlist helpers
├── db/
│   └── schema/          Drizzle schema (series, episode, watchList, progress)
└── styles/
    └── globals.css      Dramzy theme
```

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| Background | `#0f1117` (dark slate) |
| Surface | `#161b27` |
| Brand | `#0ea5e9` (electric blue) |
| Text | `#e2e8f0` |
| Muted | `#64748b` |
| Heading font | Bebas Neue |
| Body font | Inter |

---

## 🚀 Deployment (Vercel)

```bash
# Set env vars in Vercel dashboard, then:
vercel deploy
```

Required Vercel env vars: same as `.env.example` — `DATABASE_URL`, `NEXTAUTH_SECRET`, `XYRA_API_KEY`, OAuth credentials.

---

## ⚖️ Legal

Dramzy aggregates publicly available links and metadata. We do not host video files. See `/dmca` for our takedown policy.

---

*Crafted by **Sunil** · Powered by Xyra Stream API*

# DebridUI

<p align="center">
  <a href="https://debridui.viperadnan.com"><img src="https://img.shields.io/website?url=https%3A%2F%2Fviperadnan.com&label=Deployment&color=brightgreen" alt="Deployment" /></a>
  <a href="https://nextjs.org"><img src="https://img.shields.io/github/package-json/dependency-version/viperadnan-git/debridui/next?logo=next.js&logoColor=white&label=Next.js&color=black" alt="Next.js" /></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/github/package-json/dependency-version/viperadnan-git/debridui/dev/typescript?logo=typescript&logoColor=white&label=TypeScript&color=3178C6" alt="TypeScript" /></a>
  <a href="https://tailwindcss.com"><img src="https://img.shields.io/github/package-json/dependency-version/viperadnan-git/debridui/dev/tailwindcss?logo=tailwind-css&logoColor=white&label=Tailwind&color=06B6D4" alt="Tailwind CSS" /></a>
  <img alt="GitHub repo size" src="https://img.shields.io/github/repo-size/viperadnan-git/debridui?color=%23E8E2D8">
  <a href="./LICENSE"><img src="https://img.shields.io/github/license/viperadnan-git/debridui?color=blue" alt="License" /></a>
</p>

A modern, fast debrid client with integrated media discovery and streaming capabilities.

> [!IMPORTANT]
> This project does not provide, host, or stream any content. DebridUI is a client interface that connects to third-party debrid service APIs to display authorized users' private files and content. [Read full disclaimer](DISCLAIMER.md).

## Community Hosted Instances

- [https://debridui.viperadnan.com](https://debridui.viperadnan.com) - Hosted by creator

## Features

### File Management

- **Multi-account support** - Manage multiple debrid accounts seamlessly
- **Real-time file tracking** - Live updates for download progress and status
- **Advanced file explorer** - Tree view, search, sorting, and batch operations
- **Direct streaming** - Stream to VLC, IINA, MPV, PotPlayer, Kodi, MX Player
- **Drag & drop uploads** - Upload files and links easily

### Media Discovery

- **Trakt.tv catalogue** - Browse trending movies and TV shows
- **Smart search** - Find content across multiple sources
- **Media details** - Cast info, ratings, trailers, and recommendations
- **Season/episode browser** - Navigate TV shows with ease

### User Experience

- **Dark/Light mode** - Automatic theme switching
- **Responsive design** - Works on desktop, tablet, and mobile
- **Keyboard shortcuts** - Quick navigation with Cmd/Ctrl+K search
- **Progress tracking** - Visual indicators for active downloads
- **Context menus** - Right-click actions for quick operations

## Getting Started

### Prerequisites

- Node.js 20+ or Bun
- PostgreSQL 14+
- A debrid account (AllDebrid, TorBox supported)

### Configuration

Copy `.env.example` to `.env.local` and fill in the required values:

```bash
cp .env.example .env.local
```

See [`.env.example`](.env.example) for all available environment variables and their descriptions.

### Installation

```bash
# Clone the repository
git clone https://github.com/viperadnan-git/debridui
cd debridui

# Install dependencies
bun install

# Configure environment (see Configuration section above)
cp .env.example .env.local

# Set up database
bunx drizzle-kit push

# Run development server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the app.

### Deployment

**Vercel (Recommended):**

1. Push code to GitHub
2. Import project on [Vercel](https://vercel.com)
3. Add PostgreSQL database (Vercel Postgres, Neon, Supabase, etc.)
4. Configure environment variables
5. Deploy

**Standalone (Self-hosted):**

This app uses Next.js standalone output for optimized self-hosting.

**Environment Variables:**
Ensure all required environment variables from [`.env.example`](.env.example) are set in your production environment.

```bash
# Build the app
bun run build

# Static files are automatically copied to .next/standalone via postbuild script

# Start the server
NODE_ENV=production node .next/standalone/server.js
```

## CORS Proxy

Addons require a CORS proxy to function. Deploy `proxy.worker.js` to Cloudflare Workers:

1. Create a [Cloudflare Workers](https://workers.cloudflare.com) account
2. Click "Create Application" → "Create Worker"
3. Replace worker code with contents of `proxy.worker.js`
4. Update `ALLOWED_ORIGINS` array with your domain(s)
5. Deploy and copy the worker URL
6. Add to `.env.local`: `NEXT_PUBLIC_CORS_PROXY_URL=https://your.worker.workers.dev?url=`

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Disclaimer

> **⚠️ Important Legal Notice**: This project is a client interface only and does not host, store, or distribute any content. Users are solely responsible for ensuring their use complies with all applicable laws, copyright regulations, and third-party service terms. By using this software, you acknowledge and agree to the [full disclaimer](DISCLAIMER.md).

## License

GPL-3.0-or-later - see [LICENSE](LICENSE) file for details.

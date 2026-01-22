# DebridUI

[![Deploy Status](https://img.shields.io/badge/deploy-live-success)](https://debridui.vercel.app)
[![License](https://img.shields.io/github/license/viperadnan-git/debridui)](https://github.com/viperadnan-git/debridui/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)

A modern, fast debrid client with integrated media discovery. Built with Next.js 15, TypeScript, and Tailwind CSS.

> [!IMPORTANT]
> This project does not provide, host, or stream any content. DebridUI is a client interface that connects to third-party debrid service APIs to display authorized users' private files and content. [Read full disclaimer](DISCLAIMER.md).

## Demo

🚀 **Live Demo**: [https://debridui.vercel.app](https://debridui.vercel.app)

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

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI + shadcn/ui
- **State Management**: Zustand
- **Data Fetching**: TanStack Query v5
- **Forms**: React Hook Form + Zod validation
- **Package Manager**: Bun (recommended)

## Getting Started

### Prerequisites

- Node.js 20+ or Bun
- A debrid account (AllDebrid supported)

### Installation

```bash
# Clone the repository
git clone https://github.com/viperadnan-git/debridui
cd debridui

# Install dependencies
bun install

# Run development server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the app.

### Build for Production

```bash
bun run build
bun start
```

## Configuration

### Environment Variables

Create a `.env.local` file:

```env
# Optional: Custom API endpoints
NEXT_PUBLIC_TRAKT_CLIENT_ID=<your-trakt-client-id>
```

### Supported Services

- **Debrid**: AllDebrid (more coming soon)
- **Media Players**: VLC, IINA, MPV, PotPlayer, Kodi, MX Player
- **Content Catalogue**: Trakt.tv

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Disclaimer

> **⚠️ Important Legal Notice**: This project is a client interface only and does not host, store, or distribute any content. Users are solely responsible for ensuring their use complies with all applicable laws, copyright regulations, and third-party service terms. By using this software, you acknowledge and agree to the [full disclaimer](DISCLAIMER.md).

## License

GPL-3.0-or-later - see [LICENSE](LICENSE) file for details.

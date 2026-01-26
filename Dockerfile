# -----------------------------------------------------------------------------
# Next.js Standalone Docker Build with Runtime Environment Variables
# Uses Bun for optimal performance
# -----------------------------------------------------------------------------

FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json bun.lock* ./
RUN bun install --no-save --frozen-lockfile

# Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Use placeholders for NEXT_PUBLIC_* vars that will be replaced at runtime
ENV NEXT_PUBLIC_TRAKT_CLIENT_ID="__NEXT_PUBLIC_TRAKT_CLIENT_ID__"
ENV NEXT_PUBLIC_CORS_PROXY_URL="__NEXT_PUBLIC_CORS_PROXY_URL__"
ENV NEXT_PUBLIC_DISCORD_URL="__NEXT_PUBLIC_DISCORD_URL__"
ENV NEXT_PUBLIC_ANALYTICS_SCRIPT="__NEXT_PUBLIC_ANALYTICS_SCRIPT__"

RUN bun run build

# Production image
FROM base AS runner
WORKDIR /app

LABEL org.opencontainers.image.title="DebridUI" \
      org.opencontainers.image.description="A modern, fast debrid client with integrated media discovery. Built with Next.js, TypeScript, and Tailwind CSS." \
      org.opencontainers.image.url="https://github.com/viperadnan-git/debridui" \
      org.opencontainers.image.source="https://github.com/viperadnan-git/debridui" \
      org.opencontainers.image.documentation="https://github.com/viperadnan-git/debridui#readme" \
      org.opencontainers.image.authors="Adnan Ahmad <viperadnan@gmail.com>" \
      org.opencontainers.image.vendor="Adnan Ahmad" \
      org.opencontainers.image.licenses="GPL-3.0-or-later"

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME="0.0.0.0"

RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --no-log-init -g nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy entrypoint script for runtime env replacement
COPY --chmod=755 .docker/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

USER nextjs

EXPOSE 3000

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["bun", "./server.js"]

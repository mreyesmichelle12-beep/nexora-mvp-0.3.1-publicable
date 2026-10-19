# NEXORA MVP 0.3 — imagen mínima: Node 22 (SQLite y TypeScript "sin compilar" incluidos), sin npm install.
FROM node:22-alpine
ENV NODE_ENV=production PORT=3000 DATA_DIR=/data TRUST_PROXY=1
WORKDIR /app
COPY package.json ./
COPY packages/match-engine ./packages/match-engine
COPY apps/web/package.json ./apps/web/package.json
COPY apps/web/src/lib ./apps/web/src/lib
COPY apps/mvp/package.json apps/mvp/server.mjs ./apps/mvp/
COPY apps/mvp/src ./apps/mvp/src
COPY apps/mvp/static ./apps/mvp/static
COPY apps/mvp/public ./apps/mvp/public
RUN mkdir -p /data && chown -R node:node /data /app
USER node
VOLUME ["/data"]
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://127.0.0.1:3000/salud || exit 1
CMD ["node", "--no-warnings", "apps/mvp/server.mjs"]

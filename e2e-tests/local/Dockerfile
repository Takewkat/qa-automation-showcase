# The upstream Conduit (TonyMckes/conduit-realworld-example-app) built from source, production mode: the backend serves the built frontend and /api on one port, no rate limit.
FROM node:24-alpine

ARG CONDUIT_REPO=https://github.com/TonyMckes/conduit-realworld-example-app.git
ARG CONDUIT_REF=main

RUN apk add --no-cache git
WORKDIR /conduit
RUN git clone --depth 1 --branch "$CONDUIT_REF" "$CONDUIT_REPO" . \
  && npm ci --no-audit --no-fund \
  && npm run build -w frontend

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001
CMD ["npm", "run", "start", "-w", "backend"]

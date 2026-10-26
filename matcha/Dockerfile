# Production image (make). In dev (make dev) the sources are mounted instead, see docker-compose.dev.yml
FROM node:26.11.1-alpine3.24

WORKDIR /app

COPY package.json package-lock.json ./
# dev dependencies included: next build needs typescript, and the seed runs faker at boot
RUN npm ci

COPY . .

# NEXT_PUBLIC_* variables are inlined by next build
ARG NEXT_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "start"]

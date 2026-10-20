FROM node:22-alpine AS base
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npx prisma generate --schema prisma/schema.postgres.prisma
RUN npx next build

EXPOSE 3010
ENV PORT=3010
ENV NODE_ENV=production

CMD ["sh", "-c", "npx prisma migrate deploy --schema prisma/schema.postgres.prisma && npm run start"]

FROM node:22-alpine AS base
WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .
RUN npx prisma generate --schema prisma/schema.postgres.prisma
RUN npm run build

EXPOSE 3100
ENV PORT=3100
ENV NODE_ENV=production

CMD ["npm", "run", "start"]

# --- Build stage ---
FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- Runtime stage ---
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
# carpetas persistentes (también se montan como volúmenes en compose)
RUN mkdir -p uploads keys
EXPOSE 3000
CMD ["node", "dist/main.js"]

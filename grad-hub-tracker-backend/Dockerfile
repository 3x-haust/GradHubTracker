# ---- Stage 1: Build ----
FROM node:lts-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN yarn install

COPY . .
RUN yarn build

# ---- Stage 2: Production ----
FROM node:lts-alpine

WORKDIR /app

# Copy only necessary files from the builder stage
COPY package*.json ./
# Install only production dependencies
RUN yarn install --production

# Copy the compiled JavaScript code from the builder stage
COPY --from=builder /app/dist ./dist

EXPOSE 2053
CMD ["node", "dist/src/main"]
FROM node:18-alpine AS builder

WORKDIR /frontend

COPY package*.json ./
RUN npm install

COPY . ./

RUN npm run build

# Step 2: Serve the application
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["npm", "run", "start"]

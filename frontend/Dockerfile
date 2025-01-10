FROM node:18-alpine AS builder

WORKDIR /frontend

COPY package*.json ./
RUN npm install

COPY . ./

# RUN npx prisma generate

RUN npm run build

# Step 2: Serve the application
FROM node:18-alpine

WORKDIR /frontend

COPY package*.json ./
RUN npm install

COPY --from=builder /frontend/.next ./.next
COPY --from=builder /frontend/public ./public

EXPOSE 3000

CMD ["npm", "run", "dev"]

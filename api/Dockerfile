FROM node:18-alpine

WORKDIR /usr/src/api

RUN apk add --no-cache python3 make g++ openssl \
    && npm install -g typescript

COPY package*.json ./

COPY ./prisma ./prisma

RUN npm install

RUN npx prisma generate --schema=./prisma/schema.prisma

COPY . ./

RUN npm run build --verbose

EXPOSE 3000

CMD ["npm", "run", "start"]

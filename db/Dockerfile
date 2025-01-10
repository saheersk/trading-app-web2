FROM node:18-alpine

WORKDIR /usr/src/db

RUN apk add --no-cache python3 make g++ \
    && npm install -g typescript

COPY ./package*.json ./

RUN npm install

COPY prisma ./prisma

RUN npx prisma generate

COPY . ./

RUN npm run build --verbose

CMD ["npm", "run", "start"]

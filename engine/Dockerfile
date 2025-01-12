FROM node:18-alpine

WORKDIR /usr/src/engine

RUN apk add --no-cache python3 make g++ \
    && npm install -g typescript

COPY ./package*.json ./

RUN npm install

COPY . ./

RUN npm run build --verbose

CMD ["npm", "run", "start"]

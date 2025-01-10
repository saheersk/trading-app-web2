FROM node:18-alpine

WORKDIR /usr/src/api

RUN apk add --no-cache python3 make g++ 

COPY package*.json ./

RUN npm install

COPY . ./

RUN npm run build --verbose

EXPOSE 3000

CMD ["npm", "run", "start"]

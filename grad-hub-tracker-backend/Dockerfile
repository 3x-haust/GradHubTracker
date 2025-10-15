FROM node:lts-alpine

WORKDIR /app

COPY package*.json ./
RUN yarn install

COPY . .

RUN yarn build

EXPOSE 3000
CMD ["node", "dist/src/main"]
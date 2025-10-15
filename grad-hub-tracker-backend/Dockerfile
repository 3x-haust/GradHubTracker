FROM node:lts-alpine

WORKDIR /app

COPY package*.json ./
RUN yarn install

COPY . .

RUN yarn build

EXPOSE 2053
CMD ["node", "dist/src/main"]
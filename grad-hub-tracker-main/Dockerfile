FROM node:lts-alpine

WORKDIR /app

COPY package.json yarn.loc*k ./

RUN yarn config set registry https://registry.npmmirror.com/
RUN yarn install --production
RUN yarn global add vite
RUN yarn add @vitejs/plugin-react
RUN mv node_modules ../

COPY . .

EXPOSE 2082

CMD ["yarn", "dev"]
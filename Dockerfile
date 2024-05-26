FROM node:20

WORKDIR /app

COPY . .

RUN yarn && yarn build

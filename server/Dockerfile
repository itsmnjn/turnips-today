FROM node:13.13.0

WORKDIR /app

ENV PATH /app/node_modules/.bin:$PATH
ENV NODE_ENV production

COPY package.json ./
COPY yarn.lock ./

RUN yarn install --silent

COPY . ./

CMD ["node", "server.js"]
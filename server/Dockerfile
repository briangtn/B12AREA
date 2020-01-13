FROM node:10-slim

RUN npm i -g typescript tsc-watch nodemon
WORKDIR /server
COPY ./package* /server/
RUN npm install
COPY . /server
RUN npm run build

ENV HOST=0.0.0.0
ENV API_PORT=80

EXPOSE 80
CMD [ "node", "." ]
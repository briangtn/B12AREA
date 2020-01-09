FROM node:10-slim

RUN npm i -g typescript tsc-watch nodemon
WORKDIR /server
COPY . /server
RUN npm install
RUN npm run build

ENV HOST=0.0.0.0

EXPOSE 80
CMD [ "node", "." ]
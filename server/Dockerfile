# Check out https://hub.docker.com/_/node to select a new base image
FROM node:10-slim

USER node
RUN mkdir -p /home/node/app
WORKDIR /home/node/app

COPY --chown=node package*.json ./
RUN npm install
COPY --chown=node . .

RUN npm run build

ENV HOST=0.0.0.0

EXPOSE ${API_PORT}
CMD [ "node", "." ]
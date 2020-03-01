FROM node:alpine

WORKDIR /web
RUN npm install react-scripts serve typescript -g
COPY ./package* /web/
RUN npm install
COPY . /web
ENV PATH /root/.yarn/bin:$PATH
ARG REACT_APP_API_URL="http://localhost:8080"
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ARG REACT_APP_ARENA_URL=""
ENV REACT_APP_ARENA_URL=$REACT_APP_ARENA_URL
RUN npm run build
CMD serve -s build -p 80

EXPOSE 80

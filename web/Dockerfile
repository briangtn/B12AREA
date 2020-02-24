FROM node:alpine

ARG REACT_APP_API_URL="http://localhost:8080"
ENV REACT_APP_API_URL=$REACT_APP_API_URL

WORKDIR /web
RUN npm install react-scripts serve typescript -g
COPY ./package* /web/
RUN npm install
COPY . /web
ENV PATH /root/.yarn/bin:$PATH
RUN npm run build
CMD serve -s build -p 80

EXPOSE 80

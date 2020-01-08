FROM node:alpine AS build-stage
WORKDIR /web
COPY . /web
RUN npm install
ENV PATH /root/.yarn/bin:$PATH
CMD yarn build

FROM node:alpine
WORKDIR /web
COPY --from=build-stage /web/build .
RUN yarn global add serve
CMD serve -s build -p $APP_PORT
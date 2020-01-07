FROM node:alpine AS build-stage
WORKDIR /web
COPY . /web
RUN npm install --only=production
RUN npm run build
#RUN cp -R node_modules prod_node_modules

FROM node:alpine
WORKDIR /web
COPY --from=build-stage /web/build .
ENV PATH ~/.local/bin:$PATH
#COPY --from=build-stage /dashboard/prod_node_modules ./node_modules
CMD yarn add global serve
RUN serve -s build

EXPOSE 3000
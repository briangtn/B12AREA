FROM node:alpine
WORKDIR /web
RUN npm install react-scripts serve typescript -g
COPY ./package* /web/
RUN npm install
COPY . /web
ENV PATH /root/.yarn/bin:$PATH
RUN npm run build
CMD serve -s build -p 80

EXPOSE 80

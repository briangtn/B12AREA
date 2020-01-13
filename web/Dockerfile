FROM node:alpine
WORKDIR /web
COPY . /web
RUN npm install
ENV PATH /root/.yarn/bin:$PATH
RUN npm install react-scripts serve typescript -g
RUN npm run build
CMD serve -s build -p 80

EXPOSE 80

FROM node:18.19.0-alpine3.18
WORKDIR /app
ADD . /app
RUN npm install
EXPOSE 3000
CMD node backend_dist/app.js
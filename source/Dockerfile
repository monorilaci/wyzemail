FROM node:10.16.0

WORKDIR /wyzemail

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 8080
CMD [ "npm", "start" ]
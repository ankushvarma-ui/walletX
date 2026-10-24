FROM node:24-alpinefrom 

WORKDIR /app

COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Use an official Node.js runtime as a parent image
FROM node:20-slim

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install app dependencies
RUN npm install

# Bundle app source
COPY . .

# Your app binds to port 8080 so you'll need to know this
EXPOSE 8080

# Define the command to run your app
CMD [ "node", "src/index.js" ]

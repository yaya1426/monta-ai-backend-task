# Use the official Nest.js base image
FROM node:18-alpine

# Install build dependencies
RUN apk add --no-cache make gcc g++ python3

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install the dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Build the Nest.js application
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Start the Nest.js application
CMD ["npm", "run", "start:prod"]

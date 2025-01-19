# Use Node.js official image as base
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy app source code
COPY . .

# Expose the port your app runs on (assuming default 3000, adjust if different)
EXPOSE 3000

# Command to run the application
CMD ["npm", "start"] 
# Use the official Node.js v14 image as the base image
FROM node:14

# Set the working directory in the container to /app
WORKDIR /app

# Copy package.json, yarn.lock and tsconfig.json to the container
COPY package.json yarn.lock tsconfig.json ./

# Install dependencies in the container
RUN yarn install --production

# Copy the rest of the application code to the container
COPY . .

# Build the TypeScript code using Babel
RUN yarn compile

# Expose port 4000
EXPOSE 4000

# Start the server
CMD ["yarn", "start"]
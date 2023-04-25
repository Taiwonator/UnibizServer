# Use the official Node.js v14 image as the base image
FROM node:14-alpine

ENV DATABASE_URL="mongodb+srv://2382e95b329f2571:d63534b408005b3a4684e599283f2d85@mongodb.mongo--zjxk89vfl658.addon.code.run/0e6b53f33816?replicaSet=rs0&authSource=0e6b53f33816&tls=true"
ENV JWT_SECRET="EOfU4IEyyL9E+P3UK7nseGtTF8pbki2c7fHs+1yHR8svV8Arvoyde2iFVmyqIwoc9mLB6PjMFMd8QNl3wObYg"
ENV JWT_EXPIRES_IN="3600s"

# Set the working directory in the container to /app
WORKDIR /app

# Copy package.json, yarn.lock and tsconfig.json to the container
COPY package.json yarn.lock ./

# Install dependencies in the container
RUN yarn install

# Copy the rest of the application code to the container
COPY . .

# Expose port 4000
EXPOSE 4000

# Start the server
CMD ["yarn", "start"]
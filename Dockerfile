# Use the official Node.js v14 image as the base image
FROM node:14-alpine

ENV DATABASE_URL="mongodb+srv://root:O2wp0TuIdaS1XS14@cluster0.sitfetw.mongodb.net/unibiz?retryWrites=true&w=majority"
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
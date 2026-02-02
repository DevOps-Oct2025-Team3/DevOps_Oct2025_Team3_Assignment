# Use an official lightweight Node.js image
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy package files first (to cache dependencies)
COPY package.json .

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Create the uploads folder inside the container
RUN mkdir -p uploads

# Expose the port (must match the one in server.js)
EXPOSE 3000

# Command to run the application
CMD ["node", "server.js"]
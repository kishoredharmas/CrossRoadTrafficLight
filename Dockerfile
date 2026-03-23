FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/

# Copy build script
COPY build.sh /build/
RUN chmod +x /build/build.sh

# Install dependencies
RUN npm install
RUN cd client && npm install

# Copy source code
COPY . .

# Build frontend
RUN cd client && npm run build

# Create data directories
RUN mkdir -p data/sessions data/recordings

EXPOSE 3001 8080

CMD ["npm", "start"]

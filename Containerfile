# Builder stage
FROM registry.access.redhat.com/ubi9/nodejs-18@sha256:2a1be612f6f2f71fcdbe5b5237ab2b2765b7d37ebbfe1d715e966c7c8002c1b7 as builder

WORKDIR /opt/app-root/src

# Copy package files first (layer caching optimization)
COPY package*.json ./

# Install ALL dependencies
# Use npm install if package-lock.json doesn't exist, otherwise use npm ci
RUN if [ -f package-lock.json ]; then \
      npm ci --prefer-offline --no-audit; \
    else \
      npm install --prefer-offline --no-audit; \
    fi

# Copy only necessary source files (faster than COPY . .)
COPY public/ ./public/
COPY src/ ./src/
COPY *.json ./
COPY *.js ./

# Build-time environment variables
ENV DISABLE_ESLINT_PLUGIN=true
ENV GENERATE_SOURCEMAP=false
ENV INLINE_RUNTIME_CHUNK=false
ENV NODE_ENV=production

# Create cache directory
RUN mkdir -p node_modules/.cache && chmod -R 777 node_modules/.cache

# Build the production bundle
RUN npm run build

# Production stage
FROM registry.access.redhat.com/ubi9/nodejs-18-minimal@sha256:b52ca946958472a4afb884208222a9dc8af843458d2920f437bc45789448554a

WORKDIR /opt/app-root/src

# Copy built assets from builder
COPY --from=builder /opt/app-root/src/build ./build

# Install serve globally for serving static files
RUN npm install -g serve@14.2.1

# Set user (security best practice)
USER 1001

# Expose application port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Serve the production build
CMD ["serve", "-s", "build", "-l", "3001", "--no-clipboard"]
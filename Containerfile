# Builder image
FROM registry.access.redhat.com/ubi9/nodejs-18@sha256:2a1be612f6f2f71fcdbe5b5237ab2b2765b7d37ebbfe1d715e966c7c8002c1b7 as builder

# Add your code
ADD . $HOME

# Create cache directory with proper permissions
RUN mkdir -p $HOME/node_modules/.cache && \
    chmod -R 777 $HOME/node_modules/.cache

# Install dependencies
RUN npm install

# Runtime image
FROM registry.access.redhat.com/ubi9/nodejs-18-minimal@sha256:b52ca946958472a4afb884208222a9dc8af843458d2920f437bc45789448554a

# Copy artifacts from builder
COPY --from=builder $HOME $HOME

# Disable ESLint plugin to avoid cache issues
ENV DISABLE_ESLINT_PLUGIN=true

# Expose port
EXPOSE 3001

# Start node
CMD npm start
#!/bin/bash

# Build the Docker image manually
echo "Building Docker image..."

# Check if running with proper permissions
if ! docker info > /dev/null 2>&1; then
    echo "Error: Cannot connect to Docker daemon. Please ensure:"
    echo "1. Docker is running"
    echo "2. Your user is in the docker group: sudo usermod -aG docker $USER"
    echo "3. You've logged out and back in to apply group changes"
    echo ""
    echo "Alternatively, run with sudo:"
    echo "sudo docker build -t screenshot-server-app ."
    exit 1
fi

# Build the image
docker build -t screenshot-server-app .

echo "Docker image built successfully!"
echo "You can now run it with:"
echo "docker run -p 3000:3000 screenshot-server-app"
echo ""
echo "Or use docker-compose:"
echo "docker-compose up -d"
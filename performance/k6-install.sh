#!/bin/bash

# Install k6 for performance testing
echo "Installing k6 performance testing tool..."

# Check if k6 is already installed
if command -v k6 &> /dev/null; then
    echo "k6 is already installed: $(k6 version)"
    exit 0
fi

# Detect OS and install k6
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    echo "Installing k6 on Linux..."
    sudo gpg -k
    sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
    echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
    sudo apt-get update
    sudo apt-get install k6
elif [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    echo "Installing k6 on macOS..."
    if command -v brew &> /dev/null; then
        brew install k6
    else
        echo "Homebrew not found. Please install Homebrew first or install k6 manually."
        exit 1
    fi
else
    echo "Unsupported OS. Please install k6 manually from https://k6.io/docs/get-started/installation/"
    exit 1
fi

echo "k6 installation completed!"
k6 version
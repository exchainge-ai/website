#!/bin/bash

# Tail logs from all services or a specific one

if [ -z "$1" ]; then
    echo "Following logs from all services (Ctrl+C to exit)..."
    docker compose logs -f
else
    echo "Following logs from $1 (Ctrl+C to exit)..."
    docker compose logs -f "$1"
fi

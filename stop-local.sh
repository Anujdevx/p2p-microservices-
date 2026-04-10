#!/bin/bash

echo "🛑 Stopping all locally running microservices..."

pkill -f "spring-boot:run"

echo "✅ Services stopped."

#!/bin/bash
# Start API server - bypasses WSL path issues

cd /home/saidk/AlternaGen/api

echo "🚀 Starting AlternaGen API..."
echo "📍 Port: 3001"
echo "🗄️  Database: altergen"
echo ""

# Use ts-node directly instead of ts-node-dev to avoid WSL issues
npx ts-node src/index.ts

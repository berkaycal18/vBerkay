#!/bin/bash
echo "🛸 AetherDrop Platformu Başlatılıyor..."
if [ ! -d "node_modules" ]; then
  npm install
fi
node server.js --tunnel

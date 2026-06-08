#!/bin/bash
set -e

SERVER="foundry"
REMOTE_DIR="/home/ubuntu/clarinetotron"

echo "==> Building locally..."
npm run build

echo "==> Copying static assets into standalone..."
cp -r .next/static .next/standalone/.next/
cp -r public .next/standalone/

echo "==> Syncing build to server..."
rsync -az --delete .next/standalone/ "$SERVER:$REMOTE_DIR/.next/standalone/"

echo "==> Syncing config and scripts..."
rsync -az ecosystem.config.cjs scripts/ "$SERVER:$REMOTE_DIR/"

echo "==> Restarting on server..."
ssh "$SERVER" "cd $REMOTE_DIR && pm2 restart ecosystem.config.cjs --env production 2>/dev/null || pm2 start ecosystem.config.cjs --env production"

echo "==> Done."

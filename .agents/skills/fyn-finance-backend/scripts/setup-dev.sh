#!/bin/bash
# Fyn Finance OS — Development Environment Setup
# Run this script once to bootstrap the full local dev environment
# Usage: bash setup-dev.sh

set -e

echo "=== Fyn Finance OS — Dev Setup ==="

# 1. Check prerequisites
echo "[1/7] Checking prerequisites..."
command -v docker &>/dev/null || { echo "ERROR: Docker Desktop not running. Start it first."; exit 1; }
command -v node &>/dev/null || { echo "ERROR: Node.js not found."; exit 1; }
command -v npm &>/dev/null || { echo "ERROR: npm not found."; exit 1; }

# 2. Install Supabase CLI if needed
echo "[2/7] Checking Supabase CLI..."
if ! command -v supabase &>/dev/null; then
  echo "Installing Supabase CLI..."
  npm install -g supabase
fi

# 3. Initialize Supabase if not already done
echo "[3/7] Initializing Supabase..."
if [ ! -f "supabase/config.toml" ]; then
  supabase init
fi

# 4. Start Supabase local stack
echo "[4/7] Starting Supabase (this may take a minute)..."
supabase start

# 5. Capture keys from supabase status
echo "[5/7] Capturing Supabase keys..."
ANON_KEY=$(supabase status | grep "anon key" | awk '{print $NF}')
SERVICE_KEY=$(supabase status | grep "service_role key" | awk '{print $NF}')
API_URL=$(supabase status | grep "API URL" | awk '{print $NF}')

# 6. Write .env.local (frontend)
echo "[6/7] Writing environment files..."
cat > .env.local << EOF
VITE_SUPABASE_URL=${API_URL}
VITE_SUPABASE_ANON_KEY=${ANON_KEY}
VITE_API_URL=http://localhost:3001
EOF

# Write server/.env
mkdir -p server
cat > server/.env << EOF
SUPABASE_URL=${API_URL}
SUPABASE_SERVICE_ROLE_KEY=${SERVICE_KEY}
ANTHROPIC_API_KEY=YOUR_KEY_HERE
PORT=3001
EOF

echo ""
echo "=== Setup Complete ==="
echo "Supabase Studio: http://localhost:54323"
echo "Frontend dev:    npm run dev (port 5173)"
echo "Server dev:      cd server && npm run dev (port 3001)"
echo ""
echo "NEXT: Apply schema with: supabase db reset"
echo "NEXT: Add your ANTHROPIC_API_KEY to server/.env (optional, for PDF AI fallback)"

#!/bin/bash
# ============================================
# VisionTutor - Cloud Run Deploy Script
# ============================================
# Prerequisites:
#   1. gcloud CLI installed & authenticated
#   2. Docker installed
#   3. GCP project created
#
# Usage:
#   chmod +x deploy.sh
#   ./deploy.sh
# ============================================

set -e

# ── Configuration ──
PROJECT_ID="${GCP_PROJECT_ID:-your-project-id}"
REGION="${GCP_REGION:-us-central1}"
BACKEND_SERVICE="visiontutor-backend"
BACKEND_IMAGE="gcr.io/${PROJECT_ID}/${BACKEND_SERVICE}"
GEMINI_API_KEY="${GEMINI_API_KEY:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}╔════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  VisionTutor Cloud Run Deployment      ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════╝${NC}"

# ── Validate Prerequisites ──
if [ -z "$GEMINI_API_KEY" ]; then
  echo -e "${RED}ERROR: GEMINI_API_KEY not set!${NC}"
  echo "  export GEMINI_API_KEY=your_key_here"
  exit 1
fi

if [ "$PROJECT_ID" == "your-project-id" ]; then
  echo -e "${RED}ERROR: GCP_PROJECT_ID not set!${NC}"
  echo "  export GCP_PROJECT_ID=your-project-id"
  exit 1
fi

echo -e "${GREEN}Project:${NC} $PROJECT_ID"
echo -e "${GREEN}Region:${NC}  $REGION"
echo ""

# ── Step 1: Enable APIs ──
echo -e "${CYAN}[1/5] Enabling GCP APIs...${NC}"
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  containerregistry.googleapis.com \
  secretmanager.googleapis.com \
  --project=$PROJECT_ID

# ── Step 2: Store API Key in Secret Manager ──
echo -e "${CYAN}[2/5] Storing API key in Secret Manager...${NC}"
echo -n "$GEMINI_API_KEY" | gcloud secrets create gemini-api-key \
  --data-file=- \
  --project=$PROJECT_ID \
  2>/dev/null || \
echo -n "$GEMINI_API_KEY" | gcloud secrets versions add gemini-api-key \
  --data-file=- \
  --project=$PROJECT_ID

# ── Step 3: Build & Push Backend Docker Image ──
echo -e "${CYAN}[3/5] Building backend Docker image...${NC}"
cd backend
gcloud builds submit --tag $BACKEND_IMAGE --project=$PROJECT_ID
cd ..

# ── Step 4: Deploy to Cloud Run ──
echo -e "${CYAN}[4/5] Deploying to Cloud Run...${NC}"
gcloud run deploy $BACKEND_SERVICE \
  --image=$BACKEND_IMAGE \
  --platform=managed \
  --region=$REGION \
  --allow-unauthenticated \
  --port=8000 \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=5 \
  --timeout=900 \
  --set-env-vars="DEBUG=false" \
  --set-env-vars="ALLOWED_ORIGINS=*" \
  --set-secrets="GEMINI_API_KEY=gemini-api-key:latest" \
  --project=$PROJECT_ID

# ── Step 5: Get URL ──
echo -e "${CYAN}[5/5] Getting service URL...${NC}"
BACKEND_URL=$(gcloud run services describe $BACKEND_SERVICE \
  --platform=managed \
  --region=$REGION \
  --format='value(status.url)' \
  --project=$PROJECT_ID)

echo ""
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo -e "  Backend URL:    ${CYAN}${BACKEND_URL}${NC}"
echo -e "  Health Check:   ${CYAN}${BACKEND_URL}/health${NC}"
echo -e "  WebSocket:      ${CYAN}${BACKEND_URL/https/wss}/ws/session${NC}"
echo ""
echo -e "  For frontend, set env var:"
echo -e "  ${CYAN}NEXT_PUBLIC_BACKEND_WS_URL=${BACKEND_URL/https/wss}/ws/session${NC}"
echo -e "${GREEN}═══════════════════════════════════════════${NC}"

<#
.SYNOPSIS
    Automated Deployment Script for VisionTutor Backend to Google Cloud Run.
    This fulfills the "Bonus Points" hackathon requirement:
    "Prove you automated your Cloud Deployment using scripts or infrastructure-as-code tools."

.DESCRIPTION
    Builds the Docker image and deplipes it to Google Cloud Run.
    Prerequisites:
    1. Google Cloud SDK (gcloud) installed and authenticated.
    2. A GCP project selected (gcloud config set project [PROJECT_ID]).
    3. Billing enabled on the GCP project.
    4. Cloud Build and Cloud Run APIs enabled.
#>

param(
    [string]$ProjectId = $(gcloud config get-value project 2>$null),
    [string]$ServiceName = "visiontutor-backend",
    [string]$Region = "us-central1"
)

if (-not $ProjectId) {
    Write-Error "Could not detect GCP Project ID. Please set it using 'gcloud config set project YOUR_PROJECT_ID' or pass it using -ProjectId"
    exit 1
}

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " Deploying VisionTutor Backend to Google Cloud Run" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Project ID : $ProjectId"
Write-Host "Service    : $ServiceName"
Write-Host "Region     : $Region"
Write-Host "============================================================" -ForegroundColor Cyan

# Ensure we are in the correct directory (backend folder)
if (!(Test-Path .\Dockerfile)) {
    Write-Error "Dockerfile not found. Please run this script from the 'backend' directory."
    exit 1
}

Read-Host -Prompt "Press Enter to start deployment, or Ctrl+C to cancel..."

# Build and Push image using Cloud Build
Write-Host "`n[1/3] Building image on Cloud Build... This may take a few minutes." -ForegroundColor Yellow
gcloud builds submit --tag gcr.io/$ProjectId/$ServiceName

if ($LASTEXITCODE -ne 0) {
    Write-Error "Cloud Build failed."
    exit 1
}

# Deploy to Cloud Run
Write-Host "`n[2/3] Deploying to Cloud Run..." -ForegroundColor Yellow
gcloud run deploy $ServiceName `
    --image gcr.io/$ProjectId/$ServiceName `
    --platform managed `
    --region $Region `
    --allow-unauthenticated `
    --port 8080 `
    --set-env-vars="DEBUG=False" `
    --update-secrets="GEMINI_API_KEY=VISIONTUTOR_GEMINI_API_KEY:latest"

if ($LASTEXITCODE -ne 0) {
    Write-Error "Cloud Run deployment failed. Ensure you have created the Secret 'VISIONTUTOR_GEMINI_API_KEY' in GCP Secret Manager."
    exit 1
}

# Fetch the live URL
Write-Host "`n[3/3] Fetching Service URL..." -ForegroundColor Yellow
$ServiceUrl = gcloud run services describe $ServiceName --platform managed --region $Region --format="value(status.url)"

Write-Host "`n============================================================" -ForegroundColor Green
Write-Host " Deployment Successful! \o/" -ForegroundColor Green
Write-Host " Active URL: $ServiceUrl" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host "`nDon't forget to update your frontend's NEXT_PUBLIC_BACKEND_WS_URL to point to this new URL!" -ForegroundColor Cyan

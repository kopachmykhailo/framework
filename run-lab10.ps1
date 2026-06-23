#!/usr/bin/env pwsh

# Lab 10 - Testing and Docker Setup Script (Windows PowerShell)

Write-Host "🚀 Lab 10 - Fastify Testing and Docker Setup" -ForegroundColor Green
Write-Host ""

# Check Docker installation
$dockerInstalled = $null -ne (Get-Command docker -ErrorAction SilentlyContinue)
$composeInstalled = $null -ne (Get-Command docker-compose -ErrorAction SilentlyContinue)

if (-not $dockerInstalled) {
    Write-Host "❌ Docker is not installed" -ForegroundColor Red
    exit 1
}

if (-not $composeInstalled) {
    Write-Host "❌ Docker Compose is not installed" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Docker and Docker Compose installed" -ForegroundColor Green
Write-Host ""

# Show menu
Write-Host "Select an option:" -ForegroundColor Yellow
Write-Host "1. Build Docker image"
Write-Host "2. Start full stack (production)"
Write-Host "3. Start dev stack (with auto-reload)"
Write-Host "4. Run tests in container"
Write-Host "5. Run tests with coverage"
Write-Host "6. View Docker logs"
Write-Host "7. Stop all containers"
Write-Host "8. Clean up (remove containers and volumes)"
Write-Host ""

$choice = Read-Host "Enter your choice (1-8)"

switch ($choice) {
    "1" {
        Write-Host "Building Docker image..." -ForegroundColor Yellow
        docker-compose build
        Write-Host "✓ Build complete" -ForegroundColor Green
    }
    "2" {
        Write-Host "Starting production stack..." -ForegroundColor Yellow
        docker-compose -f docker-compose.yml up
    }
    "3" {
        Write-Host "Starting development stack..." -ForegroundColor Yellow
        docker-compose up
        Write-Host "✓ Dev server running on http://localhost:3000" -ForegroundColor Green
    }
    "4" {
        Write-Host "Running tests..." -ForegroundColor Yellow
        docker-compose up -d
        Write-Host "Waiting for services to be healthy..."
        Start-Sleep -Seconds 10
        docker-compose exec -T app npm run test
    }
    "5" {
        Write-Host "Running tests with coverage..." -ForegroundColor Yellow
        docker-compose up -d
        Write-Host "Waiting for services to be healthy..."
        Start-Sleep -Seconds 10
        docker-compose exec -T app npm run test:coverage
    }
    "6" {
        Write-Host "Showing logs (press Ctrl+C to exit)..." -ForegroundColor Yellow
        docker-compose logs -f
    }
    "7" {
        Write-Host "Stopping containers..." -ForegroundColor Yellow
        docker-compose down
        Write-Host "✓ Containers stopped" -ForegroundColor Green
    }
    "8" {
        Write-Host "Cleaning up (removing containers and volumes)..." -ForegroundColor Yellow
        docker-compose down -v
        Write-Host "✓ Cleanup complete" -ForegroundColor Green
    }
    default {
        Write-Host "Invalid choice" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "Done!" -ForegroundColor Green

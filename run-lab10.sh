#!/bin/bash

# Lab 10 - Testing and Docker Setup Script

set -e

echo "🚀 Lab 10 - Fastify Testing and Docker Setup"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Docker installation
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker and Docker Compose installed${NC}"
echo ""

# Show menu
echo "Select an option:"
echo "1. Build Docker image"
echo "2. Start full stack (production)"
echo "3. Start dev stack (with auto-reload)"
echo "4. Run tests in container"
echo "5. Run tests with coverage"
echo "6. View Docker logs"
echo "7. Stop all containers"
echo "8. Clean up (remove containers and volumes)"
echo ""
read -p "Enter your choice (1-8): " choice

case $choice in
    1)
        echo -e "${YELLOW}Building Docker image...${NC}"
        docker-compose build
        echo -e "${GREEN}✓ Build complete${NC}"
        ;;
    2)
        echo -e "${YELLOW}Starting production stack...${NC}"
        docker-compose -f docker-compose.yml up
        ;;
    3)
        echo -e "${YELLOW}Starting development stack...${NC}"
        docker-compose up
        echo -e "${GREEN}✓ Dev server running on http://localhost:3000${NC}"
        ;;
    4)
        echo -e "${YELLOW}Running tests...${NC}"
        docker-compose up -d
        echo "Waiting for services to be healthy..."
        sleep 10
        docker-compose exec -T app npm run test
        ;;
    5)
        echo -e "${YELLOW}Running tests with coverage...${NC}"
        docker-compose up -d
        echo "Waiting for services to be healthy..."
        sleep 10
        docker-compose exec -T app npm run test:coverage
        ;;
    6)
        echo -e "${YELLOW}Showing logs (press Ctrl+C to exit)...${NC}"
        docker-compose logs -f
        ;;
    7)
        echo -e "${YELLOW}Stopping containers...${NC}"
        docker-compose down
        echo -e "${GREEN}✓ Containers stopped${NC}"
        ;;
    8)
        echo -e "${YELLOW}Cleaning up (removing containers and volumes)...${NC}"
        docker-compose down -v
        echo -e "${GREEN}✓ Cleanup complete${NC}"
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}Done!${NC}"

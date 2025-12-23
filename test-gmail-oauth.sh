#!/bin/bash

# Gmail OAuth Integration Test Script
# Run this after setting up Google Cloud credentials

echo "================================================"
echo "🧪 Gmail OAuth Integration Test Suite"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check backend is running
echo "📡 Checking if backend is running..."
if curl -s http://localhost:3001/health > /dev/null; then
    echo -e "${GREEN}✓${NC} Backend is running on port 3001"
else
    echo -e "${RED}✗${NC} Backend is not running!"
    echo "   Start it with: cd backend && npm run dev"
    exit 1
fi

echo ""

# Get JWT token
echo "🔐 Getting authentication token..."
echo "   Enter admin email:"
read -r ADMIN_EMAIL
echo "   Enter admin password:"
read -rs ADMIN_PASSWORD

TOKEN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}✗${NC} Failed to login!"
    echo "   Response: $TOKEN_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✓${NC} Logged in successfully"
echo ""

# Test 1: Check Gmail configuration
echo "Test 1: Check Gmail OAuth configuration"
CONFIG_RESPONSE=$(curl -s -X GET http://localhost:3001/api/admin/gmail/status \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $CONFIG_RESPONSE"

if echo "$CONFIG_RESPONSE" | grep -q "connected"; then
    if echo "$CONFIG_RESPONSE" | grep -q '"connected":true'; then
        echo -e "${GREEN}✓${NC} Gmail is connected!"
        
        # Extract email
        EMAIL=$(echo "$CONFIG_RESPONSE" | grep -o '"email":"[^"]*' | cut -d'"' -f4)
        echo "   Connected email: $EMAIL"
        
        # Ask if user wants to fetch emails
        echo ""
        echo "📧 Do you want to fetch emails now? (y/n)"
        read -r FETCH_EMAILS
        
        if [ "$FETCH_EMAILS" = "y" ]; then
            echo "Fetching emails..."
            FETCH_RESPONSE=$(curl -s -X POST http://localhost:3001/api/admin/emails/fetch \
              -H "Authorization: Bearer $TOKEN" \
              -H "Content-Type: application/json" \
              -d '{"maxResults":5}')
            
            echo "Response: $FETCH_RESPONSE"
            
            if echo "$FETCH_RESPONSE" | grep -q "success"; then
                FETCHED=$(echo "$FETCH_RESPONSE" | grep -o '"fetched":[0-9]*' | cut -d':' -f2)
                echo -e "${GREEN}✓${NC} Fetched $FETCHED emails"
                
                # Check queue
                echo ""
                echo "📋 Checking email queue..."
                QUEUE_RESPONSE=$(curl -s -X GET http://localhost:3001/api/admin/queue \
                  -H "Authorization: Bearer $TOKEN")
                
                echo "Response: $QUEUE_RESPONSE"
                
                # Ask if user wants to process queue
                echo ""
                echo "🤖 Do you want to process the queue with AI? (y/n)"
                read -r PROCESS_QUEUE
                
                if [ "$PROCESS_QUEUE" = "y" ]; then
                    echo "Processing queue..."
                    PROCESS_RESPONSE=$(curl -s -X POST http://localhost:3001/api/admin/process-queue \
                      -H "Authorization: Bearer $TOKEN" \
                      -H "Content-Type: application/json" \
                      -d '{"autoCreate":true,"minConfidence":80}')
                    
                    echo "Response: $PROCESS_RESPONSE"
                    
                    if echo "$PROCESS_RESPONSE" | grep -q "total"; then
                        echo -e "${GREEN}✓${NC} Queue processed successfully!"
                    fi
                fi
            fi
        fi
    else
        echo -e "${YELLOW}⚠${NC} Gmail is not connected"
        echo ""
        echo "To connect Gmail:"
        echo "1. Get auth URL:"
        
        AUTH_RESPONSE=$(curl -s -X GET http://localhost:3001/api/admin/gmail/auth \
          -H "Authorization: Bearer $TOKEN")
        
        AUTH_URL=$(echo "$AUTH_RESPONSE" | grep -o '"authUrl":"[^"]*' | cut -d'"' -f4 | sed 's/\\//g')
        
        if [ -n "$AUTH_URL" ]; then
            echo ""
            echo "2. Open this URL in your browser:"
            echo -e "${GREEN}$AUTH_URL${NC}"
            echo ""
            echo "3. After authorizing, check status again"
        else
            echo -e "${RED}✗${NC} Failed to get auth URL"
            echo "   Make sure GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET are set in backend/.env"
        fi
    fi
else
    echo -e "${RED}✗${NC} Failed to check Gmail status"
fi

echo ""
echo "================================================"
echo "✅ Test complete!"
echo "================================================"

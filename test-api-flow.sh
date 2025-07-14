#!/bin/bash

echo "🧪 Testing Authority API Flow"
echo "============================="

# Get a fresh token
echo "1. Getting authentication token..."
TOKEN_RESPONSE=$(curl -s -X POST http://localhost:5003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user18@example.com","password":"test123"}')

echo "Login response: $TOKEN_RESPONSE"

# Extract token (basic extraction, works for testing)
TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to get token"
    exit 1
fi

echo "✅ Got token: ${TOKEN:0:20}..."

# Test the revenue endpoint
echo ""
echo "2. Testing revenue endpoint..."
REVENUE_RESPONSE=$(curl -s -X GET "http://localhost:5003/api/authority/revenue?period=month&breakdown=category&includeComparisons=true" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "Revenue response:"
echo "$REVENUE_RESPONSE" | head -c 500
echo "..."

# Check if topPerformer exists
if echo "$REVENUE_RESPONSE" | grep -q "topPerformer"; then
    echo "✅ topPerformer found in response"
    
    # Extract the topPerformer name
    TOP_PERFORMER_NAME=$(echo "$REVENUE_RESPONSE" | grep -o '"topPerformer":{"name":"[^"]*"' | cut -d'"' -f6)
    echo "🎯 Top performer name: $TOP_PERFORMER_NAME"
    
    if [ -n "$TOP_PERFORMER_NAME" ] && [ "$TOP_PERFORMER_NAME" != "N/A" ]; then
        echo "✅ SUCCESS: API returns valid topPerformer name"
    else
        echo "❌ ISSUE: topPerformer name is empty or N/A"
    fi
else
    echo "❌ topPerformer NOT found in response"
fi

echo ""
echo "3. Testing all authority endpoints..."

ENDPOINTS=(
    "metrics?period=month&includeComparisons=true"
    "category-performance?period=month&includeComparisons=true"
    "tourism-insights?period=month&includeForecasts=true"
    "revenue?period=month&breakdown=category&includeComparisons=true"
    "visitor-trends?period=month&groupBy=day&includeRevenue=true&includeComparisons=true"
)

for endpoint in "${ENDPOINTS[@]}"; do
    echo ""
    echo "📡 Testing: /api/authority/$endpoint"
    
    RESPONSE=$(curl -s -X GET "http://localhost:5003/api/authority/$endpoint" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json")
    
    if echo "$RESPONSE" | grep -q '"success":true'; then
        echo "✅ SUCCESS"
    else
        echo "❌ FAILED"
        echo "Response: ${RESPONSE:0:200}..."
    fi
done

echo ""
echo "Test completed!"

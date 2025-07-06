#!/bin/bash

# TourEase Authority API Testing Script
# This script demonstrates how to test the authority endpoints

BASE_URL="http://localhost:5004"
AUTH_TOKEN=""  # Add a valid JWT token here for testing

echo "🔍 Testing TourEase Authority API Endpoints"
echo "============================================="

# Test 1: Health Check (should fail without auth)
echo "📍 Test 1: Authority Health Check (No Auth)"
curl -s -X GET "${BASE_URL}/api/authority/health" | jq '.'
echo ""

# Test 2: Health Check with Auth (uncomment when you have a token)
# echo "📍 Test 2: Authority Health Check (With Auth)"
# curl -s -X GET "${BASE_URL}/api/authority/health" \
#   -H "Authorization: Bearer ${AUTH_TOKEN}" | jq '.'
# echo ""

# Test 3: City Metrics (uncomment when you have a token)
# echo "📍 Test 3: City Metrics"
# curl -s -X GET "${BASE_URL}/api/authority/city-metrics?period=month&includeComparisons=true" \
#   -H "Authorization: Bearer ${AUTH_TOKEN}" | jq '.'
# echo ""

# Test 4: All Attractions (uncomment when you have a token)
# echo "📍 Test 4: All Attractions"
# curl -s -X GET "${BASE_URL}/api/authority/attractions?limit=10" \
#   -H "Authorization: Bearer ${AUTH_TOKEN}" | jq '.'
# echo ""

# Test 5: Filter Options (uncomment when you have a token)
# echo "📍 Test 5: Filter Options"
# curl -s -X GET "${BASE_URL}/api/authority/attractions/filter-options" \
#   -H "Authorization: Bearer ${AUTH_TOKEN}" | jq '.'
# echo ""

echo "🎯 To test authenticated endpoints:"
echo "1. Create an AUTHORITY user account via /api/auth/register"
echo "2. Login via /api/auth/login to get a JWT token"
echo "3. Add the token to AUTH_TOKEN variable in this script"
echo "4. Uncomment the authenticated test cases above"
echo ""
echo "📊 All authority endpoints are ready and waiting for authentication!"

# Example of creating an authority user (uncomment to use):
# echo "📝 Creating Authority User (uncomment to use):"
# echo "curl -X POST ${BASE_URL}/api/auth/register \\"
# echo "  -H 'Content-Type: application/json' \\"
# echo "  -d '{"
# echo "    \"username\": \"authority_user\","
# echo "    \"email\": \"authority@tourease.com\","
# echo "    \"password\": \"securepassword123\","
# echo "    \"roleId\": 1"
# echo "  }'"

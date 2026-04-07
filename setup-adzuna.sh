#!/bin/bash

# Adzuna Integration Setup Script
# This script helps set up and test the Adzuna API integration

echo "🚀 Adzuna API Integration Setup"
echo "================================"
echo ""

# Check if database exists
if [ ! -f "database.sqlite" ]; then
  echo "📦 Creating database..."
  npm run seed
else
  echo "✅ Database already exists"
fi

echo ""
echo "🌐 Testing Adzuna API Integration"
echo "================================="
echo ""

# Test 1: Fetch jobs from Adzuna (US)
echo "Test 1: Fetching jobs from Adzuna (US)..."
curl -s "http://localhost:5000/api/jobs?source=adzuna&country=us&limit=5" | jq '.total'

# Test 2: Search for specific jobs
echo ""
echo "Test 2: Searching for 'Python Developer' jobs..."
curl -s "http://localhost:5000/api/jobs/search?keywords=Python%20Developer&limit=3" | jq '.total'

# Test 3: Fetch jobs from different countries
echo ""
echo "Test 3: Fetching jobs from UK..."
curl -s "http://localhost:5000/api/jobs?source=adzuna&country=gb&limit=3" | jq '.total'

echo ""
echo "✅ Setup complete!"
echo ""
echo "📖 For more information, see ADZUNA_API_GUIDE.md"
echo ""

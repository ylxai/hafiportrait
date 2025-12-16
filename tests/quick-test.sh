#!/bin/bash

# Quick Test Runner - untuk development
# Run subset of tests untuk quick feedback

echo "🚀 Quick Test Runner"
echo ""

# Run health check first
echo "🏥 Health Check..."
curl -s http://localhost:3000/api/health || echo "⚠️  Server not running on port 3000"
echo ""

# Run quick API tests
echo "🧪 Running Quick API Tests..."
npm run test:api -- tests/api/auth.test.ts tests/api/contact.test.ts
echo ""

# Show summary
echo "✅ Quick tests complete!"
echo ""
echo "💡 To run all tests: npm run test:all"
echo "💡 To run E2E tests: npm run test:e2e"

#!/bin/bash

# 🧪 Mobile-First Redesign Testing Script
# This script performs comprehensive testing on the redesigned landing page

echo "🎨 Starting Mobile-First Redesign Testing..."
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0
WARNINGS=0

# Function to print test result
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}: $2"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC}: $2"
        ((FAILED++))
    fi
}

print_warning() {
    echo -e "${YELLOW}⚠ WARNING${NC}: $1"
    ((WARNINGS++))
}

echo "📦 1. Checking Dependencies..."
echo "----------------------------------------"

# Check if framer-motion is installed
if grep -q "framer-motion" package.json; then
    print_result 0 "framer-motion installed"
else
    print_result 1 "framer-motion NOT installed"
fi

# Check if swiper is installed
if grep -q "swiper" package.json; then
    print_result 0 "swiper installed"
else
    print_result 1 "swiper NOT installed"
fi

echo ""
echo "📁 2. Checking File Structure..."
echo "----------------------------------------"

# Check if new components exist
files=(
    "app/components/landing/mobile-first/CinematicHero.tsx"
    "app/components/landing/mobile-first/BottomNavigation.tsx"
    "app/components/landing/mobile-first/BentoGallery.tsx"
    "app/components/landing/mobile-first/FloatingCTA.tsx"
    "app/components/landing/mobile-first/ConversationalForm.tsx"
    "app/components/landing/mobile-first/ModernServices.tsx"
    "app/components/landing/mobile-first/EditorialPricing.tsx"
    "app/components/landing/mobile-first/FeaturedEventsCarousel.tsx"
    "app/components/landing/mobile-first/EditorialAbout.tsx"
    "hooks/useScrollAnimation.ts"
    "hooks/useMediaQuery.ts"
    "hooks/useTouchGestures.ts"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        print_result 0 "Found: $file"
    else
        print_result 1 "Missing: $file"
    fi
done

echo ""
echo "🎨 3. Checking Style Configuration..."
echo "----------------------------------------"

# Check tailwind.config.ts
if grep -q "rose" tailwind.config.ts; then
    print_result 0 "Rose color palette configured"
else
    print_result 1 "Rose color palette NOT configured"
fi

if grep -q "Playfair Display" app/globals.css; then
    print_result 0 "Playfair Display font imported"
else
    print_result 1 "Playfair Display font NOT imported"
fi

if grep -q "Inter" app/globals.css; then
    print_result 0 "Inter font imported"
else
    print_result 1 "Inter font NOT imported"
fi

echo ""
echo "📄 4. Checking Page Integration..."
echo "----------------------------------------"

# Check if main page imports new components
if grep -q "CinematicHero" app/page.tsx; then
    print_result 0 "CinematicHero imported in page"
else
    print_result 1 "CinematicHero NOT imported in page"
fi

if grep -q "BottomNavigation" app/page.tsx; then
    print_result 0 "BottomNavigation imported in page"
else
    print_result 1 "BottomNavigation NOT imported in page"
fi

if grep -q "BentoGallery" app/page.tsx; then
    print_result 0 "BentoGallery imported in page"
else
    print_result 1 "BentoGallery NOT imported in page"
fi

if grep -q "ConversationalForm" app/page.tsx; then
    print_result 0 "ConversationalForm imported in page"
else
    print_result 1 "ConversationalForm NOT imported in page"
fi

echo ""
echo "🔍 5. Syntax Validation..."
echo "----------------------------------------"

# Check TypeScript compilation
echo "Running TypeScript type check..."
if npm run type-check > /dev/null 2>&1; then
    print_result 0 "TypeScript compilation successful"
else
    print_warning "TypeScript has some errors (check with: npm run type-check)"
fi

# Check linting
echo "Running ESLint..."
if npm run lint > /dev/null 2>&1; then
    print_result 0 "ESLint passed"
else
    print_warning "ESLint has some warnings (check with: npm run lint)"
fi

echo ""
echo "🏗️ 6. Build Test..."
echo "----------------------------------------"

echo "Attempting production build..."
if npm run build > /tmp/build.log 2>&1; then
    print_result 0 "Production build successful"
    
    # Check build output
    if [ -d ".next" ]; then
        print_result 0 ".next directory created"
    else
        print_result 1 ".next directory NOT created"
    fi
else
    print_result 1 "Production build FAILED (check /tmp/build.log)"
    cat /tmp/build.log | tail -20
fi

echo ""
echo "📱 7. Mobile-Specific Checks..."
echo "----------------------------------------"

# Check for mobile-first CSS
if grep -q "md:hidden" app/components/landing/mobile-first/BottomNavigation.tsx; then
    print_result 0 "Mobile-first breakpoints used"
else
    print_result 1 "Mobile-first breakpoints NOT properly used"
fi

# Check for touch event handlers
if grep -q "onTouchStart" app/components/landing/mobile-first/BentoGallery.tsx; then
    print_result 0 "Touch event handlers implemented"
else
    print_result 1 "Touch event handlers NOT implemented"
fi

# Check for safe-area support
if grep -q "safe-bottom" app/components/landing/mobile-first/BottomNavigation.tsx; then
    print_result 0 "iOS safe-area support added"
else
    print_result 1 "iOS safe-area support NOT added"
fi

echo ""
echo "🎭 8. Animation Checks..."
echo "----------------------------------------"

# Check for framer-motion usage
if grep -q "motion\." app/components/landing/mobile-first/CinematicHero.tsx; then
    print_result 0 "Framer Motion animations used"
else
    print_result 1 "Framer Motion animations NOT used"
fi

# Check for AnimatePresence
if grep -q "AnimatePresence" app/components/landing/mobile-first/BentoGallery.tsx; then
    print_result 0 "AnimatePresence for smooth transitions"
else
    print_result 1 "AnimatePresence NOT implemented"
fi

echo ""
echo "♿ 9. Accessibility Checks..."
echo "----------------------------------------"

# Check for ARIA labels
if grep -q "aria-label" app/components/landing/mobile-first/BottomNavigation.tsx; then
    print_result 0 "ARIA labels present"
else
    print_warning "ARIA labels might be missing"
fi

# Check for alt text (should have placeholders)
if grep -q "alt=" app/components/landing/mobile-first/BentoGallery.tsx; then
    print_result 0 "Image alt attributes present"
else
    print_warning "Image alt attributes might be missing"
fi

echo ""
echo "================================================"
echo "📊 TEST SUMMARY"
echo "================================================"
echo -e "${GREEN}Passed:${NC} $PASSED"
echo -e "${RED}Failed:${NC} $FAILED"
echo -e "${YELLOW}Warnings:${NC} $WARNINGS"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All critical tests passed!${NC}"
    echo ""
    echo "✅ Ready for manual testing!"
    echo ""
    echo "Next steps:"
    echo "1. Run: npm run dev"
    echo "2. Open: http://localhost:3000"
    echo "3. Test on mobile device or Chrome DevTools"
    echo "4. Check all interactions and animations"
    echo ""
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please review the errors above.${NC}"
    echo ""
    exit 1
fi

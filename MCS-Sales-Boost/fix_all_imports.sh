#!/bin/bash

# Fix all UI component imports in the entire codebase
find client/src -type f -name "*.tsx" -exec sed -i 's|@/components/ui/|../../components/ui/|g' {} \;
find client/src/components -type f -name "*.tsx" -exec sed -i 's|../../components/ui/|../ui/|g' {} \;
find client/src/components/ui -type f -name "*.tsx" -exec sed -i 's|../ui/|./|g' {} \;

# Fix all lib imports
find client/src -type f -name "*.tsx" -exec sed -i 's|@/lib/|../../lib/|g' {} \;
find client/src/components -type f -name "*.tsx" -exec sed -i 's|../../lib/|../lib/|g' {} \;

# Fix all hooks imports
find client/src -type f -name "*.tsx" -exec sed -i 's|@/hooks/|../../hooks/|g' {} \;
find client/src/components -type f -name "*.tsx" -exec sed -i 's|../../hooks/|../hooks/|g' {} \;

# Fix all shared schema imports
find client/src -type f -name "*.tsx" -exec sed -i 's|@shared/schema|../../shared/schema|g' {} \;

# Fix component imports within components directory
find client/src/components -type f -name "*.tsx" -exec sed -i 's|@/components/|../|g' {} \;

echo "All imports fixed!"

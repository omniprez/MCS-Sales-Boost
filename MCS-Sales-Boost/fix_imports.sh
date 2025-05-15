#!/bin/bash

# Find all UI component files that import from @/lib/utils
files=$(find client/src/components/ui -type f -name "*.tsx" -exec grep -l "@/lib/utils" {} \;)

# Loop through each file and replace the import
for file in $files; do
  echo "Fixing imports in $file"
  sed -i 's|import { cn } from "@/lib/utils"|import { cn } from "../../lib/utils"|g' "$file"
done

echo "All imports fixed!"

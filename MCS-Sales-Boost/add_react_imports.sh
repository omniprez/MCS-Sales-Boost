#!/bin/bash

# Find all TSX files that don't already import React
files=$(find client/src -type f -name "*.tsx" -exec grep -L "import React" {} \;)

# Loop through each file and add the React import
for file in $files; do
  echo "Adding React import to $file"
  
  # Check if the file has any import from react
  if grep -q "import.*from \"react\"" "$file"; then
    # If it has an import from react, add React to it
    sed -i 's/import { \(.*\) } from "react";/import React, { \1 } from "react";/g' "$file"
  else
    # If it doesn't have an import from react, add a new import line
    sed -i '1s/^/import React from "react";\n/' "$file"
  fi
done

echo "All React imports added!"

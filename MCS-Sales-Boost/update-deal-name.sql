-- First, list all deals to see what's available
SELECT id, name, value, category, stage FROM deals LIMIT 10;

-- Update a specific deal (replace 1 with the actual deal ID you want to update)
UPDATE deals SET name = 'Updated Deal Name via SQL', updated_at = NOW() WHERE id = 1 RETURNING *;

-- Verify the update
SELECT id, name FROM deals WHERE id = 1;

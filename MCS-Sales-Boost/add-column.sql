-- Add contract_length column to deals table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'deals' 
        AND column_name = 'contract_length'
    ) THEN
        ALTER TABLE deals ADD COLUMN contract_length INTEGER;
    END IF;
END $$;

-- Add closed_date column to deals table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'deals' 
        AND column_name = 'closed_date'
    ) THEN
        ALTER TABLE deals ADD COLUMN closed_date TIMESTAMP;
    END IF;
END $$;

-- Create wip table if it doesn't exist
CREATE TABLE IF NOT EXISTS wip (
    id SERIAL PRIMARY KEY,
    deal_id INTEGER NOT NULL REFERENCES deals(id),
    projected_delivery_date TIMESTAMP,
    actual_delivery_date TIMESTAMP,
    billing_start_date TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create wip_updates table if it doesn't exist
CREATE TABLE IF NOT EXISTS wip_updates (
    id SERIAL PRIMARY KEY,
    wip_id INTEGER NOT NULL REFERENCES wip(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    projected_delivery_date TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create revenue_recognition table if it doesn't exist
CREATE TABLE IF NOT EXISTS revenue_recognition (
    id SERIAL PRIMARY KEY,
    wip_id INTEGER NOT NULL REFERENCES wip(id),
    month VARCHAR(7) NOT NULL,
    amount FLOAT NOT NULL,
    recognized BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

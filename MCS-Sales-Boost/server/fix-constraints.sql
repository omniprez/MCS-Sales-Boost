-- This script fixes the foreign key constraints in the database
-- to add ON DELETE CASCADE to all constraints related to the deals table.
-- This ensures that when a deal is deleted, all related records are automatically deleted.

-- First, create any missing tables that are required for the application

-- Create the wip table if it doesn't exist
CREATE TABLE IF NOT EXISTS wip (
    id SERIAL PRIMARY KEY,
    deal_id INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT wip_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE
);

-- Create the installations table if it doesn't exist
CREATE TABLE IF NOT EXISTS installations (
    id SERIAL PRIMARY KEY,
    deal_id INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    installation_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT installations_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE
);

-- Create the wip_updates table if it doesn't exist
CREATE TABLE IF NOT EXISTS wip_updates (
    id SERIAL PRIMARY KEY,
    wip_id INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT wip_updates_wip_id_fkey FOREIGN KEY (wip_id) REFERENCES wip(id) ON DELETE CASCADE
);

-- Create the revenue_recognition table if it doesn't exist
CREATE TABLE IF NOT EXISTS revenue_recognition (
    id SERIAL PRIMARY KEY,
    wip_id INTEGER NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    recognition_date DATE NOT NULL,
    financial_year VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT revenue_recognition_wip_id_fkey FOREIGN KEY (wip_id) REFERENCES wip(id) ON DELETE CASCADE
);

-- First, check if the wip table exists and has a foreign key to deals
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'wip'
    ) THEN
        -- Get the constraint name for the foreign key from wip to deals
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
              ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage ccu
              ON ccu.constraint_name = tc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY'
              AND tc.table_name = 'wip'
              AND ccu.table_name = 'deals'
        ) THEN
            -- Drop and recreate the constraint with ON DELETE CASCADE
            EXECUTE (
                'ALTER TABLE wip DROP CONSTRAINT ' ||
                (SELECT tc.constraint_name FROM information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu
                  ON tc.constraint_name = kcu.constraint_name
                JOIN information_schema.constraint_column_usage ccu
                  ON ccu.constraint_name = tc.constraint_name
                WHERE tc.constraint_type = 'FOREIGN KEY'
                  AND tc.table_name = 'wip'
                  AND ccu.table_name = 'deals'
                LIMIT 1)
            );

            EXECUTE (
                'ALTER TABLE wip ADD CONSTRAINT wip_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE'
            );

            RAISE NOTICE 'Fixed foreign key constraint from wip to deals';
        END IF;
    END IF;
END $$;

-- Check if the revenue_recognition table exists and has a foreign key to wip
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'revenue_recognition'
    ) THEN
        -- Get the constraint name for the foreign key from revenue_recognition to wip
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
              ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage ccu
              ON ccu.constraint_name = tc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY'
              AND tc.table_name = 'revenue_recognition'
              AND ccu.table_name = 'wip'
        ) THEN
            -- Drop and recreate the constraint with ON DELETE CASCADE
            EXECUTE (
                'ALTER TABLE revenue_recognition DROP CONSTRAINT ' ||
                (SELECT tc.constraint_name FROM information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu
                  ON tc.constraint_name = kcu.constraint_name
                JOIN information_schema.constraint_column_usage ccu
                  ON ccu.constraint_name = tc.constraint_name
                WHERE tc.constraint_type = 'FOREIGN KEY'
                  AND tc.table_name = 'revenue_recognition'
                  AND ccu.table_name = 'wip'
                LIMIT 1)
            );

            EXECUTE (
                'ALTER TABLE revenue_recognition ADD CONSTRAINT revenue_recognition_wip_id_fkey FOREIGN KEY (wip_id) REFERENCES wip(id) ON DELETE CASCADE'
            );

            RAISE NOTICE 'Fixed foreign key constraint from revenue_recognition to wip';
        END IF;
    END IF;
END $$;

-- Check if the wip_updates table exists and has a foreign key to wip
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'wip_updates'
    ) THEN
        -- Get the constraint name for the foreign key from wip_updates to wip
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
              ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage ccu
              ON ccu.constraint_name = tc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY'
              AND tc.table_name = 'wip_updates'
              AND ccu.table_name = 'wip'
        ) THEN
            -- Drop and recreate the constraint with ON DELETE CASCADE
            EXECUTE (
                'ALTER TABLE wip_updates DROP CONSTRAINT ' ||
                (SELECT tc.constraint_name FROM information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu
                  ON tc.constraint_name = kcu.constraint_name
                JOIN information_schema.constraint_column_usage ccu
                  ON ccu.constraint_name = tc.constraint_name
                WHERE tc.constraint_type = 'FOREIGN KEY'
                  AND tc.table_name = 'wip_updates'
                  AND ccu.table_name = 'wip'
                LIMIT 1)
            );

            EXECUTE (
                'ALTER TABLE wip_updates ADD CONSTRAINT wip_updates_wip_id_fkey FOREIGN KEY (wip_id) REFERENCES wip(id) ON DELETE CASCADE'
            );

            RAISE NOTICE 'Fixed foreign key constraint from wip_updates to wip';
        END IF;
    END IF;
END $$;

-- Check if the installations table exists and has a foreign key to deals
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'installations'
    ) THEN
        -- Get the constraint name for the foreign key from installations to deals
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
              ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage ccu
              ON ccu.constraint_name = tc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY'
              AND tc.table_name = 'installations'
              AND ccu.table_name = 'deals'
        ) THEN
            -- Drop and recreate the constraint with ON DELETE CASCADE
            EXECUTE (
                'ALTER TABLE installations DROP CONSTRAINT ' ||
                (SELECT tc.constraint_name FROM information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu
                  ON tc.constraint_name = kcu.constraint_name
                JOIN information_schema.constraint_column_usage ccu
                  ON ccu.constraint_name = tc.constraint_name
                WHERE tc.constraint_type = 'FOREIGN KEY'
                  AND tc.table_name = 'installations'
                  AND ccu.table_name = 'deals'
                LIMIT 1)
            );

            EXECUTE (
                'ALTER TABLE installations ADD CONSTRAINT installations_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE'
            );

            RAISE NOTICE 'Fixed foreign key constraint from installations to deals';
        END IF;
    END IF;
END $$;

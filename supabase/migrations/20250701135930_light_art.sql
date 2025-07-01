/*
  # Add availability field to listings table

  1. New Fields
    - `availability` - Text field for dealer listings to indicate if the motorcycle is in stock or available on order
  
  2. Changes
    - Add availability field with default value "pe_stoc"
    - Add check constraint to ensure valid values
*/

-- Add availability field if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'listings' AND column_name = 'availability'
  ) THEN
    ALTER TABLE listings ADD COLUMN availability text DEFAULT 'pe_stoc';
    
    -- Add constraint to ensure valid values
    ALTER TABLE listings ADD CONSTRAINT listings_availability_check 
      CHECK (availability IN ('pe_stoc', 'la_comanda'));
  END IF;
END $$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_listings_availability ON listings(availability);

-- Update existing dealer listings to have availability set
UPDATE listings 
SET availability = 'pe_stoc' 
WHERE seller_type = 'dealer' AND availability IS NULL;
-- Migration 003: Full-text search for vehicles

-- Add search vector column to vehicles
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create function to update search vector
CREATE OR REPLACE FUNCTION update_vehicle_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.make, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.model, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.category, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.features, ' '), '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.fuel_type, '')), 'D') ||
    setweight(to_tsvector('english', COALESCE(NEW.transmission, '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update search vector
DROP TRIGGER IF EXISTS vehicle_search_vector_update ON vehicles;
CREATE TRIGGER vehicle_search_vector_update
  BEFORE INSERT OR UPDATE ON vehicles
  FOR EACH ROW
  EXECUTE FUNCTION update_vehicle_search_vector();

-- Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_vehicles_search ON vehicles USING GIN(search_vector);

-- Update existing vehicles with search vectors
UPDATE vehicles SET search_vector = 
  setweight(to_tsvector('english', COALESCE(make, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(model, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(category, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(array_to_string(features, ' '), '')), 'C') ||
  setweight(to_tsvector('english', COALESCE(fuel_type, '')), 'D') ||
  setweight(to_tsvector('english', COALESCE(transmission, '')), 'D')
WHERE search_vector IS NULL;

-- Add indexes for common filter columns
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_location ON vehicles(location_id);


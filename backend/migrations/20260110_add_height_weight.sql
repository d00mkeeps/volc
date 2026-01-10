-- Add weight and height columns to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN height_cm DECIMAL(5,2),
ADD COLUMN current_weight_kg DECIMAL(5,2);

-- Add constraints
ALTER TABLE public.user_profiles
ADD CONSTRAINT positive_height CHECK (height_cm > 0 OR height_cm IS NULL),
ADD CONSTRAINT positive_weight CHECK (current_weight_kg > 0 OR current_weight_kg IS NULL);

-- Add Paymob Public Key for Unified Checkout (Intention API)
ALTER TABLE site_settings
ADD COLUMN IF NOT EXISTS paymob_public_key TEXT;

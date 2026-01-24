-- IntegrateWise Products Table
-- Covers all 5 tiers: Professional Services, Recurring Revenue, Scalable, Digital Products + SaaS, Community

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  tier INTEGER NOT NULL CHECK (tier BETWEEN 1 AND 5),
  tier_name VARCHAR(100) NOT NULL,
  category VARCHAR(100),
  pricing_model VARCHAR(50) NOT NULL, -- 'fixed', 'monthly', 'yearly', 'custom', 'free'
  price_min DECIMAL(12, 2),
  price_max DECIMAL(12, 2),
  currency VARCHAR(10) DEFAULT 'INR',
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  icon VARCHAR(50),
  color VARCHAR(50),
  features JSONB DEFAULT '[]',
  deliverables JSONB DEFAULT '[]',
  ideal_for TEXT,
  external_url TEXT,
  sort_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_tier ON products(tier);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to products" ON products;
CREATE POLICY "Allow all access to products" ON products FOR ALL USING (true);

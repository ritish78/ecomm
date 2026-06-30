ALTER TABLE products ADD COLUMN IF NOT EXISTS search_vector tsvector;
CREATE INDEX IF NOT EXISTS product_search_vector_index ON products USING gin(search_vector);

UPDATE products p SET search_vector = to_tsvector('english', coalesce(p.name, '') || ' ' || coalesce(p.description, '') || ' ' || coalesce(b.name, '') || ' ' || coalesce(c.name, '')) FROM brands b, categories c WHERE p.brand_id = b.id AND p.category_id = c.id;

CREATE OR REPLACE FUNCTION products_search_vector_update()
RETURNS trigger AS $$
DECLARE
  brand_name text;
  category_name text;
BEGIN
  SELECT name INTO brand_name FROM brands WHERE id = NEW.brand_id;
  SELECT name INTO category_name FROM categories WHERE id = NEW.category_id;

  NEW.search_vector := to_tsvector(
    'english',
    coalesce(NEW.name, '') || ' ' ||
    coalesce(NEW.description, '') || ' ' ||
    coalesce(brand_name, '') || ' ' ||
    coalesce(category_name, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_search_vector_trigger
BEFORE INSERT OR UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION products_search_vector_update();
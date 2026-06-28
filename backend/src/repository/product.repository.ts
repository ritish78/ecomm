import { eq } from "drizzle-orm";
import db from "../db";
import { products } from "../models/products.model";
import { brands } from "../models/brands.model";
import { categories } from "../models/categories.model";

export const findProductById = async (productId: string) => {
  const [productFromDatabase] = await db.select().from(products).where(eq(products.id, productId));

  return productFromDatabase;
};

export const findProductWithDetailsById = async (productId: string) => {
  //I want to implement this:
  /**
     * SELECT
        p.id,
        p.name,
        p.slug,
        p.description,
        p.brand_id,
        b.name AS brand,
        p.category_id,
        c.name AS category,
        c.slug AS category_slug,
        p.is_active,
        p.created_at,
        p.updated_at,

        (
            SELECT COALESCE(json_agg(
            json_build_object(
                'id', pi.id,
                'imageUrl', pi.image_url,
                'altText', pi.alt_text,
                'displayOrder', pi.display_order,
                'isPrimary', pi.is_primary
            ) ORDER BY pi.display_order
            ), '[]'::json)
            FROM product_images pi
            WHERE pi.product_id = p.id
        ) AS images,
        (
            SELECT COALESCE(json_agg(
            json_build_object(
                'id', pv.id,
                'weight', pv.weight,
                'unit', pv.unit,
                'price', pv.price,
                'stock', pv.stock,
                'sku', pv.sku
            )
            ), '[]'::json)
            FROM product_variants pv
            WHERE pv.product_id = p.id
        ) AS variants

        FROM products p
        INNER JOIN brands b ON p.brand_id = b.id
        INNER JOIN categories c ON p.category_id = c.id;
     */
  //using drizzle, need to implemented above query in a different way.
  const [productRow] = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      description: products.description,
      isActive: products.isActive,
      createdAt: products.createdAt,
      updatedAt: products.createdAt,
      brand: {
        id: brands.id,
        name: brands.name,
      },
      category: {
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
      },
    })
    .from(products)
    .innerJoin(brands, eq(products.brandId, brands.id))
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.id, productId));

  //for now, have only implemented fetching product from products, brands and categories table

  return productRow;
};

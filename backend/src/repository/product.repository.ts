import { asc, eq } from "drizzle-orm";
import db from "../db";
import { products } from "../models/products.model";
import { brands } from "../models/brands.model";
import { categories } from "../models/categories.model";
import { productImages } from "../models/productImages.model";
import { productVariants } from "../models/productVariant.model";
import isUuid from "../utils/isUUID";

export const findProductById = async (productId: string) => {
  const [productFromDatabase] = await db.select().from(products).where(eq(products.id, productId));

  return productFromDatabase;
};

/**
 * @deprecated use findProductWithDetailsByIdOrSlug
 */
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
      sellerId: products.sellerId,
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

  //exiting early if there is no product of provided id
  if (!productRow) {
    return null;
  }

  const productImagesQuery = db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, productId))
    .orderBy(asc(productImages.displayOrder));

  const productsVariantsQuery = db
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, productId));

  //after getting the products, we are querying the images and variants table in a Promise.all
  //statement. We could also query the products same way which we are querying images and variants
  //and we would have the max time of (max of products/images/variants) but we have implemented
  //products + max of images/variants. we expect to get more hits on products that does not exists
  //than products that does exists. Saw that bots account for more than 50% of traffic world wide.
  //we could change to query all in one go in the future if we see that users are more likely to
  //search for products that does exists.
  //and these queries are not the same that I wanted to implement that I wrote commented out many
  //lines above. This works well with Drizzle ORM.
  const [images, variants] = await Promise.all([productImagesQuery, productsVariantsQuery]);

  return {
    ...productRow,
    images,
    variants,
  };
};

export const findProductWithDetailsByIdOrSlug = async (productIdentifier: string) => {
  const isIdentifierUuid = isUuid(productIdentifier);

  const [productRow] = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      sellerId: products.sellerId,
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
    .where(isIdentifierUuid ? eq(products.id, productIdentifier) : eq(products.slug, productIdentifier));

  //exiting early if there is no product of provided id
  if (!productRow) {
    return null;
  }

  const productImagesQuery = db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, productRow.id))
    .orderBy(asc(productImages.displayOrder));

  const productsVariantsQuery = db
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, productRow.id));

  //after getting the products, we are querying the images and variants table in a Promise.all
  //statement. We could also query the products same way which we are querying images and variants
  //and we would have the max time of (max of products/images/variants) but we have implemented
  //products + max of images/variants. we expect to get more hits on products that does not exists
  //than products that does exists. Saw that bots account for more than 50% of traffic world wide.
  //we could change to query all in one go in the future if we see that users are more likely to
  //search for products that does exists.
  //and these queries are not the same that I wanted to implement that I wrote commented out many
  //lines above. This works well with Drizzle ORM.
  const [images, variants] = await Promise.all([productImagesQuery, productsVariantsQuery]);

  return {
    ...productRow,
    images,
    variants,
  };
};



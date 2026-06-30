import { and, asc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import db from "../db";
import { Product, products } from "../models/products.model";
import { brands } from "../models/brands.model";
import { categories } from "../models/categories.model";
import { productImages } from "../models/productImages.model";
import { productVariants } from "../models/productVariant.model";
import isUuid from "../utils/isUUID";
import { FilterProductInput } from "../schema/product.schema";
import { isMainThread } from "node:worker_threads";

export const findProductById = async (productId: string): Promise<Product> => {
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
      updatedAt: products.updatedAt,
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

export const filterProducts = async (filters: FilterProductInput) => {
  const { keyword, categoryId, brandId, minPrice, maxPrice, limit, page, sort } = filters;

  const offset = (page - 1) * limit;

  const conditions = [eq(products.isActive, true)];

  if (categoryId) {
    conditions.push(eq(products.categoryId, categoryId));
  }

  if (brandId) {
    conditions.push(eq(products.brandId, brandId));
  }

  if (keyword) {
    conditions.push(
      or(
        sql`${products.searchVector} @@ websearch_to_tsquery('english', ${keyword})`,
        ilike(products.name, `%${keyword}%`),
      )!,
    );
  }

  //now selecting if the filter is on product variants
  const priceConditions = [];

  if (minPrice !== undefined) {
    priceConditions.push(sql`MIN(${productVariants.price}) >= ${minPrice}`);
  }

  if (maxPrice !== undefined) {
    priceConditions.push(sql`MAX(${productVariants.price} <= ${maxPrice})`);
  }

  const whereClause = and(...conditions);
  const havingClause = priceConditions.length > 0 ? and(...priceConditions) : undefined;

  const orderByClause = (() => {
    switch (sort) {
      case "price_asc":
        return sql`MIN(${productVariants.price}) FILTER (WHERE ${productVariants.isAvailable} = true) ASC NULLS LAST`;
      case "price_desc":
        return sql`MIN(${productVariants.price}) FILTER (WHERE ${productVariants.isAvailable} = true) DESC NULLS LAST`;
      case "name_asc":
        return sql`${products.name} ASC`;
      case "name_desc":
        return sql`${products.name} DESC`;
      case "newest":
        return sql`${products.createdAt} DESC`;
      case "oldest":
        return sql`${products.createdAt} ASC`;
      case "relevant":
      default:
        return keyword
          ? sql<number>`ts_rank(${products.searchVector}, websearch_to_tsquery('english', ${keyword}))`
          : sql<number>`1`;
    }
  })();

  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      description: products.description,
      isActive: products.isActive,
      brandId: brands.id,
      brandName: brands.name,
      categoryId: categories.id,
      categoryName: categories.name,
      categorySlug: categories.slug,
      minPrice: sql<
        string | null
      >`MIN(${productVariants.price}) FILTER (WHERE ${productVariants.isAvailable} = true)`,
      maxPrice: sql<
        string | null
      >`MAX(${productVariants.price}) FILTER (WHERE ${productVariants.isAvailable} = true)`,
      variantCount: sql<number>`COUNT(${productVariants.id}) FILTER (WHERE ${productVariants.isAvailable} = true)`,
      //for selecting, we are doing MIN again like in minPrice eventhough MIN returns smallest
      //we know there are only one primary image for one product, we are selecting smallest
      //by the character length of the url. we could do better but it would +1 query
      primaryImageUrl: sql<
        string | null
      >`MIN(${productImages.imageUrl}) FILTER (WHERE ${productImages.isPrimary} = true)`,
      primaryImageAltText: sql<
        string | null
      >`MIN(${productImages.altText}) FILTER (WHERE ${productImages.isPrimary} = true)`,
    })
    .from(products)
    .innerJoin(brands, eq(products.brandId, brands.id))
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(productVariants, eq(products.id, productVariants.productId))
    .leftJoin(productImages, eq(products.id, productImages.productId))
    .where(whereClause)
    .groupBy(products.id, brands.id, categories.id)
    .having(havingClause)
    .orderBy(orderByClause)
    .limit(limit)
    .offset(offset);

  const [{ total }] = await db
    .select({ total: sql<number>`COUNT(DISTINCT ${products.id})` })
    .from(products)
    .innerJoin(brands, eq(products.brandId, brands.id))
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(productVariants, eq(products.id, productVariants.productId))
    .where(whereClause)
    .having(havingClause);

  const data = rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    isActive: row.isActive,
    brand: {
      id: row.brandId,
      name: row.brandName,
    },
    category: {
      id: row.categoryId,
      name: row.categoryName,
      slug: row.categorySlug,
    },
    primaryImage: row.primaryImageUrl
      ? { imageUrl: row.primaryImageUrl, altText: row.primaryImageAltText }
      : null,
    minPrice: row.minPrice,
    maxPrice: row.maxPrice,
    variantCount: Number(row.variantCount),
  }));

  return {
    totalProducts: Number(total),
    page,
    limit,
    totalPages: Math.ceil(Number(total) / limit),
    data,
  };
};

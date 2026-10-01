import { and, asc, eq, gt, ilike, isNull, or, sql } from "drizzle-orm";
import db, { Tx } from "../db";
import { Product, products } from "../models/products.model";
import { brands } from "../models/brands.model";
import { categories } from "../models/categories.model";
import { productImages } from "../models/productImages.model";
import { productVariants } from "../models/productVariant.model";
import isUuid from "../utils/isUuid";
import { CreateProductVariantInput, FilterProductInput, UpdateProductInput } from "../schema/product.schema";
import toOrQuery from "../utils/toOrQuery";
import { StoreProducts, storeProducts } from "../models/storeProducts.model";
import { AddProductVariantInput, UpdateProductVariantInput } from "../schema/productVariants.schema";
import { randomUUID } from "node:crypto";

/**
 * @param {string} productId - id of the product to get
 * @returns {Promise<Product | null>} - the retrieved product or null if not found
 */
export const findProductById = async (productId: string): Promise<Product | null> => {
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

/**
 * @param {string} productIdentifier - id or slug of the product to get
 * @returns {Promise<ProductWithDetails | null>} - the retrieved product with details or null if not found
 */
export const findProductWithDetailsByIdOrSlug = async (productIdentifier: string) => {
  const isIdentifierUuid = isUuid(productIdentifier);

  const [productRow] = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
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
    .where(
      and(
        eq(productVariants.productId, productRow.id),
        or(isNull(productVariants.discontinuedAt), gt(productVariants.stock, 0)),
      ),
    );

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

/**
 * @param {FilterProductInput} filters - filters to use to filter the products
 * @returns {Promise<{ totalProducts: number; page: number; limit: number; totalPages: number; data: Product[] }>} - the filtered products with pagination
 */
export const filterProducts = async (filters: FilterProductInput) => {
  const { keyword, storeId, categoryId, brandId, minPrice, maxPrice, limit, page, sort } = filters;

  const offset = (page - 1) * limit;

  //a discontinued variant can still be sold while its stock is not zero
  const availableVariantCondition = sql`
      ${productVariants.isAvailable} = true
      AND (
        ${productVariants.discontinuedAt} IS NULL
        OR ${productVariants.stock} > 0
      )`;

  const conditions = [eq(products.isActive, true)];

  if (categoryId) {
    conditions.push(eq(products.categoryId, categoryId));
  }

  if (brandId) {
    conditions.push(eq(products.brandId, brandId));
  }

  const orQueryKeyword = keyword ? toOrQuery(keyword) : undefined;
  if (keyword) {
    conditions.push(
      or(
        sql`${products.searchVector} @@ websearch_to_tsquery('english', ${orQueryKeyword})`,
        ilike(products.name, `%${keyword}%`),
      )!,
    );
  }

  if (storeId) {
    conditions.push(
      sql`EXISTS (SELECT 1 FROM ${storeProducts} WHERE ${storeProducts.productId} = ${products.id} AND ${storeProducts.storeId} = ${storeId})`,
    );
  }

  //now selecting if the filter is on product variants
  const priceConditions = [];

  if (minPrice !== undefined) {
    priceConditions.push(
      sql`MIN(${productVariants.price}) FILTER (WHERE ${availableVariantCondition}) >= ${minPrice}`,
    );
  }

  if (maxPrice !== undefined) {
    priceConditions.push(
      sql`MAX(${productVariants.price}) FILTER (WHERE ${availableVariantCondition}) <= ${maxPrice}`,
    );
  }

  const whereClause = and(...conditions);
  const havingClause = priceConditions.length > 0 ? and(...priceConditions) : undefined;

  const orderByClause = (() => {
    switch (sort) {
      case "price_asc":
        return sql`MIN(${productVariants.price}) FILTER (WHERE ${availableVariantCondition}) ASC NULLS LAST`;
      case "price_desc":
        return sql`MIN(${productVariants.price}) FILTER (WHERE ${availableVariantCondition}) DESC NULLS LAST`;
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
          ? sql`ts_rank(${products.searchVector}, websearch_to_tsquery('english', ${orQueryKeyword})) DESC`
          : sql`${products.createdAt} DESC`;
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
      minPrice: sql<string | null>`MIN(${productVariants.price}) FILTER (WHERE ${availableVariantCondition})`,
      maxPrice: sql<string | null>`MAX(${productVariants.price}) FILTER (WHERE ${availableVariantCondition})`,
      //joining images can repeat each variant, so we count each variant only once.
      variantCount: sql<number>`COUNT(DISTINCT ${productVariants.id}) FILTER (WHERE ${availableVariantCondition})
`,
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
    .orderBy(orderByClause, products.id)
    .limit(limit)
    .offset(offset);

  const totalQuery = db
    .select({ id: products.id })
    .from(products)
    .innerJoin(brands, eq(products.brandId, brands.id))
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(productVariants, eq(products.id, productVariants.productId))
    .where(whereClause)
    .groupBy(products.id, brands.id, categories.id)
    .having(havingClause)
    .as("filtered_products");

  const [{ total }] = await db.select({ total: sql<number>`COUNT(*)` }).from(totalQuery);

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

/**
 * @param {Tx} tx - database transaction or a database connection
 * @param {string} name - name of the product to create
 * @param {string} slug - slug of the product to create
 * @param {string | undefined} description - description of the product to create
 * @param {string} brandId - id of the brand to associate with the product
 * @param {string} categoryId - id of the category to associate with the product
 * @returns {Promise<Product>} - the created product
 */
export const createProduct = async (
  tx: Tx,
  name: string,
  slug: string,
  description: string | undefined,
  brandId: string,
  categoryId: string,
) => {
  //should I make a junction table to store storeId and productId or should I store store_id in products table
  //in my previous projects, I would have gone with storing the store_id in products table itself
  //but for this, I want to use a junction table store_products table instead.
  const [product] = await tx
    .insert(products)
    .values({ name, slug, description, brandId, categoryId })
    .returning();

  return product;
};

/**
 * @param {Tx} tx - database transaction or a database connection
 * @param {string} productId - ID of the product to create variants for
 * @param {CreateProductVariantInput[]} variants - list of variants to create
 * @returns {Promise<ProductVariant[]>} - the created product variants
 */
export const createProductVariants = async (
  tx: Tx,
  productId: string,
  variants: CreateProductVariantInput[],
) => {
  const productVariant = await tx
    .insert(productVariants)
    .values(
      variants.map((variant, index) => ({
        productId,
        weight: variant.weight,
        unit: variant.unit,
        price: variant.price,
        stock: variant.stock ?? 0,
        sku: variant.sku ?? `${productId}-${variant.weight}${variant.unit}-${index + 1}`.toUpperCase(),
        isAvailable: true,
      })),
    )
    .returning();

  return productVariant;
};

/**
 * @param {Tx} tx - database transaction or a database connection
 * @param {string} storeId - ID of the store to link the product to
 * @param {string} productId - ID of the product to link to the store
 * @returns {Promise<StoreProduct>} - the linked store product
 */
export const linkProductToStore = async (tx: Tx, storeId: string, productId: string) => {
  const [storeProduct] = await tx.insert(storeProducts).values({ storeId, productId }).returning();

  return storeProduct;
};

/**
 * @param {string} storeId - id of the store to get the product for
 * @param {string} productId - id of the product to get for the store
 * @returns {Promise<StoreProduct | null>} - the retrieved store product
 */
export const findStoreProductByStoreIdAndProductId = async (storeId: string, productId: string) => {
  const [storeProduct] = await db
    .select()
    .from(storeProducts)
    .where(and(eq(storeProducts.storeId, storeId), eq(storeProducts.productId, productId)))
    .limit(1);

  return storeProduct;
};

/**
 * @param {string} productId - id of the product to delete
 * @param {Tx} tx - optional database transaction
 * @returns {Promise<Product | null>} - the deleted product
 */
export const deleteProductById = async (productId: string, tx?: Tx) => {
  const userClient = tx ? tx : db;

  const [deletedProduct] = await userClient.delete(products).where(eq(products.id, productId)).returning();

  return deletedProduct;
};

//feel like we can edit the filterProducts function to accept storeId
//and filter product by storeId and we will have type of return
//and when we change any one of the function, we won't have to change
//the other function.
// export const getAllProductsOfStore = async (storeId: string) => {
//   const productsOfStore = await db
//     .select({
//       id: products.id,
//       name: products.name,
//       slug: products.slug,
//       description: products.description,
//       isActive: products.isActive,
//       brandId: brands.id,
//       brandName: brands.name,
//       categoryId: categories.id,
//       categoryName: categories.name,
//       categorySlug: categories.slug,
//     })
//     .from(products)
//     .innerJoin(storeProducts, eq(products.id, storeProducts.productId))
//     .innerJoin(brands, eq(products.brandId, brands.id))
//     .innerJoin(categories, eq(products.categoryId, categories.id))
//     .leftJoin(productVariants, eq(products.id, productVariants.productId))
//     .groupBy(products.id, brands.id, categories.id)
//     .where(eq(storeProducts.storeId, storeId))
//     .orderBy(asc(products.name));

//   return productsOfStore;
// };

/**
 * @param {Tx} tx - database transaction or a database connection
 * @param {string} productId - ID of the product to update
 * @returns {Promise<Product | undefined>} - the product or undefined if not found
 */
export const findProductForUpdate = async (tx: Tx, productId: string) => {
  //first we lock the product in the database before updating it
  //if another user wants to update the same product, then it waits
  //for this transaction to complete
  const [productFromDatabase] = await tx
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .for("update");

  return productFromDatabase;
};

/**
 * @param {Tx} tx - database transaction or a database connection
 * @param {string} productId - ID of the product which is associated with store
 * @returns {Promise<StoreProducts[]>}
 */
export const getProductStoreLinksForUpdate = async (tx: Tx, productId: string) => {
  return tx.select().from(storeProducts).where(eq(storeProducts.productId, productId)).for("update");
};

/**
 * @param {Tx} tx - database transaction or a database connection
 * @param {string} brandId - ID of the brand to use
 * @param {string} categoryId - ID of the category to use
 * @returns
 */
export const getProductReferencesForUpdate = async (tx: Tx, brandId: string, categoryId: string) => {
  //we will check both brand and category exists or not before updating the product
  //key share lock prevents the brand and category from being deleted while this transaction is processing
  const [brand] = await tx.select().from(brands).where(eq(brands.id, brandId)).for("key share");

  const [category] = await tx.select().from(categories).where(eq(categories.id, categoryId)).for("key share");

  return { brand, category };
};

export const updateProductById = async (tx: Tx, productId: string, productInfo: UpdateProductInput) => {
  const updateData: Partial<typeof products.$inferInsert> = {
    updatedAt: new Date(),
  };

  //we only add the fields that the user provided to update
  //we are using a PATCH so, we only update columns that we were provided with
  if (productInfo.name !== undefined) {
    updateData.name = productInfo.name;
  }

  if (productInfo.description !== undefined) {
    updateData.description = productInfo.description;
  }

  if (productInfo.categoryId !== undefined) {
    updateData.categoryId = productInfo.categoryId;
  }

  if (productInfo.brandId !== undefined) {
    updateData.brandId = productInfo.brandId;
  }

  //we will still keep the same slug when updating the product.
  //we don't want users to change the whole product to another product
  //slug will still have the information of the product
  const [updatedProduct] = await tx
    .update(products)
    .set(updateData)
    .where(eq(products.id, productId))
    .returning();

  return updatedProduct;
};

export const getProductVariantsForManagement = async (productId: string) => {
  //when we are managing store, we need to know about all the products
  //even if they are discontinued or the variants that we don't have stock
  return db
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, productId))
    .orderBy(asc(productVariants.createdAt), asc(productVariants.id));
};

export const addProductVariant = async (tx: Tx, productId: string, variantInfo: AddProductVariantInput) => {
  //if the user provides a SKU, then we use it
  //but if the user does not provide it, then we create one
  const sku = variantInfo.sku ?? `VAR-${randomUUID()}`.toUpperCase();

  const [variant] = await tx
    .insert(productVariants)
    .values({
      productId,
      weight: variantInfo.weight,
      unit: variantInfo.unit,
      price: variantInfo.price,
      stock: variantInfo.stock,
      sku,
      isAvailable: true,
    })
    .onConflictDoNothing({
      target: productVariants.sku,
    })
    .returning();

  return variant;
};

export const findProductVariantForUpdate = async (tx: Tx, productId: string, variantId: string) => {
  //we need to check both id so that a variant belonging to another
  //product won't be updated by changing the variant id in the url
  const [variant] = await tx
    .select()
    .from(productVariants)
    .where(and(eq(productVariants.id, variantId), eq(productVariants.productId, productId)))
    .for("update");

  return variant;
};

export const updateProductVariantById = async (
  tx: Tx,
  productId: string,
  variantId: string,
  variantInfo: UpdateProductVariantInput,
) => {
  const updateData: Partial<typeof productVariants.$inferInsert> = {
    updatedAt: new Date(),
  };

  //we only update the fields that the user provided
  if (variantInfo.weight !== undefined) {
    updateData.weight = variantInfo.weight;
  }

  if (variantInfo.unit !== undefined) {
    updateData.unit = variantInfo.unit;
  }

  if (variantInfo.sku !== undefined) {
    updateData.sku = variantInfo.sku;
  }

  if (variantInfo.isAvailable !== undefined) {
    updateData.isAvailable = variantInfo.isAvailable;
  }

  if (variantInfo.discontinue === true) {
    if (updateData.discontinuedAt === null || updateData.discontinuedAt === undefined) {
      updateData.discontinuedAt = new Date();
    }
  }

  const [updatedVariant] = await tx
    .update(productVariants)
    .set(updateData)
    .where(and(eq(productVariants.id, variantId), eq(productVariants.productId, productId)))
    .returning();

  return updatedVariant;
};

export const updateProductVariantPriceById = async (
  tx: Tx,
  productId: string,
  variantId: string,
  price: string,
) => {
  //we are only going to update the price and the update time in this function
  const [updatedProductVariant] = await tx
    .update(productVariants)
    .set({ price, updatedAt: new Date() })
    .where(and(eq(productVariants.productId, productId), eq(productVariants.id, variantId)))
    .returning();

  return updatedProductVariant;
};

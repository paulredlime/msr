import { Product } from "@/api/entities";
import { StoreProduct } from "@/api/entities";
import { Store } from "@/api/entities";

export default function ProductsApi() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Products API</h1>
      <div className="bg-blue-50 p-4 rounded">
        <p>Get products from the database.</p>
        <p>GET with ?store=storename&limit=10</p>
      </div>
    </div>
  );
}

export async function getServerSideProps({ req, res, query }) {
  if (req.method !== 'GET') {
    return { props: {} };
  }

  const { store, limit = 10 } = query;

  try {
    if (store) {
      // Get products for specific store
      const stores = await Store.filter({ name: store });
      if (stores.length === 0) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ products: [] }));
        return { props: {} };
      }

      const storeRecord = stores[0];
      const storeProducts = await StoreProduct.filter(
        { store_id: storeRecord.id },
        '-last_seen',
        parseInt(limit)
      );

      const products = [];
      for (const storeProduct of storeProducts) {
        const productRecords = await Product.filter({ id: storeProduct.product_id });
        if (productRecords.length > 0) {
          const product = productRecords[0];
          products.push({
            id: product.id,
            title: product.title,
            brand: product.brand,
            price: storeProduct.price / 100, // Convert from pence to pounds
            loyaltyPrice: storeProduct.loyalty_price ? storeProduct.loyalty_price / 100 : null,
            url: storeProduct.url,
            imageUrl: product.image_url,
            category: product.category,
            lastSeen: storeProduct.last_seen,
            availability: storeProduct.availability
          });
        }
      }

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ products }));
      return { props: {} };
    }

    // Get all products if no store specified
    const allProducts = await Product.list('-updated_date', parseInt(limit));
    const products = allProducts.map(product => ({
      id: product.id,
      title: product.title,
      brand: product.brand,
      category: product.category,
      imageUrl: product.image_url
    }));

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ products }));

  } catch (error) {
    console.error('[API] Products error:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ 
      products: [],
      error: error.message || 'Failed to load products' 
    }));
  }

  return { props: {} };
}
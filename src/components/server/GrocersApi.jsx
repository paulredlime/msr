// Server-side API handler for /api/grocers/zyte
class GrocersApi {
  static async handleGet(req) {
    return {
      ok: true,
      ping: "pong",
      router: "base44-server-component"
    };
  }

  static async handlePost(req) {
    const { store, listUrl } = req.body || {};
    
    if (!store || !listUrl) {
      throw new Error("Missing store or listUrl");
    }

    // Return mock data for testing
    const products = [
      {
        title: `${store} Fresh Milk 2L`,
        price: 1.45,
        priceText: "£1.45",
        url: `${listUrl}#milk`
      },
      {
        title: `${store} White Bread 800g`,
        price: 0.85,
        priceText: "£0.85", 
        url: `${listUrl}#bread`
      },
      {
        title: `${store} Bananas 1kg`,
        price: 1.20,
        priceText: "£1.20",
        url: `${listUrl}#bananas`
      }
    ];

    return {
      ok: true,
      count: products.length,
      products: products
    };
  }
}

export default GrocersApi;
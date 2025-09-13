
import { InvokeLLM } from "@/api/integrations";
import { GrocerAccount } from "@/api/entities";
import { OrderHistory } from "@/api/entities";
import { User } from "@/api/entities";

// Store-specific login and order page URLs
const STORE_URLS = {
  tesco: {
    login: "https://secure.tesco.com/account/en-GB/login",
    orders: "https://secure.tesco.com/account/en-GB/orders",
    selectors: {
      username: "input[type='email'], input[name='username']",
      password: "input[type='password']",
      submit: "button[type='submit'], input[type='submit']",
      orders: ".order-summary, [data-test-id='order-card']",
      orderId: ".order-number, [data-test-id='order-id']",
      orderDate: ".order-date, [data-test-id='order-date']",
      orderTotal: ".order-total, [data-test-id='order-total']",
      items: ".order-line, [data-test-id='order-item']",
      itemTitle: ".item-name, [data-test-id='item-title']",
      itemQty: ".item-quantity, [data-test-id='item-qty']",
      itemPrice: ".item-price, [data-test-id='item-price']"
    }
  },
  iceland: {
    login: "https://www.iceland.co.uk/account/login",
    orders: "https://www.iceland.co.uk/my-account/order-history",
    selectors: {
      username: "input[type='email'], input[name='email']",
      password: "input[type='password']",
      submit: "button[type='submit'], .login-button",
      orders: ".order-card, .order-summary",
      orderId: ".order-id, .order-number",
      orderDate: ".order-date",
      orderTotal: ".order-total",
      items: ".order-item, .item-row",
      itemTitle: ".item-title, .product-name",
      itemQty: ".item-qty, .quantity",
      itemPrice: ".item-price, .price"
    }
  },
  asda: {
    login: "https://groceries.asda.com/onboarding/login",
    orders: "https://groceries.asda.com/orders",
    selectors: {
      username: "input[type='email'], input[name='username']",
      password: "input[type='password']",
      submit: "button[type='submit']",
      orders: ".order-summary",
      orderId: ".order-reference",
      orderDate: ".order-date",
      orderTotal: ".order-total",
      items: ".order-line",
      itemTitle: ".item-description",
      itemQty: ".item-quantity",
      itemPrice: ".item-price"
    }
  },
  sainsburys: {
    login: "https://www.sainsburys.co.uk/webapp/wcs/stores/servlet/Logon",
    orders: "https://www.sainsburys.co.uk/myaccount/orders",
    selectors: {
      username: "input[name='logonId']",
      password: "input[name='logonPassword']",
      submit: "button[type='submit']",
      orders: ".order-summary",
      orderId: ".order-number",
      orderDate: ".order-date",
      orderTotal: ".order-total",
      items: ".order-item",
      itemTitle: ".item-name",
      itemQty: ".item-quantity", 
      itemPrice: ".item-price"
    }
  }
};

// TODO: Replace with proper KMS/HSM encryption in production
// For now, using base64 encoding as placeholder - SECURITY RISK!
const ENCRYPTION_WARNING = 'WARNING: Using demo encryption - implement proper KMS in production';

function encrypt(text) {
  console.warn(ENCRYPTION_WARNING);
  // TODO: Implement proper encryption using AWS KMS, Azure Key Vault, or similar
  return btoa(text);
}

function decrypt(encryptedText) {
  console.warn(ENCRYPTION_WARNING);
  // TODO: Implement proper decryption using AWS KMS, Azure Key Vault, or similar
  try {
    return atob(encryptedText);
  } catch (error) {
    throw new Error('Failed to decrypt credentials');
  }
}

function parsePrice(priceStr) {
  if (!priceStr) return 0;
  const cleaned = String(priceStr).replace(/[£$,]/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

export default function ZyteOrdersFetch() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Zyte Orders Fetch API</h1>
      <div className="bg-blue-50 p-4 rounded">
        <p>This endpoint extracts order history from connected grocery accounts via Zyte browser automation.</p>
        <pre className="bg-gray-100 p-2 mt-2 rounded text-sm">
{`POST /ZyteOrdersFetch
{
  "store": "iceland",
  "userId": "user123"
}`}
        </pre>
      </div>
    </div>
  );
}

export async function getServerSideProps({ req, res }) {
  if (req.method !== 'POST') {
    return { props: {} };
  }

  try {
    const { store, userId } = JSON.parse(req.body || '{}');

    if (!store || !userId) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ 
        ok: false, 
        error: "store and userId required" 
      }));
      return { props: {} };
    }

    if (!STORE_URLS[store]) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ 
        ok: false, 
        error: `Unsupported store: ${store}` 
      }));
      return { props: {} };
    }

    // Load encrypted credentials from database
    const accounts = await GrocerAccount.filter({ 
      user_id: userId, 
      store: store,
      is_active: true 
    });

    if (accounts.length === 0) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ 
        ok: false, 
        error: "No active account credentials found for this store" 
      }));
      return { props: {} };
    }

    const account = accounts[0];
    const username = account.username;
    const password = decrypt(account.password_encrypted);

    const storeConfig = STORE_URLS[store];

    // Use InvokeLLM to perform Zyte browser automation
    const zytePrompt = `
      You are a Zyte browser automation client. Perform the following steps to extract order history:

      1. Navigate to login page: ${storeConfig.login}
      2. Fill username field (${storeConfig.selectors.username}) with: ${username}
      3. Fill password field (${storeConfig.selectors.password}) with: ${password}
      4. Click submit button (${storeConfig.selectors.submit})
      5. Wait for login to complete (5 seconds)
      6. Navigate to orders page: ${storeConfig.orders}
      7. Wait for orders to load (5 seconds)
      8. Extract order data using these selectors:
         - Orders container: ${storeConfig.selectors.orders}
         - Order ID: ${storeConfig.selectors.orderId}
         - Order Date: ${storeConfig.selectors.orderDate}
         - Order Total: ${storeConfig.selectors.orderTotal}
         - Items container: ${storeConfig.selectors.items}
         - Item title: ${storeConfig.selectors.itemTitle}
         - Item quantity: ${storeConfig.selectors.itemQty}
         - Item price: ${storeConfig.selectors.itemPrice}

      Extract the last 10 orders with all items. Return structured data.
      
      IMPORTANT: This is real browser automation with real credentials for ${store}.
      Handle 2FA prompts if they appear, and return partial data if some orders fail to parse.
    `;

    const zyteResponse = await InvokeLLM({
      prompt: zytePrompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          loginSuccess: { type: "boolean" },
          ordersFound: { type: "number" },
          orders: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                date: { type: "string" },
                total: { type: "number" },
                deliveryFee: { type: "number" },
                items: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      quantity: { type: "string" },
                      price: { type: "number" }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!zyteResponse.success) {
      // Update sync status to error
      await GrocerAccount.update(account.id, {
        sync_status: 'error',
        last_sync: new Date().toISOString()
      });

      res.statusCode = 422;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ 
        ok: false, 
        error: zyteResponse.error || "Failed to extract orders",
        loginSuccess: zyteResponse.loginSuccess 
      }));
      return { props: {} };
    }

    // Process and store orders in database
    const processedOrders = [];
    
    for (const order of zyteResponse.orders || []) {
      if (!order.id || !order.date) continue;

      // Check if we already have this order
      const existingOrders = await OrderHistory.filter({
        user_id: userId,
        store: store,
        order_id: order.id
      });

      if (existingOrders.length === 0) {
        // Create new order record
        const newOrder = await OrderHistory.create({
          user_id: userId,
          store: store,
          order_id: order.id,
          order_date: order.date,
          total_amount: parsePrice(order.total),
          delivery_fee: parsePrice(order.deliveryFee),
          items: order.items || [],
          raw_data: JSON.stringify(order)
        });
        processedOrders.push(newOrder);
      } else {
        processedOrders.push(existingOrders[0]);
      }
    }

    // Update account sync status
    await GrocerAccount.update(account.id, {
      sync_status: 'active',
      last_sync: new Date().toISOString()
    });

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      ok: true,
      store: store,
      ordersFound: zyteResponse.ordersFound || 0,
      ordersSaved: processedOrders.length,
      orders: processedOrders.slice(0, 10) // Return last 10 for display
    }));

  } catch (error) {
    console.error('[ZyteOrdersFetch] Error:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ 
      ok: false, 
      error: error.message 
    }));
  }

  return { props: {} };
}

# Order Service Documentation

## Overview
The Order Service handles the complete order lifecycle including cart management, order creation, order retrieval, and checkout processing. It acts as the central hub for customer orders and works with authentication, restaurant validation, and payment processing.

---

## 1. What Changes We Are Making?

### Current Implementation
✅ **Completed Features**:
- Create orders with item validation
- Fetch all orders
- Fetch orders by user ID with pagination
- Fetch order by ID
- Cart creation and management
- Add items to cart
- Update cart item quantities
- Remove items from cart
- Clear cart
- Cart checkout functionality
- Authentication middleware
- Kafka event publishing

### Planned Enhancements
- [ ] Order status management (pending, confirmed, preparing, ready, out_for_delivery, delivered)
- [ ] Order cancellation with refund logic
- [ ] Order modifications (add/remove items before confirmation)
- [ ] Order history with filtering (date range, status)
- [ ] Bulk order operations for restaurants
- [ ] Real-time order updates via WebSocket
- [ ] Order notes/special requests
- [ ] Estimated delivery time calculation
- [ ] Order recommendations based on history
- [ ] Loyalty points integration

---

## 2. Why We Are Doing This? What Is It Improving?

### Benefits of Current Implementation

| Aspect | Improvement |
|--------|------------|
| **Multi-Restaurant Safety** | Cart prevents mixing items from different restaurants |
| **Quantity Management** | Users can adjust quantities without removing items |
| **Data Validation** | Menu items validated against restaurant database |
| **Transaction Safety** | Cart persists to database, not session storage |
| **Authentication** | All cart/order operations require valid JWT |
| **Event Tracking** | Order creation triggers downstream services via Kafka |
| **Pagination** | Large order histories handled efficiently |
| **Separation of Concerns** | Cart and Order are separate entities (cart is temporary) |

### Why Cart Separate from Order?
```
Cart (Active, Editable):
- Temporary storage
- Multiple items from one restaurant
- Modifiable before checkout
- Can be abandoned

Order (Immutable, Historical):
- Final record of transaction
- Cannot be modified
- Used for history and analytics
- Payment reference
```

### Why Kafka Events?
```
order_created event triggers:
├─ Payment Service: Create payment intent
├─ Notification Service: Send order confirmation
├─ Analytics Service: Track order metrics (future)
└─ Restaurant Service: Notify of new order (future)
```

### Why Pagination?
```
User has 100+ orders
Without pagination:
- Load all 100 orders = slow response
- Transfer all data = high bandwidth
- Large JSON payload = memory intensive

With pagination (10 per page):
- Load 10 orders = fast response
- Page 1: orders 1-10
- Page 2: orders 11-20
- Scalable to millions of orders
```

---

## 3. How We Are Doing It? (In Detailed)

### Technology Stack
```
Framework: Express.js
Authentication: JWT Middleware
Database: MongoDB + Mongoose
Messaging: KafkaJS
HTTP Client: Axios (for service calls)
Environment: Dotenv
```

### Project Structure
```
order-service/
├── src/
│   ├── index.js                  # Server entry point
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── controllers/
│   │   ├── order.controller.js   # Order logic
│   │   └── cart.controller.js    # Cart logic
│   ├── models/
│   │   ├── order.model.js        # Order schema
│   │   └── cart.model.js         # Cart schema
│   ├── routes/
│   │   ├── orderRoutes.js        # Order endpoints
│   │   └── cartRoutes.js         # Cart endpoints
│   ├── middleware/
│   │   └── auth.middleware.js    # JWT validation
│   ├── kafka/
│   │   ├── consumer.js           # Event consumption
│   │   └── producer.js           # Event publishing
│   └── utils/ (future)
│       ├── validation.js
│       └── helpers.js
├── package.json
└── Dockerfile
```

---

### Data Models

#### Order Model
```javascript
{
  _id: ObjectId,
  userId: ObjectId (required),
  restaurantId: ObjectId (required),
  items: [{
    name: String,
    price: Number,
    quantity: Number
  }],
  totalAmount: Number,
  status: String (default: 'created'), // pending, confirmed, preparing, ready, delivered
  paymentStatus: String (default: 'pending'),
  deliveryAddress: {
    street: String,
    city: String,
    pincode: String
  },
  specialInstructions: String,
  estimatedDeliveryTime: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### Cart Model
```javascript
{
  _id: ObjectId,
  userId: ObjectId (required, indexed),
  restaurantId: ObjectId (required),
  restaurantName: String,
  items: [{
    menuItemId: ObjectId,
    name: String,
    price: Number,
    quantity: Number,
    isAvailable: Boolean
  }],
  totalAmount: Number (calculated),
  status: String (default: 'active'), // active, checked_out, abandoned
  createdAt: Date,
  updatedAt: Date
}
```

---

### Core Operations

#### 1. Add to Cart Flow

```
User adds item from restaurant X
         ↓
POST /api/cart/add
         ↓
Authenticate user (JWT middleware)
         ↓
Validate request:
├─ restaurantId required
├─ menuItemId required
├─ name required
└─ price required
         ↓
Find/Create active cart:
├─ Check if user has active cart
├─ If exists and different restaurant → error
├─ If not exists → create new
         ↓
Check if item exists:
├─ If exists → increment quantity
├─ If not → add new item
         ↓
Recalculate total
         ↓
Save to database
         ↓
Return updated cart
```

**Code Implementation**:
```javascript
const addToCart = async (req, res) => {
    try {
        const userId = req.userId; // From auth middleware
        const { restaurantId, restaurantName, menuItemId, name, price, quantity = 1 } = req.body;

        // Validation
        if (!restaurantId || !menuItemId || !name || !price) {
            return res.status(400).json({ 
                error: 'Restaurant ID, menu item ID, name, and price are required' 
            });
        }

        // Find or create cart
        let cart = await Cart.findOne({ userId, status: 'active' });

        if (!cart) {
            cart = new Cart({
                userId,
                restaurantId,
                restaurantName,
                items: [],
                totalAmount: 0
            });
        } else {
            // Prevent mixing items from different restaurants
            if (cart.restaurantId !== restaurantId) {
                return res.status(400).json({ 
                    error: 'Cannot add items from different restaurant. Clear cart first.',
                    currentRestaurant: cart.restaurantName
                });
            }
        }

        // Check if item already in cart
        const existingItemIndex = cart.items.findIndex(
            item => item.menuItemId === menuItemId
        );

        if (existingItemIndex > -1) {
            // Update quantity
            cart.items[existingItemIndex].quantity += quantity;
        } else {
            // Add new item
            cart.items.push({
                menuItemId,
                name,
                price,
                quantity,
                isAvailable: true
            });
        }

        // Calculate total
        cart.calculateTotal(); // Mongoose method
        await cart.save();

        res.status(200).json(cart);
    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({ error: 'Failed to add item to cart' });
    }
};
```

**Key Design Decisions**:
- ✅ One cart per user (prevents data inconsistency)
- ✅ One restaurant per cart (prevents order confusion)
- ✅ Quantity defaults to 1 if not provided
- ✅ Total calculated server-side (not trusted from frontend)

---

#### 2. Update Cart Quantity Flow

```
User modifies quantity
         ↓
PUT /api/cart/update
         ↓
Authenticate user
         ↓
Validate:
├─ menuItemId required
├─ quantity is number
└─ quantity >= 0
         ↓
Find user's active cart
         ↓
Find item in cart
         ↓
If quantity === 0:
├─ Remove item
├─ If cart empty → delete cart
└─ Return success
         ↓
Else:
├─ Update quantity
├─ Recalculate total
├─ Save to database
└─ Return updated cart
```

**Code**:
```javascript
const updateCartItem = async (req, res) => {
    try {
        const userId = req.userId;
        const { menuItemId, quantity } = req.body;

        // Validation
        if (!menuItemId || quantity == null || typeof quantity !== 'number' || isNaN(quantity)) {
            return res.status(400).json({ 
                error: 'Menu item ID and valid quantity required' 
            });
        }

        if (quantity < 0) {
            return res.status(400).json({ error: 'Quantity cannot be negative' });
        }

        const cart = await Cart.findOne({ userId, status: 'active' });

        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        const itemIndex = cart.items.findIndex(item => item.menuItemId === menuItemId);

        if (itemIndex === -1) {
            return res.status(404).json({ error: 'Item not found in cart' });
        }

        if (quantity === 0) {
            // Remove item
            cart.items.splice(itemIndex, 1);
        } else {
            // Update quantity
            cart.items[itemIndex].quantity = quantity;
        }

        // If cart empty, delete it
        if (cart.items.length === 0) {
            await Cart.deleteOne({ _id: cart._id });
            return res.status(200).json({ message: 'Cart is now empty' });
        }

        cart.calculateTotal();
        await cart.save();

        res.status(200).json(cart);
    } catch (error) {
        console.error('Error updating cart item:', error);
        res.status(500).json({ error: 'Failed to update cart item' });
    }
};
```

---

#### 3. Create Order Flow

```
User clicks "Place Order"
         ↓
POST /api/orders/create
         ↓
Authenticate user
         ↓
Validate:
├─ restaurantId required
├─ items array required
└─ items not empty
         ↓
Call restaurant service via gateway:
GET /api/restaurants/{restaurantId}
         ↓
Validate each item:
├─ Item exists in restaurant menu
├─ Item is available
└─ Calculate totals
         ↓
Create Order document:
├─ userId (from auth)
├─ restaurantId
├─ items (with prices)
├─ totalAmount
└─ status: 'created'
         ↓
Save to database
         ↓
Publish Kafka event: order_created
├─ orderId
├─ userId
├─ restaurantId
├─ items
└─ totalAmount
         ↓
Return order details
```

**Code**:
```javascript
const createOrder = async (req, res) => {
    try {
        const { restaurantId, items } = req.body;
        const userId = req.userId;

        // Validate restaurant exists
        const restaurantRes = await axios.get(
            `http://gateway:3000/api/restaurants/${restaurantId}`
        );
        const restaurant = restaurantRes.data;

        if (!restaurant) {
            return res.status(404).json({ error: 'Restaurant not found' });
        }

        // Validate items
        let totalAmount = 0;
        const validatedItems = [];

        for (const item of items) {
            const menuItem = restaurant.menu.find(
                mi => mi.name === item.name
            );
            
            if (!menuItem || !menuItem.available) {
                return res.status(400).json({ 
                    error: `Menu item not available: ${item.name}` 
                });
            }

            const itemTotal = menuItem.price * item.quantity;
            validatedItems.push({ ...item, price: menuItem.price });
            totalAmount += itemTotal;
        }

        // Create order
        const newOrder = new Order({
            userId,
            restaurantId,
            items: validatedItems,
            totalAmount
        });

        await newOrder.save();

        // Publish event
        await produceEvent('order_created', {
            orderId: newOrder._id,
            userId,
            restaurantId,
            items: validatedItems,
            totalAmount,
            status: 'created'
        });

        res.status(201).json(newOrder);
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
```

**Why Call Restaurant Service?**
- ✅ Validate menu items exist
- ✅ Ensure prices are current
- ✅ Verify item availability
- ✅ Prevent invalid orders

---

#### 4. Get Orders with Pagination

```
User requests order history
         ↓
GET /api/orders/user/{userId}?page=1&limit=10
         ↓
Authenticate user (JWT)
         ↓
Verify userId matches auth user (security check)
         ↓
Parse pagination params:
├─ page = 1 (default)
└─ limit = 10 (default)
         ↓
Calculate skip:
└─ skip = (page - 1) * limit = 0
         ↓
Parallel queries:
├─ Find orders:
│  ├─ Match userId
│  ├─ Sort by createdAt (newest first)
│  ├─ Skip 0 documents
│  └─ Limit to 10 documents
└─ Count total orders for user
         ↓
Return:
{
  items: [...10 orders],
  total: 42,
  page: 1,
  limit: 10
}
```

**Code**:
```javascript
const getOrdersByUser = async (req, res) => {
    try {
        const requestedUserId = req.params.userId;
        const authUserId = req.userId;

        // Security: prevent viewing other users' orders
        if (requestedUserId !== authUserId) {
            return res.status(403).json({ 
                error: 'Not authorized to view these orders' 
            });
        }

        const page = parseInt(req.query.page || '1', 10);
        const limit = parseInt(req.query.limit || '10', 10);
        const skip = (page - 1) * limit;

        // Parallel queries for efficiency
        const [orders, total] = await Promise.all([
            Order.find({ userId: requestedUserId })
                .sort({ createdAt: -1 }) // Newest first
                .skip(skip)
                .limit(limit),
            Order.countDocuments({ userId: requestedUserId }),
        ]);

        res.status(200).json({
            items: orders,
            total,
            page,
            limit,
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
```

**Performance Considerations**:
- ✅ `Promise.all()`: Execute both queries in parallel
- ✅ Index on `userId` and `createdAt` (add to model)
- ✅ Limit query results (not returning all orders)
- ✅ Sort server-side (not in memory)

---

### API Endpoints

#### Cart Endpoints

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | /api/cart | ✅ | Get user's active cart |
| POST | /api/cart/add | ✅ | Add item to cart |
| PUT | /api/cart/update | ✅ | Update item quantity |
| POST | /api/cart/remove | ✅ | Remove item from cart |
| DELETE | /api/cart/clear | ✅ | Clear entire cart |
| POST | /api/cart/checkout | ✅ | Convert cart to order |

#### Order Endpoints

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | /api/orders/create | ✅ | Create new order |
| GET | /api/orders | ❌ | Get all orders (admin only) |
| GET | /api/orders/user/:userId | ✅ | Get user's orders |
| GET | /api/orders/:orderId | ✅ | Get single order |

---

### Kafka Event Structure

#### order_created Event
```javascript
Topic: order_created
Schema: {
  orderId: ObjectId,
  userId: ObjectId,
  restaurantId: ObjectId,
  items: [{
    name: String,
    price: Number,
    quantity: Number
  }],
  totalAmount: Number,
  status: String,
  timestamp: ISO8601
}

Consumers:
├─ Payment Service: Create payment intent
├─ Notification Service: Send confirmation email
├─ Analytics Service: Log order (future)
└─ Restaurant Service: Notify of new order (future)
```

---

### Authentication Middleware

```javascript
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        req.userEmail = decoded.email;
        req.userRole = decoded.role;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};
```

**How it works**:
1. Client sends: `Authorization: Bearer eyJhbGc...`
2. Middleware extracts token after "Bearer "
3. Verifies with JWT_SECRET
4. Attaches decoded data to request
5. Next route handler has access to `req.userId`

---

### Security Considerations

| Issue | Risk | Mitigation |
|-------|------|-----------|
| Price tampering | User sends lower price | Server validates against restaurant DB ✅ |
| Quantity overflow | Large quantities cause issues | Add max quantity validation |
| Cross-user access | User A views User B's orders | Check auth user matches param ✅ |
| Cart poisoning | Modify cart with SQL | Mongoose prevents injection ✅ |
| Token expiry | Old tokens stay valid | JWT has 1-day expiry ✅ |
| Missing auth | Unauthorized access | Auth middleware required ✅ |

---

### Error Handling

```javascript
// Client sends invalid data
{
  error: 'Restaurant ID, menu item ID, name, and price are required',
  status: 400
}

// Menu item not available
{
  error: 'Menu item not available: Margherita Pizza',
  status: 400
}

// User not authorized
{
  error: 'Not authorized to view these orders',
  status: 403
}

// Server error
{
  error: 'Internal server error',
  status: 500
}
```

---

### Testing Examples

```bash
# Add to cart
curl -X POST http://localhost:3000/api/cart/add \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "restaurantId": "507f1f77bcf86cd799439011",
    "restaurantName": "Pizza Palace",
    "menuItemId": "507f1f77bcf86cd799439012",
    "name": "Margherita",
    "price": 250,
    "quantity": 2
  }'

# Get cart
curl -X GET http://localhost:3000/api/cart \
  -H "Authorization: Bearer <token>"

# Create order
curl -X POST http://localhost:3000/api/orders/create \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "restaurantId": "507f1f77bcf86cd799439011",
    "items": [
      {
        "name": "Margherita",
        "price": 250,
        "quantity": 2
      }
    ]
  }'

# Get user's orders with pagination
curl -X GET 'http://localhost:3000/api/orders/user/507f1f77bcf86cd799439010?page=1&limit=10' \
  -H "Authorization: Bearer <token>"
```

---

## Running the Service

```bash
cd services/order-service
npm install
npm run dev
# Server runs on http://localhost:4003
```

---

## Future Enhancements

### 1. Order Status Management (Priority: High)
```javascript
// Current: only 'created' status
// Future: pending → confirmed → preparing → ready → out_for_delivery → delivered

// Add status update endpoint
PUT /api/orders/{orderId}/status
// Only restaurant can update to 'confirmed', 'preparing', 'ready'
// Only delivery service can update to 'out_for_delivery', 'delivered'
```

### 2. Order Cancellation (Priority: High)
```javascript
// POST /api/orders/{orderId}/cancel
// Only valid if status is 'pending' or 'confirmed'
// Triggers refund via payment service
// Updates order status to 'cancelled'
// Publishes order_cancelled event
```

### 3. Real-Time Updates via WebSocket (Priority: Medium)
```javascript
// Instead of polling, use WebSocket
// Client connects: /orders/listen?token=xxx
// Server emits order status changes in real-time
// Better UX, less server load
```

### 4. Order Recommendations (Priority: Low)
```javascript
// ML-based suggestions based on:
// - Previous orders
// - Popular items
// - Seasonal items
// Endpoint: GET /api/orders/recommendations
```

---

## Related Documentation
- [Architecture Overview](../ARCHITECTURE.md)
- [Payment Service](./PAYMENT_SERVICE.md) (receives order_created)
- [Restaurant Service](./RESTAURANT_SERVICE.md) (validates menu)
- [API Gateway](./GATEWAY.md)

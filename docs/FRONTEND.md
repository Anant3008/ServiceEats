# Frontend Documentation

## Overview
The ServiceEats frontend is built with **Next.js 16.1.1** and **React 19.2.0** using TypeScript, TailwindCSS, and Stripe integration. It provides a complete customer-facing UI for browsing restaurants, managing carts, placing orders, and tracking deliveries.

---

## 1. What Changes We Are Making?

### Current Implementation
✅ **Completed Features**:
- Home page with weather integration and AI-powered trending messages
- Restaurant browsing with search and filtering
- Restaurant detail pages with menu
- Shopping cart management (add/remove/update items)
- Checkout with multiple payment methods (UI)
- Order history with pagination
- Order reordering
- User authentication (login/register)
- AuthContext for state management
- Protected routes with authentication guard
- Responsive design (mobile/tablet/desktop)

### Planned Enhancements
- [ ] User profile management page
- [ ] Address management (multiple delivery addresses)
- [ ] Order tracking with real-time delivery map
- [ ] Order ratings and reviews
- [ ] Favorite restaurants
- [ ] Search history and suggestions
- [ ] Promotional codes and coupons
- [ ] Wallet/balance display
- [ ] Order notifications (real-time)
- [ ] Dark mode theme
- [ ] Accessibility improvements (WCAG)

---

## 2. Why We Are Doing This? What Is It Improving?

### Benefits of Current Architecture

| Aspect | Improvement |
|--------|------------|
| **Framework** | Next.js enables SSR, SSG, and API routes optimization |
| **TypeScript** | Type safety catches errors at compile time, better DX |
| **TailwindCSS** | Utility-first CSS reduces custom CSS, consistent design |
| **Context API** | Lightweight state management, no external deps needed |
| **Authentication** | JWT tokens enable stateless, scalable authentication |
| **Component Separation** | Reusable components reduce code duplication |
| **Stripe Integration** | PCI-compliant payment processing |
| **API Gateway** | Single entry point simplifies frontend API calls |

### Why Context API Over Redux?
```
Redux:
❌ Boilerplate code (actions, reducers, dispatch)
❌ Learning curve steeper
✅ Better for very large apps with complex state

Context API (Current):
✅ Built into React
✅ Less boilerplate
✅ Sufficient for current scale
✅ Easier to maintain
✅ Faster to implement
```

### Why TailwindCSS?
```
Traditional CSS:
❌ Global namespace conflicts
❌ Class naming inconsistency
❌ Unused CSS bloat
❌ Hard to maintain across screens

TailwindCSS:
✅ Utility classes (ml-4 = margin-left: 1rem)
✅ Consistent spacing/colors
✅ Responsive utilities (lg:ml-8)
✅ PurgeCSS removes unused styles
✅ Faster development
```

### Why API Gateway?
```
Frontend calling services directly:
❌ Multiple API endpoints to manage
❌ CORS issues with multiple origins
❌ Service location changes break frontend
❌ No central request logging

Via API Gateway:
✅ Single endpoint: localhost:3000/api/*
✅ Gateway handles CORS
✅ Service discovery transparent
✅ Centralized middleware (logging, rate limit)
✅ Better for caching strategies
```

---

## 3. How We Are Doing It? (In Detailed)

### Technology Stack
```
Frontend Framework: Next.js 16.1.1
UI Library: React 19.2.0
Language: TypeScript
Styling: TailwindCSS 4
Icons: Lucide React
Payment: Stripe (@stripe/react-stripe-js)
State Management: React Context API
HTTP Client: Fetch API
```

### Project Structure
```
frontend/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home page
│   ├── globals.css             # Global styles
│   ├── auth/
│   │   ├── login/page.tsx      # Login page
│   │   └── register/page.tsx   # Register page
│   ├── restaurants/
│   │   ├── page.tsx            # Restaurant list
│   │   └── [id]/page.tsx       # Restaurant detail
│   ├── cart/
│   │   └── page.tsx            # Shopping cart
│   ├── checkout/
│   │   └── page.tsx            # Checkout & payment
│   ├── orders/
│   │   ├── page.tsx            # Order history
│   │   └── [orderId]/page.tsx  # Order detail
│   ├── profile/
│   │   └── page.tsx            # User profile (empty)
│   └── api/                    # API route handlers
│       ├── geo.ts              # Geolocation
│       ├── weather.ts          # Weather API
│       └── trending-message.ts # AI-powered messages
├── components/
│   ├── Navbar.tsx              # Navigation bar
│   ├── StickyCartFooter.tsx    # Cart summary
│   ├── WeatherBanner.tsx       # Weather display
│   ├── TrendingMessage.tsx     # Trending message
│   └── ViewRestaurantsButton.tsx # CTA button
├── context/
│   └── AuthContext.tsx         # Auth state management
├── hooks/
│   ├── useAuth.ts              # Auth custom hook
│   ├── useRequireAuth.ts       # Protected routes
│   └── useOrders.ts            # Orders custom hook
├── lib/
│   └── orders.ts               # Order utilities
├── utils/
│   ├── paymentApi.ts           # Payment API calls
│   └── getTrendingMessage.ts   # Fallback messages
├── types/ (future)
│   └── index.ts                # TypeScript types
├── public/                     # Static assets
├── package.json
└── next.config.ts
```

---

### Authentication Flow

#### 1. Registration Flow

```
User fills registration form
         ↓
Frontend validates fields:
├─ Name not empty
├─ Email valid format
└─ Password minimum length
         ↓
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secure123"
}
         ↓
Backend (User Service):
├─ Validate fields
├─ Check email not exists
├─ Hash password
├─ Save to DB
└─ Publish user_created event
         ↓
Frontend receives success
         ↓
Redirect to login page
         ↓
User logs in with email/password
```

**Code Implementation**:
```typescript
// context/AuthContext.tsx
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Registration success, user needs to login
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // ... other methods
}
```

---

#### 2. Login Flow

```
User enters email/password
         ↓
Frontend validates:
├─ Email not empty
└─ Password not empty
         ↓
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "secure123"
}
         ↓
Backend (User Service):
├─ Find user by email
├─ Compare passwords (bcryptjs)
├─ Generate JWT token
└─ Return token
         ↓
Frontend receives JWT token
         ↓
Parse JWT to extract user data:
├─ userId
├─ email
└─ role
         ↓
Store token in localStorage:
  localStorage.setItem('token', token)
         ↓
Store user in localStorage:
  localStorage.setItem('user', JSON.stringify(userData))
         ↓
Update AuthContext
         ↓
Redirect to /restaurants
```

**Code Implementation**:
```typescript
const login = async (email: string, password: string) => {
  setIsLoading(true);
  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    // Decode JWT (header.payload.signature)
    const payload = JSON.parse(
      atob(data.token.split('.')[1])
    );

    const userData: User = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role
    };

    // Store in localStorage
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(userData));

    // Update state
    setToken(data.token);
    setUser(userData);
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  } finally {
    setIsLoading(false);
  }
};
```

**JWT Structure**:
```
Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2MGRmZjFiNWM0ZTgiLCJlbWFpbCI6ImpvaG5AZXhhbXBsZS5jb20iLCJyb2xlIjoiY3VzdG9tZXIiLCJpYXQiOjE2MzYzNTc0NTgsImV4cCI6MTYzNjQ0Mzg1OH0.abc123

Decoded Header:
{
  "alg": "HS256",
  "typ": "JWT"
}

Decoded Payload:
{
  "userId": "60dff1b5c4e8",
  "email": "john@example.com",
  "role": "customer",
  "iat": 1636357458,
  "exp": 1636443858
}

Frontend decodes by splitting on '.' and base64 decoding payload
```

---

### Page Components

#### Home Page (app/page.tsx)

**Purpose**: Landing page with weather, AI-powered message, and CTA

**Features**:
```
1. Weather Integration:
   - GET /api/geo → Get user's city
   - GET /api/weather?city=Pune → Fetch weather
   - Display temperature and condition

2. AI-Powered Message:
   - POST /api/trending-message
   - Input: city, temperature, condition
   - Output: Custom message from Google Generative AI
   - Fallback: Hardcoded messages if API fails

3. Call-to-Action:
   - "View Restaurants" button
   - Redirects authenticated users to /restaurants
   - Unauthenticated redirects to /auth/login

4. Hero Image:
   - Unsplash image with animations
   - Responsive design (mobile: small, desktop: large)
   - Gradient overlay effects
```

**Code Structure**:
```typescript
export default async function HomePage() {
  // Server-side data fetching
  const locationData = await getLocation();
  const weather = await getWeather(locationData.city);
  const message = await getTrendingMessageFromAI(
    locationData.city,
    weather.main.temp,
    weather.weather[0].main
  );

  return (
    <div className="min-h-screen bg-orange-50">
      <Navbar /> {/* Navigation */}
      <WeatherBanner city={city} temp={temp} condition={condition} />
      <TrendingMessage message={message} />
      <ViewRestaurantsButton />
      <HeroImage />
    </div>
  );
}
```

---

#### Restaurants Page (app/restaurants/page.tsx)

**Purpose**: Browse and search restaurants

**Features**:
```
1. Restaurant List:
   - GET /api/restaurants
   - Display as card grid
   - Filter by category (All, Burger, Pizza, etc.)
   - Search by name/cuisine

2. Restaurant Cards:
   - Image with hover zoom
   - Rating badge (4.8 stars)
   - Cuisine tag
   - Delivery time
   - Free delivery label
   - Promoted badge (if applicable)

3. User Interactions:
   - Click card → View restaurant detail
   - Search input → Filter results
   - Category buttons → Filter by category

4. Loading/Error States:
   - Skeleton loader while fetching
   - Error message with retry
   - Empty state if no results
```

**Code Structure**:
```typescript
export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRestaurants() {
      try {
        const res = await fetch('http://localhost:3000/api/restaurants');
        const data = await res.json();
        setRestaurants(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchRestaurants();
  }, []);

  const filteredRestaurants = restaurants.filter(res =>
    (res?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (res?.cuisine || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-orange-50">
      <Navbar />
      <SearchBar />
      <CategoryFilter />
      <RestaurantGrid restaurants={filteredRestaurants} />
    </div>
  );
}
```

---

#### Cart Page (app/cart/page.tsx)

**Purpose**: View and manage shopping cart

**Features**:
```
1. Cart Items Display:
   - Fetch cart: GET /api/cart
   - Show each item with image, price, quantity
   - Remove button per item
   - Quantity controls (+/-)

2. Cart Operations:
   - Update quantity: PUT /api/cart/update
   - Remove item: POST /api/cart/remove
   - Clear cart: DELETE /api/cart/clear

3. Cart Summary:
   - Subtotal (items cost)
   - Delivery fee (₹50)
   - Taxes (calculated)
   - Total

4. Checkout Button:
   - Redirects to /checkout
   - Only enabled if cart not empty
   - Shows loading state while updating

5. Empty Cart:
   - Message: "Your cart is empty"
   - Button: "Continue Shopping" → /restaurants
```

**Code Structure**:
```typescript
export default function CartPage() {
  const { user, loading: authLoading } = useRequireAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user) {
      fetchCart();
    }
  }, [authLoading, user]);

  const fetchCart = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3000/api/cart", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        const data = await res.json();
        setCart(data);
      }
    } catch (err) {
      setError("Failed to load cart");
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (menuItemId: string, quantity: number) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3000/api/cart/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ menuItemId, quantity }),
      });

      if (res.ok) {
        fetchCart(); // Refresh cart
      }
    } catch (err) {
      console.error("Failed to update:", err);
    }
  };

  // ... render cart items
}
```

**API Call Pattern**:
```
All authenticated requests include:
{
  headers: {
    'Authorization': 'Bearer <jwt_token>',
    'Content-Type': 'application/json'
  }
}

Server (backend) extracts userId from JWT in auth middleware
```

---

#### Checkout Page (app/checkout/page.tsx)

**Purpose**: Final order confirmation and payment processing

**Features**:
```
1. Cart Summary:
   - Display cart items
   - Subtotal, delivery fee, taxes
   - Total amount

2. Payment Method Selection:
   - UPI (Google Pay, PhonePe, Paytm)
   - Credit/Debit Card (Stripe)
   - Wallet (future)

3. Card Payment (Stripe Integration):
   - CardElement from @stripe/react-stripe-js
   - Secure card input (never touches server)
   - Real-time card validation

4. Checkout Flow:
   a. User clicks "Place Order"
   b. POST /api/payments create PaymentIntent
   c. Get clientSecret from response
   d. confirmCardPayment(clientSecret, card)
   e. Stripe validates payment
   f. Success → Webhook notifies backend
   g. Redirect to /orders

5. Error Handling:
   - Card declined → Show error
   - Network error → Retry button
   - Invalid amount → Warning
```

**Stripe Integration Code**:
```typescript
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || ""
);

function CheckoutContent() {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    try {
      // 1. Create payment on backend
      const paymentRes = await fetch('http://localhost:3000/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: cart._id,
          userId: user.userId,
          amount: cart.totalAmount,
          currency: 'inr',
          paymentMethod: 'card'
        })
      });

      const { clientSecret } = await paymentRes.json();

      // 2. Confirm payment with Stripe
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: user.name,
            email: user.email
          }
        }
      });

      // 3. Check result
      if (result.paymentIntent.status === 'succeeded') {
        router.push('/orders'); // Success
      } else {
        setError('Payment failed'); // Failure
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button type="submit" disabled={!stripe || processing}>
        Pay ₹{cart.totalAmount}
      </button>
    </form>
  );
}

export default function CheckoutPage() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutContent />
    </Elements>
  );
}
```

**Key Security Notes**:
- ✅ CardElement is Stripe component (card never touches our server)
- ✅ clientSecret validates request
- ✅ JWT token required for payment creation
- ✅ Amount validated on backend

---

#### Orders Page (app/orders/page.tsx)

**Purpose**: View order history and track orders

**Features**:
```
1. Order List:
   - GET /api/orders/user/{userId}?page=1&limit=10
   - Pagination (10 orders per page)
   - Sort by newest first

2. Order Cards:
   - Restaurant name
   - Order date/time
   - Order total amount
   - Status (pending, confirmed, delivered)
   - Number of items

3. Order Actions:
   - View details → Expand order
   - Reorder → Add items back to cart
   - Track delivery (future)
   - Rate order (future)

4. Reorder Flow:
   a. User clicks "Reorder" on old order
   b. Fetch items from order
   c. Add each item to new cart
   d. Redirect to /cart
   e. User proceeds to checkout

5. Pagination:
   - Previous/Next buttons
   - Page indicator
   - Navigate to specific page
```

**Code Structure**:
```typescript
export default function OrdersPage() {
  const { user, loading: authLoading } = useRequireAuth();
  const [page, setPage] = useState(1);
  const [reordering, setReordering] = useState<string | null>(null);

  const { orders, total, loading, error } = useOrders(
    user?.userId || null,
    token,
    page,
    10 // items per page
  );

  const handleReorder = async (order: any) => {
    setReordering(order._id);
    try {
      const results = await reorderItems(
        token,
        order.restaurantId,
        order.restaurantName,
        order.items
      );

      const failed = results.filter((r) => !r.success);
      if (failed.length > 0) {
        alert(`Some items couldn't be added: ${failed.map(f => f.item).join(", ")}`);
      } else {
        router.push("/cart");
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setReordering(null);
    }
  };

  return (
    <div>
      <Navbar />
      {orders.map(order => (
        <OrderCard
          key={order._id}
          order={order}
          onReorder={handleReorder}
          isReordering={reordering === order._id}
        />
      ))}
      <Pagination
        current={page}
        total={Math.ceil(total / 10)}
        onChange={setPage}
      />
    </div>
  );
}
```

---

### Custom Hooks

#### useAuth Hook
```typescript
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

**Usage**:
```typescript
function MyComponent() {
  const { user, token, login, logout, isLoading } = useAuth();
  
  if (isLoading) return <Spinner />;
  
  if (!user) return <p>Not logged in</p>;
  
  return <p>Welcome, {user.email}!</p>;
}
```

---

#### useRequireAuth Hook
```typescript
export function useRequireAuth() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  return { user, loading };
}
```

**Usage**: Protects routes that require authentication

```typescript
export default function ProtectedPage() {
  const { user, loading } = useRequireAuth();

  if (loading) return <Spinner />;
  
  return <p>Welcome, {user.email}!</p>;
}
```

---

### Component Architecture

#### Component Hierarchy
```
App
├── AuthProvider
│   ├── Layout
│   │   ├── Navbar
│   │   └── Page Content
│   │       ├── HomePage
│   │       ├── RestaurantsPage
│   │       │   └── RestaurantCard (reusable)
│   │       ├── CartPage
│   │       ├── CheckoutPage
│   │       │   └── (Stripe Elements wrapper)
│   │       └── OrdersPage
│   │           └── OrderCard (reusable)
│   └── ApiRoutes
│       ├── /api/geo
│       ├── /api/weather
│       └── /api/trending-message
```

---

### API Call Pattern

```typescript
// Utility function for authenticated API calls
async function apiCall(
  endpoint: string,
  options: RequestInit = {}
) {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`http://localhost:3000${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
}

// Usage
const cart = await apiCall('/api/cart');
const result = await apiCall('/api/cart/add', {
  method: 'POST',
  body: JSON.stringify({ restaurantId, menuItemId, ... })
});
```

---

### Styling Strategy

#### TailwindCSS Utilities
```typescript
// Instead of custom CSS:
<div className="
  flex items-center justify-between
  px-4 py-2
  bg-white rounded-lg shadow-md
  hover:shadow-lg transition-shadow
  dark:bg-gray-800
">
  Content
</div>
```

**Color Scheme**:
```
Primary: Orange (orange-500, orange-600)
Secondary: White
Background: Orange-50 (very light)
Text: Gray-900 (dark)
Borders: Orange-100, Orange-200

Responsive:
Mobile: base (no prefix)
Tablet: md: (768px+)
Desktop: lg: (1024px+)
```

---

### State Management

#### AuthContext Flow
```
┌─────────────────────────────────┐
│ AuthContext                      │
│ ├─ user: User | null           │
│ ├─ token: string | null        │
│ ├─ login(email, pass)          │
│ ├─ register(name, email, pass) │
│ ├─ logout()                    │
│ └─ isLoading: boolean          │
└──────────┬──────────────────────┘
           │
    ┌──────▼──────┐
    │ useAuth()   │
    └──────┬──────┘
           │
    ┌──────▼───────────┐
    │ Component using  │
    │ user/login/logout│
    └──────────────────┘
```

---

## Running the Frontend

```bash
cd frontend
npm install
npm run dev
# Frontend runs on http://localhost:3001
```

### Environment Variables
Create `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_xxx
NEXT_PUBLIC_GOOGLE_AI_KEY=xxx (for trending messages)
```

---

## Performance Optimization

```typescript
// Image optimization
import Image from 'next/image';

<Image
  src="/logo.png"
  alt="Logo"
  width={100}
  height={100}
  priority // Load immediately
/>

// Code splitting (automatic with Next.js)
// Dynamic imports for heavy components
const HeavyComponent = dynamic(() => import('@/components/Heavy'));

// Memoization
const CartItem = React.memo(({ item, onUpdate }) => {
  return <div>...</div>;
});
```

---

## Security Best Practices

```typescript
// Store sensitive data carefully
// ✅ OK: localStorage for JWT token
localStorage.setItem('token', jwt);

// ❌ DON'T: Store user passwords
localStorage.setItem('password', password);

// ✅ Use HTTPS in production
// ✅ Set secure flag on cookies
// ✅ Implement CSRF protection
// ✅ Validate all user inputs
```

---

## Testing Strategy

```bash
# Unit tests (for utilities)
npm run test

# E2E tests (for user flows)
npm run test:e2e

# Lighthouse (performance)
npm run audit

# Tests to cover:
[ ] Login flow
[ ] Add to cart
[ ] Checkout with payment
[ ] Order history retrieval
[ ] Error handling
[ ] Responsive design
```

---

## Related Documentation
- [Architecture Overview](../ARCHITECTURE.md)
- [User Service](./services/USER_SERVICE.md) (authentication)
- [Order Service](./services/ORDER_SERVICE.md) (cart/orders)
- [Payment Service](./services/PAYMENT_SERVICE.md) (checkout)
- [API Gateway](./services/GATEWAY.md) (requests routed through)

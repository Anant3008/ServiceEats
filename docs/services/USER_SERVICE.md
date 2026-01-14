# User Service Documentation

## Overview
The User Service handles all authentication-related operations including user registration, login, JWT token generation, and user event publishing.

---

## 1. What Changes We Are Making?

### Current Implementation
- Basic user registration with email and password
- Login with JWT token generation
- Bcrypt password hashing
- Kafka event publishing on user creation

### Future Improvements (Planned)
- [ ] Password reset functionality
- [ ] Email verification flow
- [ ] OAuth2 integration (Google, GitHub)
- [ ] Multi-factor authentication (2FA)
- [ ] User profile management (update name, phone, address)
- [ ] Role-based access control (customer, restaurant owner, delivery partner, admin)
- [ ] Refresh token mechanism
- [ ] Session management
- [ ] Account deactivation
- [ ] Audit logging

---

## 2. Why We Are Doing This? What Is It Improving?

### Benefits of Current Implementation

| Aspect | Improvement |
|--------|------------|
| **Security** | Passwords hashed with bcryptjs (10 salt rounds), never stored in plain text |
| **Authentication** | JWT tokens for stateless authentication across services |
| **Event-Driven** | Other services notified of new users via Kafka |
| **Scalability** | Stateless JWT means any gateway instance can verify tokens |
| **Separation** | Auth logic isolated in dedicated service, follows microservices principle |

### Why JWT Over Sessions?
- **Stateless**: No server memory needed for session storage
- **Scalable**: Works with multiple gateway instances without session replication
- **Mobile-Friendly**: Can be used across web and mobile clients
- **Cross-Origin**: Works with CORS (single-origin sessions don't)

### Why Kafka Events?
- Allows other services to react to user registration
- Future: trigger welcome emails, analytics tracking, notification subscriptions
- Loose coupling: User Service doesn't need to know about downstream services

---

## 3. How We Are Doing It? (In Detailed)

### Technology Stack
```
Framework: Express.js
Auth: JWT (jsonwebtoken 9.0.2)
Password: Bcryptjs 3.0.2
Database: MongoDB + Mongoose
Messaging: KafkaJS
Environment: Dotenv for config
```

### Project Structure
```
user-service/
├── src/
│   ├── index.js              # Server entry point
│   ├── config/
│   │   └── db.js             # MongoDB connection
│   ├── controllers/
│   │   └── user.controller.js # Business logic
│   ├── models/
│   │   └── user.model.js     # Mongoose schema
│   ├── routes/
│   │   └── authRoutes.js     # Route definitions
│   ├── kafka/
│   │   └── produce.js        # Event publishing
│   └── middleware/
│       └── (auth middleware - to be added)
├── package.json
└── Dockerfile
```

### Data Flow

#### Registration Flow
```
1. User submits form (email, name, password)
   ↓
2. Frontend validates fields (client-side)
   ↓
3. POST /api/auth/register
   ├─ Validate: name, email, password required
   ├─ Check: email not already registered
   ├─ Hash: password with bcryptjs (salt rounds: 10)
   ├─ Save: new user document to MongoDB
   ├─ Publish: user_created event to Kafka
   └─ Return: Success message (status 201)
   ↓
4. Response returned to frontend
```

**Code Implementation**:
```javascript
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({ 
                message: 'All fields are required' 
            });
        }

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ 
                message: 'User already exists' 
            });
        }

        // Hash password (10 salt rounds)
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create and save user
        const newUser = new User({ 
            name, 
            email, 
            password: hashedPassword 
        });
        await newUser.save();

        // Publish event
        await produceEvent('user_created', {
            userId: newUser._id,
            name: newUser.name,
            email: newUser.email,
        });

        res.status(201).json({ 
            message: 'User registered successfully' 
        });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
```

**Why This Approach?**
- **Validation First**: Prevents invalid data entry
- **Async/Await**: Cleaner error handling
- **Kafka Event**: Allows asynchronous downstream processing
- **Status Codes**: HTTP 400 for client errors, 201 for creation success

---

#### Login Flow
```
1. User submits (email, password)
   ↓
2. POST /api/auth/login
   ├─ Validate: email and password provided
   ├─ Query: find user by email
   ├─ Check: user exists
   ├─ Compare: password with hashed password (bcryptjs)
   ├─ Generate: JWT token with user data
   │   └─ Payload: { userId, email, role }
   │   └─ Expiry: 1 day
   │   └─ Secret: JWT_SECRET from env
   └─ Return: JWT token (status 200)
   ↓
3. Frontend stores token in localStorage
```

**Code Implementation**:
```javascript
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Validation
        if (!email || !password) {
            return res.status(400).json({ 
                message: 'All fields are required' 
            });
        }

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ 
                message: 'Invalid credentials' 
            });
        }

        // Compare password (constant-time comparison to prevent timing attacks)
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ 
                message: 'Invalid credentials' 
            });
        }

        // Generate JWT
        const token = jwt.sign(
            { 
                userId: user._id, 
                email: user.email, 
                role: user.role 
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({ token });
    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
```

**Security Features**:
- **bcrypt.compare()**: Constant-time comparison prevents timing attacks
- **JWT Expiry**: Tokens expire in 1 day
- **Role Field**: Allows future RBAC implementation

---

### Database Schema

```javascript
{
  _id: ObjectId,
  name: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  role: String (default: "customer"),
  createdAt: Date,
  updatedAt: Date
}
```

**Future Extensions**:
```javascript
{
  // ... existing fields ...
  phone: String,
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  profilePicture: String (URL),
  isVerified: Boolean (default: false),
  verificationToken: String,
  passwordResetToken: String,
  passwordResetExpiry: Date,
  lastLogin: Date,
  isActive: Boolean (default: true),
  twoFactorSecret: String,
  preferences: {
    language: String,
    notifications: Boolean
  }
}
```

---

### Kafka Event Publishing

**Event Structure**:
```javascript
Topic: user_created
Schema: {
  userId: ObjectId,
  name: String,
  email: String,
  timestamp: ISO8601
}

Example:
{
  userId: "507f1f77bcf86cd799439011",
  name: "John Doe",
  email: "john@example.com",
  timestamp: "2024-01-14T10:30:00Z"
}
```

**Producer Code**:
```javascript
const { Kafka } = require('kafkajs');

const kafka = new Kafka({
    clientId: 'user-service',
    brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const producer = kafka.producer();

const produceEvent = async (topic, data) => {
    try {
        await producer.connect();
        await producer.send({
            topic,
            messages: [{
                value: JSON.stringify(data),
            }],
        });
        console.log(`Event published to ${topic}:`, data);
        await producer.disconnect();
    } catch (error) {
        console.error(`Error publishing event:`, error);
        throw error;
    }
};
```

**Why Event Publishing?**
- **Notification Service**: Can send welcome email
- **Analytics Service**: Track user registrations (future)
- **Preferences Service**: Initialize user preferences (future)
- **No Blocking**: Registration completes before event propagates

---

### Environment Configuration

**.env file**:
```
PORT=4001
MONGO_URI=mongodb://localhost:27017/service-eats-users
JWT_SECRET=your_super_secret_jwt_key_change_in_production
KAFKA_BROKER=localhost:9092
NODE_ENV=development
```

**Why Dotenv?**
- Separates secrets from code
- Different configs for dev/staging/production
- Easy to manage in CI/CD pipelines
- Never commit .env to version control

---

### API Endpoints

#### POST /api/auth/register
```
Request:
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}

Success Response (201):
{
  "message": "User registered successfully"
}

Error Responses:
400 Bad Request: "All fields are required"
400 Bad Request: "User already exists"
500 Server Error: "Server error"
```

**Validation Rules**:
- name: required, non-empty string
- email: required, valid email format
- password: required, minimum 8 characters (frontend validation)

---

#### POST /api/auth/login
```
Request:
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}

Success Response (200):
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

Error Responses:
400 Bad Request: "All fields are required"
400 Bad Request: "Invalid credentials"
500 Server Error: "Server error"
```

**Frontend Usage**:
```javascript
// Login
const response = await fetch('/api/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password })
});
const { token } = await response.json();
localStorage.setItem('token', token);

// Use token in subsequent requests
fetch('/api/orders', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

### Security Considerations

| Aspect | Current | Recommended for Production |
|--------|---------|---------------------------|
| **Password Hashing** | bcryptjs (10 rounds) | ✅ Adequate (consider 12+ rounds) |
| **JWT Expiry** | 1 day | ✅ Good (add refresh tokens) |
| **Password Storage** | Hashed | ✅ Good |
| **HTTPS** | ❌ Not enforced locally | ✅ Mandatory in production |
| **Rate Limiting** | ❌ None | ✅ Add throttling for auth endpoints |
| **Input Validation** | Basic | ✅ Add comprehensive validation |
| **CORS** | Not restricted | ✅ Add CORS whitelist |
| **SQL/NoSQL Injection** | Mongoose (safe) | ✅ Good |
| **Token Refresh** | ❌ Not implemented | ✅ Add refresh token flow |
| **Logout/Token Blacklist** | ❌ Not implemented | ✅ Add token revocation |

---

### Testing Checklist

```
Manual Testing:
[ ] Register with valid data → success
[ ] Register with duplicate email → error
[ ] Register with missing fields → error
[ ] Login with correct credentials → token returned
[ ] Login with wrong password → error
[ ] Login with non-existent email → error
[ ] Use token in another service → validates correctly
[ ] Token expires after 1 day → should be rejected

Load Testing:
[ ] 100 concurrent registrations
[ ] 100 concurrent logins
[ ] Kafka event publishing under load

Security Testing:
[ ] Password not returned in any response
[ ] Token payload doesn't expose sensitive data
[ ] bcrypt comparison is constant-time
```

---

### Future Enhancements

1. **Password Reset** (Priority: High)
   - Generate reset tokens
   - Send via email
   - Validate and update password

2. **Email Verification** (Priority: High)
   - Send verification link on registration
   - Prevent login until verified
   - Resend verification email

3. **Multi-Factor Authentication** (Priority: Medium)
   - OTP via SMS
   - Authenticator app (TOTP)
   - Backup codes

4. **OAuth Integration** (Priority: Medium)
   - Google Sign-In
   - GitHub authentication
   - Auto-populate profile

5. **Refresh Tokens** (Priority: High)
   - Issue short-lived access tokens (15 min)
   - Long-lived refresh tokens (7 days)
   - Endpoint to refresh access tokens

6. **Role-Based Access Control** (Priority: High)
   - Customer, Restaurant Owner, Delivery Partner, Admin roles
   - Different permissions per role
   - Access control in middleware

7. **User Profile Management** (Priority: Medium)
   - GET /api/users/:id (get profile)
   - PUT /api/users/:id (update profile)
   - DELETE /api/users/:id (deactivate account)

---

## Running the Service

### Local Development
```bash
cd services/user-service
npm install
npm run dev
# Server runs on http://localhost:4001
```

### Docker
```bash
docker-compose up user-service
# Or with all services
docker-compose up -d
```

### Testing
```bash
# Register
curl -X POST http://localhost:4001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepass123"
  }'

# Login
curl -X POST http://localhost:4001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securepass123"
  }'
```

---

## Monitoring & Logs

### Key Metrics to Monitor
- Registration success/failure rate
- Login success/failure rate
- JWT token generation time
- Kafka event publishing latency
- Database query performance
- Error rates by endpoint

### Log Patterns
```
[timestamp] [level] Service: User Service
[timestamp] [level] Event: user_registered, userId: xxx
[timestamp] [level] Error: Email already exists
```

---

## Related Documentation
- [Architecture Overview](../ARCHITECTURE.md)
- [API Gateway](./GATEWAY.md)
- [Order Service](./ORDER_SERVICE.md) (consumes user_created event)

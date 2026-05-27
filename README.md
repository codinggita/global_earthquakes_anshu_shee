# Global Earthquakes Analytics & Authentication API

A premium, production-ready, and high-performance **Node.js/Express.js** backend backed by **MongoDB (Mongoose)** for querying, searching, filtering, and analyzing a massive dataset of global earthquakes. 

This backend implements strict **MVC (Model-View-Controller) architecture**, complete validation schemas (using Joi), robust token-based authorization (JWT Access & Refresh pairs), request rate limiting, conditional debug logging, database backups, automated seeding, and 20 advanced custom features.

---

## Key Features

1. **Strict MVC Pattern**: Clean division between route configurations, request controllers, backend services, and Mongoose database models.
2. **Cleansed Data Ingestion**: Automated seeding script that parses the `dataset.json` file, coerces empty values (`""` to `null`), transforms string-encoded fields to double numbers, extracts geographical countries, and bulk loads data in memory-safe blocks of 5,000 documents.
3. **Advanced Mongoose Schemas**: Includes automated compound text indices, custom validators, and Mongoose pre-hook query query filters.
4. **Soft Delete Pipeline**: Injects query filters globally into Mongoose `find*`, `countDocuments`, and `aggregate` pipelines to automatically hide documents with `isDeleted: true` unless requested.
5. **Robust JWT Auth Pairings**: Issuance of short-lived Access Tokens (15 min) and long-lived Refresh Tokens (7 days) with rotation and revocation.
6. **Detailed Aggregations**: Implements MongoDB aggregation frameworks (`$group`, `$match`, `$project`, `$sort`, `$cond`) delivering depth spreads, magnitude distribution cells, error-rate analyses, and country groupings.
7. **Practiced Sandbox Middlewares**: Dedicated sandbox testing routers allowing developers to safely trigger logging, timing triggers, cached headers, rate limits, and standard API errors.
8. **Options/Head Support**: Full native headers only and allowed-methods reporting for key endpoints.
9. **Exportable Postman Collection**: Standardized file at [postman_collection.json](./postman_collection.json) to quickly load all routes.

---

## Project Structure

```
global_earthquakes/
├── dataset.json            # Downloaded 12MB raw global earthquakes array
├── package.json            # Scripts & project dependencies
├── .env                    # System configurations (Ports, Database URIs, Keys)
├── .env.example            # Deployment environment templates
├── server.js               # Express application entry-point
├── seed.js                 # Automatic data cleansers & seeding script
├── backup.js               # Database backing exporter
├── postman_collection.json # API endpoints collection
├── README.md               # Setup & project documentation
└── src/
    ├── config/
    │   └── db.js           # Mongoose MongoDB connection & event management
    ├── models/
    │   ├── Earthquake.js   # Earthquake schema, validations & pre-hooks
    │   └── User.js         # User registration schemas, bcrypt saves
    ├── controllers/
    │   ├── authController.js       # Express controllers parsing auth requests
    │   ├── earthquakeController.js # Controllers mapping CRUD & Dynamic parameters
    │   ├── analyticsController.js  # Controllers linking aggregations & stats
    │   └── systemController.js     # Health metrics & Options helpers
    ├── services/
    │   ├── authService.js          # Authentication business logic & JWTs
    │   ├── earthquakeService.js    # Database CRUD service & bulk operations
    │   └── analyticsService.js     # Aggregations & statistical service
    ├── routes/
    │   ├── authRoutes.js           # Mounts register, logins, and profiles
    │   ├── earthquakeRoutes.js     # RESTful paths, dynamic bounds, aliases
    │   ├── analyticsRoutes.js      # Aggregation analytics & statistics paths
    │   ├── systemRoutes.js         # Health checks, OPTIONS, and sandboxes
    │   └── index.js                # Router index mounting under /api/v1 prefix
    ├── middlewares/
    │   ├── authMiddleware.js       # JWT protector & role validators
    │   ├── errorMiddleware.js      # Catch-all express global error formatter
    │   ├── loggingMiddleware.js    # custom latency console logging
    │   ├── rateLimitMiddleware.js  # Staggered rate limiting limits
    │   └── validationMiddleware.js # Schema checking compilations (Joi)
    └── utils/
        ├── apiResponse.js          # Unified JSON success structures
        ├── apiError.js             # Custom Error wrapping class
        ├── asyncHandler.js         # Wrapper resolving async route exceptions
        ├── filterBuilder.js        # Maps query parameters to Mongoose queries
        └── pagination.js           # Reusable pagination offsets & metadata
```

---

## Installation & Setup

### 1. Prerequisites
Ensure you have **Node.js** (v16+) and a running **MongoDB** database instance (either local or Mongo Atlas connection string).

### 2. Configure Environment
Install dependencies and prepare environment settings:
```bash
# Install dependencies
npm install

# Setup environment variables (modify defaults in .env if needed)
cp .env.example .env
```

### 3. Ingest Dataset & Seed Database
Ensure MongoDB is running, then execute the seeder:
```bash
npm run seed
```
This script will parse the `dataset.json` file, cleanse types, extract country identifiers from places, purge existing tables, bulk insert, and build indices.

---

## Running the Server

Run the local development server:
```bash
npm run start
```
The console will log the active port and confirmation of database connection:
```
[Database] Connecting to: mongodb://127.0.0.1:27017/earthquakes
[Database] MongoDB Connected: 127.0.0.1:27017
[Server] Express active in development mode on port 5000
```

---

## API Endpoint Reference

All endpoints are prefixed with `/api/v1` (excluding base URL greetings).

### 1. User & Authentication
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| **`POST`** | `/auth/register` | Register new user account | No (Strict limit) |
| **`POST`** | `/auth/login` | Login and issue JWT access/refresh pairs | No (Strict limit) |
| **`POST`** | `/auth/logout` | Revoke active refresh token | Yes (Bearer token) |
| **`POST`** | `/auth/jwt/refresh-token` | Rotate expired access tokens | No |
| **`GET`** | `/auth/profile` | Retrieve active profile details | Yes (Bearer token) |
| **`PATCH`** | `/auth/profile` | Update profile properties (name) | Yes (Bearer token) |
| **`POST`** | `/auth/forgot-password` | Generate reset verification OTP | No |
| **`POST`** | `/auth/reset-password` | Complete password reset using OTP | No |

### 2. Earthquake Collections & CRUD
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| **`GET`** | `/earthquakes` | Get all active, paginated records | No |
| **`GET`** | `/earthquakes/:id` | Get single record by ID | No |
| **`POST`** | `/earthquakes` | Create a new earthquake record | Yes (Bearer token) |
| **`PUT`** | `/earthquakes/:id` | Completely replace existing record | Yes (Bearer token) |
| **`PATCH`** | `/earthquakes/:id` | Update specific fields on record | Yes (Bearer token) |
| **`DELETE`** | `/earthquakes/:id` | Soft delete an earthquake record | Yes (Admin Role) |
| **`GET`** | `/earthquakes/exists/:id` | Verify record exists in database | No |

### 3. Parameter and Predefined Filters
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **`GET`** | `/earthquakes/place/:place` | Fetch events matching a place name |
| **`GET`** | `/earthquakes/country/:country` | Fetch events matching a country |
| **`GET`** | `/earthquakes/magnitude/:mag` | Fetch events of a specific magnitude |
| **`GET`** | `/earthquakes/depth/:depth` | Fetch events of a specific depth |
| **`GET`** | `/earthquakes/high-magnitude` | Filter events with magnitude $\ge 5.0$ |
| **`GET`** | `/earthquakes/deep` | Filter events with depth $\ge 300\text{ km}$ |
| **`GET`** | `/earthquakes/recent` | Filter recent events sorted latest first |
| **`GET`** | `/earthquakes/oceanic` | Filter events occurring in ocean coordinates |
| **`GET`** | `/earthquakes/critical` | Filter shallow, reviewed events $\ge 6.0$ |

*Note: All search shortcuts can also be queried under the `/earthquakes/filter/*` prefix (e.g. `/earthquakes/filter/high-magnitude`).*

### 4. Keyword Regex Search
* **`GET`** `/search/earthquakes?q=indonesia`
  Queries text fields (place, country, net, status) using case-insensitive regex pattern matches, with support for pagination and sorting.

### 5. Analytics Aggregations & Statistics
| Method | Endpoint | Aggregation Framework Stages |
| :--- | :--- | :--- |
| **`GET`** | `/analytics/earthquakes/highest-magnitude` | `$match` $\rightarrow$ `$sort` $\rightarrow$ `$limit` $\rightarrow$ `$project` |
| **`GET`** | `/analytics/earthquakes/deepest` | `$match` $\rightarrow$ `$sort` $\rightarrow$ `$limit` $\rightarrow$ `$project` |
| **`GET`** | `/analytics/earthquakes/country-analysis` | `$match` $\rightarrow$ `$group` $\rightarrow$ `$sort` $\rightarrow$ `$limit` $\rightarrow$ `$project` |
| **`GET`** | `/analytics/earthquakes/magnitude-analysis` | `$project` (with complex `$cond` mappings) $\rightarrow$ `$group` $\rightarrow$ `$sort` $\rightarrow$ `$project` |
| **`GET`** | `/analytics/earthquakes/depth-analysis` | `$project` (with depth categorizations) $\rightarrow$ `$group` $\rightarrow$ `$sort` $\rightarrow$ `$project` |
| **`GET`** | `/analytics/earthquakes/monthly-analysis` | `$project` (date extraction) $\rightarrow$ `$group` $\rightarrow$ `$sort` $\rightarrow$ `$project` |
| **`GET`** | `/stats/earthquakes/count` | Returns total record counter |
| **`GET`** | `/stats/earthquakes/average-depth` | Calculates average depth in kilometers across all events |
| **`GET`** | `/stats/earthquakes/average-magnitude` | Calculates global average magnitude across all events |

### 6. Admin Bulk Operations
These endpoints are protected and restricted exclusively to authenticated users with the `'admin'` role:
* **`POST`** `/earthquakes/bulk-create`: Register multiple records.
* **`PATCH`** `/earthquakes/bulk-update`: Update multiple records using high-performance database `bulkWrite` instructions.
* **`DELETE`** `/earthquakes/bulk-delete`: Perform bulk soft deletions.

### 7. Middleware Sandboxes
Test specific middleware integrations inside sandbox routes:
* `/middleware/logger` - Verify console latency logging.
* `/middleware/auth` - Test authenticated JWT protections.
* `/middleware/rate-limit` - Observe rate limits on heavy requests.
* `/middleware/error-handler` - Practice catching operational failures.
* `/middleware/request-time` - Trace response timing metrics in headers.
* `/middleware/cache` - Observe public Cache-Control bindings.

---

## Database Backup & Recovery

Keep your data secure by running automated back-ups:
```bash
# Export active database documents to a clean JSON array
npm run backup
```
This will generate a backup file named `backup_earthquakes_<timestamp>.json` detailing all records not marked as deleted, complete with index fields.

---

## Response Formats

### Standard Success Response:
```json
{
  "success": true,
  "message": "User profile successfully retrieved.",
  "data": {
    "id": "60a1d48c08f4c20b8c6e2417",
    "name": "Admin Coordinator",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

### Standard Pagination Response:
```json
{
  "success": true,
  "message": "Earthquake records successfully retrieved.",
  "data": [...],
  "pagination": {
    "totalRecords": 3500,
    "limit": 10,
    "page": 1,
    "totalPages": 350,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### Standard Error Response:
```json
{
  "success": false,
  "message": "Input validation failed",
  "error": {
    "status": 400,
    "details": [
      {
        "field": "email",
        "message": "Please provide a valid email format"
      }
    ]
  }
}
```

# URL Shortener API

An URL shortener API built with Node.js and Express framework. It uses Turso (SQLite) as the database to store and manage shortened URLs with advanced features like custom codes, expiration dates, and password protection.

## Features

- URL Shortening

  - Generate short codes for URLs
  - Custom short codes support
  - Password protection for URLs
  - URL expiration dates
  - Click tracking

- User Management

  - API key authentication
  - User tiers (hobby, enterprise)
  - URL ownership tracking

- Enterprise Features
  - Batch URL shortening

## Tech Stack

- Node.js
- Express.js
- Prisma ORM
- Turso Database (SQLite)
- Jest & Supertest (Testing)
- k6 (Load Testing)

## Prerequisites

- Node.js (v18 or higher)
- pnpm
- k6 (for load testing)

## Installation

1. Clone the repository

```bash
git clone https://github.com/ra-kesh/url-shortener.git
```

2. Navigate to the project directory

```bash
cd url-shortener
```

3. Install dependencies

```bash
pnpm install
```

4. Set up environment variables

```bash
touch .env
```

Update the `.env` file with your Turso database credentials:

```plaintext
TURSO_DATABASE_URL=your_database_url
TURSO_AUTH_TOKEN=your_auth_token
PORT=3000
```

5. Start the server

```bash
pnpm start
```

## API Endpoints

### Shorten URL

- POST /shorten
- Body:

```json
{
  "original_url": "https://example.com",
  "custom_code": "mycode", // optional
  "password": "mypassword", // optional
  "expiry_date": "2024-12-31" // optional
}
```

- Headers:
  - Authorization: Bearer your-api-key (optional)
- Response: { "short_code": "abc123" }

### Batch Shorten URLs (Enterprise Only)

- POST /batch-shorten
- Body:

```json
{
  "urls": [
    { "original_url": "https://example1.com" },
    { "original_url": "https://example2.com" }
  ]
}
```

- Headers:
  - Authorization: Bearer your-api-key (required)
- Response: Array of shortened URLs

### Redirect

- GET /redirect?code=abc123
- Query Parameters:
- password (if URL is password protected)
- Redirects to original URL
- Returns 410 if URL has expired
- Returns 401 if password is required
- Returns 403 if password is invalid

### Update URL

- PUT /update
- Body:

```json
{
  "short_code": "abc123",
  "original_url": "https://newurl.com", // optional
  "expiry_date": "2024-12-31", // optional
  "custom_code": "newcode", // optional
  "password": "newpassword", // optional
  "undelete": true // optional
}
```

- Headers:
  - Authorization: Bearer your-api-key (required)

### Delete URL

- DELETE /delete?code=abc123
- Headers:
  - Authorization: Bearer your-api-key (required for owned URLs)
- Response: 204 No Content

## Testing

Run the test suite:

```bash
pnpm test
```

## Load Testing

1. Install k6:

   - macOS: `brew install k6`
   - Other platforms: [k6 Installation Guide](https://k6.io/docs/get-started/installation/)

2. Run load test:

```bash
k6 run load_test.js
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

ISC License

```

```

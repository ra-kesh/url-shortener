# URL Shortener API

A simple URL shortener API built with Node.js and Express framework. It uses SQLite as the database to store the mapping between short codes and original URLs.

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

## Project Structure

```plaintext
src/
├── controllers/    # Request handlers
├── services/      # Business logic
├── routes/        # API routes
├── utils/         # Utility functions
├── app.js         # Express app setup
└── server.js      # Server entry point
```

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

- **POST** `/shorten`
- **Body:** `{ "original_url": "https://example.com" }`
- **Response:** `{ "short_code": "abc123" }`

### Redirect

- **GET** `/redirect?code=abc123`
- Redirects to original URL

### Delete URL

- **DELETE** `/delete?code=abc123`
- **Response:** `204 No Content`

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

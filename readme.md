# URL Shortener API

This is a simple URL shortener API built with Node.js and the Express framework. It uses SQLite as the database to store the mapping between short codes and original URLs. It also has a test suite using Jest and Supertest and a load test using k6.

## Prerequisites:

- Node.js
- pnpm
- k6

## Installation

1. Clone the repository

```bash
git clone https://github.com/ra-kesh/url-shortener.git
```

2. Navigate to the project directory

```bash
cd url-shortener
```

3. Install the required dependencies

```bash
pnpm install
```

4. Run the server

```bash
node server.js
```

5. Run the tests

```bash
pnpm test
```

## Load Testing

### Prerequisites

- Install `k6` following the official guide: [k6 Installation](https://k6.io/docs/get-started/installation/).

### Running the Load Test

1. Navigate to the project directory
2. Run the following command

```bash
k6 run load_test.js
```

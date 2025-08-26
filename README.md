## Server Architectures
This repo presents different server architectures and evaluates characteristics, advantages and limitations of each one of them.

### Technologies
- Node.js: a JavaScript runtime environment for building scalable server-side applications.

### Servers
- **Lab01**: traditional server.
- **Lab02**: gRPC (Google Remote Procedure Call) communication between client and server.

### Architectural highlights
#### Traditional server
- **In-Memory cache**: a simple, custom-built caching solution that stores frequently accessed data in memory. This drastically reduces the number of database queries, improving API response times and lowering the load on the database. It includes a time-to-live (TTL) mechanism to ensure data freshness.

- **Structured logging**: this project uses Winston library to implement structured, JSON-formatted logs.

- **Swagger for documentation**: API documentation is powered by Swagger (OpenAPI). By defining the API's structure in a YAML file, the project automatically generates an interactive web-based documentation interface.

- **JWT authentication**: all protected routes are secured with JSON Web Tokens (JWT). A middleware verifies each token, ensuring that only authenticated users can access and modify their own data, providing a robust layer of security.
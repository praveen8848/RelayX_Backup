



# Security & Multi‑Tenancy in RelayX

## 1. Overview

RelayX is designed to be a **developer platform** where multiple independent projects (tenants) can publish events. Each tenant must be isolated from others and authenticated using a unique API key.

This document explains how RelayX implements multi‑tenancy and API key authentication, and how clients can use it.

## 2. Project (Tenant) Model

A **Project** represents a tenant. Each project has:

- `id` – internal identifier
- `name` – human‑readable name
- `apiKey` – secret key used for authentication
- `createdAt` – timestamp

The API key is a random string prefixed with `relay_live_`, generated when the project is created. It is stored in the database (hashed in a real production system; for this project we store it as plain text for simplicity, but this can be enhanced with BCrypt).

## 3. Authentication Flow

1. Client creates a project via the admin API (`POST /api/projects`).
2. The response includes the `apiKey`.
3. Client includes the key in the `Authorization` header as a Bearer token when calling protected endpoints.
4. A Spring Security filter intercepts the request, extracts the key, and looks up the project in the database.
5. If found, the project ID is set as the authentication principal and stored as a request attribute.
6. The protected controller can then access the project ID and associate data (outbox events) with that tenant.

## 4. Implementation Details

### 4.1 `Project` Entity

```java
@Entity
@Table(name = "projects")
public class Project {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(name = "api_key", nullable = false, unique = true, length = 64)
    private String apiKey;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    // PrePersist generates apiKey if null
}
```
### 4.2 Authentication Filter

`ApiKeyAuthFilter` extends `OncePerRequestFilter`. It reads the `Authorization` header, validates it against the `ProjectRepository`, and sets the Spring Security context if the API key is valid.

```java
if (header.startsWith("Bearer ")) {
    String apiKey = header.substring(7);

    projectRepository.findByApiKey(apiKey).ifPresent(project -> {
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(
                        project.getId(),
                        null,
                        Collections.emptyList()
                );

        SecurityContextHolder.getContext().setAuthentication(auth);
        request.setAttribute("projectId", project.getId());
    });
}
```

### 4.3 Security Configuration

Spring Security is configured to:

* Disable CSRF since we use API tokens.
* Require authentication only for `/api/events/**`.
* Permit all other endpoints (admin endpoints may later be secured).
* Register the `ApiKeyAuthFilter` before the default username/password authentication filter.

```java
http
    .csrf().disable()
    .authorizeHttpRequests(auth -> auth
        .requestMatchers("/api/events/**").authenticated()
        .anyRequest().permitAll()
    )
    .addFilterBefore(
        new ApiKeyAuthFilter(projectRepository),
        UsernamePasswordAuthenticationFilter.class
    );
```

### 4.4 Event Ingestion (Protected Endpoint)

`POST /api/events` accepts a JSON body containing the event details and uses the authenticated project ID to create an outbox event.

Example request:

```http
POST /api/events
Authorization: Bearer relay_live_abc123...
Content-Type: application/json

{
  "aggregateType": "Order",
  "aggregateId": 42,
  "eventType": "OrderCreated",
  "topic": "order-events",
  "payload": "{\"id\":42,\"status\":\"CREATED\"}"
}
```

The controller extracts `projectId` from the authentication principal and sets it on the outbox event.

## 5. Project Management API

Currently, project management endpoints are open and do not require admin authentication. This is acceptable for local development.

In production, these endpoints should be protected with an appropriate admin role.

* `POST /api/projects?name=MyProject` — Creates a project and returns the API key.
* `GET /api/projects` — Lists all projects.

## 6. How Clients Use RelayX

1. **Register a project** via the API or a future dashboard UI.
2. **Store the API key securely.**
3. **Publish events** by sending `POST /api/events` with the API key in the `Authorization` header.
4. **RelayX ensures reliable delivery** to Kafka using the Outbox Pattern, retries, and a Dead Letter Queue (DLQ).

The `projectId` is stored with each event, enabling:

* Per-tenant metrics.
* Event ownership tracking.
* Future tenant isolation features.

## 7. Testing Multi-Tenancy

### Step 1: Start the Application

Start RelayX along with PostgreSQL and Kafka.

### Step 2: Create Two Projects

```bash
curl -X POST "http://localhost:8080/api/projects?name=TenantA"

curl -X POST "http://localhost:8080/api/projects?name=TenantB"
```

Note the returned `apiKey` values for both projects.

### Step 3: Publish an Event Using TenantA's API Key

```powershell
Invoke-RestMethod -Uri "http://localhost:8080/api/events" `
  -Method Post `
  -Headers @{ Authorization = "Bearer <TenantA_apiKey>" } `
  -ContentType "application/json" `
  -Body '{"aggregateType":"Order","aggregateId":1,"eventType":"OrderCreated","topic":"order-events","payload":"{}"}'
```

### Step 4: Verify the Database

Verify that the created outbox event has a `project_id` corresponding to TenantA.

### Step 5: Test TenantB

Publish another event using TenantB's API key.

The newly created event should have TenantB's `project_id`.

This confirms that RelayX correctly associates events with the authenticated project.

## 8. Security Considerations

* **API keys must be kept secret:** Never expose API keys in client-side code, source control, or application logs.
* **HTTPS:** HTTPS is mandatory in production to prevent API key interception.
* **Rate limiting:** Rate limiting can be added to protect the ingestion API from abuse.
* **Key rotation and revocation:** These should be added as future enhancements.
* **Project isolation:** Events are currently tagged with `projectId`, but the relay processes all projects uniformly. For stronger isolation, separate Kafka topics, partitions, consumer groups, or dedicated infrastructure per tenant can be considered.

## 9. Conclusion

Multi-tenancy and API key authentication transform RelayX from a single-service Outbox Pattern implementation into a multi-tenant event delivery platform.

This architecture provides:

* Project-level event ownership.
* API-based authentication.
* Tenant-aware event tracking.
* A foundation for future isolation and observability features.

Combined with reliable delivery, retries, idempotency, concurrency control, and DLQ support, multi-tenancy becomes a key differentiator for RelayX and demonstrates practical knowledge of **system design, distributed systems, security, and backend architecture**.

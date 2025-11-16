# API Overview

Last Updated: {{DATE}}

## Overview

This document provides a comprehensive overview of the API, including endpoints, authentication, and usage examples.

## Base Information

- **Base URL**: `{{API_BASE_URL}}`
- **API Version**: `{{API_VERSION}}`
- **Protocol**: {{PROTOCOL}}
- **Format**: JSON

## Authentication

### Authentication Method

{{AUTH_METHOD_DESCRIPTION}}

### Getting Started

```{{LANGUAGE}}
// Authentication example
{{AUTH_EXAMPLE}}
```

### API Keys

{{API_KEY_DESCRIPTION}}

## Rate Limiting

- **Rate Limit**: {{RATE_LIMIT}}
- **Rate Limit Window**: {{RATE_WINDOW}}
- **Headers**:
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining
  - `X-RateLimit-Reset`: Time when limit resets

## Common Request/Response Format

### Request Headers

```http
Content-Type: application/json
Authorization: {{AUTH_HEADER_EXAMPLE}}
X-API-Version: {{API_VERSION}}
```

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "ISO 8601 timestamp",
    "request_id": "unique request ID"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { ... }
  },
  "meta": {
    "timestamp": "ISO 8601 timestamp",
    "request_id": "unique request ID"
  }
}
```

## API Endpoints

### {{RESOURCE_1}} Endpoints

#### Get {{RESOURCE_1}}

```http
GET {{API_BASE_URL}}/{{RESOURCE_1_PATH}}/{id}
```

**Description**: {{ENDPOINT_DESCRIPTION}}

**Parameters**:
- `id` (path, required): {{PARAM_DESCRIPTION}}

**Query Parameters**:
- `{{QUERY_PARAM_1}}` (optional): {{QUERY_PARAM_1_DESCRIPTION}}
- `{{QUERY_PARAM_2}}` (optional): {{QUERY_PARAM_2_DESCRIPTION}}

**Response**:
```json
{{RESPONSE_EXAMPLE}}
```

**Example**:
```{{LANGUAGE}}
{{CODE_EXAMPLE}}
```

#### List {{RESOURCE_1}}

```http
GET {{API_BASE_URL}}/{{RESOURCE_1_PATH}}
```

**Description**: {{ENDPOINT_DESCRIPTION}}

**Query Parameters**:
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 20): Items per page
- `sort` (optional): Sort field
- `order` (optional, default: asc): Sort order (asc/desc)
- `{{FILTER_PARAM}}` (optional): {{FILTER_DESCRIPTION}}

**Response**:
```json
{
  "success": true,
  "data": [
    {{ITEM_EXAMPLE}}
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "total_pages": 5
  }
}
```

#### Create {{RESOURCE_1}}

```http
POST {{API_BASE_URL}}/{{RESOURCE_1_PATH}}
```

**Description**: {{ENDPOINT_DESCRIPTION}}

**Request Body**:
```json
{{REQUEST_BODY_EXAMPLE}}
```

**Response**:
```json
{{RESPONSE_EXAMPLE}}
```

**Example**:
```{{LANGUAGE}}
{{CODE_EXAMPLE}}
```

#### Update {{RESOURCE_1}}

```http
PUT {{API_BASE_URL}}/{{RESOURCE_1_PATH}}/{id}
PATCH {{API_BASE_URL}}/{{RESOURCE_1_PATH}}/{id}
```

**Description**: {{ENDPOINT_DESCRIPTION}}

**Parameters**:
- `id` (path, required): {{PARAM_DESCRIPTION}}

**Request Body**:
```json
{{REQUEST_BODY_EXAMPLE}}
```

**Response**:
```json
{{RESPONSE_EXAMPLE}}
```

#### Delete {{RESOURCE_1}}

```http
DELETE {{API_BASE_URL}}/{{RESOURCE_1_PATH}}/{id}
```

**Description**: {{ENDPOINT_DESCRIPTION}}

**Parameters**:
- `id` (path, required): {{PARAM_DESCRIPTION}}

**Response**:
```json
{
  "success": true,
  "message": "{{RESOURCE_1}} deleted successfully"
}
```

### {{RESOURCE_2}} Endpoints

#### Get {{RESOURCE_2}}

```http
GET {{API_BASE_URL}}/{{RESOURCE_2_PATH}}/{id}
```

**Description**: {{ENDPOINT_DESCRIPTION}}

**Response**:
```json
{{RESPONSE_EXAMPLE}}
```

#### List {{RESOURCE_2}}

```http
GET {{API_BASE_URL}}/{{RESOURCE_2_PATH}}
```

**Description**: {{ENDPOINT_DESCRIPTION}}

**Query Parameters**:
- `{{QUERY_PARAM}}` (optional): {{QUERY_PARAM_DESCRIPTION}}

### {{RESOURCE_3}} Endpoints

#### {{CUSTOM_ENDPOINT}}

```http
{{HTTP_METHOD}} {{API_BASE_URL}}/{{CUSTOM_PATH}}
```

**Description**: {{ENDPOINT_DESCRIPTION}}

## Error Codes

### HTTP Status Codes

- `200 OK`: Request succeeded
- `201 Created`: Resource created successfully
- `204 No Content`: Request succeeded with no content
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication required or failed
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `422 Unprocessable Entity`: Validation error
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error
- `503 Service Unavailable`: Service temporarily unavailable

### Application Error Codes

- `{{ERROR_CODE_1}}`: {{ERROR_DESCRIPTION_1}}
- `{{ERROR_CODE_2}}`: {{ERROR_DESCRIPTION_2}}
- `{{ERROR_CODE_3}}`: {{ERROR_DESCRIPTION_3}}

## Pagination

All list endpoints support pagination with these parameters:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

**Response includes**:
```json
{
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "total_pages": 5,
    "has_next": true,
    "has_prev": false
  }
}
```

## Filtering and Sorting

### Filtering

Use query parameters to filter results:

```http
GET {{API_BASE_URL}}/{{RESOURCE_PATH}}?{{FILTER_FIELD}}={{FILTER_VALUE}}
```

**Supported Operators**:
- `eq`: Equal to
- `ne`: Not equal to
- `gt`: Greater than
- `gte`: Greater than or equal
- `lt`: Less than
- `lte`: Less than or equal
- `in`: In list
- `like`: Pattern match

**Example**:
```http
GET {{API_BASE_URL}}/{{RESOURCE_PATH}}?status=eq:active&created_at=gte:2024-01-01
```

### Sorting

Use `sort` and `order` parameters:

```http
GET {{API_BASE_URL}}/{{RESOURCE_PATH}}?sort={{FIELD}}&order=desc
```

## Webhooks

### Available Events

- `{{EVENT_1}}`: {{EVENT_1_DESCRIPTION}}
- `{{EVENT_2}}`: {{EVENT_2_DESCRIPTION}}
- `{{EVENT_3}}`: {{EVENT_3_DESCRIPTION}}

### Webhook Payload

```json
{
  "event": "{{EVENT_NAME}}",
  "timestamp": "ISO 8601 timestamp",
  "data": { ... },
  "webhook_id": "unique webhook ID"
}
```

### Registering Webhooks

```http
POST {{API_BASE_URL}}/webhooks
```

**Request**:
```json
{
  "url": "https://your-domain.com/webhook",
  "events": ["{{EVENT_1}}", "{{EVENT_2}}"],
  "secret": "your-webhook-secret"
}
```

## SDK Examples

### {{LANGUAGE_1}}

```{{LANGUAGE_1}}
{{SDK_EXAMPLE_1}}
```

### {{LANGUAGE_2}}

```{{LANGUAGE_2}}
{{SDK_EXAMPLE_2}}
```

## Best Practices

### Error Handling

```{{LANGUAGE}}
{{ERROR_HANDLING_EXAMPLE}}
```

### Retry Logic

{{RETRY_GUIDANCE}}

### Idempotency

{{IDEMPOTENCY_GUIDANCE}}

## Testing

### Test Environment

- **Base URL**: `{{TEST_API_BASE_URL}}`
- **Test API Key**: {{TEST_KEY_INFO}}

### Example Test Requests

```{{LANGUAGE}}
{{TEST_EXAMPLE}}
```

## Related Documentation

- [Architecture](architecture.md)
- [Domains and Modules](domains-and-modules.md)
- [Development Workflows](development-workflows.md)

## API Changelog

### {{VERSION_1}}

- {{CHANGE_1}}
- {{CHANGE_2}}

### {{VERSION_2}}

- {{CHANGE_1}}

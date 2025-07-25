# CAD Document Module Architecture

## Overview

The CAD Document module provides a comprehensive system for managing technical maintenance documents with electrical schemes and other CAD-related documentation. This module follows the exact same architectural patterns as the Project module, ensuring consistency and maintainability across the application.

## Purpose

CAD Documents are technical maintenance documents that belong to projects and contain:

- Electrical schemes
- Technical diagrams
- Maintenance documentation
- Versioned technical information
- Location-specific documentation

Each CAD Document belongs to exactly one project and includes versioning capabilities for tracking document revisions.

## Architecture Pattern

The CAD Document module follows a layered architecture pattern identical to the Project module:

```
CADDocumentModule
├── Controller Layer (API endpoints)
├── Service Layer (Business logic)
├── Direct Read/Write Layer (Data access abstraction)
└── Repository Layer (Database operations)
```

## Module Structure

### Core Files

- `cad-document.module.ts` - Main module configuration
- `cad-document.service.ts` - Primary business logic service
- `cad-document.controller.ts` - REST API endpoints

### Data Transfer Objects (DTOs)

- `dto/create-cad-document.dto.ts` - Input validation for document creation
- `dto/cad-document-response.dto.ts` - Output transformation for API responses

### Interfaces

- `interfaces/cad-document.interface.ts` - TypeScript interfaces for type safety

### Data Model Layer

- `data-model/cad-document.schema.ts` - MongoDB schema definition
- `data-model/cad-document-repository.service.ts` - Database operations
- `data-model/cad-document-repository.module.ts` - Repository module configuration

### Direct Access Layers

- `direct-read/` - Read-only operations without business logic
- `direct-write/` - Write operations with basic validation

## Data Model

### CAD Document Entity

The CADDocument entity contains the following fields:

| Field         | Type     | Required | Description                              |
| ------------- | -------- | -------- | ---------------------------------------- |
| `_id`         | ObjectId | Yes      | Unique MongoDB identifier                |
| `name`        | String   | Yes      | Display name of the document             |
| `description` | String   | Yes      | Detailed description of document content |
| `projectId`   | String   | Yes      | Reference to parent project              |
| `location`    | String   | Yes      | User-defined location description        |
| `version`     | String   | Yes      | Document version for tracking revisions  |
| `createdAt`   | Date     | Auto     | Document creation timestamp              |
| `updatedAt`   | Date     | Auto     | Last modification timestamp              |

### Relationships

- **One-to-Many**: Each Project can have multiple CAD Documents
- **Many-to-One**: Each CAD Document belongs to exactly one Project

## API Endpoints

All endpoints require JWT authentication and follow RESTful conventions:

### Create Document

- `POST /cad-documents/v1`
- Creates a new CAD document
- Body: `CreateCADDocumentRequestDto`

### Read Operations

- `GET /cad-documents/:id/v1` - Find by ID
- `GET /cad-documents/projects/:projectId/v1` - Find by project
- `GET /cad-documents/locations/:location/v1` - Find by location (partial match)

### Update Document

- `PUT /cad-documents/:id/v1`
- Updates an existing document
- Body: `ICADDocument`

### Delete Document

- `DELETE /cad-documents/:id/v1`
- Removes a document by ID

## Service Layer Architecture

### Main Service (`CADDocumentService`)

The primary service provides:

- Business logic orchestration
- Error handling and logging
- Input/output transformation
- Transaction coordination

### Direct Services

**Direct Read Service**: Handles read operations without business logic

- `findById(id: string)`
- `findByProjectId(projectId: string)`
- `findByLocation(location: string)`

**Direct Write Service**: Handles write operations with basic validation

- `create(cadDocument: Omit<ICADDocument, 'id'>)`
- `update(id: string, cadDocument: ICADDocument)`
- `delete(id: string)`

### Repository Service

The repository service handles all database interactions:

- MongoDB operations using Mongoose
- Data transformation between entities and interfaces
- Query optimization
- Error handling at the data layer

## Validation and DTOs

### Input Validation

`CreateCADDocumentRequestDto` provides comprehensive validation:

- All string fields validated as non-empty
- Type checking for all required fields
- Integration with class-validator decorators

### Output Transformation

`CADDocumentResponseDto` ensures consistent API responses:

- Transforms internal entity to public interface
- Includes timestamp information
- Maintains type safety

## Error Handling

The module implements comprehensive error handling:

- `NotFoundException` for missing documents
- `InternalServerErrorException` for unexpected errors
- Detailed logging for debugging and monitoring

## Integration Points

### With Project Module

- CAD Documents reference projects via `projectId`
- Supports querying documents by project
- Maintains referential integrity

### With Authentication

- All endpoints protected by JWT authentication
- User context available for authorization decisions

### With Logging

- Comprehensive logging of all operations
- Structured logging for monitoring and debugging

## Database Collection

Documents are stored in the `cad_documents` MongoDB collection with:

- Automatic timestamp management
- Indexed fields for performance
- Document validation at the schema level

## Future Extensibility

The architecture supports future enhancements:

- Additional query methods in repository layer
- Extended validation rules in DTOs
- Business logic extensions in service layer
- New API endpoints in controller layer

## Usage Examples

### Creating a CAD Document

```typescript
const cadDocument = {
  name: "Electrical Schematic v2.1",
  description: "Updated electrical schematic for main control panel",
  projectId: "507f1f77bcf86cd799439011",
  location: "Building A - Floor 2 - Control Room",
  version: "2.1.0",
};

const result = await cadDocumentService.create(cadDocument);
```

### Finding Documents by Project

```typescript
const projectDocuments = await cadDocumentService.findByProjectId(
  "507f1f77bcf86cd799439011"
);
```

### Searching by Location

```typescript
const controlRoomDocs = await cadDocumentService.findByLocation("Control Room");
```

## Best Practices

1. **Consistent Naming**: Follow the established naming conventions
2. **Error Handling**: Always handle errors at appropriate layers
3. **Validation**: Validate inputs at the DTO layer
4. **Logging**: Log all significant operations
5. **Type Safety**: Use TypeScript interfaces consistently
6. **Documentation**: Maintain comprehensive JSDoc comments

## Dependencies

- `@nestjs/common` - Core NestJS functionality
- `@nestjs/mongoose` - MongoDB integration
- `class-validator` - Input validation
- `mongoose` - MongoDB object modeling
- Custom logger service
- Authentication guards

This architecture ensures scalability, maintainability, and consistency with the existing codebase while providing comprehensive CAD document management capabilities.

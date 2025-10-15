# Joan - Planet Nine File Storage Service

## Overview

Joan is a Planet Nine allyabase microservice that handles file storage and retrieval with sessionless authentication.

**Location**: `/joan/`
**Port**: 3008 (default)

## Core Features

### 📁 **File Management**
- **Secure Storage**: Cryptographically authenticated file uploads
- **File Retrieval**: Fast file access with authentication
- **Sessionless Auth**: All operations use cryptographic signatures
- **Per-User Storage**: Isolated file storage per user

## API Endpoints

### File Operations
- `POST /file/:uuid` - Upload file for user
- `GET /file/:uuid/:filename` - Retrieve specific file
- `GET /user/:uuid/files` - List user's files
- `DELETE /file/:uuid/:filename` - Delete file

### MAGIC Protocol
- `POST /magic/spell/:spellName` - Execute MAGIC spells for file operations

### Health & Status
- `GET /health` - Service health check

## MAGIC Route Conversion (October 2025)

All Joan REST endpoints have been converted to MAGIC protocol spells:

### Converted Spells (5 total)
1. **joanUserCreate** - Create file storage user
2. **joanUserFileUpload** - Upload file to user storage
3. **joanUserFiles** - List user's files
4. **joanUserFile** - Retrieve specific file
5. **joanUserFileDelete** - Delete file

**Testing**: Comprehensive MAGIC spell tests available in `/test/mocha/magic-spells.js` (10 tests covering success and error cases)

**Documentation**: See `/MAGIC-ROUTES.md` for complete spell specifications and migration guide

## Implementation Details

**Location**: `/src/server/node/src/magic/magic.js`

All file operations maintain the same functionality as the original REST endpoints while benefiting from centralized Fount authentication and MAGIC protocol features like experience granting and gateway rewards.

## Last Updated
October 14, 2025 - Completed full MAGIC protocol conversion. All 5 routes now accessible via MAGIC spells with centralized Fount authentication.

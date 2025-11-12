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

### Authentication
- `POST /auth/email/send-otp` - Send OTP code to email
- `POST /auth/email/verify-otp` - Verify OTP and create/return user
- `GET /auth/github/initiate` - Initiate GitHub OAuth flow
- `GET /auth/github/callback` - GitHub OAuth callback handler

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

## Authentication Implementation (November 2025)

Joan now includes authentication endpoints for user-friendly sign-in flows:

### Email OTP Authentication
- **Implementation**: `/src/auth/otp.js`
- Uses 6-digit OTP codes sent via Minnie SMTP service
- 10-minute expiration for security
- Email hash used as Joan user identifier

### GitHub OAuth Authentication
- **Implementation**: `/src/auth/oauth.js`
- Full OAuth 2.0 flow with CSRF protection
- Fetches user profile and email from GitHub API
- GitHub ID used as Joan user identifier

### Environment Variables
- `MINNIE_HOST` - Minnie SMTP server (default: localhost)
- `MINNIE_PORT` - Minnie SMTP port (default: 2525)
- `GITHUB_CLIENT_ID` - GitHub OAuth application ID
- `GITHUB_CLIENT_SECRET` - GitHub OAuth application secret
- `GITHUB_REDIRECT_URI` - OAuth callback URL (default: http://localhost:3004/auth/github/callback)

### User Creation
Both authentication methods automatically create Joan users with sessionless cryptographic keys when new users sign in. Private keys are returned only on first sign-in.

## Last Updated
November 12, 2025 - Added authentication endpoints (Email OTP + GitHub OAuth) for user sign-in flows. Authentication features consolidated from allyabase deployment to main Joan repository.

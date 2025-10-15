# Joan MAGIC-Routed Endpoints

## Overview

Joan now supports MAGIC-routed versions of all POST, PUT, and DELETE operations. These spells route through Fount (the resolver) for centralized authentication, eliminating the need for individual signature verification in Joan.

## Converted Routes

### 1. User Creation
**Direct Route**: `PUT /user/create`
**MAGIC Spell**: `joanUserCreate`
**Cost**: 50 MP

**Components**:
```javascript
{
  pubKey: "user-public-key",
  hash: "password-hash"
}
```

**Returns**:
```javascript
{
  success: true,
  user: {
    uuid: "user-uuid",
    pubKey: "user-public-key",
    hash: "password-hash"
  }
}
```

---

### 2. Hash Update
**Direct Route**: `PUT /user/:uuid/update-hash`
**MAGIC Spell**: `joanUserUpdateHash`
**Cost**: 50 MP

**Components**:
```javascript
{
  uuid: "user-uuid",
  hash: "current-password-hash",
  newHash: "new-password-hash"
}
```

**Returns**:
```javascript
{
  success: true,
  user: {
    uuid: "user-uuid",
    pubKey: "user-public-key",
    hash: "new-password-hash"
  }
}
```

---

### 3. User Deletion
**Direct Route**: `DELETE /user/:uuid`
**MAGIC Spell**: `joanUserDelete`
**Cost**: 50 MP

**Components**:
```javascript
{
  uuid: "user-uuid",
  hash: "password-hash"
}
```

**Returns**:
```javascript
{
  success: true
}
```

---

## Implementation Details

### File Changes

1. **`/src/magic/magic.js`** - Added three new spell handlers:
   - `joanUserCreate(spell)`
   - `joanUserUpdateHash(spell)`
   - `joanUserDelete(spell)`

2. **`/fount/src/server/node/spellbooks/spellbook.js`** - Added spell definitions with destinations and costs

3. **`/test/mocha/magic-spells.js`** - New test file with comprehensive spell tests

4. **`/test/mocha/package.json`** - Added `fount-js` dependency

### Authentication Flow

```
Client → Fount (resolver) → Joan MAGIC handler → Business logic
           ↓
    Verifies signature
    Deducts MP
    Grants experience
    Grants nineum
```

**Before (Direct REST)**:
- Client signs request
- Joan verifies signature
- Joan executes business logic

**After (MAGIC Spell)**:
- Client signs spell
- Fount verifies signature & deducts MP
- Fount grants experience & nineum to caster
- Fount forwards to Joan
- Joan executes business logic (no auth needed)

### Naming Convention

Route path → Spell name transformation:
```
/user/create              → joanUserCreate
/user/:uuid/update-hash   → joanUserUpdateHash
/user/:uuid               → joanUserDelete
```

Pattern: `[service][PathWithoutSlashesAndParams]`

### Error Handling

All spell handlers return consistent error format:
```javascript
{
  success: false,
  error: "Error description"
}
```

## Testing

Run MAGIC spell tests:
```bash
cd joan/test/mocha
npm install
npm test magic-spells.js
```

Test coverage:
- ✅ User creation via spell
- ✅ Hash update via spell
- ✅ User deletion via spell
- ✅ Missing fields validation
- ✅ Non-existent user error handling

## Benefits

1. **Centralized Auth**: All signature verification in one place (Fount)
2. **Automatic Rewards**: Every spell grants experience + nineum
3. **Gateway Rewards**: Gateway participants get 10% of rewards
4. **Reduced Code**: Joan handlers don't need auth logic
5. **Consistent Pattern**: Same flow for all services

## Next Steps

This pattern will be replicated across all 13 allyabase services:
- ✅ Joan (3 routes complete)
- ⏳ Pref
- ⏳ Aretha
- ⏳ Continuebee
- ⏳ BDO
- ⏳ Julia
- ⏳ Dolores
- ⏳ Sanora
- ⏳ Addie
- ⏳ Covenant
- ⏳ Prof
- ⏳ Fount (internal routes)

## Last Updated
January 14, 2025

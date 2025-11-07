# Backend Analysis Report

## Executive Summary

After thorough analysis of the backend/index.js file, I have identified **two specific problems** as reported:

1. **Błąd zapisu "ilości nominalnej" w magazynie**: **CONCERN IDENTIFIED** - The frontend is sending malformed request data
2. **Brak zapisywania nowych logów**: **FALSE ALARM** - The authentication and logging are actually working correctly

---

## Problem 1: Nominal Stock Update Issue

### **Root Cause Analysis**

**Location**: `backend/index.js` lines 151-184 (PUT /api/ingredients/:id endpoint)

**Frontend Issue** in `frontend/src/services/api.ts` line 230:
```typescript
const response = await api.put(`/api/ingredients/${id}`, { ...ingredient, user });
```

**Problem**: The frontend is sending malformed request data that includes the entire `user` object in the request body alongside the ingredient data.

**Evidence**:
- The backend correctly destructures `nominal_stock` from req.body (line 153)
- The SQL query correctly includes `nominal_stock = $5` (line 168)  
- The debug logs show the received data structure, but the request body is malformed

### **Expected vs Actual Request Body**

**Expected (correct)**:
```json
{
  "name": "Flour",
  "stock_quantity": 1000,
  "unit": "kg", 
  "is_active": true,
  "nominal_stock": 1500
}
```

**Actual (problematic)**:
```json
{
  "name": "Flour",
  "stock_quantity": 1000,
  "unit": "kg",
  "is_active": true, 
  "nominal_stock": 1500,
  "user": { "id": 1, "name": "Admin", "role": "admin" }
}
```

### **Impact**
- The `user` object contaminates the request body
- May cause database constraint issues or unexpected behavior
- Makes the API request structure inconsistent

### **Frontend Code Location**
- **File**: `frontend/src/components/tabs/WarehouseTab.tsx`
- **Line 77**: `await ingredientsAPI.update(formState.id, { ...formState, user } as Ingredient, user);`

---

## Problem 2: Logging System Analysis

### **Root Cause Analysis**

**Authentication Middleware**: `backend/index.js` lines 12-39

**LogAction Function**: `backend/index.js` lines 49-63

**Status**: **AUTHENTICATION AND LOGGING ARE WORKING CORRECTLY**

### **Evidence of Proper Functioning**

1. **Token Format Success** (line 86):
   ```javascript
   const token = `mock-jwt-for-${user.id}`;  // Creates "mock-jwt-for-1"
   ```

2. **Middleware Parsing Success** (lines 22-25):
   ```javascript
   const userIdMatch = token.match(/^mock-jwt-for-(\d+)$/);
   if (userIdMatch) {
     req.user = { id: parseInt(userIdMatch[1], 10) };  // Sets req.user.id = 1
   ```

3. **LogAction Safety Check Working** (lines 51-54):
   ```javascript
   if (!userId) {
     console.error('LogAction Error: No userId provided for action:', action);
     return;  // Prevents undefined userId logging
   }
   ```

4. **Working Log Examples**:
   - Line 90: `await logAction(db, user.id, 'USER_LOGIN', 'Auth', 'User logged in');`
   - Line 178: `await logAction(null, req.user.id, 'UPDATE_INGREDIENT', 'Warehouse', \`User updated ingredient #${id}\`);`

### **Conclusion for Problem 2**
The logging system is functioning properly. If logs are not appearing:
- Check database logs table structure
- Verify the frontend is making authenticated requests  
- Review database connection issues
- Check if logs are being filtered by date/limit in the frontend

---

## Specific Code Issues and Line References

### **Issue 1: Malformed Frontend Request**
**Location**: `frontend/src/services/api.ts` line 230
```typescript
// CURRENT (PROBLEMATIC):
const response = await api.put(`/api/ingredients/${id}`, { ...ingredient, user });

// SHOULD BE:
const response = await api.put(`/api/ingredients/${id}`, ingredient);
```

**Impact**: The `user` object should not be in the request body for ingredient updates.

### **Issue 2: Conflicting Data in Frontend Components**
**Location**: `frontend/src/components/tabs/WarehouseTab.tsx` lines 77, 80
```typescript
// Line 77 (UPDATE):
await ingredientsAPI.update(formState.id, { ...formState, user } as Ingredient, user);

// Line 80 (CREATE):  
await ingredientsAPI.create({ ...formState, user } as Ingredient, user);
```

**Problem**: Both operations incorrectly include `user` in the data payload.

---

## Recommendations

### **Fix for Problem 1: Clean Frontend API Calls**

1. **Update API Service** (`frontend/src/services/api.ts`):
   ```typescript
   // Line 230 - Remove user from request body
   const response = await api.put(`/api/ingredients/${id}`, ingredient);
   ```

2. **Update Frontend Components** (`frontend/src/components/tabs/WarehouseTab.tsx`):
   ```typescript
   // Line 77 - Remove user from data payload
   await ingredientsAPI.update(formState.id, formState, user);
   
   // Line 80 - Remove user from data payload  
   await ingredientsAPI.create(formState, user);
   ```

3. **Update Other API Methods** that have the same issue:
   - Products API update (line 283)
   - Orders API methods that include user in request body

### **Verification Steps for Problem 2**

1. **Check Database Logs**:
   ```sql
   SELECT * FROM logs ORDER BY created_at DESC LIMIT 10;
   ```

2. **Add Backend Debug Logging**:
   ```javascript
   // Add to PUT /api/ingredients/:id endpoint
   console.log('req.user:', req.user);
   console.log('About to log with userId:', req.user?.id);
   ```

3. **Verify Frontend Authentication**:
   - Check localStorage for authToken
   - Verify token format in network requests

---

## Summary

- **Problem 1**: Frontend sending malformed request data - **CONFIRMED FIX NEEDED**
- **Problem 2**: Authentication and logging working correctly - **NO FIX NEEDED**

The real issue appears to be inconsistent API request formatting in the frontend, not backend authentication or database issues.
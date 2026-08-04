import { db } from '@/lib/db'

// ─── Types ───────────────────────────────────────────────────────
export interface UserContext {
  userId: string
  role: string
  propertyIds: string[] // Property IDs the user can access
  isSuperAdmin: boolean
}

// ─── Get User's Accessible Property IDs ──────────────────────────
// Returns the list of property IDs the user can access based on their hostel assignments
// Super admin returns empty array (meaning "all properties")
export async function getUserPropertyIds(userId: string, role: string): Promise<string[]> {
  // Super admin can access all properties
  if (role === 'super_admin') return []
  
  // Owner can access their owned properties
  if (role === 'owner') {
    const ownedProperties = await db.property.findMany({
      where: { ownerId: userId },
      select: { id: true },
    })
    return ownedProperties.map(p => p.id)
  }
  
  // Manager, staff, tenant: get from hostel assignments
  const assignments = await db.hostelAssignment.findMany({
    where: { userId, isActive: true },
    select: { propertyId: true },
  })
  return assignments.map(a => a.propertyId)
}

// ─── Build Scoped Where Clause ──────────────────────────────────
// Returns a Prisma where clause that filters data by user's accessible properties
// If propertyIds is empty (super admin), returns empty object (no filter)
// If a specific propertyId is requested, validates it's in the user's accessible list
export function buildScopedWhere(userCtx: UserContext, requestedPropertyId?: string): Record<string, any> {
  // Super admin: no scoping unless specific property requested
  if (userCtx.isSuperAdmin) {
    if (requestedPropertyId) {
      return { propertyId: requestedPropertyId }
    }
    return {}
  }
  
  // If user has no accessible properties, return impossible condition
  if (userCtx.propertyIds.length === 0) {
    return { propertyId: '__NO_ACCESS__' }
  }
  
  // If specific property requested, validate access
  if (requestedPropertyId) {
    if (!userCtx.propertyIds.includes(requestedPropertyId)) {
      return { propertyId: '__NO_ACCESS__' } // User can't access this property
    }
    return { propertyId: requestedPropertyId }
  }
  
  // Return filter for all accessible properties
  return { propertyId: { in: userCtx.propertyIds } }
}

// ─── Build Full User Context ────────────────────────────────────
// Creates a complete UserContext object for use in API routes
export async function buildUserContext(userId: string, role: string): Promise<UserContext> {
  const propertyIds = await getUserPropertyIds(userId, role)
  return {
    userId,
    role,
    propertyIds,
    isSuperAdmin: role === 'super_admin',
  }
}

// ─── Check Permission Against DB ────────────────────────────────
// Checks if a role has a specific permission by looking up the RolePermission table
// Falls back to checking against default ROLE_PERMISSIONS if not found in DB
export async function checkPermission(role: string, permission: string): Promise<boolean> {
  // Super admin always has all permissions
  if (role === 'super_admin') return true
  
  try {
    const rp = await db.rolePermission.findUnique({ where: { role } })
    if (rp) {
      const perms = JSON.parse(rp.permissions)
      return perms.includes(permission)
    }
  } catch {
    // Fall through to defaults
  }
  
  // Fallback: check against hardcoded defaults
  const { ROLE_PERMISSIONS } = await import('@/lib/store')
  const defaultPerms = ROLE_PERMISSIONS[role] || []
  return defaultPerms.includes(permission as any)
}

// ─── Validate CRUD Access ───────────────────────────────────────
// Combined check: permission + data scope
// Returns { allowed: boolean, whereClause: object, error?: string }
export async function validateAccess(
  userId: string,
  role: string,
  module: string,
  action: 'create' | 'read' | 'update' | 'delete',
  requestedPropertyId?: string
): Promise<{ allowed: boolean; whereClause: Record<string, any>; userCtx: UserContext; error?: string }> {
  const userCtx = await buildUserContext(userId, role)
  
  // Check permission
  const permission = `${module}:${action}`
  const hasPermission = await checkPermission(role, permission)
  if (!hasPermission) {
    return { allowed: false, whereClause: {}, userCtx, error: `You don't have permission to ${action} ${module}` }
  }
  
  // Build scoped where clause
  const whereClause = buildScopedWhere(userCtx, requestedPropertyId)
  
  // Check if the where clause would return no results (access denied to specific property)
  if (whereClause.propertyId === '__NO_ACCESS__') {
    return { allowed: false, whereClause: {}, userCtx, error: 'You do not have access to this property' }
  }
  
  return { allowed: true, whereClause, userCtx }
}

// ─── Build Property-Level Where Clause ──────────────────────────
// For the Property model itself, we need to filter by `id` not `propertyId`
export function buildPropertyWhere(userCtx: UserContext, requestedPropertyId?: string): Record<string, any> {
  // Super admin: no scoping unless specific property requested
  if (userCtx.isSuperAdmin) {
    if (requestedPropertyId) {
      return { id: requestedPropertyId }
    }
    return {}
  }
  
  // If user has no accessible properties, return impossible condition
  if (userCtx.propertyIds.length === 0) {
    return { id: '__NO_ACCESS__' }
  }
  
  // If specific property requested, validate access
  if (requestedPropertyId) {
    if (!userCtx.propertyIds.includes(requestedPropertyId)) {
      return { id: '__NO_ACCESS__' }
    }
    return { id: requestedPropertyId }
  }
  
  // Return filter for all accessible properties
  return { id: { in: userCtx.propertyIds } }
}

// ─── Tenant Self-Access Check ───────────────────────────────────
// For tenant-specific data (payments, complaints, etc.)
// Returns a where clause that only includes the tenant's own data
export function buildTenantWhere(tenantId: string, userCtx: UserContext, requestedPropertyId?: string): Record<string, any> {
  const baseWhere = buildScopedWhere(userCtx, requestedPropertyId)
  return {
    ...baseWhere,
    tenantId, // Only the tenant's own data
  }
}

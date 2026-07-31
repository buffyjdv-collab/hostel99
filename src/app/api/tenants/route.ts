import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { validateAccess, buildUserContext, buildScopedWhere } from '@/lib/auth-helpers'

// GET /api/tenants - List tenants (scoped to user's access)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || ''
    const role = searchParams.get('role') || ''
    const propertyId = searchParams.get('propertyId') || undefined
    const tenantUserId = searchParams.get('userId_filter') || undefined

    // For tenants: they can only see their own data (bypass validateAccess)
    if (role === 'tenant') {
      const tenantProfile = await db.tenant.findFirst({
        where: { userId },
        include: {
          property: { select: { id: true, name: true, address: true } },
          room: { select: { id: true, name: true, number: true } },
          bed: { select: { id: true, name: true, number: true } },
          user: { select: { id: true, name: true, email: true, phone: true } },
        },
      })
      if (tenantProfile) {
        return NextResponse.json([tenantProfile])
      }
      return NextResponse.json([])
    }

    // Validate read access for non-tenant roles
    const access = await validateAccess(userId, role, 'tenants', 'read', propertyId)
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: 403 })
    }

    const where: Record<string, unknown> = { ...access.whereClause }
    if (tenantUserId) where.userId = tenantUserId

    const tenants = await db.tenant.findMany({
      where,
      include: {
        property: { select: { id: true, name: true, address: true } },
        room: { select: { id: true, name: true, number: true } },
        bed: { select: { id: true, name: true, number: true } },
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(tenants)
  } catch (error) {
    console.error('Tenants GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch tenants' }, { status: 500 })
  }
}

// POST /api/tenants - Create tenant
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      name, email, phone, emergencyContact, emergencyPhone,
      fatherName, motherName, aadhaarNumber, panNumber, passportNumber,
      dateOfBirth, gender, occupation, company, permanentAddress,
      propertyId, roomId, bedId, checkInDate, checkOutDate,
      rentAmount, depositAmount, kycStatus, agreementStatus,
      agreementStart, agreementEnd, userId: tenantUserId,
      // Auth context
      userId, role,
    } = body

    // Validate create access
    const access = await validateAccess(userId, role, 'tenants', 'create', propertyId)
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: 403 })
    }

    if (!name || !phone || !propertyId) {
      return NextResponse.json(
        { error: 'Name, phone, and propertyId are required' },
        { status: 400 }
      )
    }

    const tenant = await db.tenant.create({
      data: {
        name, email, phone, emergencyContact, emergencyPhone,
        fatherName, motherName, aadhaarNumber, panNumber, passportNumber,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        gender, occupation, company, permanentAddress,
        propertyId, roomId, bedId,
        checkInDate: checkInDate ? new Date(checkInDate) : undefined,
        checkOutDate: checkOutDate ? new Date(checkOutDate) : undefined,
        rentAmount: rentAmount || 0, depositAmount: depositAmount || 0,
        kycStatus: kycStatus || 'pending', agreementStatus: agreementStatus || 'pending',
        agreementStart: agreementStart ? new Date(agreementStart) : undefined,
        agreementEnd: agreementEnd ? new Date(agreementEnd) : undefined,
        userId: tenantUserId,
      },
      include: {
        property: { select: { id: true, name: true } },
        room: { select: { id: true, name: true, number: true } },
        bed: { select: { id: true, name: true, number: true } },
      },
    })

    // Update bed status if bed is assigned
    if (bedId) {
      await db.bed.update({ where: { id: bedId }, data: { status: 'occupied', tenantId: tenant.id } })
    }
    // Update room occupied beds count
    if (roomId) {
      const occupiedCount = await db.bed.count({ where: { roomId, status: 'occupied' } })
      await db.room.update({ where: { id: roomId }, data: { occupiedBeds: occupiedCount } })
    }
    // Create hostel assignment for tenant user
    if (tenantUserId) {
      await db.hostelAssignment.upsert({
        where: { userId_propertyId: { userId: tenantUserId, propertyId } },
        update: { role: 'tenant', isActive: true },
        create: { userId: tenantUserId, propertyId, role: 'tenant', isActive: true },
      })
    }

    return NextResponse.json(tenant, { status: 201 })
  } catch (error) {
    console.error('Tenants POST error:', error)
    return NextResponse.json({ error: 'Failed to create tenant' }, { status: 500 })
  }
}

// PATCH /api/tenants - Update tenant
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, userId, role, ...data } = body

    // Validate update access
    const access = await validateAccess(userId, role, 'tenants', 'update', data.propertyId)
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: 403 })
    }

    if (!id) {
      return NextResponse.json({ error: 'Tenant id is required' }, { status: 400 })
    }

    const existingTenant = await db.tenant.findUnique({ where: { id } })
    if (!existingTenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // Check property access for existing tenant
    if (!access.userCtx.isSuperAdmin && !access.userCtx.propertyIds.includes(existingTenant.propertyId)) {
      return NextResponse.json({ error: 'You do not have access to this tenant' }, { status: 403 })
    }

    // For tenants: they can only update their own profile
    if (role === 'tenant') {
      const tenantProfile = await db.tenant.findFirst({ where: { userId } })
      if (!tenantProfile || tenantProfile.id !== id) {
        return NextResponse.json({ error: 'You can only update your own profile' }, { status: 403 })
      }
    }

    const updateData: Record<string, unknown> = {}
    const updatableFields = ['name', 'email', 'phone', 'emergencyContact', 'emergencyPhone',
      'fatherName', 'motherName', 'aadhaarNumber', 'panNumber', 'passportNumber',
      'dateOfBirth', 'gender', 'occupation', 'company', 'permanentAddress',
      'propertyId', 'roomId', 'bedId', 'checkInDate', 'checkOutDate',
      'rentAmount', 'depositAmount', 'kycStatus', 'agreementStatus',
      'agreementStart', 'agreementEnd', 'status']

    for (const field of updatableFields) {
      if (data[field] !== undefined) {
        if (['dateOfBirth', 'checkInDate', 'checkOutDate', 'agreementStart', 'agreementEnd'].includes(field)) {
          updateData[field] = data[field] ? new Date(data[field]) : null
        } else {
          updateData[field] = data[field]
        }
      }
    }

    const tenant = await db.tenant.update({
      where: { id },
      data: updateData,
      include: {
        property: { select: { id: true, name: true } },
        room: { select: { id: true, name: true, number: true } },
        bed: { select: { id: true, name: true, number: true } },
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    })

    // Update bed status if bed is changed
    if (data.bedId !== undefined) {
      if (existingTenant.bedId) {
        await db.bed.update({ where: { id: existingTenant.bedId }, data: { status: 'available', tenantId: null } })
      }
      if (data.bedId) {
        await db.bed.update({ where: { id: data.bedId }, data: { status: 'occupied', tenantId: id } })
      }
    }
    // Update room occupied beds count
    if (data.roomId !== undefined) {
      const roomsToUpdate = new Set<string>()
      if (existingTenant.roomId) roomsToUpdate.add(existingTenant.roomId)
      if (data.roomId) roomsToUpdate.add(data.roomId)
      for (const rId of roomsToUpdate) {
        const occupiedCount = await db.bed.count({ where: { roomId: rId, status: 'occupied' } })
        await db.room.update({ where: { id: rId }, data: { occupiedBeds: occupiedCount } })
      }
    }

    return NextResponse.json(tenant)
  } catch (error) {
    console.error('Tenants PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update tenant' }, { status: 500 })
  }
}

// DELETE /api/tenants - Delete tenant
export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    const { id, userId, role } = body

    // Validate delete access
    const access = await validateAccess(userId, role, 'tenants', 'delete')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: 403 })
    }

    if (!id) {
      return NextResponse.json({ error: 'Tenant id is required' }, { status: 400 })
    }

    const existingTenant = await db.tenant.findUnique({
      where: { id },
      include: { payments: true, complaints: true },
    })
    if (!existingTenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // Check property access
    if (!access.userCtx.isSuperAdmin && !access.userCtx.propertyIds.includes(existingTenant.propertyId)) {
      return NextResponse.json({ error: 'You do not have access to this tenant' }, { status: 403 })
    }

    // Free up the bed if assigned
    if (existingTenant.bedId) {
      await db.bed.update({ where: { id: existingTenant.bedId }, data: { status: 'available', tenantId: null } })
    }
    // Update room occupied beds count
    if (existingTenant.roomId) {
      const occupiedCount = await db.bed.count({ where: { roomId: existingTenant.roomId, status: 'occupied' } })
      await db.room.update({ where: { id: existingTenant.roomId }, data: { occupiedBeds: Math.max(0, occupiedCount - 1) } })
    }
    // Delete related records
    await db.payment.deleteMany({ where: { tenantId: id } })
    await db.complaint.deleteMany({ where: { tenantId: id } })
    await db.visitor.deleteMany({ where: { tenantId: id } })
    await db.tenant.delete({ where: { id } })

    return NextResponse.json({ message: 'Tenant deleted successfully', id })
  } catch (error) {
    console.error('Tenants DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete tenant' }, { status: 500 })
  }
}

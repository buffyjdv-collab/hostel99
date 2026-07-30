import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const tenants = await db.tenant.findMany({
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

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      name,
      email,
      phone,
      emergencyContact,
      emergencyPhone,
      fatherName,
      motherName,
      aadhaarNumber,
      panNumber,
      passportNumber,
      dateOfBirth,
      gender,
      occupation,
      company,
      permanentAddress,
      propertyId,
      roomId,
      bedId,
      checkInDate,
      checkOutDate,
      rentAmount,
      depositAmount,
      kycStatus,
      agreementStatus,
      agreementStart,
      agreementEnd,
      userId,
    } = body

    if (!name || !phone || !propertyId) {
      return NextResponse.json(
        { error: 'Name, phone, and propertyId are required' },
        { status: 400 }
      )
    }

    const tenant = await db.tenant.create({
      data: {
        name,
        email,
        phone,
        emergencyContact,
        emergencyPhone,
        fatherName,
        motherName,
        aadhaarNumber,
        panNumber,
        passportNumber,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        gender,
        occupation,
        company,
        permanentAddress,
        propertyId,
        roomId,
        bedId,
        checkInDate: checkInDate ? new Date(checkInDate) : undefined,
        checkOutDate: checkOutDate ? new Date(checkOutDate) : undefined,
        rentAmount: rentAmount || 0,
        depositAmount: depositAmount || 0,
        kycStatus: kycStatus || 'pending',
        agreementStatus: agreementStatus || 'pending',
        agreementStart: agreementStart ? new Date(agreementStart) : undefined,
        agreementEnd: agreementEnd ? new Date(agreementEnd) : undefined,
        userId,
      },
      include: {
        property: { select: { id: true, name: true } },
        room: { select: { id: true, name: true, number: true } },
        bed: { select: { id: true, name: true, number: true } },
      },
    })

    // Update bed status if bed is assigned
    if (bedId) {
      await db.bed.update({
        where: { id: bedId },
        data: { status: 'occupied', tenantId: tenant.id },
      })
    }

    // Update room occupied beds count
    if (roomId) {
      const occupiedCount = await db.bed.count({
        where: { roomId, status: 'occupied' },
      })
      await db.room.update({
        where: { id: roomId },
        data: { occupiedBeds: occupiedCount },
      })
    }

    return NextResponse.json(tenant, { status: 201 })
  } catch (error) {
    console.error('Tenants POST error:', error)
    return NextResponse.json({ error: 'Failed to create tenant' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const {
      id,
      name,
      email,
      phone,
      emergencyContact,
      emergencyPhone,
      fatherName,
      motherName,
      aadhaarNumber,
      panNumber,
      passportNumber,
      dateOfBirth,
      gender,
      occupation,
      company,
      permanentAddress,
      propertyId,
      roomId,
      bedId,
      checkInDate,
      checkOutDate,
      rentAmount,
      depositAmount,
      kycStatus,
      agreementStatus,
      agreementStart,
      agreementEnd,
      status,
    } = body

    if (!id) {
      return NextResponse.json({ error: 'Tenant id is required' }, { status: 400 })
    }

    const existingTenant = await db.tenant.findUnique({ where: { id } })
    if (!existingTenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (phone !== undefined) updateData.phone = phone
    if (emergencyContact !== undefined) updateData.emergencyContact = emergencyContact
    if (emergencyPhone !== undefined) updateData.emergencyPhone = emergencyPhone
    if (fatherName !== undefined) updateData.fatherName = fatherName
    if (motherName !== undefined) updateData.motherName = motherName
    if (aadhaarNumber !== undefined) updateData.aadhaarNumber = aadhaarNumber
    if (panNumber !== undefined) updateData.panNumber = panNumber
    if (passportNumber !== undefined) updateData.passportNumber = passportNumber
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null
    if (gender !== undefined) updateData.gender = gender
    if (occupation !== undefined) updateData.occupation = occupation
    if (company !== undefined) updateData.company = company
    if (permanentAddress !== undefined) updateData.permanentAddress = permanentAddress
    if (propertyId !== undefined) updateData.propertyId = propertyId
    if (roomId !== undefined) updateData.roomId = roomId
    if (bedId !== undefined) updateData.bedId = bedId
    if (checkInDate !== undefined) updateData.checkInDate = checkInDate ? new Date(checkInDate) : null
    if (checkOutDate !== undefined) updateData.checkOutDate = checkOutDate ? new Date(checkOutDate) : null
    if (rentAmount !== undefined) updateData.rentAmount = rentAmount
    if (depositAmount !== undefined) updateData.depositAmount = depositAmount
    if (kycStatus !== undefined) updateData.kycStatus = kycStatus
    if (agreementStatus !== undefined) updateData.agreementStatus = agreementStatus
    if (agreementStart !== undefined) updateData.agreementStart = agreementStart ? new Date(agreementStart) : null
    if (agreementEnd !== undefined) updateData.agreementEnd = agreementEnd ? new Date(agreementEnd) : null
    if (status !== undefined) updateData.status = status

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
    if (bedId !== undefined) {
      // Free up old bed
      if (existingTenant.bedId) {
        await db.bed.update({
          where: { id: existingTenant.bedId },
          data: { status: 'available', tenantId: null },
        })
      }
      // Occupy new bed
      if (bedId) {
        await db.bed.update({
          where: { id: bedId },
          data: { status: 'occupied', tenantId: id },
        })
      }
    }

    // Update room occupied beds count
    if (roomId !== undefined) {
      const roomsToUpdate = new Set<string>()
      if (existingTenant.roomId) roomsToUpdate.add(existingTenant.roomId)
      if (roomId) roomsToUpdate.add(roomId)
      for (const rId of roomsToUpdate) {
        const occupiedCount = await db.bed.count({
          where: { roomId: rId, status: 'occupied' },
        })
        await db.room.update({
          where: { id: rId },
          data: { occupiedBeds: occupiedCount },
        })
      }
    }

    return NextResponse.json(tenant)
  } catch (error) {
    console.error('Tenants PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update tenant' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    const { id } = body

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

    // Free up the bed if assigned
    if (existingTenant.bedId) {
      await db.bed.update({
        where: { id: existingTenant.bedId },
        data: { status: 'available', tenantId: null },
      })
    }

    // Update room occupied beds count
    if (existingTenant.roomId) {
      const occupiedCount = await db.bed.count({
        where: { roomId: existingTenant.roomId, status: 'occupied' },
      })
      await db.room.update({
        where: { id: existingTenant.roomId },
        data: { occupiedBeds: Math.max(0, occupiedCount - 1) },
      })
    }

    // Delete related payments and complaints
    await db.payment.deleteMany({ where: { tenantId: id } })
    await db.complaint.deleteMany({ where: { tenantId: id } })
    await db.visitor.deleteMany({ where: { tenantId: id } })

    // Delete the tenant
    await db.tenant.delete({ where: { id } })

    return NextResponse.json({ message: 'Tenant deleted successfully', id })
  } catch (error) {
    console.error('Tenants DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete tenant' }, { status: 500 })
  }
}

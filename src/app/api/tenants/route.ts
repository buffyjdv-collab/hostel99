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

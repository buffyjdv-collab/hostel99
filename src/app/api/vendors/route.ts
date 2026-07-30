import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/vendors
export async function GET(req: NextRequest) {
  try {
    const propertyId = req.nextUrl.searchParams.get('propertyId')
    const where: any = {}
    if (propertyId) where.propertyId = propertyId

    const vendors = await db.vendor.findMany({
      where,
      include: {
        property: { select: { id: true, name: true } },
        _count: { select: { purchaseOrders: true, quotations: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const stats = {
      totalVendors: vendors.length,
      activeVendors: vendors.filter(v => v.status === 'active').length,
      avgRating: vendors.length ? (vendors.reduce((s, v) => s + v.rating, 0) / vendors.length).toFixed(1) : '0',
    }

    return NextResponse.json({ vendors, stats })
  } catch (error) {
    console.error('Vendors GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch vendors' }, { status: 500 })
  }
}

// POST /api/vendors
export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    const vendor = await db.vendor.create({
      data: {
        name: data.name,
        contactPerson: data.contactPerson,
        phone: data.phone,
        email: data.email,
        address: data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        gstNumber: data.gstNumber,
        panNumber: data.panNumber,
        bankName: data.bankName,
        bankAccount: data.bankAccount,
        ifscCode: data.ifscCode,
        paymentTerms: data.paymentTerms,
        rating: data.rating || 0,
        status: 'active',
        propertyId: data.propertyId,
      },
    })
    return NextResponse.json(vendor)
  } catch (error) {
    console.error('Vendors POST error:', error)
    return NextResponse.json({ error: 'Failed to create vendor' }, { status: 500 })
  }
}

// PATCH /api/vendors
export async function PATCH(req: NextRequest) {
  try {
    const data = await req.json()
    const vendor = await db.vendor.update({
      where: { id: data.id },
      data: {
        name: data.name,
        contactPerson: data.contactPerson,
        phone: data.phone,
        email: data.email,
        address: data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        gstNumber: data.gstNumber,
        panNumber: data.panNumber,
        bankName: data.bankName,
        bankAccount: data.bankAccount,
        ifscCode: data.ifscCode,
        paymentTerms: data.paymentTerms,
        rating: data.rating,
        status: data.status,
      },
    })
    return NextResponse.json(vendor)
  } catch (error) {
    console.error('Vendors PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update vendor' }, { status: 500 })
  }
}

import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// POST /api/hostels - Create hostel + owner user + assignment in one step
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      // Hostel details
      hostelName,
      hostelType,
      address,
      city,
      state,
      pincode,
      landmark,
      description,
      totalRooms,
      totalBeds,
      amenities,
      // Owner details
      ownerName,
      ownerEmail,
      ownerPhone,
      ownerPassword,
    } = body

    // Validate required fields
    if (!hostelName || !address || !city) {
      return NextResponse.json(
        { error: 'Hostel name, address, and city are required' },
        { status: 400 }
      )
    }
    if (!ownerName || !ownerEmail || !ownerPhone) {
      return NextResponse.json(
        { error: 'Owner name, email, and phone are required' },
        { status: 400 }
      )
    }

    // Check if owner email already exists
    const existingUser = await db.user.findUnique({ where: { email: ownerEmail } })
    let ownerUser

    if (existingUser) {
      // Use existing user - update their role to owner if needed
      ownerUser = existingUser
      if (existingUser.role !== 'owner' && existingUser.role !== 'super_admin') {
        await db.user.update({
          where: { id: existingUser.id },
          data: { role: 'owner' },
        })
      }
    } else {
      // Create new owner user
      const password = ownerPassword || `${ownerName.toLowerCase().replace(/\s+/g, '')}123`
      ownerUser = await db.user.create({
        data: {
          email: ownerEmail,
          name: ownerName,
          phone: ownerPhone,
          password,
          role: 'owner',
          isActive: true,
        },
      })
    }

    // Create the property (hostel)
    const property = await db.property.create({
      data: {
        name: hostelName,
        type: hostelType || 'pg',
        address,
        city,
        state: state || '',
        pincode: pincode || '',
        landmark: landmark || '',
        description: description || '',
        totalRooms: totalRooms || 0,
        totalBeds: totalBeds || 0,
        occupancy: 0,
        amenities: amenities ? JSON.stringify(amenities) : JSON.stringify([]),
        images: JSON.stringify([]),
        ownerId: ownerUser.id,
        contactPhone: ownerPhone,
        contactEmail: ownerEmail,
      },
    })

    // Create hostel assignment - assign owner to this hostel
    await db.hostelAssignment.create({
      data: {
        userId: ownerUser.id,
        propertyId: property.id,
        role: 'owner',
        isActive: true,
      },
    })

    return NextResponse.json({
      property,
      owner: {
        id: ownerUser.id,
        name: ownerUser.name,
        email: ownerUser.email,
        phone: ownerUser.phone,
        role: ownerUser.role,
        isNew: !existingUser,
      },
      message: 'Hostel created and owner assigned successfully',
    }, { status: 201 })
  } catch (error: any) {
    console.error('Hostels POST error:', error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A property with this name already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to create hostel' }, { status: 500 })
  }
}

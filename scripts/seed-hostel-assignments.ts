import { db } from '@/lib/db'

async function main() {
  console.log('Seeding hostel assignments...')

  // Get all users
  const users = await db.user.findMany({ select: { id: true, email: true, role: true } })
  const properties = await db.property.findMany({ select: { id: true, name: true, ownerId: true } })

  console.log(`Found ${users.length} users and ${properties.length} properties`)

  if (properties.length === 0) {
    console.log('No properties found. Creating a demo property...')

    // Find an owner user
    const owner = users.find(u => u.role === 'owner')
    const superAdmin = users.find(u => u.role === 'super_admin')

    if (!owner && !superAdmin) {
      console.log('No owner or super_admin found. Cannot create property.')
      return
    }

    const property = await db.property.create({
      data: {
        name: 'Sunrise PG',
        type: 'pg',
        address: '123 MG Road, Koramangala',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560034',
        totalRooms: 20,
        totalBeds: 60,
        occupancy: 35,
        ownerId: owner?.id || superAdmin?.id || users[0]?.id,
        contactPhone: '+91 9876543210',
        contactEmail: 'info@sunrisepg.com',
      },
    })

    console.log(`Created property: ${property.name} (${property.id})`)
    properties.push(property)
  }

  // Assign users to properties
  for (const user of users) {
    if (user.role === 'super_admin') {
      // Super admin gets assigned to all properties
      for (const prop of properties) {
        const existing = await db.hostelAssignment.findUnique({
          where: { userId_propertyId: { userId: user.id, propertyId: prop.id } },
        })
        if (!existing) {
          await db.hostelAssignment.create({
            data: { userId: user.id, propertyId: prop.id, role: 'owner' },
          })
          console.log(`Assigned ${user.email} (super_admin) to ${prop.name} as owner`)
        }
      }
    } else if (user.role === 'owner') {
      // Owner gets assigned to their own properties
      const ownedProps = properties.filter(p => p.ownerId === user.id)
      if (ownedProps.length === 0 && properties.length > 0) {
        // If no owned properties, assign to the first one
        const existing = await db.hostelAssignment.findUnique({
          where: { userId_propertyId: { userId: user.id, propertyId: properties[0].id } },
        })
        if (!existing) {
          await db.hostelAssignment.create({
            data: { userId: user.id, propertyId: properties[0].id, role: 'owner' },
          })
          console.log(`Assigned ${user.email} (owner) to ${properties[0].name} as owner`)
        }
      } else {
        for (const prop of ownedProps) {
          const existing = await db.hostelAssignment.findUnique({
            where: { userId_propertyId: { userId: user.id, propertyId: prop.id } },
          })
          if (!existing) {
            await db.hostelAssignment.create({
              data: { userId: user.id, propertyId: prop.id, role: 'owner' },
            })
            console.log(`Assigned ${user.email} (owner) to ${prop.name} as owner`)
          }
        }
      }
    } else if (user.role === 'manager') {
      // Manager gets assigned to the first property
      if (properties.length > 0) {
        const existing = await db.hostelAssignment.findUnique({
          where: { userId_propertyId: { userId: user.id, propertyId: properties[0].id } },
        })
        if (!existing) {
          await db.hostelAssignment.create({
            data: { userId: user.id, propertyId: properties[0].id, role: 'manager' },
          })
          console.log(`Assigned ${user.email} (manager) to ${properties[0].name} as manager`)
        }
      }
    } else if (user.role === 'staff') {
      // Staff gets assigned to the first property
      if (properties.length > 0) {
        const existing = await db.hostelAssignment.findUnique({
          where: { userId_propertyId: { userId: user.id, propertyId: properties[0].id } },
        })
        if (!existing) {
          await db.hostelAssignment.create({
            data: { userId: user.id, propertyId: properties[0].id, role: 'staff' },
          })
          console.log(`Assigned ${user.email} (staff) to ${properties[0].name} as staff`)
        }
      }
    } else if (user.role === 'tenant') {
      // Tenant gets assigned to the first property
      if (properties.length > 0) {
        const existing = await db.hostelAssignment.findUnique({
          where: { userId_propertyId: { userId: user.id, propertyId: properties[0].id } },
        })
        if (!existing) {
          await db.hostelAssignment.create({
            data: { userId: user.id, propertyId: properties[0].id, role: 'tenant' },
          })
          console.log(`Assigned ${user.email} (tenant) to ${properties[0].name} as tenant`)
        }
      }
    }
  }

  console.log('Hostel assignment seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })

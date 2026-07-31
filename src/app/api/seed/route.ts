import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // Clear existing data first - use individual deleteMany in correct order
    try {
      await db.hostelAssignment.deleteMany()
    } catch {}
    try {
      await db.activityLog.deleteMany()
    } catch {}
    try {
      await db.salaryPayment.deleteMany()
    } catch {}
    try {
      await db.attendance.deleteMany()
    } catch {}
    try {
      await db.document.deleteMany()
    } catch {}
    try {
      await db.visitor.deleteMany()
    } catch {}
    try {
      await db.communication.deleteMany()
    } catch {}
    try {
      await db.notice.deleteMany()
    } catch {}
    try {
      await db.expense.deleteMany()
    } catch {}
    try {
      await db.complaint.deleteMany()
    } catch {}
    try {
      await db.payment.deleteMany()
    } catch {}
    try {
      await db.booking.deleteMany()
    } catch {}
    try {
      await db.lead.deleteMany()
    } catch {}
    try {
      await db.bed.deleteMany()
    } catch {}
    try {
      await db.tenant.deleteMany()
    } catch {}
    try {
      await db.staff.deleteMany()
    } catch {}
    try {
      await db.room.deleteMany()
    } catch {}
    try {
      await db.floor.deleteMany()
    } catch {}
    try {
      await db.building.deleteMany()
    } catch {}
    try {
      await db.inventoryCategory.deleteMany()
    } catch {}
    try {
      await db.inventoryItem.deleteMany()
    } catch {}
    try {
      await db.vendor.deleteMany()
    } catch {}
    try {
      await db.purchaseRequisition.deleteMany()
    } catch {}
    try {
      await db.purchaseOrder.deleteMany()
    } catch {}
    try {
      await db.goodsReceivedNote.deleteMany()
    } catch {}
    try {
      await db.kitchenMenu.deleteMany()
    } catch {}
    try {
      await db.kitchenMeal.deleteMany()
    } catch {}
    try {
      await db.messMenu.deleteMany()
    } catch {}
    try {
      await db.messMeal.deleteMany()
    } catch {}
    try {
      await db.asset.deleteMany()
    } catch {}
    try {
      await db.housekeepingItem.deleteMany()
    } catch {}
    try {
      await db.housekeepingTask.deleteMany()
    } catch {}
    try {
      await db.wasteRecord.deleteMany()
    } catch {}
    try {
      await db.rolePermission.deleteMany()
    } catch {}
    try {
      await db.property.deleteMany()
    } catch {}
    try {
      await db.subscription.deleteMany()
    } catch {}
    try {
      await db.user.deleteMany()
    } catch {}

    // Create Super Admin
    const superAdmin = await db.user.create({
      data: {
        email: 'admin@hostelpro.com',
        name: 'Super Admin',
        phone: '9876543210',
        password: 'admin123',
        role: 'super_admin',
        isActive: true,
      },
    })

    // Create Property Owner
    const owner = await db.user.create({
      data: {
        email: 'owner@hostelpro.com',
        name: 'Rajesh Kumar',
        phone: '9876543211',
        password: 'owner123',
        role: 'owner',
        isActive: true,
      },
    })

    // Create Manager
    const manager = await db.user.create({
      data: {
        email: 'manager@hostelpro.com',
        name: 'Priya Sharma',
        phone: '9876543212',
        password: 'manager123',
        role: 'manager',
        isActive: true,
      },
    })

    // Create Staff users
    const staffUser1 = await db.user.create({
      data: {
        email: 'staff1@hostelpro.com',
        name: 'Amit Singh',
        phone: '9876543213',
        password: 'staff123',
        role: 'staff',
        isActive: true,
      },
    })

    const staffUser2 = await db.user.create({
      data: {
        email: 'staff2@hostelpro.com',
        name: 'Neha Gupta',
        phone: '9876543214',
        password: 'staff123',
        role: 'staff',
        isActive: true,
      },
    })

    // ─── Properties ──────────────────────────────────────────
    const property1 = await db.property.create({
      data: {
        name: 'Sunrise PG',
        type: 'pg',
        address: '123 MG Road, Koramangala',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560034',
        landmark: 'Near Forum Mall',
        description: 'Premium PG accommodation for working professionals with all modern amenities',
        totalRooms: 20,
        totalBeds: 60,
        occupancy: 45,
        amenities: JSON.stringify(['WiFi', 'AC', 'Laundry', 'Meals', 'Parking', 'CCTV', 'Power Backup']),
        images: JSON.stringify([]),
        ownerId: owner.id,
        contactPhone: owner.phone,
        contactEmail: owner.email,
      },
    })

    const property2 = await db.property.create({
      data: {
        name: 'Green Valley Hostel',
        type: 'hostel',
        address: '456 Brigade Road, Indiranagar',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560038',
        landmark: 'Near Metro Station',
        description: 'Student-friendly hostel with study rooms and recreational facilities',
        totalRooms: 30,
        totalBeds: 90,
        occupancy: 72,
        amenities: JSON.stringify(['WiFi', 'Study Room', 'Mess', 'Gym', 'Sports', 'CCTV']),
        images: JSON.stringify([]),
        ownerId: owner.id,
        contactPhone: owner.phone,
        contactEmail: owner.email,
      },
    })

    const property3 = await db.property.create({
      data: {
        name: 'Urban Nest Co-Living',
        type: 'co_living',
        address: '789 HSR Layout, Sector 2',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560102',
        landmark: 'Near BDA Complex',
        description: 'Modern co-living spaces designed for community living and networking',
        totalRooms: 15,
        totalBeds: 45,
        occupancy: 30,
        amenities: JSON.stringify(['WiFi', 'AC', 'Co-working Space', 'Lounge', 'Kitchen', 'Events']),
        images: JSON.stringify([]),
        ownerId: owner.id,
        contactPhone: owner.phone,
        contactEmail: owner.email,
      },
    })

    // ─── Hostel Assignments (Multi-Tenancy) ──────────────────
    // Owner is assigned to all 3 properties
    await db.hostelAssignment.create({ data: { userId: owner.id, propertyId: property1.id, role: 'owner' } })
    await db.hostelAssignment.create({ data: { userId: owner.id, propertyId: property2.id, role: 'owner' } })
    await db.hostelAssignment.create({ data: { userId: owner.id, propertyId: property3.id, role: 'owner' } })

    // Manager is assigned to property1 and property2
    await db.hostelAssignment.create({ data: { userId: manager.id, propertyId: property1.id, role: 'manager' } })
    await db.hostelAssignment.create({ data: { userId: manager.id, propertyId: property2.id, role: 'manager' } })

    // Staff1 is assigned to property1
    await db.hostelAssignment.create({ data: { userId: staffUser1.id, propertyId: property1.id, role: 'staff' } })

    // Staff2 is assigned to property2
    await db.hostelAssignment.create({ data: { userId: staffUser2.id, propertyId: property2.id, role: 'staff' } })

    // ─── Buildings ───────────────────────────────────────────
    const building1 = await db.building.create({
      data: { name: 'Block A', propertyId: property1.id, wings: 'East,West', totalFloors: 3 },
    })
    const building2 = await db.building.create({
      data: { name: 'Block B', propertyId: property1.id, totalFloors: 2 },
    })
    const building3 = await db.building.create({
      data: { name: 'Main Building', propertyId: property2.id, wings: 'North,South', totalFloors: 4 },
    })

    // ─── Floors ──────────────────────────────────────────────
    const floors = []
    for (let i = 1; i <= 3; i++) {
      floors.push(await db.floor.create({
        data: { name: `Floor ${i}`, number: i, buildingId: building1.id, propertyId: property1.id, wing: i <= 2 ? 'East' : 'West' },
      }))
    }
    for (let i = 1; i <= 2; i++) {
      floors.push(await db.floor.create({
        data: { name: `Floor ${i}`, number: i, buildingId: building2.id, propertyId: property1.id },
      }))
    }
    for (let i = 1; i <= 4; i++) {
      floors.push(await db.floor.create({
        data: { name: `Floor ${i}`, number: i, buildingId: building3.id, propertyId: property2.id, wing: i <= 2 ? 'North' : 'South' },
      }))
    }

    // ─── Rooms & Beds ───────────────────────────────────────
    const sharingTypes = ['single', 'double', 'triple', 'four_sharing']
    const roomTypes = ['ac', 'non_ac', 'deluxe', 'premium']
    const rents = { ac: 12000, non_ac: 8000, deluxe: 15000, premium: 18000 }

    let roomCount = 0
    const allRooms = []
    for (const floor of floors) {
      const roomsPerFloor = floor.propertyId === property1.id ? 4 : 5
      for (let r = 1; r <= roomsPerFloor; r++) {
        roomCount++
        const sharingType = sharingTypes[Math.floor(Math.random() * sharingTypes.length)]
        const roomType = roomTypes[Math.floor(Math.random() * roomTypes.length)]
        const bedCount = sharingType === 'single' ? 1 : sharingType === 'double' ? 2 : sharingType === 'triple' ? 3 : 4
        const occupied = Math.min(bedCount, Math.floor(Math.random() * (bedCount + 1)))
        const status = occupied >= bedCount ? 'occupied' : 'available'

        const room = await db.room.create({
          data: {
            name: `Room ${roomCount}`,
            number: `${floor.number}${String(r).padStart(2, '0')}`,
            floorId: floor.id,
            buildingId: floor.buildingId,
            propertyId: floor.propertyId,
            sharingType,
            roomType,
            totalBeds: bedCount,
            occupiedBeds: occupied,
            rent: rents[roomType as keyof typeof rents] || 8000,
            deposit: (rents[roomType as keyof typeof rents] || 8000) * 2,
            amenities: JSON.stringify(['WiFi', 'Wardrobe', 'Study Table']),
            status,
          },
        })
        allRooms.push(room)

        for (let b = 1; b <= bedCount; b++) {
          await db.bed.create({
            data: {
              name: `Bed ${b}`,
              number: b,
              roomId: room.id,
              status: b <= occupied ? 'occupied' : 'available',
            },
          })
        }
      }
    }

    // ─── Staff ───────────────────────────────────────────────
    const staffMembers = []
    const staffRoles = ['caretaker', 'housekeeping', 'maintenance', 'security', 'cook']
    for (let i = 0; i < 5; i++) {
      const staffUser = await db.user.create({
        data: {
          email: `staff${i + 3}@hostelpro.com`,
          name: ['Ravi Kumar', 'Sunita Devi', 'Mohan Lal', 'Kavita Joshi', 'Deepak Verma'][i],
          phone: `98765432${15 + i}`,
          password: 'staff123',
          role: 'staff',
          isActive: true,
        },
      })
      const assignedPropertyId = i < 3 ? property1.id : property2.id
      const staff = await db.staff.create({
        data: {
          userId: staffUser.id,
          name: staffUser.name,
          phone: staffUser.phone,
          role: staffRoles[i],
          propertyId: assignedPropertyId,
          salary: [12000, 10000, 13000, 11000, 14000][i],
          joinDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          status: 'active',
          aadhaarNumber: `${Math.floor(Math.random() * 9000 + 1000)} ${Math.floor(Math.random() * 9000 + 1000)} ${Math.floor(Math.random() * 9000 + 1000)}`,
          address: 'Bangalore, Karnataka',
        },
      })
      // Assign staff to hostel
      await db.hostelAssignment.create({
        data: { userId: staffUser.id, propertyId: assignedPropertyId, role: 'staff' },
      })
      staffMembers.push(staff)
    }

    // ─── Tenants ─────────────────────────────────────────────
    const tenantNames = [
      'Arjun Reddy', 'Sneha Patel', 'Vikram Mehta', 'Ananya Iyer', 'Rohit Deshmukh',
      'Kavya Nair', 'Aditya Malhotra', 'Pooja Sharma', 'Rahul Verma', 'Divya Reddy',
      'Karthik Rajan', 'Meera Krishnan', 'Siddharth Jain', 'Ritu Agarwal', 'Nikhil Joshi',
      'Swati Mishra', 'Pranav Kulkarni', 'Aisha Khan', 'Harsh Pandey', 'Nandini Rao',
      'Suresh Babu', 'Lakshmi Iyengar', 'Manoj Tiwari', 'Shruti Bhat', 'Deepak Chauhan',
      'Preeti Saxena', 'Arun Nair', 'Rashmi Gupta', 'Vivek Singh', 'Tanya Mehta',
      'Anil Yadav', 'Suman Devi', 'Raj Malhotra', 'Kiran Pai', 'Pallavi Das',
      'Santosh Kumar', 'Geeta Rani', 'Mukesh Thakur', 'Sarla Verma', 'Dinesh Hegde',
      'Hema Malini', 'Ashok Sinha', 'Rekha Sharma', 'Vijay Kumar', 'Nisha Patel',
    ]

    const tenants = []
    const availableBeds = await db.bed.findMany({ where: { status: 'occupied' } })

    for (let i = 0; i < Math.min(10, availableBeds.length); i++) {
      const bed = availableBeds[i]
      const room = allRooms.find(r => r.id === bed.roomId)
      if (!room) continue

      const tenantUser = await db.user.create({
        data: {
          email: `tenant${i + 1}@hostelpro.com`,
          name: tenantNames[i] || `Tenant ${i + 1}`,
          phone: `98765${String(i + 1).padStart(5, '0')}`,
          password: 'tenant123',
          role: 'tenant',
          isActive: true,
        },
      })

      const tenant = await db.tenant.create({
        data: {
          userId: tenantUser.id,
          name: tenantNames[i] || `Tenant ${i + 1}`,
          email: tenantUser.email,
          phone: tenantUser.phone,
          emergencyContact: `Emergency ${i + 1}`,
          emergencyPhone: `98766${String(i + 1).padStart(5, '0')}`,
          fatherName: `Father of ${tenantNames[i] || `Tenant ${i + 1}`}`,
          motherName: `Mother of ${tenantNames[i] || `Tenant ${i + 1}`}`,
          aadhaarNumber: `${Math.floor(Math.random() * 9000 + 1000)} ${Math.floor(Math.random() * 9000 + 1000)} ${Math.floor(Math.random() * 9000 + 1000)}`,
          panNumber: `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}P${Math.floor(Math.random() * 9000 + 1000)}`,
          dateOfBirth: new Date(1995 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          gender: i % 2 === 0 ? 'male' : 'female',
          occupation: ['Software Engineer', 'Student', 'MBA Student', 'Data Analyst', 'Designer', 'Marketing Executive'][i % 6],
          company: ['Google', 'Infosys', 'Wipro', 'TCS', 'Amazon', 'Flipkart'][i % 6],
          permanentAddress: 'Home Town, India',
          kycStatus: i % 5 === 0 ? 'pending' : i % 7 === 0 ? 'rejected' : 'verified',
          policeVerified: i % 3 !== 0,
          agreementStatus: i % 4 === 0 ? 'pending' : i % 6 === 0 ? 'expired' : 'signed',
          agreementStart: new Date(2024, Math.floor(Math.random() * 12), 1),
          agreementEnd: new Date(2025, Math.floor(Math.random() * 12), 1),
          propertyId: room.propertyId,
          roomId: room.id,
          bedId: bed.id,
          checkInDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          status: 'active',
          rentAmount: room.rent,
          depositAmount: room.deposit,
          depositStatus: i % 4 === 0 ? 'pending' : 'paid',
        },
      })
      tenants.push(tenant)

      // Assign tenant to their hostel
      await db.hostelAssignment.create({
        data: { userId: tenantUser.id, propertyId: room.propertyId, role: 'tenant' },
      })

      // Update bed status
      await db.bed.update({ where: { id: bed.id }, data: { tenantId: tenant.id, status: 'occupied' } })
    }

    // ─── Leads ───────────────────────────────────────────────
    const leadSources = ['website', 'whatsapp', 'referral', 'walk_in', 'google', 'social_media']
    const leadStatuses = ['lead', 'inquiry', 'site_visit', 'negotiation', 'token', 'booking', 'move_in', 'lost']
    const leadNames = [
      'Rahul Sharma', 'Priya Patel', 'Amit Kumar', 'Sneha Reddy', 'Vikram Singh',
      'Anita Desai', 'Karan Mehta', 'Riya Gupta', 'Saurabh Jain', 'Megha Nair',
      'Deepak Mishra', 'Nisha Agarwal', 'Rajesh Verma', 'Pooja Iyer', 'Manish Tiwari',
      'Swati Bhat', 'Arvind Kumar', 'Sakshi Sharma', 'Ramesh Yadav', 'Kavita Joshi',
    ]

    for (let i = 0; i < 10; i++) {
      const status = leadStatuses[Math.floor(Math.random() * leadStatuses.length)]
      const stage = leadStatuses.indexOf(status) + 1
      await db.lead.create({
        data: {
          name: leadNames[i % leadNames.length],
          email: `lead${i + 1}@example.com`,
          phone: `98767${String(i + 1).padStart(5, '0')}`,
          source: leadSources[Math.floor(Math.random() * leadSources.length)],
          status,
          stage: Math.min(stage, 7),
          propertyId: [property1.id, property2.id, property3.id][i % 3],
          roomPreference: ['Single AC', 'Double Non-AC', 'Triple Sharing', 'Premium'][i % 4],
          budget: 8000 + Math.floor(Math.random() * 10000),
          visitDate: Math.random() > 0.5 ? new Date(2025, 6, Math.floor(Math.random() * 28) + 1) : null,
          followUpDate: new Date(2025, 6, Math.floor(Math.random() * 28) + 1),
          tokenAmount: status === 'token' || status === 'booking' || status === 'move_in' ? 5000 : null,
          notes: `Interested in ${['AC', 'Non-AC', 'Premium'][i % 3]} room`,
          assignedToId: manager.id,
          createdById: manager.id,
        },
      })
    }

    // ─── Payments ────────────────────────────────────────────
    const paymentMethods = ['upi', 'bank_transfer', 'card', 'wallet', 'cash']
    for (const tenant of tenants) {
      for (let m = 0; m < 2; m++) {
        const month = 2 + m
        const year = 2025
        const isPaid = Math.random() > 0.2
        const electricity = Math.floor(Math.random() * 1500) + 300
        const water = Math.floor(Math.random() * 500) + 200
        const wifi = 500
        const food = Math.floor(Math.random() * 3000) + 2000
        const rentAmount = tenant.rentAmount

        await db.payment.create({
          data: {
            tenantId: tenant.id,
            propertyId: tenant.propertyId,
            amount: rentAmount + electricity + water + wifi + food,
            rentAmount,
            electricity,
            water,
            wifi,
            food,
            laundry: Math.random() > 0.5 ? 500 : 0,
            parking: Math.random() > 0.7 ? 1000 : 0,
            otherCharges: 0,
            lateFine: isPaid ? 0 : Math.floor(Math.random() * 500),
            discount: 0,
            advanceAdjust: 0,
            paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
            paymentType: 'rent',
            status: isPaid ? 'paid' : (month < 7 ? 'overdue' : 'pending'),
            dueDate: new Date(year, month - 1, 5),
            paidDate: isPaid ? new Date(year, month - 1, Math.floor(Math.random() * 10) + 1) : null,
            receiptNumber: isPaid ? `RCP${String(month).padStart(2, '0')}${String(tenants.indexOf(tenant) + 1).padStart(4, '0')}` : null,
            month,
            year,
          },
        })
      }
    }

    // ─── Complaints ──────────────────────────────────────────
    const complaintCategories = ['maintenance', 'cleanliness', 'noise', 'food', 'staff', 'other']
    const complaintTitles = [
      'AC not working in room', 'Water leakage in bathroom', 'WiFi connectivity issues',
      'Noisy neighbors at night', 'Food quality is poor', 'Cockroach problem in room',
      'Hot water not available', 'Electrical socket not working', 'Common area not clean',
      'Staff behavior issue', 'Window broken', 'Elevator not working',
      'Parking space issue', 'Security concern', 'Mosquito problem',
    ]

    for (let i = 0; i < 8; i++) {
      const tenant = tenants[i % tenants.length]
      if (!tenant) continue
      const status = ['open', 'assigned', 'in_progress', 'resolved', 'closed'][Math.floor(Math.random() * 5)]
      await db.complaint.create({
        data: {
          title: complaintTitles[i % complaintTitles.length],
          description: `${complaintTitles[i % complaintTitles.length]} - Please resolve this issue at the earliest. This is affecting daily routine and needs urgent attention.`,
          category: complaintCategories[i % complaintCategories.length],
          priority: ['low', 'medium', 'high', 'urgent'][Math.floor(Math.random() * 4)],
          status,
          rating: status === 'resolved' || status === 'closed' ? Math.floor(Math.random() * 3) + 3 : null,
          resolution: status === 'resolved' || status === 'closed' ? 'Issue has been resolved. Thank you for your patience.' : null,
          propertyId: tenant.propertyId,
          tenantId: tenant.id,
          assignedToId: status !== 'open' ? staffUser1.id : null,
          createdById: tenant.userId || manager.id,
        },
      })
    }

    // ─── Expenses ────────────────────────────────────────────
    const expenseCategories = ['maintenance', 'utilities', 'salary', 'supplies', 'food', 'marketing', 'other']
    const expenseDescriptions = [
      'Plumbing repair', 'Electricity bill', 'Staff salary payment', 'Cleaning supplies',
      'Grocery purchase', 'Google Ads campaign', 'Paint and renovation', 'Internet bill',
      'Security guard salary', 'Furniture purchase', 'Water bill', 'Pest control service',
      'CCTV maintenance', 'Fire safety equipment', 'Garden maintenance',
    ]

    for (let i = 0; i < 10; i++) {
      await db.expense.create({
        data: {
          category: expenseCategories[i % expenseCategories.length],
          description: expenseDescriptions[i % expenseDescriptions.length],
          amount: Math.floor(Math.random() * 15000) + 1000,
          date: new Date(2025, Math.floor(Math.random() * 7), Math.floor(Math.random() * 28) + 1),
          vendor: ['ABC Services', 'XYZ Supplies', 'Quick Fix', 'Pro Maintenance', 'City Utilities'][i % 5],
          propertyId: [property1.id, property2.id, property3.id][i % 3],
          createdById: manager.id,
          status: 'approved',
        },
      })
    }

    // ─── Notices ─────────────────────────────────────────────
    const notices = [
      { title: 'Water Supply Maintenance', content: 'Water supply will be temporarily interrupted on Saturday from 9 AM to 12 PM for maintenance work. Please store sufficient water in advance. We apologize for the inconvenience.', type: 'maintenance' },
      { title: 'Rent Payment Reminder', content: 'This is a reminder that rent for the current month is due by the 5th. Late fees will be applicable after the 10th. Please ensure timely payment to avoid penalties.', type: 'payment' },
      { title: 'Annual Day Celebration', content: 'We are pleased to announce our Annual Day celebration on August 15th. All residents are invited to participate. Cultural programs and dinner will be arranged. Please register at the front desk.', type: 'event' },
      { title: 'Fire Safety Drill', content: 'A mandatory fire safety drill will be conducted on July 28th at 4 PM. All residents must participate. Emergency exits and assembly points will be demonstrated during the drill.', type: 'urgent' },
      { title: 'New WiFi Password', content: 'The WiFi password has been updated for security reasons. The new password is available at the reception desk. Please collect it during office hours. Old password will be deactivated from tomorrow.', type: 'general' },
    ]

    for (const notice of notices) {
      await db.notice.create({
        data: {
          title: notice.title,
          content: notice.content,
          type: notice.type,
          propertyId: property1.id,
          createdById: manager.id,
          isActive: true,
          expiryDate: new Date(2025, 7, 30),
        },
      })
    }

    // ─── Visitors ────────────────────────────────────────────
    for (let i = 0; i < 10; i++) {
      const tenant = tenants[i % tenants.length]
      if (!tenant) continue
      await db.visitor.create({
        data: {
          name: [`Visitor ${i + 1}`, 'Parent', 'Friend', 'Colleague', 'Relative'][i % 5],
          phone: `98768${String(i + 1).padStart(5, '0')}`,
          purpose: ['Personal visit', 'Delivery', 'Meeting', 'Parent visit', 'Friend visit'][i % 5],
          tenantId: tenant.id,
          propertyId: tenant.propertyId,
          checkIn: new Date(2025, 6, Math.floor(Math.random() * 28) + 1, 10 + Math.floor(Math.random() * 8), 0),
          checkOut: i % 3 !== 0 ? new Date(2025, 6, Math.floor(Math.random() * 28) + 1, 18 + Math.floor(Math.random() * 4), 0) : null,
          status: i % 3 !== 0 ? 'checked_out' : 'checked_in',
        },
      })
    }

    // ─── Attendance ──────────────────────────────────────────
    for (const staff of staffMembers) {
      for (let d = 1; d <= 7; d++) {
        if (d % 7 === 0) continue // Skip Sundays
        await db.attendance.create({
          data: {
            staffId: staff.id,
            date: new Date(2025, 6, d),
            checkIn: new Date(2025, 6, d, 8, 0),
            checkOut: new Date(2025, 6, d, 18, 0),
            status: Math.random() > 0.1 ? 'present' : 'absent',
          },
        })
      }
    }

    // ─── Subscriptions ───────────────────────────────────────
    await db.subscription.create({
      data: {
        userId: owner.id,
        plan: 'premium',
        status: 'active',
        startDate: new Date(2024, 0, 1),
        endDate: new Date(2025, 11, 31),
        amount: 2499,
        autoRenew: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully with hostel assignments for multi-tenancy',
      stats: {
        properties: 3,
        buildings: 3,
        floors: floors.length,
        rooms: allRooms.length,
        tenants: tenants.length,
        leads: 20,
        staff: staffMembers.length,
        complaints: 15,
        expenses: 20,
        notices: 5,
        visitors: 10,
        hostelAssignments: 'Created for all users',
      },
    })
  } catch (error: unknown) {
    console.error('Seed error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

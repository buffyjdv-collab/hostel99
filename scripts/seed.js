const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  console.log('Starting database seed...');

  // Clear existing data (order matters for foreign key constraints)
  const models = [
    'activityLog', 'salaryPayment', 'attendance', 'document', 'visitor',
    'communication', 'notice', 'expense', 'complaint', 'payment',
    'booking', 'lead', 'bed', 'tenant',
    'wasteRecord', 'consumptionLog', 'messAttendance', 'kitchenIssue',
    'menuPlanItem', 'menuPlan', 'recipeItem', 'recipe',
    'goodsReceivedNoteItem', 'goodsReceivedNote',
    'purchaseOrderItem', 'purchaseOrder',
    'purchaseRequisitionItem', 'purchaseRequisition',
    'vendorQuotation', 'vendor',
    'stockTransaction', 'inventoryItem', 'inventoryCategory',
    'housekeepingItem', 'laundryItem', 'asset',
    'room', 'floor', 'building',
    'property', 'subscription', 'staff', 'user'
  ];

  for (const model of models) {
    try {
      await prisma[model].deleteMany();
      console.log(`  Cleared ${model}`);
    } catch (e) { /* skip */ }
  }

  // Create Super Admin
  const superAdmin = await prisma.user.create({
    data: { email: 'admin@hostelpro.com', name: 'Super Admin', phone: '9876543210', password: 'admin123', role: 'super_admin', isActive: true },
  });
  console.log('Created Super Admin');

  // Create Property Owner
  const owner = await prisma.user.create({
    data: { email: 'owner@hostelpro.com', name: 'Rajesh Kumar', phone: '9876543211', password: 'owner123', role: 'owner', isActive: true },
  });
  console.log('Created Owner');

  // Create Manager
  const manager = await prisma.user.create({
    data: { email: 'manager@hostelpro.com', name: 'Priya Sharma', phone: '9876543212', password: 'manager123', role: 'manager', isActive: true },
  });
  console.log('Created Manager');

  // Create Staff users
  const staffUser1 = await prisma.user.create({
    data: { email: 'staff1@hostelpro.com', name: 'Amit Singh', phone: '9876543213', password: 'staff123', role: 'staff', isActive: true },
  });
  const staffUser2 = await prisma.user.create({
    data: { email: 'staff2@hostelpro.com', name: 'Neha Gupta', phone: '9876543214', password: 'staff123', role: 'staff', isActive: true },
  });
  console.log('Created Staff users');

  // ─── Properties ──────────────────────────────────────────
  const property1 = await prisma.property.create({
    data: {
      name: 'Sunrise PG', type: 'pg', address: '123 MG Road, Koramangala', city: 'Bangalore',
      state: 'Karnataka', pincode: '560034', landmark: 'Near Forum Mall',
      description: 'Premium PG accommodation for working professionals with all modern amenities',
      totalRooms: 20, totalBeds: 60, occupancy: 45,
      amenities: JSON.stringify(['WiFi', 'AC', 'Laundry', 'Meals', 'Parking', 'CCTV', 'Power Backup']),
      images: JSON.stringify([]), ownerId: owner.id,
    },
  });
  const property2 = await prisma.property.create({
    data: {
      name: 'Green Valley Hostel', type: 'hostel', address: '456 Brigade Road, Indiranagar', city: 'Bangalore',
      state: 'Karnataka', pincode: '560038', landmark: 'Near Metro Station',
      description: 'Student-friendly hostel with study rooms and recreational facilities',
      totalRooms: 30, totalBeds: 90, occupancy: 72,
      amenities: JSON.stringify(['WiFi', 'Study Room', 'Mess', 'Gym', 'Sports', 'CCTV']),
      images: JSON.stringify([]), ownerId: owner.id,
    },
  });
  const property3 = await prisma.property.create({
    data: {
      name: 'Urban Nest Co-Living', type: 'co_living', address: '789 HSR Layout, Sector 2', city: 'Bangalore',
      state: 'Karnataka', pincode: '560102', landmark: 'Near BDA Complex',
      description: 'Modern co-living spaces designed for community living and networking',
      totalRooms: 15, totalBeds: 45, occupancy: 30,
      amenities: JSON.stringify(['WiFi', 'AC', 'Co-working Space', 'Lounge', 'Kitchen', 'Events']),
      images: JSON.stringify([]), ownerId: owner.id,
    },
  });
  console.log('Created 3 Properties');

  // ─── Buildings ───────────────────────────────────────────
  const building1 = await prisma.building.create({ data: { name: 'Block A', propertyId: property1.id, wings: 'East,West', totalFloors: 3 } });
  const building2 = await prisma.building.create({ data: { name: 'Block B', propertyId: property1.id, totalFloors: 2 } });
  const building3 = await prisma.building.create({ data: { name: 'Main Building', propertyId: property2.id, wings: 'North,South', totalFloors: 4 } });
  console.log('Created 3 Buildings');

  // ─── Floors ──────────────────────────────────────────────
  const floors = [];
  for (let i = 1; i <= 3; i++) {
    floors.push(await prisma.floor.create({ data: { name: `Floor ${i}`, number: i, buildingId: building1.id, propertyId: property1.id, wing: i <= 2 ? 'East' : 'West' } }));
  }
  for (let i = 1; i <= 2; i++) {
    floors.push(await prisma.floor.create({ data: { name: `Floor ${i}`, number: i, buildingId: building2.id, propertyId: property1.id } }));
  }
  for (let i = 1; i <= 4; i++) {
    floors.push(await prisma.floor.create({ data: { name: `Floor ${i}`, number: i, buildingId: building3.id, propertyId: property2.id, wing: i <= 2 ? 'North' : 'South' } }));
  }
  console.log(`Created ${floors.length} Floors`);

  // ─── Rooms & Beds ───────────────────────────────────────
  const sharingTypes = ['single', 'double', 'triple', 'four_sharing'];
  const roomTypes = ['ac', 'non_ac', 'deluxe', 'premium'];
  const rents = { ac: 12000, non_ac: 8000, deluxe: 15000, premium: 18000 };
  let roomCount = 0;
  const allRooms = [];
  for (const floor of floors) {
    const roomsPerFloor = floor.propertyId === property1.id ? 4 : 5;
    for (let r = 1; r <= roomsPerFloor; r++) {
      roomCount++;
      const sharingType = sharingTypes[Math.floor(Math.random() * sharingTypes.length)];
      const roomType = roomTypes[Math.floor(Math.random() * roomTypes.length)];
      const bedCount = sharingType === 'single' ? 1 : sharingType === 'double' ? 2 : sharingType === 'triple' ? 3 : 4;
      const occupied = Math.min(bedCount, Math.floor(Math.random() * (bedCount + 1)));
      const status = occupied >= bedCount ? 'occupied' : 'available';
      const room = await prisma.room.create({
        data: {
          name: `Room ${roomCount}`, number: `${floor.number}${String(r).padStart(2, '0')}`,
          floorId: floor.id, buildingId: floor.buildingId, propertyId: floor.propertyId,
          sharingType, roomType, totalBeds: bedCount, occupiedBeds: occupied,
          rent: rents[roomType] || 8000, deposit: (rents[roomType] || 8000) * 2,
          amenities: JSON.stringify(['WiFi', 'Wardrobe', 'Study Table']), status,
        },
      });
      allRooms.push(room);
      for (let b = 1; b <= bedCount; b++) {
        await prisma.bed.create({ data: { name: `Bed ${b}`, number: b, roomId: room.id, status: b <= occupied ? 'occupied' : 'available' } });
      }
    }
  }
  console.log(`Created ${allRooms.length} Rooms with beds`);

  // ─── Staff ───────────────────────────────────────────────
  const staffMembers = [];
  const staffRoles = ['caretaker', 'housekeeping', 'maintenance', 'security', 'cook'];
  const staffNames = ['Ravi Kumar', 'Sunita Devi', 'Mohan Lal', 'Kavita Joshi', 'Deepak Verma'];
  const staffSalaries = [12000, 10000, 13000, 11000, 14000];
  for (let i = 0; i < 5; i++) {
    const staffUser = await prisma.user.create({
      data: { email: `staff${i + 3}@hostelpro.com`, name: staffNames[i], phone: `98765432${15 + i}`, password: 'staff123', role: 'staff', isActive: true },
    });
    const staff = await prisma.staff.create({
      data: {
        userId: staffUser.id, name: staffNames[i], phone: staffUser.phone, role: staffRoles[i],
        propertyId: i < 3 ? property1.id : property2.id, salary: staffSalaries[i],
        joinDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        status: 'active', aadhaarNumber: `${Math.floor(Math.random() * 9000 + 1000)} ${Math.floor(Math.random() * 9000 + 1000)} ${Math.floor(Math.random() * 9000 + 1000)}`,
        address: 'Bangalore, Karnataka',
      },
    });
    staffMembers.push(staff);
  }
  console.log('Created 5 Staff members');

  // ─── Tenants ─────────────────────────────────────────────
  const tenantNames = [
    'Arjun Reddy', 'Sneha Patel', 'Vikram Mehta', 'Ananya Iyer', 'Rohit Deshmukh',
    'Kavya Nair', 'Aditya Malhotra', 'Pooja Sharma', 'Rahul Verma', 'Divya Reddy',
    'Karthik Rajan', 'Meera Krishnan', 'Siddharth Jain', 'Ritu Agarwal', 'Nikhil Joshi',
    'Swati Mishra', 'Pranav Kulkarni', 'Aisha Khan', 'Harsh Pandey', 'Nandini Rao',
  ];
  const tenants = [];
  const availableBeds = await prisma.bed.findMany({ where: { status: 'occupied' } });
  for (let i = 0; i < Math.min(20, availableBeds.length); i++) {
    const bed = availableBeds[i];
    const room = allRooms.find(r => r.id === bed.roomId);
    if (!room) continue;
    const tenantUser = await prisma.user.create({
      data: { email: `tenant${i + 1}@hostelpro.com`, name: tenantNames[i], phone: `98765${String(i + 1).padStart(5, '0')}`, password: 'tenant123', role: 'tenant', isActive: true },
    });
    const tenant = await prisma.tenant.create({
      data: {
        userId: tenantUser.id, name: tenantNames[i], email: tenantUser.email, phone: tenantUser.phone,
        emergencyContact: `Emergency ${i + 1}`, emergencyPhone: `98766${String(i + 1).padStart(5, '0')}`,
        fatherName: `Father of ${tenantNames[i]}`, motherName: `Mother of ${tenantNames[i]}`,
        aadhaarNumber: `${Math.floor(Math.random() * 9000 + 1000)} ${Math.floor(Math.random() * 9000 + 1000)} ${Math.floor(Math.random() * 9000 + 1000)}`,
        dateOfBirth: new Date(1995 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        gender: i % 2 === 0 ? 'male' : 'female',
        occupation: ['Software Engineer', 'Student', 'MBA Student', 'Data Analyst', 'Designer'][i % 5],
        company: ['Google', 'Infosys', 'Wipro', 'TCS', 'Amazon'][i % 5],
        permanentAddress: 'Home Town, India',
        kycStatus: i % 5 === 0 ? 'pending' : i % 7 === 0 ? 'rejected' : 'verified',
        policeVerified: i % 3 !== 0,
        agreementStatus: i % 4 === 0 ? 'pending' : i % 6 === 0 ? 'expired' : 'signed',
        agreementStart: new Date(2024, Math.floor(Math.random() * 12), 1),
        agreementEnd: new Date(2025, Math.floor(Math.random() * 12), 1),
        propertyId: room.propertyId, roomId: room.id, bedId: bed.id,
        checkInDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        status: 'active', rentAmount: room.rent, depositAmount: room.deposit,
        depositStatus: i % 4 === 0 ? 'pending' : 'paid',
      },
    });
    tenants.push(tenant);
    await prisma.bed.update({ where: { id: bed.id }, data: { tenantId: tenant.id, status: 'occupied' } });
  }
  console.log(`Created ${tenants.length} Tenants`);

  // ─── Leads ───────────────────────────────────────────────
  const leadSources = ['website', 'whatsapp', 'referral', 'walk_in', 'google', 'social_media'];
  const leadStatuses = ['lead', 'inquiry', 'site_visit', 'negotiation', 'token', 'booking', 'move_in', 'lost'];
  const leadNames = ['Rahul Sharma', 'Priya Patel', 'Amit Kumar', 'Sneha Reddy', 'Vikram Singh', 'Anita Desai', 'Karan Mehta', 'Riya Gupta', 'Saurabh Jain', 'Megha Nair', 'Deepak Mishra', 'Nisha Agarwal', 'Rajesh Verma', 'Pooja Iyer', 'Manish Tiwari', 'Swati Bhat', 'Arvind Kumar', 'Sakshi Sharma', 'Ramesh Yadav', 'Kavita Joshi'];
  for (let i = 0; i < 20; i++) {
    const status = leadStatuses[Math.floor(Math.random() * leadStatuses.length)];
    const stage = leadStatuses.indexOf(status) + 1;
    await prisma.lead.create({
      data: {
        name: leadNames[i % leadNames.length], email: `lead${i + 1}@example.com`, phone: `98767${String(i + 1).padStart(5, '0')}`,
        source: leadSources[Math.floor(Math.random() * leadSources.length)], status, stage: Math.min(stage, 7),
        propertyId: [property1.id, property2.id, property3.id][i % 3],
        roomPreference: ['Single AC', 'Double Non-AC', 'Triple Sharing', 'Premium'][i % 4],
        budget: 8000 + Math.floor(Math.random() * 10000),
        visitDate: Math.random() > 0.5 ? new Date(2025, 6, Math.floor(Math.random() * 28) + 1) : null,
        followUpDate: new Date(2025, 6, Math.floor(Math.random() * 28) + 1),
        tokenAmount: ['token', 'booking', 'move_in'].includes(status) ? 5000 : null,
        notes: `Interested in ${['AC', 'Non-AC', 'Premium'][i % 3]} room`,
        assignedToId: manager.id, createdById: manager.id,
      },
    });
  }
  console.log('Created 20 Leads');

  // ─── Payments ────────────────────────────────────────────
  const paymentMethods = ['upi', 'bank_transfer', 'card', 'wallet', 'cash'];
  for (const tenant of tenants) {
    for (let m = 0; m < 6; m++) {
      const month = 2 + m;
      const year = 2025;
      const isPaid = Math.random() > 0.2;
      const electricity = Math.floor(Math.random() * 1500) + 300;
      const water = Math.floor(Math.random() * 500) + 200;
      const wifi = 500;
      const food = Math.floor(Math.random() * 3000) + 2000;
      await prisma.payment.create({
        data: {
          tenantId: tenant.id, propertyId: tenant.propertyId,
          amount: tenant.rentAmount + electricity + water + wifi + food,
          rentAmount: tenant.rentAmount, electricity, water, wifi, food,
          laundry: Math.random() > 0.5 ? 500 : 0, parking: Math.random() > 0.7 ? 1000 : 0,
          paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
          paymentType: 'rent', status: isPaid ? 'paid' : (month < 7 ? 'overdue' : 'pending'),
          dueDate: new Date(year, month - 1, 5),
          paidDate: isPaid ? new Date(year, month - 1, Math.floor(Math.random() * 10) + 1) : null,
          receiptNumber: isPaid ? `RCP${String(month).padStart(2, '0')}${String(tenants.indexOf(tenant) + 1).padStart(4, '0')}` : null,
          month, year,
        },
      });
    }
  }
  console.log(`Created ${tenants.length * 6} Payments`);

  // ─── Complaints ──────────────────────────────────────────
  const complaintCategories = ['maintenance', 'cleanliness', 'noise', 'food', 'staff', 'other'];
  const complaintTitles = ['AC not working in room', 'Water leakage in bathroom', 'WiFi connectivity issues', 'Noisy neighbors at night', 'Food quality is poor', 'Cockroach problem in room', 'Hot water not available', 'Electrical socket not working', 'Common area not clean', 'Staff behavior issue', 'Window broken', 'Elevator not working', 'Parking space issue', 'Security concern', 'Mosquito problem'];
  for (let i = 0; i < 15; i++) {
    const tenant = tenants[i % tenants.length];
    if (!tenant) continue;
    const status = ['open', 'assigned', 'in_progress', 'resolved', 'closed'][Math.floor(Math.random() * 5)];
    await prisma.complaint.create({
      data: {
        title: complaintTitles[i % complaintTitles.length],
        description: `${complaintTitles[i % complaintTitles.length]} - Please resolve this issue at the earliest.`,
        category: complaintCategories[i % complaintCategories.length],
        priority: ['low', 'medium', 'high', 'urgent'][Math.floor(Math.random() * 4)],
        status, rating: ['resolved', 'closed'].includes(status) ? Math.floor(Math.random() * 3) + 3 : null,
        resolution: ['resolved', 'closed'].includes(status) ? 'Issue has been resolved.' : null,
        propertyId: tenant.propertyId, tenantId: tenant.id,
        assignedToId: status !== 'open' ? staffUser1.id : null,
        createdById: tenant.userId || manager.id,
      },
    });
  }
  console.log('Created 15 Complaints');

  // ─── Expenses ────────────────────────────────────────────
  const expenseCategories = ['maintenance', 'utilities', 'salary', 'supplies', 'food', 'marketing', 'other'];
  const expenseDescriptions = ['Plumbing repair', 'Electricity bill', 'Staff salary payment', 'Cleaning supplies', 'Grocery purchase', 'Google Ads campaign', 'Paint and renovation', 'Internet bill', 'Security guard salary', 'Furniture purchase', 'Water bill', 'Pest control service', 'CCTV maintenance', 'Fire safety equipment', 'Garden maintenance'];
  for (let i = 0; i < 20; i++) {
    await prisma.expense.create({
      data: {
        category: expenseCategories[i % expenseCategories.length],
        description: expenseDescriptions[i % expenseDescriptions.length],
        amount: Math.floor(Math.random() * 15000) + 1000,
        date: new Date(2025, Math.floor(Math.random() * 7), Math.floor(Math.random() * 28) + 1),
        vendor: ['ABC Services', 'XYZ Supplies', 'Quick Fix', 'Pro Maintenance', 'City Utilities'][i % 5],
        propertyId: [property1.id, property2.id, property3.id][i % 3],
        createdById: manager.id, status: 'approved',
      },
    });
  }
  console.log('Created 20 Expenses');

  // ─── Notices ─────────────────────────────────────────────
  const notices = [
    { title: 'Water Supply Maintenance', content: 'Water supply will be temporarily interrupted on Saturday from 9 AM to 12 PM for maintenance work.', type: 'maintenance' },
    { title: 'Rent Payment Reminder', content: 'Rent for the current month is due by the 5th. Late fees will be applicable after the 10th.', type: 'payment' },
    { title: 'Annual Day Celebration', content: 'Annual Day celebration on August 15th. All residents are invited to participate.', type: 'event' },
    { title: 'Fire Safety Drill', content: 'Mandatory fire safety drill will be conducted on July 28th at 4 PM.', type: 'urgent' },
    { title: 'New WiFi Password', content: 'WiFi password has been updated for security reasons. Collect from reception.', type: 'general' },
  ];
  for (const notice of notices) {
    await prisma.notice.create({
      data: { title: notice.title, content: notice.content, type: notice.type, propertyId: property1.id, createdById: manager.id, isActive: true, expiryDate: new Date(2025, 7, 30) },
    });
  }
  console.log('Created 5 Notices');

  // ─── Visitors ────────────────────────────────────────────
  for (let i = 0; i < 10; i++) {
    const tenant = tenants[i % tenants.length];
    if (!tenant) continue;
    await prisma.visitor.create({
      data: {
        name: ['Visitor', 'Parent', 'Friend', 'Colleague', 'Relative'][i % 5],
        phone: `98768${String(i + 1).padStart(5, '0')}`,
        purpose: ['Personal visit', 'Delivery', 'Meeting', 'Parent visit', 'Friend visit'][i % 5],
        tenantId: tenant.id, propertyId: tenant.propertyId,
        checkIn: new Date(2025, 6, Math.floor(Math.random() * 28) + 1, 10 + Math.floor(Math.random() * 8), 0),
        checkOut: i % 3 !== 0 ? new Date(2025, 6, Math.floor(Math.random() * 28) + 1, 18 + Math.floor(Math.random() * 4), 0) : null,
        status: i % 3 !== 0 ? 'checked_out' : 'checked_in',
      },
    });
  }
  console.log('Created 10 Visitors');

  // ─── Attendance ──────────────────────────────────────────
  for (const staff of staffMembers) {
    for (let d = 1; d <= 30; d++) {
      if (d % 7 === 0) continue;
      await prisma.attendance.create({
        data: {
          staffId: staff.id, date: new Date(2025, 6, d),
          checkIn: new Date(2025, 6, d, 8, 0), checkOut: new Date(2025, 6, d, 18, 0),
          status: Math.random() > 0.1 ? 'present' : 'absent',
        },
      });
    }
  }
  console.log('Created Attendance records');

  // ─── Subscription ───────────────────────────────────────
  await prisma.subscription.create({
    data: { userId: owner.id, plan: 'premium', status: 'active', startDate: new Date(2024, 0, 1), endDate: new Date(2025, 11, 31), amount: 2499, autoRenew: true },
  });
  console.log('Created Subscription');

  console.log('\n✅ Database seeded successfully!');
  console.log(`\nStats: Properties: 3, Rooms: ${allRooms.length}, Tenants: ${tenants.length}, Leads: 20, Staff: 5, Complaints: 15, Expenses: 20, Notices: 5, Visitors: 10`);

  await prisma.$disconnect();
}

seed().catch(e => {
  console.error('Seed error:', e.message);
  prisma.$disconnect();
  process.exit(1);
});

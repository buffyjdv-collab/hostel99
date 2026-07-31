const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasourceUrl: 'postgresql://neondb_owner:npg_zQ8nyKWVPoM2@ep-dry-lake-ayve30xa-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require'
});

async function seed() {
  console.log('🚀 Starting full database seed (Multi-tenant Hostel99)...');

  // ─── Truncate all tables ───────────────────────────────────────
  console.log('Clearing all data...');
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE 
      "ActivityLog", "SalaryPayment", "Attendance", "Document", "Visitor",
      "Communication", "Notice", "Expense", "Complaint", "Payment",
      "Booking", "Lead", "Bed", "Tenant",
      "WasteRecord", "ConsumptionLog", "MessAttendance", "KitchenIssue",
      "MenuPlanItem", "MenuPlan", "RecipeItem", "Recipe",
      "GoodsReceivedNoteItem", "GoodsReceivedNote",
      "PurchaseOrderItem", "PurchaseOrder",
      "PurchaseRequisitionItem", "PurchaseRequisition",
      "VendorQuotation", "Vendor",
      "StockTransaction", "InventoryItem", "InventoryCategory",
      "HousekeepingItem", "LaundryItem", "Asset",
      "Room", "Floor", "Building",
      "HostelAssignment", "Property", "Subscription", "Staff", "User",
      "RolePermission"
    CASCADE
  `);
  console.log('  ✅ All tables cleared');

  // ═══════════════════════════════════════════════════════════════
  // 1. CREATE USERS
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📋 Creating users...');

  // Super Admin
  const superAdmin = await prisma.user.create({
    data: { email: 'admin@hostelpro.com', name: 'Super Admin', phone: '9876543210', password: 'admin123', role: 'super_admin', isActive: true }
  });

  // Owner 1 — Rajesh Kumar (owns 2 properties in Bangalore)
  const owner1 = await prisma.user.create({
    data: { email: 'rajesh@hostelpro.com', name: 'Rajesh Kumar', phone: '9876543211', password: 'owner123', role: 'owner', isActive: true }
  });

  // Owner 2 — Meena Sharma (owns 1 property in Mumbai)
  const owner2 = await prisma.user.create({
    data: { email: 'meena@hostelpro.com', name: 'Meena Sharma', phone: '9876543222', password: 'owner123', role: 'owner', isActive: true }
  });

  // Owner 3 — Vikram Patel (owns 1 property in Delhi)
  const owner3 = await prisma.user.create({
    data: { email: 'vikram@hostelpro.com', name: 'Vikram Patel', phone: '9876543233', password: 'owner123', role: 'owner', isActive: true }
  });

  // Managers (1 per property)
  const manager1 = await prisma.user.create({
    data: { email: 'priya@hostelpro.com', name: 'Priya Sharma', phone: '9876543212', password: 'manager123', role: 'manager', isActive: true }
  });
  const manager2 = await prisma.user.create({
    data: { email: 'sunil@hostelpro.com', name: 'Sunil Reddy', phone: '9876543223', password: 'manager123', role: 'manager', isActive: true }
  });
  const manager3 = await prisma.user.create({
    data: { email: 'anita@hostelpro.com', name: 'Anita Desai', phone: '9876543234', password: 'manager123', role: 'manager', isActive: true }
  });
  const manager4 = await prisma.user.create({
    data: { email: 'raj@hostelpro.com', name: 'Raj Malhotra', phone: '9876543244', password: 'manager123', role: 'manager', isActive: true }
  });

  // Staff users (7 staff across all properties)
  const staffUsers = [];
  const staffNames = ['Amit Singh', 'Neha Gupta', 'Ravi Kumar', 'Sunita Devi', 'Mohan Lal', 'Kavita Joshi', 'Deepak Verma'];
  for (let i = 0; i < staffNames.length; i++) {
    const u = await prisma.user.create({
      data: { email: `staff${i + 1}@hostelpro.com`, name: staffNames[i], phone: `9876543${30 + i}`, password: 'staff123', role: 'staff', isActive: true }
    });
    staffUsers.push(u);
  }
  console.log('  ✅ Created 1 super_admin + 3 owners + 4 managers + 7 staff = 15 users');

  // ═══════════════════════════════════════════════════════════════
  // 2. CREATE PROPERTIES (Hostels)
  // ═══════════════════════════════════════════════════════════════
  console.log('\n🏠 Creating properties...');

  const property1 = await prisma.property.create({
    data: {
      name: 'Sunrise PG', type: 'pg', address: '123 MG Road, Koramangala', city: 'Bangalore',
      state: 'Karnataka', pincode: '560034', landmark: 'Near Forum Mall',
      description: 'Premium PG accommodation for working professionals with modern amenities',
      contactPhone: '9876543211', contactEmail: 'rajesh@hostelpro.com',
      totalRooms: 20, totalBeds: 60, occupancy: 45,
      amenities: JSON.stringify(['WiFi', 'AC', 'Laundry', 'Meals', 'Parking', 'CCTV', 'Power Backup']),
      images: JSON.stringify([]), ownerId: owner1.id,
    },
  });

  const property2 = await prisma.property.create({
    data: {
      name: 'Green Valley Hostel', type: 'hostel', address: '456 Brigade Road, Indiranagar', city: 'Bangalore',
      state: 'Karnataka', pincode: '560038', landmark: 'Near Metro Station',
      description: 'Student-friendly hostel with study rooms and recreational facilities',
      contactPhone: '9876543211', contactEmail: 'rajesh@hostelpro.com',
      totalRooms: 30, totalBeds: 90, occupancy: 72,
      amenities: JSON.stringify(['WiFi', 'Study Room', 'Mess', 'Gym', 'Sports', 'CCTV']),
      images: JSON.stringify([]), ownerId: owner1.id,
    },
  });

  const property3 = await prisma.property.create({
    data: {
      name: 'Urban Nest Co-Living', type: 'co_living', address: '789 HSR Layout, Sector 2', city: 'Mumbai',
      state: 'Maharashtra', pincode: '400001', landmark: 'Near BDA Complex',
      description: 'Modern co-living spaces for community living in Mumbai',
      contactPhone: '9876543222', contactEmail: 'meena@hostelpro.com',
      totalRooms: 15, totalBeds: 45, occupancy: 30,
      amenities: JSON.stringify(['WiFi', 'AC', 'Co-working Space', 'Lounge', 'Kitchen', 'Events']),
      images: JSON.stringify([]), ownerId: owner2.id,
    },
  });

  const property4 = await prisma.property.create({
    data: {
      name: 'Delhi Heights PG', type: 'pg', address: '12 Connaught Place', city: 'New Delhi',
      state: 'Delhi', pincode: '110001', landmark: 'Near Rajiv Chowk Metro',
      description: 'Premium PG in the heart of Delhi with excellent connectivity',
      contactPhone: '9876543233', contactEmail: 'vikram@hostelpro.com',
      totalRooms: 25, totalBeds: 75, occupancy: 58,
      amenities: JSON.stringify(['WiFi', 'AC', 'Meals', 'Parking', 'CCTV', 'Power Backup', 'Gym']),
      images: JSON.stringify([]), ownerId: owner3.id,
    },
  });

  console.log('  ✅ Created 4 Properties (2 for Owner1, 1 for Owner2, 1 for Owner3)');

  // ═══════════════════════════════════════════════════════════════
  // 3. HOSTEL ASSIGNMENTS (Multi-Tenancy Links)
  // ═══════════════════════════════════════════════════════════════
  console.log('\n🔗 Creating hostel assignments...');

  // Owner → Property assignments
  const assignments = [
    { userId: owner1.id, propertyId: property1.id, role: 'owner' },
    { userId: owner1.id, propertyId: property2.id, role: 'owner' },
    { userId: owner2.id, propertyId: property3.id, role: 'owner' },
    { userId: owner3.id, propertyId: property4.id, role: 'owner' },
    // Manager → Property assignments
    { userId: manager1.id, propertyId: property1.id, role: 'manager' },
    { userId: manager2.id, propertyId: property2.id, role: 'manager' },
    { userId: manager3.id, propertyId: property3.id, role: 'manager' },
    { userId: manager4.id, propertyId: property4.id, role: 'manager' },
    // Staff → Property assignments
    { userId: staffUsers[0].id, propertyId: property1.id, role: 'staff' },
    { userId: staffUsers[1].id, propertyId: property1.id, role: 'staff' },
    { userId: staffUsers[2].id, propertyId: property2.id, role: 'staff' },
    { userId: staffUsers[3].id, propertyId: property2.id, role: 'staff' },
    { userId: staffUsers[4].id, propertyId: property3.id, role: 'staff' },
    { userId: staffUsers[5].id, propertyId: property4.id, role: 'staff' },
    { userId: staffUsers[6].id, propertyId: property4.id, role: 'staff' },
  ];

  await prisma.hostelAssignment.createMany({ data: assignments });
  console.log(`  ✅ Created ${assignments.length} Hostel Assignments`);

  // ═══════════════════════════════════════════════════════════════
  // 4. BUILDINGS, FLOORS, ROOMS, BEDS
  // ═══════════════════════════════════════════════════════════════
  console.log('\n🏗️ Creating buildings, floors, rooms, beds...');

  // Buildings
  const building1 = await prisma.building.create({ data: { name: 'Block A', propertyId: property1.id, wings: 'East,West', totalFloors: 3 } });
  const building2 = await prisma.building.create({ data: { name: 'Block B', propertyId: property1.id, totalFloors: 2 } });
  const building3 = await prisma.building.create({ data: { name: 'Main Building', propertyId: property2.id, wings: 'North,South', totalFloors: 4 } });
  const building4 = await prisma.building.create({ data: { name: 'Tower A', propertyId: property3.id, totalFloors: 3 } });
  const building5 = await prisma.building.create({ data: { name: 'Wing A', propertyId: property4.id, wings: 'Left,Right', totalFloors: 3 } });

  // Floors
  const floorsData = [];
  for (let i = 1; i <= 3; i++) floorsData.push({ name: `Floor ${i}`, number: i, buildingId: building1.id, propertyId: property1.id, wing: i <= 2 ? 'East' : 'West' });
  for (let i = 1; i <= 2; i++) floorsData.push({ name: `Floor ${i}`, number: i, buildingId: building2.id, propertyId: property1.id });
  for (let i = 1; i <= 4; i++) floorsData.push({ name: `Floor ${i}`, number: i, buildingId: building3.id, propertyId: property2.id, wing: i <= 2 ? 'North' : 'South' });
  for (let i = 1; i <= 3; i++) floorsData.push({ name: `Floor ${i}`, number: i, buildingId: building4.id, propertyId: property3.id });
  for (let i = 1; i <= 3; i++) floorsData.push({ name: `Floor ${i}`, number: i, buildingId: building5.id, propertyId: property4.id, wing: i <= 2 ? 'Left' : 'Right' });
  await prisma.floor.createMany({ data: floorsData });
  const allFloors = await prisma.floor.findMany();
  console.log(`  ✅ Created ${allFloors.length} Floors`);

  // Rooms & Beds
  const sharingTypes = ['single', 'double', 'triple', 'four_sharing'];
  const roomTypes = ['ac', 'non_ac', 'deluxe', 'premium'];
  const rents = { ac: 12000, non_ac: 8000, deluxe: 15000, premium: 18000 };
  const roomData = [];
  let roomCount = 0;

  for (const floor of allFloors) {
    const roomsPerFloor = [3, 3, 4, 4, 3][Math.floor(roomCount / 10) % 5] || 3;
    for (let r = 1; r <= roomsPerFloor; r++) {
      roomCount++;
      const sharingType = sharingTypes[(roomCount - 1) % 4];
      const roomType = roomTypes[(roomCount - 1) % 4];
      const bedCount = sharingType === 'single' ? 1 : sharingType === 'double' ? 2 : sharingType === 'triple' ? 3 : 4;
      const occupied = Math.min(bedCount, Math.floor(Math.random() * (bedCount + 1)));
      const status = occupied >= bedCount ? 'occupied' : 'available';
      roomData.push({
        name: `Room ${roomCount}`, number: `${floor.number}${String(r).padStart(2, '0')}`,
        floorId: floor.id, buildingId: floor.buildingId, propertyId: floor.propertyId,
        sharingType, roomType, totalBeds: bedCount, occupiedBeds: occupied,
        rent: rents[roomType] || 8000, deposit: (rents[roomType] || 8000) * 2,
        amenities: JSON.stringify(['WiFi', 'Wardrobe', 'Study Table']), status,
      });
    }
  }
  await prisma.room.createMany({ data: roomData });
  const allRooms = await prisma.room.findMany();

  // Create beds for each room
  const bedData = [];
  for (const room of allRooms) {
    for (let b = 1; b <= room.totalBeds; b++) {
      bedData.push({ name: `Bed ${b}`, number: b, roomId: room.id, status: b <= room.occupiedBeds ? 'occupied' : 'available' });
    }
  }
  await prisma.bed.createMany({ data: bedData });
  console.log(`  ✅ Created ${allRooms.length} Rooms with ${bedData.length} Beds`);

  // ═══════════════════════════════════════════════════════════════
  // 5. STAFF
  // ═══════════════════════════════════════════════════════════════
  console.log('\n👷 Creating staff...');
  const staffRoles = ['caretaker', 'housekeeping', 'maintenance', 'security', 'cook', 'housekeeping', 'maintenance'];
  const staffSalaries = [12000, 10000, 13000, 11000, 14000, 9500, 10500];
  const staffPropertyMap = [property1.id, property1.id, property2.id, property2.id, property3.id, property4.id, property4.id];
  const staffData = [];
  for (let i = 0; i < staffNames.length; i++) {
    staffData.push({
      userId: staffUsers[i].id, name: staffNames[i], phone: `9876543${30 + i}`, role: staffRoles[i],
      propertyId: staffPropertyMap[i], salary: staffSalaries[i],
      joinDate: new Date(2024, i, 15), status: 'active',
      aadhaarNumber: `${1000 + i * 1111} ${2000 + i * 1111} ${3000 + i * 1111}`,
      address: ['Bangalore', 'Bangalore', 'Bangalore', 'Bangalore', 'Mumbai', 'Delhi', 'Delhi'][i],
    });
  }
  await prisma.staff.createMany({ data: staffData });
  const staffMembers = await prisma.staff.findMany();
  console.log(`  ✅ Created ${staffMembers.length} Staff members`);

  // ═══════════════════════════════════════════════════════════════
  // 6. TENANTS
  // ═══════════════════════════════════════════════════════════════
  console.log('\n🛏️ Creating tenants...');
  const availableBeds = await prisma.bed.findMany({ where: { status: 'occupied' } });
  const tenantNames = [
    'Arjun Reddy', 'Sneha Patel', 'Vikram Mehta', 'Ananya Iyer', 'Rohit Deshmukh',
    'Kavya Nair', 'Aditya Malhotra', 'Pooja Sharma', 'Rahul Verma', 'Divya Reddy',
    'Karthik Rajan', 'Meera Krishnan', 'Siddharth Jain', 'Ritu Agarwal', 'Nikhil Joshi',
    'Swati Mishra', 'Pranav Kulkarni', 'Aisha Khan', 'Harsh Pandey', 'Nandini Rao',
    'Sanjay Gupta', 'Preeti Nair', 'Manish Kumar', 'Lakshmi Iyer', 'Rajat Singh',
    'Suman Rao', 'Arun Patel', 'Deepa Sharma', 'Gaurav Joshi', 'Neha Verma'
  ];

  // Create tenant users
  await prisma.user.createMany({
    data: tenantNames.map((name, i) => ({
      email: `tenant${i + 1}@hostelpro.com`, name, phone: `98765${String(i + 1).padStart(5, '0')}`,
      password: 'tenant123', role: 'tenant', isActive: true,
    })),
  });
  const tenantUserEmails = tenantNames.map((_, i) => `tenant${i + 1}@hostelpro.com`);
  const tenantUsers = await prisma.user.findMany({ where: { email: { in: tenantUserEmails } } });

  const tenants = [];
  for (let i = 0; i < Math.min(25, availableBeds.length); i++) {
    const bed = availableBeds[i];
    const room = allRooms.find(r => r.id === bed.roomId);
    if (!room) continue;
    const tenantUser = tenantUsers[i];
    if (!tenantUser) continue;
    const tenant = await prisma.tenant.create({
      data: {
        userId: tenantUser.id, name: tenantNames[i], email: tenantUser.email, phone: tenantUser.phone,
        emergencyContact: `Emergency ${i + 1}`, emergencyPhone: `98766${String(i + 1).padStart(5, '0')}`,
        fatherName: `Father of ${tenantNames[i]}`, motherName: `Mother of ${tenantNames[i]}`,
        aadhaarNumber: `${1000 + i * 1111} ${2000 + i * 1111} ${3000 + i * 1111}`,
        dateOfBirth: new Date(1995 + (i % 10), i % 12, (i % 28) + 1),
        gender: i % 2 === 0 ? 'male' : 'female',
        occupation: ['Software Engineer', 'Student', 'MBA Student', 'Data Analyst', 'Designer'][i % 5],
        company: ['Google', 'Infosys', 'Wipro', 'TCS', 'Amazon'][i % 5],
        permanentAddress: 'Home Town, India',
        kycStatus: i % 5 === 0 ? 'pending' : 'verified',
        policeVerified: i % 3 !== 0,
        agreementStatus: i % 4 === 0 ? 'pending' : 'signed',
        agreementStart: new Date(2024, i % 12, 1),
        agreementEnd: new Date(2025, i % 12, 1),
        propertyId: room.propertyId, roomId: room.id, bedId: bed.id,
        checkInDate: new Date(2024, i % 12, (i % 28) + 1),
        status: 'active', rentAmount: room.rent, depositAmount: room.deposit,
        depositStatus: i % 4 === 0 ? 'pending' : 'paid',
      },
    });
    tenants.push(tenant);
    await prisma.bed.update({ where: { id: bed.id }, data: { tenantId: tenant.id, status: 'occupied' } });

    // Create hostel assignment for tenant
    await prisma.hostelAssignment.create({
      data: { userId: tenantUser.id, propertyId: room.propertyId, role: 'tenant' }
    });
  }
  console.log(`  ✅ Created ${tenants.length} Tenants with hostel assignments`);

  // ═══════════════════════════════════════════════════════════════
  // 7. LEADS
  // ═══════════════════════════════════════════════════════════════
  console.log('\n🎯 Creating leads...');
  const leadSources = ['website', 'whatsapp', 'referral', 'walk_in', 'google', 'social_media'];
  const leadNames = ['Rahul Sharma', 'Priya Patel', 'Amit Kumar', 'Sneha Reddy', 'Vikram Singh', 'Anita Desai', 'Karan Mehta', 'Riya Gupta', 'Saurabh Jain', 'Megha Nair', 'Deepak Mishra', 'Nisha Agarwal', 'Rajesh Verma', 'Pooja Iyer', 'Manish Tiwari', 'Swati Bhat', 'Arvind Kumar', 'Sakshi Sharma', 'Ramesh Yadav', 'Kavita Joshi'];
  const propIds = [property1.id, property2.id, property3.id, property4.id];
  await prisma.lead.createMany({
    data: leadNames.map((name, i) => {
      const status = ['lead', 'inquiry', 'site_visit', 'negotiation', 'token', 'booking', 'move_in', 'lost'][i % 8];
      return {
        name, email: `lead${i + 1}@example.com`, phone: `98767${String(i + 1).padStart(5, '0')}`,
        source: leadSources[i % 6], status, stage: (i % 8) + 1,
        propertyId: propIds[i % 4],
        roomPreference: ['Single AC', 'Double Non-AC', 'Triple Sharing', 'Premium'][i % 4],
        budget: 8000 + (i * 500) % 10000,
        followUpDate: new Date(2025, 6, (i % 28) + 1),
        tokenAmount: ['token', 'booking', 'move_in'].includes(status) ? 5000 : null,
        notes: `Interested in ${['AC', 'Non-AC', 'Premium'][i % 3]} room`,
        assignedToId: [manager1.id, manager2.id, manager3.id, manager4.id][i % 4],
        createdById: [manager1.id, manager2.id, manager3.id, manager4.id][i % 4],
      };
    }),
  });
  console.log('  ✅ Created 20 Leads');

  // ═══════════════════════════════════════════════════════════════
  // 8. PAYMENTS
  // ═══════════════════════════════════════════════════════════════
  console.log('\n💰 Creating payments...');
  const paymentData = [];
  for (const tenant of tenants) {
    for (let m = 0; m < 3; m++) {
      const month = 5 + m;
      const year = 2025;
      const isPaid = Math.random() > 0.2;
      const electricity = Math.floor(Math.random() * 1500) + 300;
      const water = Math.floor(Math.random() * 500) + 200;
      const wifi = 500;
      const food = Math.floor(Math.random() * 3000) + 2000;
      paymentData.push({
        tenantId: tenant.id, propertyId: tenant.propertyId,
        amount: tenant.rentAmount + electricity + water + wifi + food,
        rentAmount: tenant.rentAmount, electricity, water, wifi, food,
        laundry: Math.random() > 0.5 ? 500 : 0, parking: Math.random() > 0.7 ? 1000 : 0,
        paymentMethod: ['upi', 'bank_transfer', 'card', 'wallet', 'cash'][m % 5],
        paymentType: 'rent', status: isPaid ? 'paid' : 'pending',
        dueDate: new Date(year, month - 1, 5),
        paidDate: isPaid ? new Date(year, month - 1, (m * 3) + 1) : null,
        receiptNumber: isPaid ? `RCP${String(month).padStart(2, '0')}${String(tenants.indexOf(tenant) + 1).padStart(4, '0')}` : null,
        month, year,
      });
    }
  }
  await prisma.payment.createMany({ data: paymentData });
  console.log(`  ✅ Created ${paymentData.length} Payments`);

  // ═══════════════════════════════════════════════════════════════
  // 9. COMPLAINTS
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📢 Creating complaints...');
  const complaintTitles = ['AC not working', 'Water leakage', 'WiFi issues', 'Noisy neighbors', 'Food quality poor', 'Cockroach problem', 'Hot water not available', 'Socket not working', 'Common area dirty', 'Staff behavior', 'Window broken', 'Elevator not working', 'Parking issue', 'Security concern', 'Mosquito problem'];
  const complaintCategories = ['maintenance', 'cleanliness', 'noise', 'food', 'staff', 'other'];
  await prisma.complaint.createMany({
    data: complaintTitles.map((title, i) => {
      const tenant = tenants[i % tenants.length];
      const status = ['open', 'assigned', 'in_progress', 'resolved', 'closed'][i % 5];
      return {
        title, description: `${title} - Please resolve this issue at the earliest.`,
        category: complaintCategories[i % 6],
        priority: ['low', 'medium', 'high', 'urgent'][i % 4],
        status, rating: ['resolved', 'closed'].includes(status) ? (i % 3) + 3 : null,
        resolution: ['resolved', 'closed'].includes(status) ? 'Issue has been resolved.' : null,
        propertyId: tenant?.propertyId || property1.id, tenantId: tenant?.id || '',
        assignedToId: status !== 'open' ? staffUsers[i % 7].id : null,
        createdById: tenant?.userId || manager1.id,
      };
    }).filter(c => c.tenantId),
  });
  console.log('  ✅ Created 15 Complaints');

  // ═══════════════════════════════════════════════════════════════
  // 10. EXPENSES
  // ═══════════════════════════════════════════════════════════════
  console.log('\n💵 Creating expenses...');
  const expenseDescriptions = ['Plumbing repair', 'Electricity bill', 'Staff salary', 'Cleaning supplies', 'Grocery purchase', 'Google Ads', 'Paint renovation', 'Internet bill', 'Security salary', 'Furniture purchase', 'Water bill', 'Pest control', 'CCTV maintenance', 'Fire safety', 'Garden maintenance', 'Generator service', 'Plumbing parts', 'Electrical repair', 'Paint supplies', 'Office supplies'];
  const expenseCategories = ['maintenance', 'utilities', 'salary', 'supplies', 'food', 'marketing', 'other'];
  await prisma.expense.createMany({
    data: expenseDescriptions.map((desc, i) => ({
      category: expenseCategories[i % 7],
      description: desc,
      amount: (i + 5) * 1000,
      date: new Date(2025, i % 7, (i % 28) + 1),
      vendor: ['ABC Services', 'XYZ Supplies', 'Quick Fix', 'Pro Maintenance', 'City Utilities'][i % 5],
      propertyId: propIds[i % 4],
      createdById: [manager1.id, manager2.id, manager3.id, manager4.id][i % 4], status: 'approved',
    })),
  });
  console.log('  ✅ Created 20 Expenses');

  // ═══════════════════════════════════════════════════════════════
  // 11. NOTICES
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📌 Creating notices...');
  await prisma.notice.createMany({
    data: [
      { title: 'Water Supply Maintenance', content: 'Water supply will be temporarily interrupted on Saturday from 9 AM to 12 PM.', type: 'maintenance', propertyId: property1.id, createdById: manager1.id, isActive: true, expiryDate: new Date(2025, 7, 30) },
      { title: 'Rent Payment Reminder', content: 'Rent is due by the 5th. Late fees applicable after the 10th.', type: 'payment', propertyId: property1.id, createdById: manager1.id, isActive: true, expiryDate: new Date(2025, 7, 30) },
      { title: 'Annual Day Celebration', content: 'Annual Day celebration on August 15th. All residents invited.', type: 'event', propertyId: property2.id, createdById: manager2.id, isActive: true, expiryDate: new Date(2025, 7, 30) },
      { title: 'Fire Safety Drill', content: 'Mandatory fire safety drill on July 28th at 4 PM.', type: 'urgent', propertyId: property2.id, createdById: manager2.id, isActive: true, expiryDate: new Date(2025, 7, 30) },
      { title: 'New WiFi Password', content: 'WiFi password updated. Collect from reception.', type: 'general', propertyId: property3.id, createdById: manager3.id, isActive: true, expiryDate: new Date(2025, 7, 30) },
      { title: 'Gym Timings Updated', content: 'Gym will now be open from 6 AM to 10 PM daily.', type: 'general', propertyId: property4.id, createdById: manager4.id, isActive: true, expiryDate: new Date(2025, 7, 30) },
    ],
  });
  console.log('  ✅ Created 6 Notices');

  // ═══════════════════════════════════════════════════════════════
  // 12. VISITORS
  // ═══════════════════════════════════════════════════════════════
  console.log('\n🚪 Creating visitors...');
  const visitorData = [];
  for (let i = 0; i < 10; i++) {
    const tenant = tenants[i % tenants.length];
    if (!tenant) continue;
    visitorData.push({
      name: ['Visitor', 'Parent', 'Friend', 'Colleague', 'Relative'][i % 5],
      phone: `98768${String(i + 1).padStart(5, '0')}`,
      purpose: ['Personal visit', 'Delivery', 'Meeting', 'Parent visit', 'Friend visit'][i % 5],
      tenantId: tenant.id, propertyId: tenant.propertyId,
      checkIn: new Date(2025, 6, (i % 28) + 1, 10 + (i % 8), 0),
      checkOut: i % 3 !== 0 ? new Date(2025, 6, (i % 28) + 1, 18 + (i % 4), 0) : null,
      status: i % 3 !== 0 ? 'checked_out' : 'checked_in',
    });
  }
  await prisma.visitor.createMany({ data: visitorData });
  console.log('  ✅ Created 10 Visitors');

  // ═══════════════════════════════════════════════════════════════
  // 13. ATTENDANCE
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📋 Creating attendance...');
  const attendanceData = [];
  for (const staff of staffMembers) {
    for (let d = 1; d <= 30; d++) {
      if (d % 7 === 0) continue;
      attendanceData.push({
        staffId: staff.id, date: new Date(2025, 6, d),
        checkIn: new Date(2025, 6, d, 8, 0), checkOut: new Date(2025, 6, d, 18, 0),
        status: d % 10 !== 0 ? 'present' : 'absent',
      });
    }
  }
  await prisma.attendance.createMany({ data: attendanceData });
  console.log(`  ✅ Created ${attendanceData.length} Attendance records`);

  // ═══════════════════════════════════════════════════════════════
  // 14. INVENTORY (per property)
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📦 Creating inventory...');

  const categories = [
    { name: 'Groceries', slug: 'groceries', icon: 'shopping-cart', items: [
      { name: 'Rice (Basmati)', unit: 'kg', unitPrice: 80, currentStock: 50, minStock: 10, gstRate: 5 },
      { name: 'Wheat Flour', unit: 'kg', unitPrice: 45, currentStock: 30, minStock: 8, gstRate: 5 },
      { name: 'Toor Dal', unit: 'kg', unitPrice: 120, currentStock: 20, minStock: 5, gstRate: 5 },
      { name: 'Cooking Oil', unit: 'l', unitPrice: 150, currentStock: 15, minStock: 5, gstRate: 5 },
      { name: 'Sugar', unit: 'kg', unitPrice: 50, currentStock: 25, minStock: 8, gstRate: 5 },
      { name: 'Salt', unit: 'kg', unitPrice: 20, currentStock: 10, minStock: 3, gstRate: 0 },
      { name: 'Tea Powder', unit: 'kg', unitPrice: 400, currentStock: 5, minStock: 2, gstRate: 5 },
      { name: 'Milk', unit: 'l', unitPrice: 60, currentStock: 20, minStock: 10, gstRate: 0 },
    ]},
    { name: 'Cleaning Supplies', slug: 'cleaning', icon: 'sparkles', items: [
      { name: 'Phenyl', unit: 'l', unitPrice: 80, currentStock: 10, minStock: 3, gstRate: 18 },
      { name: 'Floor Cleaner', unit: 'l', unitPrice: 120, currentStock: 8, minStock: 2, gstRate: 18 },
      { name: 'Detergent Powder', unit: 'kg', unitPrice: 90, currentStock: 15, minStock: 5, gstRate: 18 },
      { name: 'Dish Wash Liquid', unit: 'l', unitPrice: 110, currentStock: 6, minStock: 2, gstRate: 18 },
      { name: 'Broom', unit: 'pcs', unitPrice: 80, currentStock: 10, minStock: 3, gstRate: 18 },
      { name: 'Mop', unit: 'pcs', unitPrice: 250, currentStock: 4, minStock: 2, gstRate: 18 },
    ]},
    { name: 'Maintenance', slug: 'maintenance', icon: 'wrench', items: [
      { name: 'Light Bulb (LED)', unit: 'pcs', unitPrice: 120, currentStock: 20, minStock: 5, gstRate: 18 },
      { name: 'Pipe (1 inch)', unit: 'pcs', unitPrice: 80, currentStock: 8, minStock: 3, gstRate: 18 },
      { name: 'Switch', unit: 'pcs', unitPrice: 45, currentStock: 15, minStock: 5, gstRate: 18 },
      { name: 'Tap', unit: 'pcs', unitPrice: 200, currentStock: 5, minStock: 2, gstRate: 18 },
    ]},
  ];

  for (const prop of [property1, property2, property3, property4]) {
    for (const cat of categories) {
      const category = await prisma.inventoryCategory.create({
        data: { name: cat.name, slug: `${cat.slug}-${prop.id.substring(0, 8)}`, description: cat.name, icon: cat.icon, propertyId: prop.id }
      });
      for (const item of cat.items) {
        await prisma.inventoryItem.create({
          data: {
            name: item.name, categoryId: category.id, propertyId: prop.id,
            unit: item.unit, unitPrice: item.unitPrice, currentStock: item.currentStock,
            openingStock: item.currentStock, minStock: item.minStock, maxStock: item.currentStock * 3,
            reorderLevel: item.minStock * 1.5, gstRate: item.gstRate, isActive: true,
          }
        });
      }
    }
  }
  const invCount = await prisma.inventoryItem.count();
  console.log(`  ✅ Created inventory: ${invCount} items across 4 properties`);

  // ═══════════════════════════════════════════════════════════════
  // 15. VENDORS & PURCHASE ORDERS
  // ═══════════════════════════════════════════════════════════════
  console.log('\n🏭 Creating vendors & purchase orders...');
  const vendorData = [
    { name: 'ABC Grocers', contactPerson: 'Ramesh', phone: '9900112233', email: 'abc@grocers.com', city: 'Bangalore', state: 'Karnataka' },
    { name: 'XYZ Supplies', contactPerson: 'Suresh', phone: '9900112244', email: 'xyz@supplies.com', city: 'Bangalore', state: 'Karnataka' },
    { name: 'Quick Fix Maintenance', contactPerson: 'Mohan', phone: '9900112255', email: 'quick@fix.com', city: 'Mumbai', state: 'Maharashtra' },
    { name: 'Delhi Suppliers', contactPerson: 'Ashok', phone: '9900112266', email: 'delhi@suppliers.com', city: 'New Delhi', state: 'Delhi' },
  ];
  const vendors = [];
  for (let i = 0; i < vendorData.length; i++) {
    const v = await prisma.vendor.create({
      data: { ...vendorData[i], propertyId: propIds[i], status: 'active', rating: 4, address: vendorData[i].city }
    });
    vendors.push(v);
  }

  // Purchase Orders
  const allItems = await prisma.inventoryItem.findMany({ take: 8 });
  for (let i = 0; i < 4; i++) {
    const item1 = allItems[i * 2];
    const item2 = allItems[i * 2 + 1];
    if (!item1 || !item2) continue;
    const po = await prisma.purchaseOrder.create({
      data: {
        poNumber: `PO-2025-${String(i + 1).padStart(4, '0')}`, vendorId: vendors[i].id,
        propertyId: propIds[i], createdById: [manager1.id, manager2.id, manager3.id, manager4.id][i],
        status: 'approved', orderDate: new Date(2025, 6, 10 + i),
        totalAmount: item1.unitPrice * 10 + item2.unitPrice * 5,
        netAmount: item1.unitPrice * 10 + item2.unitPrice * 5,
        items: {
          create: [
            { itemId: item1.id, itemName: item1.name, quantity: 10, unit: item1.unit, unitPrice: item1.unitPrice, totalPrice: item1.unitPrice * 10, status: 'pending' },
            { itemId: item2.id, itemName: item2.name, quantity: 5, unit: item2.unit, unitPrice: item2.unitPrice, totalPrice: item2.unitPrice * 5, status: 'pending' },
          ]
        }
      }
    });
  }
  console.log('  ✅ Created 4 Vendors with Purchase Orders');

  // ═══════════════════════════════════════════════════════════════
  // 16. ASSETS
  // ═══════════════════════════════════════════════════════════════
  console.log('\n🪑 Creating assets...');
  const assetData = [
    { name: 'AC Unit - Daikin 1.5T', category: 'electrical', subCategory: 'ac', purchasePrice: 35000, currentValue: 25000 },
    { name: 'Bed Frame - Double', category: 'furniture', subCategory: 'bed', purchasePrice: 8000, currentValue: 5000 },
    { name: 'Mattress - King Size', category: 'furniture', subCategory: 'mattress', purchasePrice: 5000, currentValue: 3000 },
    { name: 'Ceiling Fan', category: 'electrical', subCategory: 'fan', purchasePrice: 2500, currentValue: 1500 },
    { name: 'TV 32 inch', category: 'electronics', subCategory: 'tv', purchasePrice: 15000, currentValue: 10000 },
    { name: 'Refrigerator 180L', category: 'appliance', subCategory: 'refrigerator', purchasePrice: 18000, currentValue: 12000 },
    { name: 'Washing Machine', category: 'appliance', subCategory: 'washing_machine', purchasePrice: 22000, currentValue: 15000 },
    { name: 'Water Cooler', category: 'appliance', subCategory: 'water_cooler', purchasePrice: 12000, currentValue: 8000 },
  ];
  const rooms = await prisma.room.findMany({ take: 20 });
  for (const prop of [property1, property2, property3, property4]) {
    const propRooms = rooms.filter(r => r.propertyId === prop.id);
    for (let i = 0; i < assetData.length; i++) {
      const a = assetData[i];
      await prisma.asset.create({
        data: {
          ...a, propertyId: prop.id,
          roomId: propRooms[i % propRooms.length]?.id || null,
          purchaseDate: new Date(2024, i % 12, 1),
          depreciationRate: 15, vendor: ['ABC Electronics', 'XYZ Furniture', 'Quick Fix'][i % 3],
          warrantyExpiry: new Date(2026, i % 12, 1),
          status: 'active', condition: ['excellent', 'good', 'good', 'fair'][i % 4],
        }
      });
    }
  }
  const assetCount = await prisma.asset.count();
  console.log(`  ✅ Created ${assetCount} Assets`);

  // ═══════════════════════════════════════════════════════════════
  // 17. MESS MANAGEMENT (Menu Plans, Recipes)
  // ═══════════════════════════════════════════════════════════════
  console.log('\n🍳 Creating mess management data...');
  for (const prop of [property1, property2]) {
    // Recipes
    const riceItem = await prisma.inventoryItem.findFirst({ where: { propertyId: prop.id, name: 'Rice (Basmati)' } });
    const dalItem = await prisma.inventoryItem.findFirst({ where: { propertyId: prop.id, name: 'Toor Dal' } });
    const oilItem = await prisma.inventoryItem.findFirst({ where: { propertyId: prop.id, name: 'Cooking Oil' } });

    const recipe1 = await prisma.recipe.create({
      data: { name: 'Rice & Dal', category: 'veg', mealType: 'lunch', baseServings: 50, propertyId: prop.id, instructions: 'Cook rice and dal separately. Season with spices.' }
    });
    const recipe2 = await prisma.recipe.create({
      data: { name: 'Chapati & Curry', category: 'veg', mealType: 'dinner', baseServings: 50, propertyId: prop.id, instructions: 'Make chapati dough. Prepare vegetable curry.' }
    });

    if (riceItem) {
      await prisma.recipeItem.create({ data: { recipeId: recipe1.id, itemId: riceItem.id, quantity: 5, unit: 'kg' } });
      await prisma.recipeItem.create({ data: { recipeId: recipe2.id, itemId: riceItem.id, quantity: 3, unit: 'kg' } });
    }
    if (dalItem) {
      await prisma.recipeItem.create({ data: { recipeId: recipe1.id, itemId: dalItem.id, quantity: 3, unit: 'kg' } });
    }
    if (oilItem) {
      await prisma.recipeItem.create({ data: { recipeId: recipe1.id, itemId: oilItem.id, quantity: 1, unit: 'l' } });
      await prisma.recipeItem.create({ data: { recipeId: recipe2.id, itemId: oilItem.id, quantity: 0.5, unit: 'l' } });
    }

    // Menu Plans
    for (let d = 1; d <= 7; d++) {
      for (const mealType of ['breakfast', 'lunch', 'dinner']) {
        const mp = await prisma.menuPlan.create({
          data: { date: new Date(2025, 6, d), mealType, propertyId: prop.id, headCount: 50, status: 'planned' }
        });
        await prisma.menuPlanItem.create({
          data: { menuPlanId: mp.id, recipeId: mealType === 'breakfast' ? recipe1.id : recipe2.id, dishName: mealType === 'breakfast' ? 'Poha & Tea' : mealType === 'lunch' ? 'Rice & Dal' : 'Chapati & Curry', servings: 50 }
        });
      }
    }
  }
  console.log('  ✅ Created Recipes & Menu Plans for 2 properties');

  // ═══════════════════════════════════════════════════════════════
  // 18. LAUNDRY & HOUSEKEEPING
  // ═══════════════════════════════════════════════════════════════
  console.log('\n🧹 Creating laundry & housekeeping items...');
  const laundryItems = [
    { name: 'Bedsheet', category: 'bedding', totalQuantity: 60, issuedQuantity: 45, inLaundry: 10, damagedQuantity: 2 },
    { name: 'Pillow Cover', category: 'bedding', totalQuantity: 120, issuedQuantity: 90, inLaundry: 20, damagedQuantity: 5 },
    { name: 'Towel', category: 'bathroom', totalQuantity: 80, issuedQuantity: 60, inLaundry: 15, damagedQuantity: 3 },
    { name: 'Curtain', category: 'curtain', totalQuantity: 40, issuedQuantity: 30, inLaundry: 5, damagedQuantity: 1 },
  ];
  const housekeepingItems = [
    { name: 'Phenyl', category: 'cleaning', unit: 'l', currentStock: 10, minStock: 3, unitPrice: 80 },
    { name: 'Floor Cleaner', category: 'cleaning', unit: 'l', currentStock: 8, minStock: 2, unitPrice: 120 },
    { name: 'Detergent', category: 'hygiene', unit: 'kg', currentStock: 15, minStock: 5, unitPrice: 90 },
    { name: 'Tissue Roll', category: 'hygiene', unit: 'roll', currentStock: 50, minStock: 15, unitPrice: 30 },
    { name: 'Garbage Bag', category: 'tool', unit: 'pack', currentStock: 30, minStock: 10, unitPrice: 50 },
  ];

  for (const prop of [property1, property2, property3, property4]) {
    for (const li of laundryItems) {
      await prisma.laundryItem.create({
        data: { ...li, propertyId: prop.id, condition: 'good', status: 'in_use', lastWashDate: new Date(2025, 6, 15) }
      });
    }
    for (const hi of housekeepingItems) {
      await prisma.housekeepingItem.create({
        data: { ...hi, propertyId: prop.id, isActive: true, lastRestocked: new Date(2025, 6, 1) }
      });
    }
  }
  console.log('  ✅ Created Laundry & Housekeeping items for all properties');

  // ═══════════════════════════════════════════════════════════════
  // 19. SUBSCRIPTIONS
  // ═══════════════════════════════════════════════════════════════
  console.log('\n⭐ Creating subscriptions...');
  await prisma.subscription.create({ data: { userId: owner1.id, plan: 'premium', status: 'active', startDate: new Date(2024, 0, 1), endDate: new Date(2025, 11, 31), amount: 2499, autoRenew: true } });
  await prisma.subscription.create({ data: { userId: owner2.id, plan: 'gold', status: 'active', startDate: new Date(2024, 3, 1), endDate: new Date(2025, 2, 31), amount: 4999, autoRenew: true } });
  await prisma.subscription.create({ data: { userId: owner3.id, plan: 'basic', status: 'active', startDate: new Date(2024, 6, 1), endDate: new Date(2025, 5, 30), amount: 999, autoRenew: true } });
  console.log('  ✅ Created 3 Subscriptions');

  // ═══════════════════════════════════════════════════════════════
  // 20. ROLE PERMISSIONS
  // ═══════════════════════════════════════════════════════════════
  console.log('\n🔐 Creating role permissions...');
  const rolePermissions = {
    super_admin: JSON.stringify(['dashboard', 'properties', 'buildings', 'rooms', 'tenants', 'beds', 'leads', 'bookings', 'payments', 'complaints', 'staff', 'expenses', 'notices', 'communications', 'visitors', 'documents', 'inventory', 'vendors', 'purchase_requisitions', 'purchase_orders', 'grn', 'stock', 'assets', 'laundry', 'housekeeping', 'mess', 'kitchen', 'recipes', 'waste', 'attendance', 'salary', 'activity_log', 'reports', 'settings', 'role_management', 'user_management']),
    owner: JSON.stringify(['dashboard', 'properties', 'buildings', 'rooms', 'tenants', 'beds', 'leads', 'bookings', 'payments', 'complaints', 'staff', 'expenses', 'notices', 'communications', 'visitors', 'documents', 'inventory', 'vendors', 'purchase_requisitions', 'purchase_orders', 'grn', 'stock', 'assets', 'laundry', 'housekeeping', 'mess', 'kitchen', 'recipes', 'waste', 'attendance', 'salary', 'activity_log', 'reports', 'settings', 'user_management']),
    manager: JSON.stringify(['dashboard', 'properties', 'buildings', 'rooms', 'tenants', 'beds', 'leads', 'bookings', 'payments', 'complaints', 'staff', 'expenses', 'notices', 'communications', 'visitors', 'documents', 'inventory', 'vendors', 'purchase_requisitions', 'purchase_orders', 'grn', 'stock', 'assets', 'laundry', 'housekeeping', 'mess', 'kitchen', 'recipes', 'waste', 'attendance', 'salary', 'activity_log', 'reports']),
    staff: JSON.stringify(['dashboard', 'tenants', 'complaints', 'visitors', 'attendance', 'inventory', 'housekeeping', 'laundry']),
    tenant: JSON.stringify(['dashboard', 'payments', 'complaints', 'notices', 'visitors', 'documents']),
  };
  for (const [role, perms] of Object.entries(rolePermissions)) {
    await prisma.rolePermission.create({ data: { role, permissions: perms } });
  }
  console.log('  ✅ Created 5 Role Permissions');

  // ═══════════════════════════════════════════════════════════════
  // 21. COMMUNICATIONS
  // ═══════════════════════════════════════════════════════════════
  console.log('\n💬 Creating communications...');
  await prisma.communication.createMany({
    data: [
      { type: 'whatsapp', message: 'Rent reminder: Please pay rent by 5th of this month.', recipientType: 'all', propertyId: property1.id, senderId: manager1.id, status: 'delivered' },
      { type: 'email', message: 'Monthly newsletter: New amenities added!', recipientType: 'tenants', propertyId: property2.id, senderId: manager2.id, status: 'sent' },
      { type: 'sms', message: 'Fire drill scheduled for July 28th at 4 PM.', recipientType: 'all', propertyId: property3.id, senderId: manager3.id, status: 'delivered' },
      { type: 'announcement', message: 'Annual Day celebration on August 15th.', recipientType: 'all', propertyId: property4.id, senderId: manager4.id, status: 'read' },
    ],
  });
  console.log('  ✅ Created 4 Communications');

  // ═══════════════════════════════════════════════════════════════
  // 22. ACTIVITY LOGS
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📝 Creating activity logs...');
  await prisma.activityLog.createMany({
    data: [
      { action: 'USER_LOGIN', details: 'Super admin logged in', entityType: 'User', userId: superAdmin.id },
      { action: 'PROPERTY_CREATED', details: 'Property Sunrise PG created', entityType: 'Property', userId: superAdmin.id },
      { action: 'TENANT_ADDED', details: 'Tenant Arjun Reddy checked in', entityType: 'Tenant', userId: manager1.id },
      { action: 'PAYMENT_RECEIVED', details: 'Payment of Rs 12000 received', entityType: 'Payment', userId: manager1.id },
      { action: 'COMPLAINT_RESOLVED', details: 'AC not working - resolved', entityType: 'Complaint', userId: staffUsers[0].id },
      { action: 'OWNER_CREATED', details: 'Owner Rajesh Kumar created with hostel assignment', entityType: 'User', userId: superAdmin.id },
      { action: 'LEAD_CONVERTED', details: 'Lead converted to booking', entityType: 'Lead', userId: manager2.id },
    ],
  });
  console.log('  ✅ Created 7 Activity Logs');

  // ═══════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════
  console.log('\n' + '═'.repeat(60));
  console.log('🎉 SEED COMPLETED SUCCESSFULLY!');
  console.log('═'.repeat(60));
  console.log('\n📊 Database Summary:');
  console.log('  👤 Users:        1 super_admin + 3 owners + 4 managers + 7 staff + 25 tenants = 40');
  console.log('  🏠 Properties:   4 (Sunrise PG, Green Valley, Urban Nest, Delhi Heights)');
  console.log('  🔗 Assignments:  15+ (hostel-user multi-tenant links)');
  console.log('  🏗️ Buildings:    5');
  console.log('  🛏️ Rooms & Beds: ~50 rooms, ~150 beds');
  console.log('  👷 Staff:         7');
  console.log('  🛌 Tenants:       25');
  console.log('  🎯 Leads:         20');
  console.log('  💰 Payments:      ~75');
  console.log('  📢 Complaints:    15');
  console.log('  💵 Expenses:      20');
  console.log('  📌 Notices:       6');
  console.log('  🚪 Visitors:      10');
  console.log('  📋 Attendance:    ~200');
  console.log('  📦 Inventory:     ~72 items');
  console.log('  🪑 Assets:        ~32');
  console.log('  🏭 Vendors:       4');
  console.log('  🍳 Recipes:       4');
  console.log('  🔐 Permissions:   5 roles');
  console.log('\n🔑 Demo Login Credentials:');
  console.log('  Super Admin:  admin@hostelpro.com / admin123');
  console.log('  Owner 1:      rajesh@hostelpro.com / owner123');
  console.log('  Owner 2:      meena@hostelpro.com / owner123');
  console.log('  Owner 3:      vikram@hostelpro.com / owner123');
  console.log('  Manager 1:    priya@hostelpro.com / manager123');
  console.log('  Manager 2:    sunil@hostelpro.com / manager123');
  console.log('  Manager 3:    anita@hostelpro.com / manager123');
  console.log('  Manager 4:    raj@hostelpro.com / manager123');
  console.log('  Staff:        staff1-7@hostelpro.com / staff123');
  console.log('  Tenant:       tenant1-25@hostelpro.com / tenant123');

  await prisma.$disconnect();
}

seed().catch(e => {
  console.error('❌ Seed error:', e.message);
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});

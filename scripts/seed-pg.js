const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  console.log('Starting database seed (PostgreSQL optimized)...');

  // Truncate all tables with cascade
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
      "Property", "Subscription", "Staff", "User"
    CASCADE
  `);
  console.log('  All tables cleared');

  // Create all users at once using createMany
  console.log('Creating users...');
  const users = await prisma.user.createMany({
    data: [
      { email: 'admin@hostelpro.com', name: 'Super Admin', phone: '9876543210', password: 'admin123', role: 'super_admin', isActive: true },
      { email: 'owner@hostelpro.com', name: 'Rajesh Kumar', phone: '9876543211', password: 'owner123', role: 'owner', isActive: true },
      { email: 'manager@hostelpro.com', name: 'Priya Sharma', phone: '9876543212', password: 'manager123', role: 'manager', isActive: true },
      { email: 'staff1@hostelpro.com', name: 'Amit Singh', phone: '9876543213', password: 'staff123', role: 'staff', isActive: true },
      { email: 'staff2@hostelpro.com', name: 'Neha Gupta', phone: '9876543214', password: 'staff123', role: 'staff', isActive: true },
      { email: 'staff3@hostelpro.com', name: 'Ravi Kumar', phone: '9876543215', password: 'staff123', role: 'staff', isActive: true },
      { email: 'staff4@hostelpro.com', name: 'Sunita Devi', phone: '9876543216', password: 'staff123', role: 'staff', isActive: true },
      { email: 'staff5@hostelpro.com', name: 'Mohan Lal', phone: '9876543217', password: 'staff123', role: 'staff', isActive: true },
      { email: 'staff6@hostelpro.com', name: 'Kavita Joshi', phone: '9876543218', password: 'staff123', role: 'staff', isActive: true },
      { email: 'staff7@hostelpro.com', name: 'Deepak Verma', phone: '9876543219', password: 'staff123', role: 'staff', isActive: true },
    ],
  });
  console.log(`Created ${users.count} users`);

  // Fetch users by email for references
  const allUsers = await prisma.user.findMany();
  const superAdmin = allUsers.find(u => u.email === 'admin@hostelpro.com');
  const owner = allUsers.find(u => u.email === 'owner@hostelpro.com');
  const manager = allUsers.find(u => u.email === 'manager@hostelpro.com');
  const staffUser1 = allUsers.find(u => u.email === 'staff1@hostelpro.com');
  const staffUsers = allUsers.filter(u => u.email.startsWith('staff'));

  // Properties
  console.log('Creating properties...');
  const property1 = await prisma.property.create({
    data: {
      name: 'Sunrise PG', type: 'pg', address: '123 MG Road, Koramangala', city: 'Bangalore',
      state: 'Karnataka', pincode: '560034', landmark: 'Near Forum Mall',
      description: 'Premium PG accommodation for working professionals',
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
      description: 'Modern co-living spaces for community living',
      totalRooms: 15, totalBeds: 45, occupancy: 30,
      amenities: JSON.stringify(['WiFi', 'AC', 'Co-working Space', 'Lounge', 'Kitchen', 'Events']),
      images: JSON.stringify([]), ownerId: owner.id,
    },
  });
  console.log('Created 3 Properties');

  // Buildings
  console.log('Creating buildings...');
  const building1 = await prisma.building.create({ data: { name: 'Block A', propertyId: property1.id, wings: 'East,West', totalFloors: 3 } });
  const building2 = await prisma.building.create({ data: { name: 'Block B', propertyId: property1.id, totalFloors: 2 } });
  const building3 = await prisma.building.create({ data: { name: 'Main Building', propertyId: property2.id, wings: 'North,South', totalFloors: 4 } });

  // Floors
  console.log('Creating floors...');
  const floorsData = [];
  for (let i = 1; i <= 3; i++) floorsData.push({ name: `Floor ${i}`, number: i, buildingId: building1.id, propertyId: property1.id, wing: i <= 2 ? 'East' : 'West' });
  for (let i = 1; i <= 2; i++) floorsData.push({ name: `Floor ${i}`, number: i, buildingId: building2.id, propertyId: property1.id });
  for (let i = 1; i <= 4; i++) floorsData.push({ name: `Floor ${i}`, number: i, buildingId: building3.id, propertyId: property2.id, wing: i <= 2 ? 'North' : 'South' });
  await prisma.floor.createMany({ data: floorsData });
  const floors = await prisma.floor.findMany();
  console.log(`Created ${floors.length} Floors`);

  // Rooms & Beds
  console.log('Creating rooms and beds...');
  const sharingTypes = ['single', 'double', 'triple', 'four_sharing'];
  const roomTypes = ['ac', 'non_ac', 'deluxe', 'premium'];
  const rents = { ac: 12000, non_ac: 8000, deluxe: 15000, premium: 18000 };
  const roomData = [];
  const bedData = [];
  let roomCount = 0;

  for (const floor of floors) {
    const roomsPerFloor = floor.propertyId === property1.id ? 3 : 4;
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
  for (const room of allRooms) {
    for (let b = 1; b <= room.totalBeds; b++) {
      bedData.push({ name: `Bed ${b}`, number: b, roomId: room.id, status: b <= room.occupiedBeds ? 'occupied' : 'available' });
    }
  }
  await prisma.bed.createMany({ data: bedData });
  console.log(`Created ${allRooms.length} Rooms with ${bedData.length} Beds`);

  // Staff
  console.log('Creating staff...');
  const staffRoles = ['caretaker', 'housekeeping', 'maintenance', 'security', 'cook'];
  const staffNames = ['Ravi Kumar', 'Sunita Devi', 'Mohan Lal', 'Kavita Joshi', 'Deepak Verma'];
  const staffSalaries = [12000, 10000, 13000, 11000, 14000];
  const staffData = [];
  for (let i = 0; i < 5; i++) {
    staffData.push({
      userId: staffUsers[i + 2]?.id || null, name: staffNames[i], phone: `98765432${15 + i}`, role: staffRoles[i],
      propertyId: i < 3 ? property1.id : property2.id, salary: staffSalaries[i],
      joinDate: new Date(2024, i, 15), status: 'active',
      aadhaarNumber: `${1000 + i * 1111} ${2000 + i * 1111} ${3000 + i * 1111}`,
      address: 'Bangalore, Karnataka',
    });
  }
  await prisma.staff.createMany({ data: staffData });
  const staffMembers = await prisma.staff.findMany();
  console.log('Created 5 Staff members');

  // Tenants
  console.log('Creating tenants...');
  const availableBeds = await prisma.bed.findMany({ where: { status: 'occupied' } });
  const tenantNames = ['Arjun Reddy', 'Sneha Patel', 'Vikram Mehta', 'Ananya Iyer', 'Rohit Deshmukh',
    'Kavya Nair', 'Aditya Malhotra', 'Pooja Sharma', 'Rahul Verma', 'Divya Reddy',
    'Karthik Rajan', 'Meera Krishnan', 'Siddharth Jain', 'Ritu Agarwal', 'Nikhil Joshi',
    'Swati Mishra', 'Pranav Kulkarni', 'Aisha Khan', 'Harsh Pandey', 'Nandini Rao'];
  const tenantUserEmails = tenantNames.map((_, i) => `tenant${i + 1}@hostelpro.com`);

  // Create tenant users first
  await prisma.user.createMany({
    data: tenantNames.map((name, i) => ({
      email: `tenant${i + 1}@hostelpro.com`, name, phone: `98765${String(i + 1).padStart(5, '0')}`,
      password: 'tenant123', role: 'tenant', isActive: true,
    })),
  });
  const tenantUsers = await prisma.user.findMany({ where: { email: { in: tenantUserEmails } } });

  const tenants = [];
  for (let i = 0; i < Math.min(15, availableBeds.length); i++) {
    const bed = availableBeds[i];
    const room = allRooms.find(r => r.id === bed.roomId);
    if (!room) continue;
    const tenantUser = tenantUsers[i];
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
  }
  console.log(`Created ${tenants.length} Tenants`);

  // Leads
  console.log('Creating leads...');
  const leadSources = ['website', 'whatsapp', 'referral', 'walk_in', 'google', 'social_media'];
  const leadNames = ['Rahul Sharma', 'Priya Patel', 'Amit Kumar', 'Sneha Reddy', 'Vikram Singh', 'Anita Desai', 'Karan Mehta', 'Riya Gupta', 'Saurabh Jain', 'Megha Nair', 'Deepak Mishra', 'Nisha Agarwal', 'Rajesh Verma', 'Pooja Iyer', 'Manish Tiwari', 'Swati Bhat', 'Arvind Kumar', 'Sakshi Sharma', 'Ramesh Yadav', 'Kavita Joshi'];
  const propIds = [property1.id, property2.id, property3.id];
  await prisma.lead.createMany({
    data: leadNames.map((name, i) => {
      const status = ['lead', 'inquiry', 'site_visit', 'negotiation', 'token', 'booking', 'move_in', 'lost'][i % 8];
      return {
        name, email: `lead${i + 1}@example.com`, phone: `98767${String(i + 1).padStart(5, '0')}`,
        source: leadSources[i % 6], status, stage: (i % 8) + 1,
        propertyId: propIds[i % 3],
        roomPreference: ['Single AC', 'Double Non-AC', 'Triple Sharing', 'Premium'][i % 4],
        budget: 8000 + (i * 500) % 10000,
        followUpDate: new Date(2025, 6, (i % 28) + 1),
        tokenAmount: ['token', 'booking', 'move_in'].includes(status) ? 5000 : null,
        notes: `Interested in ${['AC', 'Non-AC', 'Premium'][i % 3]} room`,
        assignedToId: manager.id, createdById: manager.id,
      };
    }),
  });
  console.log('Created 20 Leads');

  // Payments (batch create)
  console.log('Creating payments...');
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
  console.log(`Created ${paymentData.length} Payments`);

  // Complaints
  console.log('Creating complaints...');
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
        assignedToId: status !== 'open' ? staffUser1.id : null,
        createdById: tenant?.userId || manager.id,
      };
    }).filter(c => c.tenantId),
  });
  console.log('Created Complaints');

  // Expenses
  console.log('Creating expenses...');
  const expenseDescriptions = ['Plumbing repair', 'Electricity bill', 'Staff salary', 'Cleaning supplies', 'Grocery purchase', 'Google Ads', 'Paint renovation', 'Internet bill', 'Security salary', 'Furniture purchase', 'Water bill', 'Pest control', 'CCTV maintenance', 'Fire safety', 'Garden maintenance', 'Generator service', 'Plumbing parts', 'Electrical repair', 'Paint supplies', 'Office supplies'];
  const expenseCategories = ['maintenance', 'utilities', 'salary', 'supplies', 'food', 'marketing', 'other'];
  await prisma.expense.createMany({
    data: expenseDescriptions.map((desc, i) => ({
      category: expenseCategories[i % 7],
      description: desc,
      amount: (i + 5) * 1000,
      date: new Date(2025, i % 7, (i % 28) + 1),
      vendor: ['ABC Services', 'XYZ Supplies', 'Quick Fix', 'Pro Maintenance', 'City Utilities'][i % 5],
      propertyId: propIds[i % 3],
      createdById: manager.id, status: 'approved',
    })),
  });
  console.log('Created 20 Expenses');

  // Notices
  console.log('Creating notices...');
  await prisma.notice.createMany({
    data: [
      { title: 'Water Supply Maintenance', content: 'Water supply will be temporarily interrupted on Saturday from 9 AM to 12 PM.', type: 'maintenance', propertyId: property1.id, createdById: manager.id, isActive: true, expiryDate: new Date(2025, 7, 30) },
      { title: 'Rent Payment Reminder', content: 'Rent is due by the 5th. Late fees applicable after the 10th.', type: 'payment', propertyId: property1.id, createdById: manager.id, isActive: true, expiryDate: new Date(2025, 7, 30) },
      { title: 'Annual Day Celebration', content: 'Annual Day celebration on August 15th. All residents invited.', type: 'event', propertyId: property1.id, createdById: manager.id, isActive: true, expiryDate: new Date(2025, 7, 30) },
      { title: 'Fire Safety Drill', content: 'Mandatory fire safety drill on July 28th at 4 PM.', type: 'urgent', propertyId: property1.id, createdById: manager.id, isActive: true, expiryDate: new Date(2025, 7, 30) },
      { title: 'New WiFi Password', content: 'WiFi password updated. Collect from reception.', type: 'general', propertyId: property1.id, createdById: manager.id, isActive: true, expiryDate: new Date(2025, 7, 30) },
    ],
  });
  console.log('Created 5 Notices');

  // Visitors
  console.log('Creating visitors...');
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
  console.log('Created 10 Visitors');

  // Attendance (batch create)
  console.log('Creating attendance...');
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
  console.log(`Created ${attendanceData.length} Attendance records`);

  // Subscription
  await prisma.subscription.create({
    data: { userId: owner.id, plan: 'premium', status: 'active', startDate: new Date(2024, 0, 1), endDate: new Date(2025, 11, 31), amount: 2499, autoRenew: true },
  });
  console.log('Created Subscription');

  console.log('\n✅ Main seed completed successfully!');

  await prisma.$disconnect();
}

seed().catch(e => {
  console.error('Seed error:', e.message);
  prisma.$disconnect();
  process.exit(1);
});

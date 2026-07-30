const { PrismaClient } = require('@prisma/client')
const db = new PrismaClient()

async function seedInventory() {
  console.log('🌱 Seeding inventory data (PostgreSQL optimized)...')

  const properties = await db.property.findMany()
  const users = await db.user.findMany()

  if (properties.length === 0) {
    console.log('❌ No properties found. Run main seed first.')
    return
  }

  const propertyId = properties[0].id
  const userId = users[0]?.id

  // ─── Inventory Categories (batch create) ──────────────────────────────────
  console.log('Creating inventory categories...')
  const categoryData = [
    { name: 'Kitchen Groceries', slug: 'kitchen-groceries', description: 'Rice, wheat, pulses, flour', icon: 'Wheat', propertyId },
    { name: 'Vegetables & Fruits', slug: 'vegetables-fruits', description: 'Fresh vegetables and fruits', icon: 'Apple', propertyId },
    { name: 'Dairy Products', slug: 'dairy-products', description: 'Milk, curd, paneer, butter', icon: 'Milk', propertyId },
    { name: 'Meat & Eggs', slug: 'meat-eggs', description: 'Chicken, mutton, fish, eggs', icon: 'Egg', propertyId },
    { name: 'Cooking Oil & Spices', slug: 'oil-spices', description: 'Cooking oil, masala, salt, turmeric', icon: 'Flame', propertyId },
    { name: 'Beverages', slug: 'beverages', description: 'Tea, coffee, juice, water', icon: 'Coffee', propertyId },
    { name: 'Cleaning Supplies', slug: 'cleaning-supplies', description: 'Phenyl, floor cleaner, soap', icon: 'Sparkles', propertyId },
    { name: 'Gas Cylinders', slug: 'gas-cylinders', description: 'LPG cylinders for cooking', icon: 'Flame', propertyId },
    { name: 'Stationery', slug: 'stationery', description: 'Paper, pens, files', icon: 'Pen', propertyId },
    { name: 'Medical Supplies', slug: 'medical-supplies', description: 'First aid, medicines', icon: 'Heart', propertyId },
  ]

  for (const cat of categoryData) {
    await db.inventoryCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    })
  }
  const categories = await db.inventoryCategory.findMany({ where: { propertyId } })
  console.log(`  ✅ ${categories.length} categories`)

  // ─── Inventory Items (batch create) ──────────────────────────────────
  console.log('Creating inventory items...')
  const catMap = {}
  categories.forEach(c => { catMap[c.name] = c.id })

  const itemData = [
    { name: 'Basmati Rice', categoryId: catMap['Kitchen Groceries'], unit: 'kg', unitPrice: 80, currentStock: 150, openingStock: 150, minStock: 30, maxStock: 300, reorderLevel: 30, gstRate: 5, hsnCode: '1006', storeLocation: 'Main Store', isActive: true, propertyId },
    { name: 'Toor Dal', categoryId: catMap['Kitchen Groceries'], unit: 'kg', unitPrice: 120, currentStock: 50, openingStock: 50, minStock: 15, maxStock: 100, reorderLevel: 15, gstRate: 5, hsnCode: '0713', storeLocation: 'Main Store', isActive: true, propertyId },
    { name: 'Wheat Flour', categoryId: catMap['Kitchen Groceries'], unit: 'kg', unitPrice: 45, currentStock: 80, openingStock: 80, minStock: 20, maxStock: 150, reorderLevel: 20, gstRate: 5, hsnCode: '1101', storeLocation: 'Main Store', isActive: true, propertyId },
    { name: 'Sugar', categoryId: catMap['Kitchen Groceries'], unit: 'kg', unitPrice: 48, currentStock: 40, openingStock: 40, minStock: 10, maxStock: 80, reorderLevel: 10, gstRate: 5, hsnCode: '1701', storeLocation: 'Main Store', isActive: true, propertyId },
    { name: 'Onions', categoryId: catMap['Vegetables & Fruits'], unit: 'kg', unitPrice: 30, currentStock: 5, openingStock: 5, minStock: 10, maxStock: 60, reorderLevel: 10, gstRate: 0, storeLocation: 'Main Store', isActive: true, propertyId },
    { name: 'Potatoes', categoryId: catMap['Vegetables & Fruits'], unit: 'kg', unitPrice: 25, currentStock: 30, openingStock: 30, minStock: 10, maxStock: 60, reorderLevel: 10, gstRate: 0, storeLocation: 'Main Store', isActive: true, propertyId },
    { name: 'Tomatoes', categoryId: catMap['Vegetables & Fruits'], unit: 'kg', unitPrice: 35, currentStock: 3, openingStock: 3, minStock: 8, maxStock: 40, reorderLevel: 8, gstRate: 0, storeLocation: 'Main Store', isActive: true, propertyId },
    { name: 'Green Vegetables', categoryId: catMap['Vegetables & Fruits'], unit: 'kg', unitPrice: 40, currentStock: 12, openingStock: 12, minStock: 5, maxStock: 30, reorderLevel: 5, gstRate: 0, storeLocation: 'Main Store', isActive: true, propertyId },
    { name: 'Milk', categoryId: catMap['Dairy Products'], unit: 'l', unitPrice: 60, currentStock: 30, openingStock: 30, minStock: 10, maxStock: 50, reorderLevel: 10, gstRate: 5, storeLocation: 'Cold Store', isActive: true, propertyId },
    { name: 'Curd', categoryId: catMap['Dairy Products'], unit: 'kg', unitPrice: 70, currentStock: 10, openingStock: 10, minStock: 5, maxStock: 25, reorderLevel: 5, gstRate: 5, storeLocation: 'Cold Store', isActive: true, propertyId },
    { name: 'Paneer', categoryId: catMap['Dairy Products'], unit: 'kg', unitPrice: 320, currentStock: 5, openingStock: 5, minStock: 2, maxStock: 15, reorderLevel: 2, gstRate: 12, storeLocation: 'Cold Store', isActive: true, propertyId },
    { name: 'Eggs', categoryId: catMap['Meat & Eggs'], unit: 'pcs', unitPrice: 7, currentStock: 200, openingStock: 200, minStock: 60, maxStock: 500, reorderLevel: 60, gstRate: 0, storeLocation: 'Cold Store', isActive: true, propertyId },
    { name: 'Chicken', categoryId: catMap['Meat & Eggs'], unit: 'kg', unitPrice: 240, currentStock: 8, openingStock: 8, minStock: 5, maxStock: 20, reorderLevel: 5, gstRate: 0, storeLocation: 'Cold Store', isActive: true, propertyId },
    { name: 'Sunflower Oil', categoryId: catMap['Cooking Oil & Spices'], unit: 'l', unitPrice: 150, currentStock: 20, openingStock: 20, minStock: 5, maxStock: 40, reorderLevel: 5, gstRate: 5, storeLocation: 'Main Store', isActive: true, propertyId },
    { name: 'Mustard Oil', categoryId: catMap['Cooking Oil & Spices'], unit: 'l', unitPrice: 180, currentStock: 10, openingStock: 10, minStock: 3, maxStock: 20, reorderLevel: 3, gstRate: 5, storeLocation: 'Main Store', isActive: true, propertyId },
    { name: 'Turmeric Powder', categoryId: catMap['Cooking Oil & Spices'], unit: 'kg', unitPrice: 350, currentStock: 0.5, openingStock: 0.5, minStock: 1, maxStock: 10, reorderLevel: 1, gstRate: 5, storeLocation: 'Main Store', isActive: true, propertyId },
    { name: 'Red Chilli Powder', categoryId: catMap['Cooking Oil & Spices'], unit: 'kg', unitPrice: 400, currentStock: 2, openingStock: 2, minStock: 1, maxStock: 8, reorderLevel: 1, gstRate: 5, storeLocation: 'Main Store', isActive: true, propertyId },
    { name: 'Garam Masala', categoryId: catMap['Cooking Oil & Spices'], unit: 'kg', unitPrice: 600, currentStock: 1.5, openingStock: 1.5, minStock: 0.5, maxStock: 5, reorderLevel: 0.5, gstRate: 5, storeLocation: 'Main Store', isActive: true, propertyId },
    { name: 'Salt', categoryId: catMap['Cooking Oil & Spices'], unit: 'kg', unitPrice: 20, currentStock: 10, openingStock: 10, minStock: 3, maxStock: 25, reorderLevel: 3, gstRate: 0, storeLocation: 'Main Store', isActive: true, propertyId },
    { name: 'Tea Powder', categoryId: catMap['Beverages'], unit: 'kg', unitPrice: 500, currentStock: 4, openingStock: 4, minStock: 1, maxStock: 10, reorderLevel: 1, gstRate: 5, storeLocation: 'Main Store', isActive: true, propertyId },
    { name: 'Coffee Powder', categoryId: catMap['Beverages'], unit: 'kg', unitPrice: 800, currentStock: 2, openingStock: 2, minStock: 0.5, maxStock: 5, reorderLevel: 0.5, gstRate: 5, storeLocation: 'Main Store', isActive: true, propertyId },
    { name: 'Phenyl', categoryId: catMap['Cleaning Supplies'], unit: 'l', unitPrice: 80, currentStock: 8, openingStock: 8, minStock: 2, maxStock: 20, reorderLevel: 2, gstRate: 18, storeLocation: 'Utility Store', isActive: true, propertyId },
    { name: 'Floor Cleaner', categoryId: catMap['Cleaning Supplies'], unit: 'l', unitPrice: 120, currentStock: 5, openingStock: 5, minStock: 2, maxStock: 15, reorderLevel: 2, gstRate: 18, storeLocation: 'Utility Store', isActive: true, propertyId },
    { name: 'Detergent', categoryId: catMap['Cleaning Supplies'], unit: 'kg', unitPrice: 90, currentStock: 10, openingStock: 10, minStock: 3, maxStock: 25, reorderLevel: 3, gstRate: 18, storeLocation: 'Utility Store', isActive: true, propertyId },
    { name: 'LPG Cylinder', categoryId: catMap['Gas Cylinders'], unit: 'cylinder', unitPrice: 850, currentStock: 4, openingStock: 4, minStock: 2, maxStock: 10, reorderLevel: 2, gstRate: 5, storeLocation: 'Gas Store', isActive: true, propertyId },
    { name: 'A4 Paper Bundle', categoryId: catMap['Stationery'], unit: 'pack', unitPrice: 250, currentStock: 5, openingStock: 5, minStock: 2, maxStock: 15, reorderLevel: 2, gstRate: 18, storeLocation: 'Office', isActive: true, propertyId },
    { name: 'First Aid Kit', categoryId: catMap['Medical Supplies'], unit: 'pcs', unitPrice: 500, currentStock: 3, openingStock: 3, minStock: 1, maxStock: 10, reorderLevel: 1, gstRate: 12, storeLocation: 'Reception', isActive: true, propertyId },
  ]

  // Check existing items and create only new ones
  const existingItems = await db.inventoryItem.findMany({ where: { propertyId } })
  const existingNames = new Set(existingItems.map(i => i.name))
  const newItems = itemData.filter(i => !existingNames.has(i.name))
  if (newItems.length > 0) {
    await db.inventoryItem.createMany({ data: newItems })
  }
  const items = await db.inventoryItem.findMany({ where: { propertyId } })
  console.log(`  ✅ ${items.length} inventory items`)

  // ─── Vendors (batch create) ──────────────────────────────────
  console.log('Creating vendors...')
  const vendorData = [
    { name: 'Sri Lakshmi Groceries', contactPerson: 'Ramesh Kumar', phone: '9876543210', email: 'ramesh@srilakshmi.com', address: '15 Market Road', city: 'Hyderabad', state: 'Telangana', gstNumber: '36AABCS1234F1Z5', rating: 4, paymentTerms: 'Net 30', status: 'active', propertyId },
    { name: 'Fresh Farm Suppliers', contactPerson: 'Anitha Reddy', phone: '9876543211', email: 'anitha@freshfarm.com', address: '22 Vegetable Market', city: 'Hyderabad', state: 'Telangana', gstNumber: '36AABCF5678G2Z3', rating: 5, paymentTerms: 'COD', status: 'active', propertyId },
    { name: 'Dairy Pure India', contactPerson: 'Venkat Rao', phone: '9876543212', email: 'venkat@dairypure.com', address: '8 Dairy Lane', city: 'Hyderabad', state: 'Telangana', gstNumber: '36AABCD9012H3Z1', rating: 4, paymentTerms: 'Net 15', status: 'active', propertyId },
    { name: 'HP Gas Agency', contactPerson: 'Suresh Babu', phone: '9876543213', email: 'hpgas@agency.com', address: '45 Station Road', city: 'Hyderabad', state: 'Telangana', gstNumber: '36AABCH3456I4Z9', rating: 3, paymentTerms: 'Advance', status: 'active', propertyId },
    { name: 'Clean Pro Supplies', contactPerson: 'Meena Devi', phone: '9876543214', email: 'meena@cleanpro.com', address: '12 Industrial Area', city: 'Hyderabad', state: 'Telangana', gstNumber: '36AABCC7890J5Z7', rating: 4, paymentTerms: 'Net 30', status: 'active', propertyId },
  ]

  const existingVendors = await db.vendor.findMany({ where: { propertyId } })
  const existingVendorNames = new Set(existingVendors.map(v => v.name))
  const newVendors = vendorData.filter(v => !existingVendorNames.has(v.name))
  if (newVendors.length > 0) {
    await db.vendor.createMany({ data: newVendors })
  }
  const vendors = await db.vendor.findMany({ where: { propertyId } })
  console.log(`  ✅ ${vendors.length} vendors`)

  // ─── Purchase Orders ──────────────────────────────────
  console.log('Creating purchase orders...')
  const poCount = await db.purchaseOrder.count()
  if (poCount === 0 && userId && vendors.length > 0) {
    const rice = items.find(i => i.name === 'Basmati Rice')
    const dal = items.find(i => i.name === 'Toor Dal')
    const oil = items.find(i => i.name === 'Sunflower Oil')
    const tea = items.find(i => i.name === 'Tea Powder')
    const coffee = items.find(i => i.name === 'Coffee Powder')

    if (rice && dal && oil) {
      const po1Items = [
        { itemId: rice.id, itemName: 'Basmati Rice', quantity: 50, unit: 'kg', unitPrice: 80, gstRate: 5, totalPrice: 4000, receivedQty: 0, status: 'pending' },
        { itemId: dal.id, itemName: 'Toor Dal', quantity: 20, unit: 'kg', unitPrice: 120, gstRate: 5, totalPrice: 2400, receivedQty: 0, status: 'pending' },
        { itemId: oil.id, itemName: 'Sunflower Oil', quantity: 10, unit: 'l', unitPrice: 150, gstRate: 5, totalPrice: 1500, receivedQty: 0, status: 'pending' },
      ]
      const totalAmount = po1Items.reduce((s, i) => s + i.totalPrice, 0)
      const gstAmount = po1Items.reduce((s, i) => s + (i.totalPrice * i.gstRate / 100), 0)

      await db.purchaseOrder.create({
        data: {
          poNumber: 'PO-0001', vendorId: vendors[0].id, propertyId, createdById: userId,
          status: 'approved', orderDate: new Date(Date.now() - 5 * 86400000),
          expectedDelivery: new Date(Date.now() + 2 * 86400000),
          totalAmount, gstAmount, discount: 0, netAmount: totalAmount + gstAmount, paymentStatus: 'unpaid',
          items: { create: po1Items },
        },
      })

      if (tea && coffee) {
        const po2Items = [
          { itemId: tea.id, itemName: 'Tea Powder', quantity: 2, unit: 'kg', unitPrice: 500, gstRate: 5, totalPrice: 1000, receivedQty: 2, status: 'received' },
          { itemId: coffee.id, itemName: 'Coffee Powder', quantity: 1, unit: 'kg', unitPrice: 800, gstRate: 5, totalPrice: 800, receivedQty: 1, status: 'received' },
        ]
        const total2 = po2Items.reduce((s, i) => s + i.totalPrice, 0)
        const gst2 = po2Items.reduce((s, i) => s + (i.totalPrice * i.gstRate / 100), 0)

        await db.purchaseOrder.create({
          data: {
            poNumber: 'PO-0002', vendorId: vendors[0].id, propertyId, createdById: userId,
            status: 'received', orderDate: new Date(Date.now() - 15 * 86400000),
            totalAmount: total2, gstAmount: gst2, discount: 0, netAmount: total2 + gst2, paymentStatus: 'paid', paymentMode: 'upi',
            items: { create: po2Items },
          },
        })
      }
    }
    console.log('  ✅ 2 purchase orders')
  } else {
    console.log(`  ⏭️ Purchase orders already exist (${poCount})`)
  }

  // ─── Recipes ──────────────────────────────────
  console.log('Creating recipes...')
  const recipeCount = await db.recipe.count()
  if (recipeCount === 0) {
    const rice = items.find(i => i.name === 'Basmati Rice')
    const dal = items.find(i => i.name === 'Toor Dal')
    const oil = items.find(i => i.name === 'Sunflower Oil')
    const onions = items.find(i => i.name === 'Onions')
    const tomatoes = items.find(i => i.name === 'Tomatoes')
    const veggies = items.find(i => i.name === 'Green Vegetables')
    const turmeric = items.find(i => i.name === 'Turmeric Powder')
    const chilli = items.find(i => i.name === 'Red Chilli Powder')
    const garam = items.find(i => i.name === 'Garam Masala')
    const saltItem = items.find(i => i.name === 'Salt')
    const potatoes = items.find(i => i.name === 'Potatoes')
    const eggs = items.find(i => i.name === 'Eggs')
    const milk = items.find(i => i.name === 'Milk')
    const sugar = items.find(i => i.name === 'Sugar')
    const teaItem = items.find(i => i.name === 'Tea Powder')
    const flour = items.find(i => i.name === 'Wheat Flour')
    const curd = items.find(i => i.name === 'Curd')

    const recipeData = [
      { name: 'Vegetable Biryani', category: 'veg', mealType: 'lunch', baseServings: 100, instructions: 'Wash and soak rice. Fry vegetables with spices. Cook rice separately. Layer and steam for 20 minutes.', propertyId, isActive: true,
        ingredients: [
          { itemId: rice?.id, quantity: 25, unit: 'kg' }, { itemId: veggies?.id, quantity: 15, unit: 'kg' },
          { itemId: oil?.id, quantity: 4, unit: 'l' }, { itemId: saltItem?.id, quantity: 0.5, unit: 'kg' },
          { itemId: garam?.id, quantity: 2, unit: 'kg' }, { itemId: onions?.id, quantity: 8, unit: 'kg' },
          { itemId: tomatoes?.id, quantity: 5, unit: 'kg' }, { itemId: turmeric?.id, quantity: 0.3, unit: 'kg' },
        ].filter(i => i.itemId) },
      { name: 'Dal Tadka', category: 'veg', mealType: 'lunch', baseServings: 100, instructions: 'Boil dal with turmeric and salt. Prepare tadka with oil, cumin, garlic, and red chilli. Mix and simmer.', propertyId, isActive: true,
        ingredients: [
          { itemId: dal?.id, quantity: 10, unit: 'kg' }, { itemId: oil?.id, quantity: 1.5, unit: 'l' },
          { itemId: turmeric?.id, quantity: 0.2, unit: 'kg' }, { itemId: saltItem?.id, quantity: 0.3, unit: 'kg' },
          { itemId: chilli?.id, quantity: 0.3, unit: 'kg' }, { itemId: tomatoes?.id, quantity: 3, unit: 'kg' },
        ].filter(i => i.itemId) },
      { name: 'Aloo Gobi', category: 'veg', mealType: 'lunch', baseServings: 100, instructions: 'Cut potatoes and cauliflower. Fry with spices and turmeric. Simmer until cooked.', propertyId, isActive: true,
        ingredients: [
          { itemId: potatoes?.id, quantity: 12, unit: 'kg' }, { itemId: oil?.id, quantity: 2, unit: 'l' },
          { itemId: turmeric?.id, quantity: 0.2, unit: 'kg' }, { itemId: chilli?.id, quantity: 0.2, unit: 'kg' },
          { itemId: saltItem?.id, quantity: 0.3, unit: 'kg' }, { itemId: tomatoes?.id, quantity: 4, unit: 'kg' },
        ].filter(i => i.itemId) },
      { name: 'Egg Curry', category: 'non_veg', mealType: 'lunch', baseServings: 100, instructions: 'Boil eggs. Prepare gravy with onions, tomatoes, and spices. Add eggs and simmer.', propertyId, isActive: true,
        ingredients: [
          { itemId: eggs?.id, quantity: 100, unit: 'pcs' }, { itemId: oil?.id, quantity: 2, unit: 'l' },
          { itemId: onions?.id, quantity: 6, unit: 'kg' }, { itemId: tomatoes?.id, quantity: 4, unit: 'kg' },
          { itemId: turmeric?.id, quantity: 0.2, unit: 'kg' }, { itemId: chilli?.id, quantity: 0.2, unit: 'kg' },
          { itemId: saltItem?.id, quantity: 0.3, unit: 'kg' },
        ].filter(i => i.itemId) },
      { name: 'Chicken Curry', category: 'non_veg', mealType: 'dinner', baseServings: 100, instructions: 'Marinate chicken. Fry onions, add spices. Cook chicken in gravy.', propertyId, isActive: true,
        ingredients: [
          { itemId: items.find(i => i.name === 'Chicken')?.id, quantity: 15, unit: 'kg' },
          { itemId: oil?.id, quantity: 3, unit: 'l' }, { itemId: onions?.id, quantity: 8, unit: 'kg' },
          { itemId: tomatoes?.id, quantity: 5, unit: 'kg' }, { itemId: garam?.id, quantity: 0.5, unit: 'kg' },
          { itemId: chilli?.id, quantity: 0.3, unit: 'kg' }, { itemId: saltItem?.id, quantity: 0.4, unit: 'kg' },
        ].filter(i => i.itemId) },
      { name: 'Chapati', category: 'veg', mealType: 'lunch', baseServings: 100, instructions: 'Knead dough with flour and salt. Roll into flat rounds. Cook on tawa.', propertyId, isActive: true,
        ingredients: [
          { itemId: flour?.id, quantity: 20, unit: 'kg' }, { itemId: oil?.id, quantity: 1, unit: 'l' },
          { itemId: saltItem?.id, quantity: 0.2, unit: 'kg' },
        ].filter(i => i.itemId) },
      { name: 'Tea', category: 'veg', mealType: 'breakfast', baseServings: 100, instructions: 'Boil water with tea powder. Add milk and sugar. Strain and serve.', propertyId, isActive: true,
        ingredients: [
          { itemId: teaItem?.id, quantity: 0.5, unit: 'kg' }, { itemId: milk?.id, quantity: 15, unit: 'l' },
          { itemId: sugar?.id, quantity: 3, unit: 'kg' },
        ].filter(i => i.itemId) },
      { name: 'Poha', category: 'veg', mealType: 'breakfast', baseServings: 100, instructions: 'Wash and soak poha. Fry peanuts, mustard seeds, curry leaves. Mix with poha.', propertyId, isActive: true,
        ingredients: [
          { itemId: rice?.id, quantity: 8, unit: 'kg' }, { itemId: oil?.id, quantity: 1, unit: 'l' },
          { itemId: turmeric?.id, quantity: 0.1, unit: 'kg' }, { itemId: saltItem?.id, quantity: 0.2, unit: 'kg' },
          { itemId: onions?.id, quantity: 3, unit: 'kg' }, { itemId: potatoes?.id, quantity: 5, unit: 'kg' },
        ].filter(i => i.itemId) },
    ]

    for (const recipe of recipeData) {
      const ingredients = recipe.ingredients.map(ing => ({ itemId: ing.itemId, quantity: ing.quantity, unit: ing.unit }))
      delete recipe.ingredients
      await db.recipe.create({ data: { ...recipe, ingredients: { create: ingredients } } })
    }
    console.log(`  ✅ ${recipeData.length} recipes`)
  } else {
    console.log(`  ⏭️ Recipes already exist (${recipeCount})`)
  }

  // ─── Menu Plans (batch create) ──────────────────────────────────
  console.log('Creating menu plans...')
  const menuCount = await db.menuPlan.count()
  if (menuCount === 0) {
    const recipes = await db.recipe.findMany({ where: { propertyId } })
    const today = new Date()
    const mealTypes = ['breakfast', 'lunch', 'snacks', 'dinner']
    const menuData = []

    for (let d = 0; d < 3; d++) {
      const date = new Date(today)
      date.setDate(date.getDate() + d)
      for (const mealType of mealTypes) {
        const recipe = recipes.find(r => r.mealType === mealType) || recipes[0]
        menuData.push({
          date, mealType, propertyId, headCount: 80 + d * 5, status: d === 0 ? 'served' : 'planned',
          notes: `Menu for ${mealType}`,
          items: {
            create: [{
              recipeId: recipe?.id || null,
              dishName: recipe?.name || 'Daily Special',
              servings: 80 + d * 5,
            }]
          }
        })
      }
    }

    for (const menu of menuData) {
      await db.menuPlan.create({ data: menu })
    }
    console.log(`  ✅ ${menuData.length} menu plans`)
  } else {
    console.log(`  ⏭️ Menu plans already exist (${menuCount})`)
  }

  // ─── Kitchen Issues (batch create) ──────────────────────────────────
  console.log('Creating kitchen issues...')
  const issueCount = await db.kitchenIssue.count()
  if (issueCount === 0 && userId) {
    const rice = items.find(i => i.name === 'Basmati Rice')
    const dal = items.find(i => i.name === 'Toor Dal')
    const oil = items.find(i => i.name === 'Sunflower Oil')
    const veggies = items.find(i => i.name === 'Green Vegetables')
    const milk = items.find(i => i.name === 'Milk')

    const issueData = [
      { issueNumber: 'KI-0001', itemId: rice?.id, propertyId, quantity: 15, unit: 'kg', issuedTo: 'Kitchen Staff', purpose: 'lunch', issuedById: userId, notes: 'For lunch preparation' },
      { issueNumber: 'KI-0002', itemId: dal?.id, propertyId, quantity: 8, unit: 'kg', issuedTo: 'Kitchen Staff', purpose: 'lunch', issuedById: userId, notes: 'For dal preparation' },
      { issueNumber: 'KI-0003', itemId: oil?.id, propertyId, quantity: 3, unit: 'l', issuedTo: 'Kitchen Staff', purpose: 'lunch', issuedById: userId, notes: 'Cooking oil for lunch' },
      { issueNumber: 'KI-0004', itemId: veggies?.id, propertyId, quantity: 10, unit: 'kg', issuedTo: 'Kitchen Staff', purpose: 'dinner', issuedById: userId, notes: 'For dinner vegetables' },
      { issueNumber: 'KI-0005', itemId: milk?.id, propertyId, quantity: 12, unit: 'l', issuedTo: 'Kitchen Staff', purpose: 'breakfast', issuedById: userId, notes: 'Morning tea and milk' },
      { issueNumber: 'KI-0006', itemId: rice?.id, propertyId, quantity: 12, unit: 'kg', issuedTo: 'Kitchen Staff', purpose: 'dinner', issuedById: userId, notes: 'Dinner rice' },
    ].filter(i => i.itemId)

    for (const issue of issueData) {
      await db.kitchenIssue.create({ data: issue })
    }
    console.log(`  ✅ ${issueData.length} kitchen issues`)
  } else {
    console.log(`  ⏭️ Kitchen issues already exist (${issueCount})`)
  }

  // ─── Assets (batch create) ──────────────────────────────────
  console.log('Creating assets...')
  const assetCount = await db.asset.count()
  if (assetCount === 0) {
    const rooms = await db.room.findMany({ where: { propertyId }, take: 10 })
    const assetData = [
      { name: 'Double Bed Frame', assetTag: 'AST-001', category: 'furniture', subCategory: 'bed', propertyId, roomId: rooms[0]?.id || null, purchaseDate: new Date(2024, 0, 15), purchasePrice: 8000, currentValue: 6000, depreciationRate: 10, vendor: 'Furniture World', status: 'active', condition: 'good', lastMaintenance: new Date(2025, 0, 15), nextMaintenance: new Date(2026, 0, 15) },
      { name: 'Queen Mattress', assetTag: 'AST-002', category: 'furniture', subCategory: 'mattress', propertyId, roomId: rooms[1]?.id || null, purchaseDate: new Date(2024, 1, 10), purchasePrice: 5000, currentValue: 3500, depreciationRate: 15, vendor: 'SleepWell', status: 'active', condition: 'good', lastMaintenance: new Date(2025, 1, 10), nextMaintenance: new Date(2026, 1, 10) },
      { name: 'Ceiling Fan', assetTag: 'AST-003', category: 'electrical', subCategory: 'fan', propertyId, roomId: rooms[2]?.id || null, purchaseDate: new Date(2024, 2, 5), purchasePrice: 2500, currentValue: 2000, depreciationRate: 10, vendor: 'Havells', status: 'active', condition: 'excellent' },
      { name: 'Split AC 1.5 Ton', assetTag: 'AST-004', category: 'electronics', subCategory: 'ac', propertyId, roomId: rooms[3]?.id || null, purchaseDate: new Date(2024, 3, 20), purchasePrice: 35000, currentValue: 28000, depreciationRate: 15, vendor: 'Daikin', warrantyExpiry: new Date(2027, 3, 20), status: 'active', condition: 'good', lastMaintenance: new Date(2025, 3, 20), nextMaintenance: new Date(2025, 9, 20) },
      { name: '32 inch LED TV', assetTag: 'AST-005', category: 'electronics', subCategory: 'tv', propertyId, roomId: rooms[4]?.id || null, purchaseDate: new Date(2024, 4, 1), purchasePrice: 15000, currentValue: 12000, depreciationRate: 20, vendor: 'Samsung', warrantyExpiry: new Date(2026, 4, 1), status: 'active', condition: 'good' },
      { name: 'Water Cooler', assetTag: 'AST-006', category: 'appliance', subCategory: 'water_cooler', propertyId, purchaseDate: new Date(2024, 5, 10), purchasePrice: 12000, currentValue: 9000, depreciationRate: 15, vendor: 'Blue Star', status: 'active', condition: 'good', lastMaintenance: new Date(2025, 5, 10), nextMaintenance: new Date(2025, 11, 10) },
      { name: 'Washing Machine', assetTag: 'AST-007', category: 'appliance', subCategory: 'washing_machine', propertyId, purchaseDate: new Date(2024, 6, 15), purchasePrice: 25000, currentValue: 20000, depreciationRate: 15, vendor: 'LG', warrantyExpiry: new Date(2027, 6, 15), status: 'active', condition: 'excellent' },
      { name: 'Refrigerator', assetTag: 'AST-008', category: 'appliance', subCategory: 'refrigerator', propertyId, purchaseDate: new Date(2024, 7, 1), purchasePrice: 30000, currentValue: 25000, depreciationRate: 10, vendor: 'Whirlpool', warrantyExpiry: new Date(2027, 7, 1), status: 'active', condition: 'good' },
      { name: 'Study Table', assetTag: 'AST-009', category: 'furniture', subCategory: 'table', propertyId, roomId: rooms[5]?.id || null, purchaseDate: new Date(2024, 8, 5), purchasePrice: 3500, currentValue: 2500, depreciationRate: 10, vendor: 'Furniture World', status: 'active', condition: 'fair' },
      { name: 'Office Chair', assetTag: 'AST-010', category: 'furniture', subCategory: 'chair', propertyId, roomId: rooms[6]?.id || null, purchaseDate: new Date(2024, 9, 15), purchasePrice: 4000, currentValue: 3000, depreciationRate: 10, vendor: 'Furniture World', status: 'active', condition: 'good' },
      { name: 'Commercial Gas Stove', assetTag: 'AST-011', category: 'kitchen_equipment', subCategory: 'gas_stove', propertyId, purchaseDate: new Date(2024, 0, 1), purchasePrice: 18000, currentValue: 14000, depreciationRate: 15, vendor: 'Sunflame', status: 'active', condition: 'good', lastMaintenance: new Date(2025, 0, 1), nextMaintenance: new Date(2025, 6, 1) },
      { name: 'Broken Table Fan', assetTag: 'AST-012', category: 'electrical', subCategory: 'fan', propertyId, purchaseDate: new Date(2023, 0, 1), purchasePrice: 1500, currentValue: 0, depreciationRate: 20, status: 'under_maintenance', condition: 'poor' },
      { name: 'Old Cupboard', assetTag: 'AST-013', category: 'furniture', subCategory: 'bed', propertyId, roomId: rooms[7]?.id || null, purchaseDate: new Date(2022, 5, 1), purchasePrice: 6000, currentValue: 1000, depreciationRate: 15, status: 'disposed', condition: 'broken' },
      { name: 'Inverter Battery', assetTag: 'AST-014', category: 'electrical', propertyId, purchaseDate: new Date(2024, 2, 1), purchasePrice: 12000, currentValue: 9000, depreciationRate: 15, vendor: 'Luminous', status: 'active', condition: 'good', lastMaintenance: new Date(2025, 2, 1), nextMaintenance: new Date(2025, 8, 1) },
    ]

    await db.asset.createMany({ data: assetData })
    console.log(`  ✅ ${assetData.length} assets`)
  } else {
    console.log(`  ⏭️ Assets already exist (${assetCount})`)
  }

  // ─── Laundry Items (batch create) ──────────────────────────────────
  console.log('Creating laundry items...')
  const laundryCount = await db.laundryItem.count()
  if (laundryCount === 0) {
    const rooms = await db.room.findMany({ where: { propertyId }, take: 6 })
    const laundryData = [
      { name: 'Bedsheet Set', category: 'bedding', propertyId, roomId: rooms[0]?.id || null, totalQuantity: 60, issuedQuantity: 45, inLaundry: 10, damagedQuantity: 2, condition: 'good', lastWashDate: new Date(2025, 6, 25), nextWashDate: new Date(2025, 7, 1), status: 'in_use' },
      { name: 'Pillow Covers', category: 'bedding', propertyId, roomId: rooms[1]?.id || null, totalQuantity: 60, issuedQuantity: 45, inLaundry: 8, damagedQuantity: 3, condition: 'good', lastWashDate: new Date(2025, 6, 25), nextWashDate: new Date(2025, 7, 1), status: 'in_use' },
      { name: 'Blankets', category: 'bedding', propertyId, totalQuantity: 45, issuedQuantity: 40, inLaundry: 3, damagedQuantity: 1, condition: 'fair', lastWashDate: new Date(2025, 5, 1), nextWashDate: new Date(2025, 8, 1), status: 'in_use' },
      { name: 'Bath Towels', category: 'bathroom', propertyId, totalQuantity: 80, issuedQuantity: 60, inLaundry: 15, damagedQuantity: 5, condition: 'good', lastWashDate: new Date(2025, 6, 26), nextWashDate: new Date(2025, 7, 3), status: 'in_use' },
      { name: 'Window Curtains', category: 'curtain', propertyId, roomId: rooms[2]?.id || null, totalQuantity: 30, issuedQuantity: 30, inLaundry: 0, damagedQuantity: 0, condition: 'good', lastWashDate: new Date(2025, 4, 1), nextWashDate: new Date(2025, 7, 1), status: 'in_use' },
      { name: 'Door Mat', category: 'other', propertyId, totalQuantity: 20, issuedQuantity: 18, inLaundry: 0, damagedQuantity: 2, condition: 'fair', lastWashDate: new Date(2025, 6, 1), nextWashDate: new Date(2025, 7, 1), status: 'in_use' },
    ]

    await db.laundryItem.createMany({ data: laundryData })
    console.log(`  ✅ ${laundryData.length} laundry items`)
  } else {
    console.log(`  ⏭️ Laundry items already exist (${laundryCount})`)
  }

  // ─── Housekeeping Items (batch create) ──────────────────────────────────
  console.log('Creating housekeeping items...')
  const hkCount = await db.housekeepingItem.count()
  if (hkCount === 0) {
    const hkData = [
      { name: 'Phenyl', category: 'cleaning', propertyId, unit: 'l', currentStock: 15, minStock: 5, unitPrice: 80, lastRestocked: new Date(2025, 6, 20), nextRestock: new Date(2025, 7, 20), isActive: true },
      { name: 'Floor Cleaner', category: 'cleaning', propertyId, unit: 'l', currentStock: 10, minStock: 3, unitPrice: 120, lastRestocked: new Date(2025, 6, 20), nextRestock: new Date(2025, 7, 20), isActive: true },
      { name: 'Detergent Powder', category: 'cleaning', propertyId, unit: 'kg', currentStock: 20, minStock: 5, unitPrice: 90, lastRestocked: new Date(2025, 6, 15), nextRestock: new Date(2025, 7, 15), isActive: true },
      { name: 'Toilet Cleaner', category: 'hygiene', propertyId, unit: 'l', currentStock: 8, minStock: 3, unitPrice: 150, lastRestocked: new Date(2025, 6, 15), nextRestock: new Date(2025, 7, 15), isActive: true },
      { name: 'Hand Soap', category: 'hygiene', propertyId, unit: 'l', currentStock: 12, minStock: 4, unitPrice: 200, lastRestocked: new Date(2025, 6, 10), nextRestock: new Date(2025, 7, 10), isActive: true },
      { name: 'Tissue Roll', category: 'hygiene', propertyId, unit: 'roll', currentStock: 50, minStock: 15, unitPrice: 35, lastRestocked: new Date(2025, 6, 20), nextRestock: new Date(2025, 7, 5), isActive: true },
      { name: 'Garbage Bag', category: 'other', propertyId, unit: 'pack', currentStock: 30, minStock: 10, unitPrice: 150, lastRestocked: new Date(2025, 6, 15), nextRestock: new Date(2025, 7, 15), isActive: true },
      { name: 'Mop', category: 'tool', propertyId, unit: 'pcs', currentStock: 5, minStock: 2, unitPrice: 350, lastRestocked: new Date(2025, 5, 1), nextRestock: new Date(2025, 8, 1), isActive: true },
      { name: 'Bucket', category: 'tool', propertyId, unit: 'pcs', currentStock: 8, minStock: 3, unitPrice: 250, lastRestocked: new Date(2025, 5, 1), nextRestock: new Date(2025, 8, 1), isActive: true },
      { name: 'Broom Stick', category: 'tool', propertyId, unit: 'pcs', currentStock: 6, minStock: 2, unitPrice: 180, lastRestocked: new Date(2025, 6, 1), nextRestock: new Date(2025, 7, 1), isActive: true },
    ]

    await db.housekeepingItem.createMany({ data: hkData })
    console.log(`  ✅ ${hkData.length} housekeeping items`)
  } else {
    console.log(`  ⏭️ Housekeeping items already exist (${hkCount})`)
  }

  // ─── Waste Records (batch create) ──────────────────────────────────
  console.log('Creating waste records...')
  const wasteCount = await db.wasteRecord.count()
  if (wasteCount === 0) {
    const rice = items.find(i => i.name === 'Basmati Rice')
    const dal = items.find(i => i.name === 'Toor Dal')
    const veggies = items.find(i => i.name === 'Green Vegetables')
    const milk = items.find(i => i.name === 'Milk')

    const wasteData = [
      { date: new Date(2025, 6, 25), category: 'food_waste', itemId: rice?.id || null, propertyId, description: 'Leftover rice from lunch', quantity: 3, unit: 'kg', estimatedCost: 240, disposalMethod: 'compost', disposalDate: new Date(2025, 6, 25), recordedById: userId, notes: 'Overestimated headcount' },
      { date: new Date(2025, 6, 25), category: 'food_waste', itemId: dal?.id || null, propertyId, description: 'Spoiled dal', quantity: 1, unit: 'kg', estimatedCost: 120, disposalMethod: 'trash', disposalDate: new Date(2025, 6, 25), recordedById: userId, notes: 'Kept too long' },
      { date: new Date(2025, 6, 24), category: 'spoilage', itemId: veggies?.id || null, propertyId, description: 'Wilted vegetables', quantity: 2, unit: 'kg', estimatedCost: 80, disposalMethod: 'compost', disposalDate: new Date(2025, 6, 24), recordedById: userId, notes: 'Not stored properly' },
      { date: new Date(2025, 6, 23), category: 'expired', itemId: milk?.id || null, propertyId, description: 'Expired milk packets', quantity: 3, unit: 'l', estimatedCost: 180, disposalMethod: 'trash', disposalDate: new Date(2025, 6, 23), recordedById: userId, notes: 'Exceeded expiry date' },
      { date: new Date(2025, 6, 22), category: 'other', propertyId, description: 'Spilled cooking oil', quantity: 0.5, unit: 'l', estimatedCost: 75, disposalMethod: 'trash', disposalDate: new Date(2025, 6, 22), recordedById: userId, notes: 'Accident during cooking' },
    ].filter(w => !w.itemId || items.some(i => i.id === w.itemId))

    await db.wasteRecord.createMany({ data: wasteData })
    console.log(`  ✅ ${wasteData.length} waste records`)
  } else {
    console.log(`  ⏭️ Waste records already exist (${wasteCount})`)
  }

  // ─── Consumption Logs (batch create) ──────────────────────────────────
  console.log('Creating consumption logs...')
  const consumptionCount = await db.consumptionLog.count()
  if (consumptionCount === 0) {
    const rice = items.find(i => i.name === 'Basmati Rice')
    const dal = items.find(i => i.name === 'Toor Dal')
    const oil = items.find(i => i.name === 'Sunflower Oil')
    const milk = items.find(i => i.name === 'Milk')

    const consumptionData = [
      { date: new Date(2025, 6, 25), itemId: rice?.id, propertyId, mealType: 'lunch', issuedQty: 15, consumedQty: 13, returnedQty: 1, wastageQty: 1, unit: 'kg', costPerUnit: 80, totalCost: 1200 },
      { date: new Date(2025, 6, 25), itemId: dal?.id, propertyId, mealType: 'lunch', issuedQty: 8, consumedQty: 7, returnedQty: 0.5, wastageQty: 0.5, unit: 'kg', costPerUnit: 120, totalCost: 960 },
      { date: new Date(2025, 6, 25), itemId: oil?.id, propertyId, mealType: 'lunch', issuedQty: 3, consumedQty: 2.8, returnedQty: 0, wastageQty: 0.2, unit: 'l', costPerUnit: 150, totalCost: 450 },
      { date: new Date(2025, 6, 25), itemId: milk?.id, propertyId, mealType: 'breakfast', issuedQty: 12, consumedQty: 11, returnedQty: 0, wastageQty: 1, unit: 'l', costPerUnit: 60, totalCost: 720 },
      { date: new Date(2025, 6, 24), itemId: rice?.id, propertyId, mealType: 'dinner', issuedQty: 12, consumedQty: 11, returnedQty: 0.5, wastageQty: 0.5, unit: 'kg', costPerUnit: 80, totalCost: 960 },
    ].filter(c => c.itemId)

    await db.consumptionLog.createMany({ data: consumptionData })
    console.log(`  ✅ ${consumptionData.length} consumption logs`)
  } else {
    console.log(`  ⏭️ Consumption logs already exist (${consumptionCount})`)
  }

  console.log('\n✅ Inventory seed completed successfully!')
  await db.$disconnect()
}

seedInventory().catch(e => {
  console.error('Seed error:', e.message)
  db.$disconnect()
  process.exit(1)
})

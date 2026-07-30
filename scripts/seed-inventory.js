const { PrismaClient } = require('@prisma/client')
const db = new PrismaClient()

async function seedInventory() {
  console.log('🌱 Seeding inventory data...')

  // Get existing properties and users
  const properties = await db.property.findMany()
  const users = await db.user.findMany()

  if (properties.length === 0) {
    console.log('❌ No properties found. Run main seed first.')
    return
  }

  const propertyId = properties[0].id
  const userId = users[0]?.id

  // ─── Inventory Categories ──────────────────────────────────
  console.log('Creating inventory categories...')
  const categoryData = [
    { name: 'Kitchen Groceries', slug: 'kitchen-groceries', description: 'Rice, wheat, pulses, flour', icon: 'Wheat' },
    { name: 'Vegetables & Fruits', slug: 'vegetables-fruits', description: 'Fresh vegetables and fruits', icon: 'Apple' },
    { name: 'Dairy Products', slug: 'dairy-products', description: 'Milk, curd, paneer, butter', icon: 'Milk' },
    { name: 'Meat & Eggs', slug: 'meat-eggs', description: 'Chicken, mutton, fish, eggs', icon: 'Egg' },
    { name: 'Cooking Oil & Spices', slug: 'oil-spices', description: 'Cooking oil, masala, salt, turmeric', icon: 'Flame' },
    { name: 'Beverages', slug: 'beverages', description: 'Tea, coffee, juice, water', icon: 'Coffee' },
    { name: 'Cleaning Supplies', slug: 'cleaning-supplies', description: 'Phenyl, floor cleaner, soap', icon: 'Sparkles' },
    { name: 'Gas Cylinders', slug: 'gas-cylinders', description: 'LPG cylinders for cooking', icon: 'Flame' },
    { name: 'Stationery', slug: 'stationery', description: 'Paper, pens, files', icon: 'Pen' },
    { name: 'Medical Supplies', slug: 'medical-supplies', description: 'First aid, medicines', icon: 'Heart' },
  ]

  const categories = []
  for (const cat of categoryData) {
    const existing = await db.inventoryCategory.findFirst({ where: { slug: cat.slug } })
    if (existing) {
      categories.push(existing)
    } else {
      const created = await db.inventoryCategory.create({
        data: { ...cat, propertyId },
      })
      categories.push(created)
    }
  }
  console.log(`  ✅ ${categories.length} categories`)

  // ─── Inventory Items ──────────────────────────────────────
  console.log('Creating inventory items...')
  const itemData = [
    { name: 'Basmati Rice', categoryId: categories[0].id, unit: 'kg', unitPrice: 80, currentStock: 150, minStock: 30, maxStock: 300, gstRate: 5, hsnCode: '1006' },
    { name: 'Toor Dal', categoryId: categories[0].id, unit: 'kg', unitPrice: 120, currentStock: 50, minStock: 15, maxStock: 100, gstRate: 5, hsnCode: '0713' },
    { name: 'Wheat Flour', categoryId: categories[0].id, unit: 'kg', unitPrice: 45, currentStock: 80, minStock: 20, maxStock: 150, gstRate: 5, hsnCode: '1101' },
    { name: 'Sugar', categoryId: categories[0].id, unit: 'kg', unitPrice: 48, currentStock: 40, minStock: 10, maxStock: 80, gstRate: 5, hsnCode: '1701' },
    { name: 'Onions', categoryId: categories[1].id, unit: 'kg', unitPrice: 30, currentStock: 25, minStock: 10, maxStock: 60, gstRate: 0 },
    { name: 'Potatoes', categoryId: categories[1].id, unit: 'kg', unitPrice: 25, currentStock: 30, minStock: 10, maxStock: 60, gstRate: 0 },
    { name: 'Tomatoes', categoryId: categories[1].id, unit: 'kg', unitPrice: 35, currentStock: 15, minStock: 8, maxStock: 40, gstRate: 0 },
    { name: 'Green Vegetables', categoryId: categories[1].id, unit: 'kg', unitPrice: 40, currentStock: 12, minStock: 5, maxStock: 30, gstRate: 0 },
    { name: 'Milk', categoryId: categories[2].id, unit: 'l', unitPrice: 60, currentStock: 30, minStock: 10, maxStock: 50, gstRate: 5 },
    { name: 'Curd', categoryId: categories[2].id, unit: 'kg', unitPrice: 70, currentStock: 10, minStock: 5, maxStock: 25, gstRate: 5 },
    { name: 'Paneer', categoryId: categories[2].id, unit: 'kg', unitPrice: 320, currentStock: 5, minStock: 2, maxStock: 15, gstRate: 12 },
    { name: 'Eggs', categoryId: categories[3].id, unit: 'pcs', unitPrice: 7, currentStock: 200, minStock: 60, maxStock: 500, gstRate: 0 },
    { name: 'Chicken', categoryId: categories[3].id, unit: 'kg', unitPrice: 240, currentStock: 8, minStock: 5, maxStock: 20, gstRate: 0 },
    { name: 'Sunflower Oil', categoryId: categories[4].id, unit: 'l', unitPrice: 150, currentStock: 20, minStock: 5, maxStock: 40, gstRate: 5 },
    { name: 'Mustard Oil', categoryId: categories[4].id, unit: 'l', unitPrice: 180, currentStock: 10, minStock: 3, maxStock: 20, gstRate: 5 },
    { name: 'Turmeric Powder', categoryId: categories[4].id, unit: 'kg', unitPrice: 350, currentStock: 3, minStock: 1, maxStock: 10, gstRate: 5 },
    { name: 'Red Chilli Powder', categoryId: categories[4].id, unit: 'kg', unitPrice: 400, currentStock: 2, minStock: 1, maxStock: 8, gstRate: 5 },
    { name: 'Garam Masala', categoryId: categories[4].id, unit: 'kg', unitPrice: 600, currentStock: 1.5, minStock: 0.5, maxStock: 5, gstRate: 5 },
    { name: 'Salt', categoryId: categories[4].id, unit: 'kg', unitPrice: 20, currentStock: 10, minStock: 3, maxStock: 25, gstRate: 0 },
    { name: 'Tea Powder', categoryId: categories[5].id, unit: 'kg', unitPrice: 500, currentStock: 4, minStock: 1, maxStock: 10, gstRate: 5 },
    { name: 'Coffee Powder', categoryId: categories[5].id, unit: 'kg', unitPrice: 800, currentStock: 2, minStock: 0.5, maxStock: 5, gstRate: 5 },
    { name: 'Phenyl', categoryId: categories[6].id, unit: 'l', unitPrice: 80, currentStock: 8, minStock: 2, maxStock: 20, gstRate: 18 },
    { name: 'Floor Cleaner', categoryId: categories[6].id, unit: 'l', unitPrice: 120, currentStock: 5, minStock: 2, maxStock: 15, gstRate: 18 },
    { name: 'Detergent', categoryId: categories[6].id, unit: 'kg', unitPrice: 90, currentStock: 10, minStock: 3, maxStock: 25, gstRate: 18 },
    { name: 'LPG Cylinder', categoryId: categories[7].id, unit: 'cylinder', unitPrice: 850, currentStock: 4, minStock: 2, maxStock: 10, gstRate: 5 },
    { name: 'A4 Paper Bundle', categoryId: categories[8].id, unit: 'pack', unitPrice: 250, currentStock: 5, minStock: 2, maxStock: 15, gstRate: 18 },
    { name: 'First Aid Kit', categoryId: categories[9].id, unit: 'pcs', unitPrice: 500, currentStock: 3, minStock: 1, maxStock: 10, gstRate: 12 },
  ]

  // Check for low stock items (some below minStock for demo)
  itemData[4].currentStock = 5  // Onions - low stock
  itemData[6].currentStock = 3  // Tomatoes - low stock
  itemData[18].currentStock = 0.5 // Turmeric - low stock

  const items = []
  for (const item of itemData) {
    const existing = await db.inventoryItem.findFirst({ where: { name: item.name, propertyId } })
    if (existing) {
      items.push(existing)
    } else {
      const created = await db.inventoryItem.create({
        data: {
          ...item,
          propertyId,
          openingStock: item.currentStock,
          reorderLevel: item.minStock,
          storeLocation: item.categoryId === categories[7].id ? 'Gas Store' : 'Main Store',
          isActive: true,
        },
      })
      items.push(created)
    }
  }
  console.log(`  ✅ ${items.length} inventory items`)

  // ─── Vendors ──────────────────────────────────────────────
  console.log('Creating vendors...')
  const vendorData = [
    { name: 'Sri Lakshmi Groceries', contactPerson: 'Ramesh Kumar', phone: '9876543210', email: 'ramesh@srilakshmi.com', address: '15 Market Road', city: 'Hyderabad', state: 'Telangana', gstNumber: '36AABCS1234F1Z5', rating: 4, paymentTerms: 'Net 30' },
    { name: 'Fresh Farm Suppliers', contactPerson: 'Anitha Reddy', phone: '9876543211', email: 'anitha@freshfarm.com', address: '22 Vegetable Market', city: 'Hyderabad', state: 'Telangana', gstNumber: '36AABCF5678G2Z3', rating: 5, paymentTerms: 'COD' },
    { name: 'Dairy Pure India', contactPerson: 'Venkat Rao', phone: '9876543212', email: 'venkat@dairypure.com', address: '8 Dairy Lane', city: 'Hyderabad', state: 'Telangana', gstNumber: '36AABCD9012H3Z1', rating: 4, paymentTerms: 'Net 15' },
    { name: 'HP Gas Agency', contactPerson: 'Suresh Babu', phone: '9876543213', email: 'hpgas@agency.com', address: '45 Station Road', city: 'Hyderabad', state: 'Telangana', gstNumber: '36AABCH3456I4Z9', rating: 3, paymentTerms: 'Advance' },
    { name: 'Clean Pro Supplies', contactPerson: 'Meena Devi', phone: '9876543214', email: 'meena@cleanpro.com', address: '12 Industrial Area', city: 'Hyderabad', state: 'Telangana', gstNumber: '36AABCC7890J5Z7', rating: 4, paymentTerms: 'Net 30' },
  ]

  const vendors = []
  for (const vendor of vendorData) {
    const existing = await db.vendor.findFirst({ where: { name: vendor.name, propertyId } })
    if (existing) {
      vendors.push(existing)
    } else {
      const created = await db.vendor.create({
        data: { ...vendor, propertyId, status: 'active' },
      })
      vendors.push(created)
    }
  }
  console.log(`  ✅ ${vendors.length} vendors`)

  // ─── Purchase Orders ──────────────────────────────────────
  console.log('Creating purchase orders...')
  const poCount = await db.purchaseOrder.count()
  if (poCount === 0 && userId) {
    const rice = items.find(i => i.name === 'Basmati Rice')
    const dal = items.find(i => i.name === 'Toor Dal')
    const oil = items.find(i => i.name === 'Sunflower Oil')

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
          poNumber: 'PO-0001',
          vendorId: vendors[0].id,
          propertyId,
          createdById: userId,
          status: 'approved',
          orderDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          expectedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          totalAmount,
          gstAmount,
          discount: 0,
          netAmount: totalAmount + gstAmount,
          paymentStatus: 'unpaid',
          items: { create: po1Items },
        },
      })

      // Second PO - already received
      const tea = items.find(i => i.name === 'Tea Powder')
      const coffee = items.find(i => i.name === 'Coffee Powder')
      if (tea && coffee) {
        const po2Items = [
          { itemId: tea.id, itemName: 'Tea Powder', quantity: 2, unit: 'kg', unitPrice: 500, gstRate: 5, totalPrice: 1000, receivedQty: 2, status: 'received' },
          { itemId: coffee.id, itemName: 'Coffee Powder', quantity: 1, unit: 'kg', unitPrice: 800, gstRate: 5, totalPrice: 800, receivedQty: 1, status: 'received' },
        ]
        const total2 = po2Items.reduce((s, i) => s + i.totalPrice, 0)
        const gst2 = po2Items.reduce((s, i) => s + (i.totalPrice * i.gstRate / 100), 0)

        await db.purchaseOrder.create({
          data: {
            poNumber: 'PO-0002',
            vendorId: vendors[0].id,
            propertyId,
            createdById: userId,
            status: 'received',
            orderDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
            totalAmount: total2,
            gstAmount: gst2,
            discount: 0,
            netAmount: total2 + gst2,
            paymentStatus: 'paid',
            paymentMode: 'upi',
            items: { create: po2Items },
          },
        })
      }
    }
    console.log(`  ✅ 2 purchase orders`)
  } else {
    console.log(`  ⏭️ Purchase orders already exist (${poCount})`)
  }

  // ─── Recipes ──────────────────────────────────────────────
  console.log('Creating recipes...')
  const recipeCount = await db.recipe.count()
  const recipes = []
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
    const salt = items.find(i => i.name === 'Salt')
    const potatoes = items.find(i => i.name === 'Potatoes')
    const eggs = items.find(i => i.name === 'Eggs')
    const milk = items.find(i => i.name === 'Milk')
    const sugar = items.find(i => i.name === 'Sugar')
    const tea = items.find(i => i.name === 'Tea Powder')
    const flour = items.find(i => i.name === 'Wheat Flour')
    const curd = items.find(i => i.name === 'Curd')

    const recipeData = [
      {
        name: 'Vegetable Biryani', category: 'veg', mealType: 'lunch', baseServings: 100,
        instructions: 'Wash and soak rice. Fry vegetables with spices. Cook rice separately. Layer and steam for 20 minutes.',
        ingredients: [
          { itemId: rice?.id, quantity: 25, unit: 'kg' },
          { itemId: veggies?.id, quantity: 15, unit: 'kg' },
          { itemId: oil?.id, quantity: 4, unit: 'l' },
          { itemId: salt?.id, quantity: 0.5, unit: 'kg' },
          { itemId: garam?.id, quantity: 2, unit: 'kg' },
          { itemId: onions?.id, quantity: 8, unit: 'kg' },
          { itemId: tomatoes?.id, quantity: 5, unit: 'kg' },
          { itemId: turmeric?.id, quantity: 0.3, unit: 'kg' },
        ].filter(i => i.itemId),
      },
      {
        name: 'Dal Tadka', category: 'veg', mealType: 'lunch', baseServings: 100,
        instructions: 'Boil dal with turmeric and salt. Prepare tadka with oil, cumin, garlic, and red chilli. Mix and simmer.',
        ingredients: [
          { itemId: dal?.id, quantity: 10, unit: 'kg' },
          { itemId: oil?.id, quantity: 1.5, unit: 'l' },
          { itemId: turmeric?.id, quantity: 0.2, unit: 'kg' },
          { itemId: salt?.id, quantity: 0.3, unit: 'kg' },
          { itemId: chilli?.id, quantity: 0.3, unit: 'kg' },
          { itemId: tomatoes?.id, quantity: 3, unit: 'kg' },
        ].filter(i => i.itemId),
      },
      {
        name: 'Sambar', category: 'veg', mealType: 'breakfast', baseServings: 100,
        instructions: 'Cook dal with vegetables. Add tamarind paste and sambar powder. Prepare tadka and mix.',
        ingredients: [
          { itemId: dal?.id, quantity: 6, unit: 'kg' },
          { itemId: oil?.id, quantity: 1, unit: 'l' },
          { itemId: turmeric?.id, quantity: 0.1, unit: 'kg' },
          { itemId: salt?.id, quantity: 0.2, unit: 'kg' },
          { itemId: potatoes?.id, quantity: 5, unit: 'kg' },
          { itemId: tomatoes?.id, quantity: 4, unit: 'kg' },
          { itemId: onions?.id, quantity: 3, unit: 'kg' },
        ].filter(i => i.itemId),
      },
      {
        name: 'Idli', category: 'veg', mealType: 'breakfast', baseServings: 100,
        instructions: 'Soak rice and urad dal overnight. Grind to batter. Ferment for 8 hours. Steam in idli molds.',
        ingredients: [
          { itemId: rice?.id, quantity: 8, unit: 'kg' },
          { itemId: salt?.id, quantity: 0.15, unit: 'kg' },
        ].filter(i => i.itemId),
      },
      {
        name: 'Chapati', category: 'veg', mealType: 'dinner', baseServings: 100,
        instructions: 'Knead wheat flour with water and salt. Roll into thin circles. Cook on hot tawa.',
        ingredients: [
          { itemId: flour?.id, quantity: 15, unit: 'kg' },
          { itemId: oil?.id, quantity: 2, unit: 'l' },
          { itemId: salt?.id, quantity: 0.2, unit: 'kg' },
        ].filter(i => i.itemId),
      },
      {
        name: 'Egg Curry', category: 'non_veg', mealType: 'dinner', baseServings: 100,
        instructions: 'Boil eggs. Prepare onion-tomato gravy with spices. Add boiled eggs and simmer.',
        ingredients: [
          { itemId: eggs?.id, quantity: 150, unit: 'pcs' },
          { itemId: onions?.id, quantity: 5, unit: 'kg' },
          { itemId: tomatoes?.id, quantity: 4, unit: 'kg' },
          { itemId: oil?.id, quantity: 2, unit: 'l' },
          { itemId: garam?.id, quantity: 0.5, unit: 'kg' },
          { itemId: turmeric?.id, quantity: 0.2, unit: 'kg' },
          { itemId: salt?.id, quantity: 0.3, unit: 'kg' },
        ].filter(i => i.itemId),
      },
      {
        name: 'Tea', category: 'veg', mealType: 'breakfast', baseServings: 100,
        instructions: 'Boil water with tea powder. Add milk and sugar. Strain and serve hot.',
        ingredients: [
          { itemId: tea?.id, quantity: 0.5, unit: 'kg' },
          { itemId: milk?.id, quantity: 10, unit: 'l' },
          { itemId: sugar?.id, quantity: 3, unit: 'kg' },
        ].filter(i => i.itemId),
      },
      {
        name: 'Curd Rice', category: 'veg', mealType: 'lunch', baseServings: 100,
        instructions: 'Cook rice and let it cool. Mix with curd, salt, and tempering of mustard seeds.',
        ingredients: [
          { itemId: rice?.id, quantity: 10, unit: 'kg' },
          { itemId: curd?.id, quantity: 8, unit: 'kg' },
          { itemId: salt?.id, quantity: 0.2, unit: 'kg' },
        ].filter(i => i.itemId),
      },
    ]

    for (const recipe of recipeData) {
      const created = await db.recipe.create({
        data: {
          name: recipe.name,
          category: recipe.category,
          mealType: recipe.mealType,
          baseServings: recipe.baseServings,
          instructions: recipe.instructions,
          propertyId,
          isActive: true,
          ingredients: {
            create: recipe.ingredients.map(ing => ({
              itemId: ing.itemId,
              quantity: ing.quantity,
              unit: ing.unit,
            })),
          },
        },
      })
      recipes.push(created)
    }
    console.log(`  ✅ ${recipes.length} recipes`)
  } else {
    console.log(`  ⏭️ Recipes already exist (${recipeCount})`)
  }

  // ─── Menu Plans ──────────────────────────────────────────
  console.log('Creating menu plans...')
  const menuCount = await db.menuPlan.count()
  if (menuCount === 0 && recipes.length > 0) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const mealTypes = ['breakfast', 'lunch', 'dinner']
    const recipeByMeal = {
      breakfast: recipes.filter(r => r.mealType === 'breakfast'),
      lunch: recipes.filter(r => r.mealType === 'lunch'),
      dinner: recipes.filter(r => r.mealType === 'dinner'),
    }

    for (let d = 0; d < 3; d++) {
      const date = new Date(today)
      date.setDate(date.getDate() + d)

      for (const meal of mealTypes) {
        const mealRecipes = recipeByMeal[meal]
        if (mealRecipes.length > 0) {
          await db.menuPlan.create({
            data: {
              date,
              mealType: meal,
              propertyId,
              headCount: 80 + Math.floor(Math.random() * 20),
              status: d === 0 ? 'planned' : 'planned',
              items: {
                create: mealRecipes.slice(0, 2).map(r => ({
                  recipeId: r.id,
                  dishName: r.name,
                  servings: 1,
                })),
              },
            },
          })
        }
      }
    }
    console.log(`  ✅ Menu plans for 3 days`)
  } else {
    console.log(`  ⏭️ Menu plans already exist (${menuCount})`)
  }

  // ─── Kitchen Issues ──────────────────────────────────────
  console.log('Creating kitchen issues...')
  const issueCount = await db.kitchenIssue.count()
  if (issueCount === 0 && userId) {
    const rice = items.find(i => i.name === 'Basmati Rice')
    const dal = items.find(i => i.name === 'Toor Dal')
    const oil = items.find(i => i.name === 'Sunflower Oil')
    const veggies = items.find(i => i.name === 'Green Vegetables')

    const issueItems = [
      { itemId: rice?.id, quantity: 10, unit: 'kg', purpose: 'lunch' },
      { itemId: dal?.id, quantity: 5, unit: 'kg', purpose: 'lunch' },
      { itemId: oil?.id, quantity: 2, unit: 'l', purpose: 'lunch' },
      { itemId: veggies?.id, quantity: 8, unit: 'kg', purpose: 'lunch' },
      { itemId: rice?.id, quantity: 8, unit: 'kg', purpose: 'dinner' },
      { itemId: oil?.id, quantity: 1.5, unit: 'l', purpose: 'dinner' },
    ].filter(i => i.itemId)

    for (let i = 0; i < issueItems.length; i++) {
      await db.kitchenIssue.create({
        data: {
          issueNumber: `KI-${String(i + 1).padStart(4, '0')}`,
          itemId: issueItems[i].itemId,
          propertyId,
          quantity: issueItems[i].quantity,
          unit: issueItems[i].unit,
          issuedTo: 'Kitchen',
          purpose: issueItems[i].purpose,
          issuedById: userId,
          menuDate: new Date(),
        },
      })
    }
    console.log(`  ✅ ${issueItems.length} kitchen issues`)
  }

  // ─── Assets ──────────────────────────────────────────────
  console.log('Creating assets...')
  const assetCount = await db.asset.count()
  if (assetCount === 0) {
    const rooms = await db.room.findMany({ where: { propertyId }, take: 10 })
    const assetData = [
      { name: 'Single Bed', category: 'furniture', subCategory: 'bed', purchasePrice: 5000, currentValue: 3500, condition: 'good' },
      { name: 'Double Bed', category: 'furniture', subCategory: 'bed', purchasePrice: 8000, currentValue: 5500, condition: 'good' },
      { name: 'Mattress - Single', category: 'furniture', subCategory: 'mattress', purchasePrice: 3000, currentValue: 1800, condition: 'fair' },
      { name: 'Study Chair', category: 'furniture', subCategory: 'chair', purchasePrice: 2500, currentValue: 1500, condition: 'good' },
      { name: 'Study Table', category: 'furniture', subCategory: 'table', purchasePrice: 4000, currentValue: 2500, condition: 'good' },
      { name: 'Ceiling Fan', category: 'electrical', subCategory: 'fan', purchasePrice: 1800, currentValue: 1000, condition: 'good' },
      { name: 'Window AC 1.5 Ton', category: 'electronics', subCategory: 'ac', purchasePrice: 35000, currentValue: 22000, condition: 'excellent' },
      { name: '32" LED TV', category: 'electronics', subCategory: 'tv', purchasePrice: 15000, currentValue: 8000, condition: 'good' },
      { name: 'Water Cooler', category: 'appliance', subCategory: 'water_cooler', purchasePrice: 12000, currentValue: 7000, condition: 'good' },
      { name: 'Washing Machine', category: 'appliance', subCategory: 'washing_machine', purchasePrice: 18000, currentValue: 10000, condition: 'fair' },
      { name: 'Refrigerator 300L', category: 'appliance', subCategory: 'refrigerator', purchasePrice: 25000, currentValue: 15000, condition: 'good' },
      { name: 'Gas Stove 4-Burner', category: 'kitchen_equipment', subCategory: 'gas_stove', purchasePrice: 5000, currentValue: 3000, condition: 'good' },
      { name: 'Almirah', category: 'furniture', subCategory: 'other', purchasePrice: 8000, currentValue: 5000, condition: 'good' },
      { name: 'Broken Chair', category: 'furniture', subCategory: 'chair', purchasePrice: 2500, currentValue: 0, condition: 'broken', status: 'under_maintenance' },
    ]

    for (let i = 0; i < assetData.length; i++) {
      const a = assetData[i]
      await db.asset.create({
        data: {
          name: a.name,
          assetTag: `AST-${String(i + 1).padStart(4, '0')}`,
          category: a.category,
          subCategory: a.subCategory,
          propertyId,
          roomId: rooms[i % rooms.length]?.id || null,
          purchaseDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
          purchasePrice: a.purchasePrice,
          currentValue: a.currentValue,
          depreciationRate: 10,
          status: a.status || 'active',
          condition: a.condition,
          vendor: i % 2 === 0 ? 'Furniture World' : 'Electronics Hub',
          warrantyExpiry: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        },
      })
    }
    console.log(`  ✅ ${assetData.length} assets`)
  } else {
    console.log(`  ⏭️ Assets already exist (${assetCount})`)
  }

  // ─── Laundry Items ───────────────────────────────────────
  console.log('Creating laundry items...')
  const laundryCount = await db.laundryItem.count()
  if (laundryCount === 0) {
    const rooms = await db.room.findMany({ where: { propertyId }, take: 10 })
    const laundryData = [
      { name: 'Bedsheet - Single', category: 'bedding', totalQuantity: 60, issuedQuantity: 45, inLaundry: 10, damagedQuantity: 3 },
      { name: 'Bedsheet - Double', category: 'bedding', totalQuantity: 30, issuedQuantity: 25, inLaundry: 5, damagedQuantity: 1 },
      { name: 'Blanket', category: 'bedding', totalQuantity: 50, issuedQuantity: 40, inLaundry: 5, damagedQuantity: 2 },
      { name: 'Pillow', category: 'bedding', totalQuantity: 80, issuedQuantity: 65, inLaundry: 0, damagedQuantity: 5 },
      { name: 'Towel', category: 'bathroom', totalQuantity: 100, issuedQuantity: 80, inLaundry: 15, damagedQuantity: 4 },
      { name: 'Curtain', category: 'curtain', totalQuantity: 40, issuedQuantity: 35, inLaundry: 3, damagedQuantity: 1 },
    ]

    for (let i = 0; i < laundryData.length; i++) {
      await db.laundryItem.create({
        data: {
          ...laundryData[i],
          propertyId,
          roomId: rooms[i % rooms.length]?.id || null,
          condition: laundryData[i].damagedQuantity > 3 ? 'fair' : 'good',
          status: 'in_use',
          lastWashDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          nextWashDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        },
      })
    }
    console.log(`  ✅ ${laundryData.length} laundry items`)
  } else {
    console.log(`  ⏭️ Laundry items already exist (${laundryCount})`)
  }

  // ─── Housekeeping Items ──────────────────────────────────
  console.log('Creating housekeeping items...')
  const hkCount = await db.housekeepingItem.count()
  if (hkCount === 0) {
    const hkData = [
      { name: 'Phenyl', category: 'cleaning', unit: 'l', currentStock: 15, minStock: 5, unitPrice: 80 },
      { name: 'Floor Cleaner', category: 'cleaning', unit: 'l', currentStock: 10, minStock: 3, unitPrice: 120 },
      { name: 'Toilet Cleaner', category: 'cleaning', unit: 'l', currentStock: 8, minStock: 2, unitPrice: 150 },
      { name: 'Hand Soap', category: 'hygiene', unit: 'pcs', currentStock: 20, minStock: 5, unitPrice: 45 },
      { name: 'Detergent Powder', category: 'cleaning', unit: 'kg', currentStock: 12, minStock: 3, unitPrice: 90 },
      { name: 'Mop', category: 'tool', unit: 'pcs', currentStock: 5, minStock: 2, unitPrice: 250 },
      { name: 'Bucket', category: 'tool', unit: 'pcs', currentStock: 8, minStock: 3, unitPrice: 180 },
      { name: 'Tissue Roll', category: 'hygiene', unit: 'roll', currentStock: 2, minStock: 10, unitPrice: 35 },
      { name: 'Garbage Bag', category: 'cleaning', unit: 'pack', currentStock: 15, minStock: 5, unitPrice: 120 },
      { name: 'Broom', category: 'tool', unit: 'pcs', currentStock: 4, minStock: 2, unitPrice: 150 },
    ]

    for (const item of hkData) {
      await db.housekeepingItem.create({
        data: {
          ...item,
          propertyId,
          isActive: true,
          lastRestocked: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        },
      })
    }
    console.log(`  ✅ ${hkData.length} housekeeping items`)
  } else {
    console.log(`  ⏭️ Housekeeping items already exist (${hkCount})`)
  }

  // ─── Waste Records ───────────────────────────────────────
  console.log('Creating waste records...')
  const wasteCount = await db.wasteRecord.count()
  if (wasteCount === 0 && userId) {
    const wasteData = [
      { category: 'food_waste', description: 'Leftover rice from lunch', quantity: 5, unit: 'kg', estimatedCost: 400, disposalMethod: 'compost' },
      { category: 'food_waste', description: 'Spoiled vegetable curry', quantity: 3, unit: 'kg', estimatedCost: 300, disposalMethod: 'trash' },
      { category: 'expired', description: 'Expired milk packets', quantity: 2, unit: 'l', estimatedCost: 120, disposalMethod: 'trash' },
      { category: 'damaged', description: 'Broken glass jars', quantity: 4, unit: 'pcs', estimatedCost: 200, disposalMethod: 'recycling' },
      { category: 'spoilage', description: 'Rotten onions', quantity: 2, unit: 'kg', estimatedCost: 60, disposalMethod: 'compost' },
    ]

    for (const w of wasteData) {
      await db.wasteRecord.create({
        data: {
          date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          category: w.category,
          propertyId,
          description: w.description,
          quantity: w.quantity,
          unit: w.unit,
          estimatedCost: w.estimatedCost,
          disposalMethod: w.disposalMethod,
          recordedById: userId,
        },
      })
    }
    console.log(`  ✅ ${wasteData.length} waste records`)
  }

  // ─── Consumption Logs ────────────────────────────────────
  console.log('Creating consumption logs...')
  const conCount = await db.consumptionLog.count()
  if (conCount === 0) {
    const rice = items.find(i => i.name === 'Basmati Rice')
    const dal = items.find(i => i.name === 'Toor Dal')
    const oil = items.find(i => i.name === 'Sunflower Oil')
    const veggies = items.find(i => i.name === 'Green Vegetables')

    const logData = [
      { itemId: rice?.id, mealType: 'lunch', issuedQty: 10, consumedQty: 9, returnedQty: 0.5, wastageQty: 0.5, unit: 'kg', costPerUnit: 80 },
      { itemId: dal?.id, mealType: 'lunch', issuedQty: 5, consumedQty: 4.5, returnedQty: 0, wastageQty: 0.5, unit: 'kg', costPerUnit: 120 },
      { itemId: oil?.id, mealType: 'lunch', issuedQty: 2, consumedQty: 1.8, returnedQty: 0, wastageQty: 0.2, unit: 'l', costPerUnit: 150 },
      { itemId: rice?.id, mealType: 'dinner', issuedQty: 8, consumedQty: 7.5, returnedQty: 0, wastageQty: 0.5, unit: 'kg', costPerUnit: 80 },
      { itemId: veggies?.id, mealType: 'dinner', issuedQty: 6, consumedQty: 5.5, returnedQty: 0, wastageQty: 0.5, unit: 'kg', costPerUnit: 40 },
    ].filter(l => l.itemId)

    for (const log of logData) {
      await db.consumptionLog.create({
        data: {
          date: new Date(Date.now() - 24 * 60 * 60 * 1000),
          itemId: log.itemId,
          propertyId,
          mealType: log.mealType,
          issuedQty: log.issuedQty,
          consumedQty: log.consumedQty,
          returnedQty: log.returnedQty,
          wastageQty: log.wastageQty,
          unit: log.unit,
          costPerUnit: log.costPerUnit,
          totalCost: (log.consumedQty + log.wastageQty) * log.costPerUnit,
        },
      })
    }
    console.log(`  ✅ ${logData.length} consumption logs`)
  }

  console.log('\n✅ Inventory seeding complete!')
}

seedInventory()
  .catch((e) => {
    console.error('Seeding error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })

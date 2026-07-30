import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/kitchen - Kitchen issues, menu plans, recipes
export async function GET(req: NextRequest) {
  try {
    const propertyId = req.nextUrl.searchParams.get('propertyId')
    const type = req.nextUrl.searchParams.get('type') || 'all'
    const where: any = {}
    if (propertyId) where.propertyId = propertyId

    const result: any = {}

    if (type === 'all' || type === 'issues') {
      result.issues = await db.kitchenIssue.findMany({
        where: propertyId ? { propertyId } : {},
        include: {
          item: { select: { name: true, unit: true } },
          property: { select: { name: true } },
          issuedBy: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      })
    }

    if (type === 'all' || type === 'menus') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      result.menus = await db.menuPlan.findMany({
        where: propertyId ? { propertyId, date: { gte: today } } : { date: { gte: today } },
        include: {
          property: { select: { name: true } },
          items: { include: { recipe: { include: { ingredients: { include: { item: true } } } } } },
        },
        orderBy: [{ date: 'asc' }, { mealType: 'asc' }],
        take: 20,
      })
    }

    if (type === 'all' || type === 'recipes') {
      result.recipes = await db.recipe.findMany({
        where: propertyId ? { propertyId, isActive: true } : { isActive: true },
        include: {
          ingredients: { include: { item: { select: { name: true, unit: true, currentStock: true } } } },
          property: { select: { name: true } },
        },
        orderBy: { name: 'asc' },
      })
    }

    // Stats
    if (type === 'all') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const todayIssues = await db.kitchenIssue.findMany({
        where: { propertyId: propertyId || undefined, createdAt: { gte: today, lt: tomorrow } },
      })

      result.stats = {
        todayIssues: todayIssues.length,
        todayItemsIssued: todayIssues.reduce((s, i) => s + i.quantity, 0),
        activeRecipes: result.recipes?.length || 0,
        plannedMenus: result.menus?.length || 0,
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Kitchen GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch kitchen data' }, { status: 500 })
  }
}

// POST /api/kitchen
export async function POST(req: NextRequest) {
  try {
    const data = await req.json()

    if (data.type === 'issue') {
      // Issue items to kitchen - deduct stock
      const item = await db.inventoryItem.findUnique({ where: { id: data.itemId } })
      if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 })
      if (item.currentStock < data.quantity) {
        return NextResponse.json({ error: 'Insufficient stock' }, { status: 400 })
      }

      const issueCount = await db.kitchenIssue.count()
      const previousStock = item.currentStock
      const newStock = previousStock - data.quantity

      const [issue] = await Promise.all([
        db.kitchenIssue.create({
          data: {
            issueNumber: `KI-${String(issueCount + 1).padStart(4, '0')}`,
            itemId: data.itemId,
            propertyId: data.propertyId,
            quantity: data.quantity,
            unit: item.unit,
            issuedTo: data.issuedTo || 'Kitchen',
            purpose: data.purpose,
            menuPlanId: data.menuPlanId,
            menuDate: data.menuDate ? new Date(data.menuDate) : null,
            issuedById: data.userId,
            notes: data.notes,
          },
        }),
        db.inventoryItem.update({
          where: { id: data.itemId },
          data: { currentStock: newStock },
        }),
        db.stockTransaction.create({
          data: {
            itemId: data.itemId,
            propertyId: data.propertyId,
            type: 'issue',
            quantity: -data.quantity,
            previousStock,
            newStock,
            unitPrice: item.unitPrice,
            reference: `KI-${String(issueCount + 1).padStart(4, '0')}`,
            performedById: data.userId,
            notes: `Kitchen issue - ${data.purpose || 'general'}`,
          },
        }),
      ])

      return NextResponse.json(issue)
    }

    if (data.type === 'recipe') {
      const recipe = await db.recipe.create({
        data: {
          name: data.name,
          category: data.category || 'veg',
          mealType: data.mealType || 'lunch',
          baseServings: data.baseServings || 100,
          instructions: data.instructions,
          propertyId: data.propertyId,
          isActive: true,
          ingredients: {
            create: (data.ingredients || []).map((ing: any) => ({
              itemId: ing.itemId,
              quantity: ing.quantity,
              unit: ing.unit,
              notes: ing.notes,
            })),
          },
        },
        include: { ingredients: { include: { item: true } } },
      })
      return NextResponse.json(recipe)
    }

    if (data.type === 'menu') {
      const menu = await db.menuPlan.create({
        data: {
          date: new Date(data.date),
          mealType: data.mealType,
          propertyId: data.propertyId,
          headCount: data.headCount || 0,
          status: 'planned',
          notes: data.notes,
          items: {
            create: (data.items || []).map((item: any) => ({
              recipeId: item.recipeId || null,
              dishName: item.dishName,
              servings: item.servings || 1,
              notes: item.notes,
            })),
          },
        },
        include: { items: { include: { recipe: true } } },
      })
      return NextResponse.json(menu)
    }

    if (data.type === 'serve_menu') {
      // When a menu is served, deduct recipe ingredients from stock
      const menuPlan = await db.menuPlan.findUnique({
        where: { id: data.menuPlanId },
        include: { items: { include: { recipe: { include: { ingredients: true } } } } },
      })
      if (!menuPlan) return NextResponse.json({ error: 'Menu not found' }, { status: 404 })

      const scaleFactor = data.headCount ? data.headCount / 100 : 1 // default base servings
      const deductions: any[] = []

      for (const menuItem of menuPlan.items) {
        if (menuItem.recipe) {
          for (const ing of menuItem.recipe.ingredients) {
            const qty = ing.quantity * scaleFactor * (menuItem.servings || 1)
            const invItem = await db.inventoryItem.findUnique({ where: { id: ing.itemId } })
            if (invItem) {
              const prevStock = invItem.currentStock
              const newStock = Math.max(0, prevStock - qty)
              await Promise.all([
                db.inventoryItem.update({ where: { id: ing.itemId }, data: { currentStock: newStock } }),
                db.stockTransaction.create({
                  data: {
                    itemId: ing.itemId,
                    propertyId: invItem.propertyId,
                    type: 'issue',
                    quantity: -qty,
                    previousStock: prevStock,
                    newStock,
                    unitPrice: invItem.unitPrice,
                    reference: `Menu: ${menuPlan.mealType}`,
                    notes: `Auto-deduction for menu: ${menuItem.dishName}`,
                    performedById: data.userId,
                  },
                }),
              ])
              deductions.push({ item: invItem.name, qty, unit: ing.unit })
            }
          }
        }
      }

      // Update menu status
      await db.menuPlan.update({
        where: { id: data.menuPlanId },
        data: { status: 'served', headCount: data.headCount || menuPlan.headCount },
      })

      return NextResponse.json({ success: true, deductions })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('Kitchen POST error:', error)
    return NextResponse.json({ error: 'Failed to process kitchen request' }, { status: 500 })
  }
}

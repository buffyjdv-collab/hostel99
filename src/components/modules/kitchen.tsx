'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useAppStore, hasPermission } from '@/lib/store'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  ChefHat,
  UtensilsCrossed,
  ClipboardList,
  CalendarDays,
  Plus,
  Search,
  MoreVertical,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  Package,
  BookOpen,
  Leaf,
  Drumstick,
  Apple,
  Soup,
  Eye,
  Play,
  Utensils,
  X,
  Minus,
  Pencil,
  Trash2,
} from 'lucide-react'
import { format, parseISO, addDays, isToday, isTomorrow, isSameDay } from 'date-fns'
import { useToast } from '@/hooks/use-toast'

// ── Types ────────────────────────────────────────────────────────────────────

interface InventoryItem {
  id: string
  name: string
  unit: string
  currentStock: number
  category?: { id: string; name: string; slug: string }
}

interface KitchenIssue {
  id: string
  issueNumber: string
  itemId: string
  item: { name: string; unit: string }
  quantity: number
  unit: string
  issuedTo: string
  purpose: string | null
  menuDate: string | null
  issuedBy: { name: string }
  notes?: string | null
  createdAt: string
}

interface RecipeIngredient {
  id: string
  item: { name: string; unit: string; currentStock: number }
  quantity: number
  unit: string
}

interface Recipe {
  id: string
  name: string
  category: string
  mealType: string
  baseServings: number
  instructions: string | null
  ingredients: RecipeIngredient[]
}

interface MenuPlanItem {
  id: string
  dishName: string
  servings: number
  recipeId: string | null
  recipe: {
    name: string
    ingredients: RecipeIngredient[]
  } | null
  notes?: string | null
}

interface MenuPlan {
  id: string
  date: string
  mealType: string
  headCount: number
  status: string
  notes?: string | null
  items: MenuPlanItem[]
}

interface KitchenStats {
  todayIssues: number
  todayItemsIssued: number
  activeRecipes: number
  plannedMenus: number
}

interface KitchenData {
  issues: KitchenIssue[]
  menus: MenuPlan[]
  recipes: Recipe[]
  stats: KitchenStats
}

// ── Purpose Badge ────────────────────────────────────────────────────────────

function PurposeBadge({ purpose }: { purpose: string | null }) {
  const config: Record<string, { label: string; className: string }> = {
    breakfast: { label: 'Breakfast', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
    lunch: { label: 'Lunch', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
    dinner: { label: 'Dinner', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
    snacks: { label: 'Snacks', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' },
    special: { label: 'Special', className: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300' },
  }
  const c = config[purpose || ''] || { label: purpose || 'General', className: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300' }
  return <Badge variant="secondary" className={c.className}>{c.label}</Badge>
}

// ── Category Badge ───────────────────────────────────────────────────────────

function CategoryBadge({ category }: { category: string }) {
  const config: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
    veg: { label: 'Veg', icon: <Leaf className="h-3 w-3" />, className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
    non_veg: { label: 'Non-Veg', icon: <Drumstick className="h-3 w-3" />, className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
    vegan: { label: 'Vegan', icon: <Apple className="h-3 w-3" />, className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' },
  }
  const c = config[category] || { label: category, icon: null, className: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300' }
  return <Badge variant="secondary" className={`gap-1 ${c.className}`}>{c.icon}{c.label}</Badge>
}

// ── Menu Status Badge ────────────────────────────────────────────────────────

function MenuStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    planned: { label: 'Planned', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
    preparing: { label: 'Preparing', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
    served: { label: 'Served', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
    completed: { label: 'Completed', className: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300' },
  }
  const c = config[status] || { label: status, className: 'bg-slate-100 text-slate-800' }
  return <Badge variant="secondary" className={c.className}>{c.label}</Badge>
}

// ── Meal Type Icon ───────────────────────────────────────────────────────────

function MealTypeIcon({ mealType, className }: { mealType: string; className?: string }) {
  switch (mealType) {
    case 'breakfast': return <Soup className={className || 'h-4 w-4'} />
    case 'lunch': return <Utensils className={className || 'h-4 w-4'} />
    case 'dinner': return <UtensilsCrossed className={className || 'h-4 w-4'} />
    case 'snacks': return <Apple className={className || 'h-4 w-4'} />
    default: return <Utensils className={className || 'h-4 w-4'} />
  }
}

// ── Main Component ───────────────────────────────────────────────────────────

export function KitchenPage() {
  const { selectedPropertyId, currentHostelId, currentUser } = useAppStore()
  const { toast } = useToast()

  const role = currentUser?.role || ''
  const canCreate = hasPermission(role, 'kitchen:create')
  const canUpdate = hasPermission(role, 'kitchen:update')
  const canDelete = hasPermission(role, 'kitchen:delete')

  // Data state
  const [data, setData] = useState<KitchenData | null>(null)
  const [loading, setLoading] = useState(true)
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [activeTab, setActiveTab] = useState('issues')

  // Dialog states
  const [issueDialogOpen, setIssueDialogOpen] = useState(false)
  const [recipeDialogOpen, setRecipeDialogOpen] = useState(false)
  const [menuDialogOpen, setMenuDialogOpen] = useState(false)
  const [recipeDetailOpen, setRecipeDetailOpen] = useState(false)
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [serveConfirmOpen, setServeConfirmOpen] = useState(false)
  const [servingMenu, setServingMenu] = useState<MenuPlan | null>(null)

  // Edit dialog states
  const [editIssueDialogOpen, setEditIssueDialogOpen] = useState(false)
  const [editRecipeDialogOpen, setEditRecipeDialogOpen] = useState(false)
  const [editMenuDialogOpen, setEditMenuDialogOpen] = useState(false)
  const [editingIssue, setEditingIssue] = useState<KitchenIssue | null>(null)
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null)
  const [editingMenu, setEditingMenu] = useState<MenuPlan | null>(null)

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'issue' | 'recipe' | 'menu'; id: string; name: string } | null>(null)

  // Form states
  const [issueForm, setIssueForm] = useState({
    itemId: '',
    quantity: '',
    purpose: '',
    issuedTo: '',
    notes: '',
  })
  const [recipeForm, setRecipeForm] = useState({
    name: '',
    category: 'veg',
    mealType: 'lunch',
    baseServings: '100',
    instructions: '',
    ingredients: [] as { itemId: string; quantity: string; unit: string }[],
  })
  const [menuForm, setMenuForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    mealType: 'lunch',
    headCount: '100',
    notes: '',
    items: [] as { recipeId: string; dishName: string; servings: string }[],
  })

  // Edit form states
  const [editIssueForm, setEditIssueForm] = useState({
    quantity: '',
    issuedTo: '',
    purpose: '',
    notes: '',
  })
  const [editRecipeForm, setEditRecipeForm] = useState({
    name: '',
    category: 'veg',
    mealType: 'lunch',
    baseServings: '100',
    instructions: '',
    ingredients: [] as { itemId: string; quantity: string; unit: string }[],
  })
  const [editMenuForm, setEditMenuForm] = useState({
    date: '',
    mealType: 'lunch',
    headCount: '100',
    notes: '',
    items: [] as { recipeId: string; dishName: string; servings: string }[],
  })

  // Search & filter
  const [issueSearch, setIssueSearch] = useState('')
  const [recipeSearch, setRecipeSearch] = useState('')
  const [menuSearch, setMenuSearch] = useState('')

  // Submitting
  const [submitting, setSubmitting] = useState(false)

  // ── Fetch data ─────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedPropertyId || currentHostelId) params.set('propertyId', selectedPropertyId || currentHostelId!)
      params.set('type', 'all')

      const res = await fetch(`/api/kitchen?${params.toString()}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch (error) {
      console.error('Failed to fetch kitchen data:', error)
      toast({ title: 'Error', description: 'Failed to load kitchen data', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [selectedPropertyId, currentHostelId, toast])

  const fetchInventory = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (selectedPropertyId || currentHostelId) params.set('propertyId', selectedPropertyId || currentHostelId!)
      const res = await fetch(`/api/inventory?${params.toString()}`)
      if (res.ok) {
        const json = await res.json()
        setInventoryItems(json.items || [])
      }
    } catch (error) {
      console.error('Failed to fetch inventory:', error)
    }
  }, [selectedPropertyId, currentHostelId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    fetchInventory()
  }, [fetchInventory])

  // ── Issue to Kitchen ───────────────────────────────────────────────────────

  const handleIssueToKitchen = async () => {
    if (!issueForm.itemId || !issueForm.quantity) {
      toast({ title: 'Validation Error', description: 'Please select an item and enter quantity', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/kitchen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'issue',
          itemId: issueForm.itemId,
          quantity: parseFloat(issueForm.quantity),
          purpose: issueForm.purpose || null,
          issuedTo: issueForm.issuedTo || 'Kitchen',
          notes: issueForm.notes || null,
          propertyId: selectedPropertyId,
          userId: currentUser?.id,
        }),
      })
      if (res.ok) {
        toast({ title: 'Success', description: 'Item issued to kitchen successfully' })
        setIssueDialogOpen(false)
        setIssueForm({ itemId: '', quantity: '', purpose: '', issuedTo: '', notes: '' })
        fetchData()
        fetchInventory()
      } else {
        const err = await res.json()
        toast({ title: 'Error', description: err.error || 'Failed to issue item', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to issue item', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  // ── Add Recipe ─────────────────────────────────────────────────────────────

  const handleAddRecipe = async () => {
    if (!recipeForm.name || recipeForm.ingredients.length === 0) {
      toast({ title: 'Validation Error', description: 'Please enter recipe name and add at least one ingredient', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/kitchen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'recipe',
          name: recipeForm.name,
          category: recipeForm.category,
          mealType: recipeForm.mealType,
          baseServings: parseInt(recipeForm.baseServings) || 100,
          instructions: recipeForm.instructions || null,
          propertyId: selectedPropertyId,
          ingredients: recipeForm.ingredients.map(ing => ({
            itemId: ing.itemId,
            quantity: parseFloat(ing.quantity),
            unit: ing.unit,
          })),
        }),
      })
      if (res.ok) {
        toast({ title: 'Success', description: 'Recipe created successfully' })
        setRecipeDialogOpen(false)
        setRecipeForm({ name: '', category: 'veg', mealType: 'lunch', baseServings: '100', instructions: '', ingredients: [] })
        fetchData()
      } else {
        const err = await res.json()
        toast({ title: 'Error', description: err.error || 'Failed to create recipe', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create recipe', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  // ── Create Menu Plan ───────────────────────────────────────────────────────

  const handleCreateMenu = async () => {
    if (!menuForm.date || menuForm.items.length === 0) {
      toast({ title: 'Validation Error', description: 'Please select a date and add at least one dish', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/kitchen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'menu',
          date: menuForm.date,
          mealType: menuForm.mealType,
          headCount: parseInt(menuForm.headCount) || 0,
          notes: menuForm.notes || null,
          propertyId: selectedPropertyId,
          items: menuForm.items.map(item => ({
            recipeId: item.recipeId || null,
            dishName: item.dishName,
            servings: parseInt(item.servings) || 1,
          })),
        }),
      })
      if (res.ok) {
        toast({ title: 'Success', description: 'Menu plan created successfully' })
        setMenuDialogOpen(false)
        setMenuForm({ date: format(new Date(), 'yyyy-MM-dd'), mealType: 'lunch', headCount: '100', notes: '', items: [] })
        fetchData()
      } else {
        const err = await res.json()
        toast({ title: 'Error', description: err.error || 'Failed to create menu plan', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create menu plan', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  // ── Serve Menu ─────────────────────────────────────────────────────────────

  const handleServeMenu = async () => {
    if (!servingMenu) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/kitchen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'serve_menu',
          menuPlanId: servingMenu.id,
          headCount: servingMenu.headCount,
          propertyId: selectedPropertyId,
          userId: currentUser?.id,
        }),
      })
      if (res.ok) {
        const result = await res.json()
        toast({
          title: 'Menu Served',
          description: `Deducted ${result.deductions?.length || 0} ingredient(s) from stock`,
        })
        setServeConfirmOpen(false)
        setServingMenu(null)
        fetchData()
        fetchInventory()
      } else {
        const err = await res.json()
        toast({ title: 'Error', description: err.error || 'Failed to serve menu', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to serve menu', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  // ── Edit Issue ─────────────────────────────────────────────────────────────

  const openEditIssueDialog = (issue: KitchenIssue) => {
    setEditingIssue(issue)
    setEditIssueForm({
      quantity: String(issue.quantity),
      issuedTo: issue.issuedTo,
      purpose: issue.purpose || '',
      notes: issue.notes || '',
    })
    setEditIssueDialogOpen(true)
  }

  const handleEditIssue = async () => {
    if (!editingIssue) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/kitchen', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'issue',
          id: editingIssue.id,
          quantity: parseFloat(editIssueForm.quantity),
          issuedTo: editIssueForm.issuedTo || undefined,
          purpose: editIssueForm.purpose || null,
          notes: editIssueForm.notes || null,
        }),
      })
      if (res.ok) {
        toast({ title: 'Success', description: 'Kitchen issue updated successfully' })
        setEditIssueDialogOpen(false)
        setEditingIssue(null)
        fetchData()
      } else {
        const err = await res.json()
        toast({ title: 'Error', description: err.error || 'Failed to update issue', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update issue', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  // ── Edit Recipe ─────────────────────────────────────────────────────────────

  const openEditRecipeDialog = (recipe: Recipe) => {
    setEditingRecipe(recipe)
    setEditRecipeForm({
      name: recipe.name,
      category: recipe.category,
      mealType: recipe.mealType,
      baseServings: String(recipe.baseServings),
      instructions: recipe.instructions || '',
      ingredients: recipe.ingredients.map(ing => ({
        itemId: ing.item ? (ing as any).itemId || '' : '',
        quantity: String(ing.quantity),
        unit: ing.unit,
      })),
    })
    setEditRecipeDialogOpen(true)
  }

  const handleEditRecipe = async () => {
    if (!editingRecipe) return
    if (!editRecipeForm.name) {
      toast({ title: 'Validation Error', description: 'Recipe name is required', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/kitchen', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'recipe',
          id: editingRecipe.id,
          name: editRecipeForm.name,
          category: editRecipeForm.category,
          mealType: editRecipeForm.mealType,
          baseServings: parseInt(editRecipeForm.baseServings) || 100,
          instructions: editRecipeForm.instructions || null,
          ingredients: editRecipeForm.ingredients.map(ing => ({
            itemId: ing.itemId,
            quantity: parseFloat(ing.quantity),
            unit: ing.unit,
          })),
        }),
      })
      if (res.ok) {
        toast({ title: 'Success', description: 'Recipe updated successfully' })
        setEditRecipeDialogOpen(false)
        setEditingRecipe(null)
        fetchData()
      } else {
        const err = await res.json()
        toast({ title: 'Error', description: err.error || 'Failed to update recipe', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update recipe', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  // ── Edit Menu ───────────────────────────────────────────────────────────────

  const openEditMenuDialog = (menu: MenuPlan) => {
    setEditingMenu(menu)
    setEditMenuForm({
      date: format(parseISO(menu.date), 'yyyy-MM-dd'),
      mealType: menu.mealType,
      headCount: String(menu.headCount),
      notes: menu.notes || '',
      items: menu.items.map(item => ({
        recipeId: item.recipeId || '',
        dishName: item.dishName,
        servings: String(item.servings),
      })),
    })
    setEditMenuDialogOpen(true)
  }

  const handleEditMenu = async () => {
    if (!editingMenu) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/kitchen', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'menu',
          id: editingMenu.id,
          date: editMenuForm.date,
          mealType: editMenuForm.mealType,
          headCount: parseInt(editMenuForm.headCount) || 0,
          notes: editMenuForm.notes || null,
          items: editMenuForm.items.map(item => ({
            recipeId: item.recipeId || null,
            dishName: item.dishName,
            servings: parseInt(item.servings) || 1,
          })),
        }),
      })
      if (res.ok) {
        toast({ title: 'Success', description: 'Menu plan updated successfully' })
        setEditMenuDialogOpen(false)
        setEditingMenu(null)
        fetchData()
      } else {
        const err = await res.json()
        toast({ title: 'Error', description: err.error || 'Failed to update menu plan', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update menu plan', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  // ── Delete ──────────────────────────────────────────────────────────────────

  const openDeleteDialog = (type: 'issue' | 'recipe' | 'menu', id: string, name: string) => {
    setDeleteTarget({ type, id, name })
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/kitchen', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: deleteTarget.type,
          id: deleteTarget.id,
        }),
      })
      if (res.ok) {
        toast({ title: 'Success', description: `${deleteTarget.name} has been deleted` })
        fetchData()
      } else {
        const err = await res.json()
        toast({ title: 'Error', description: err.error || 'Failed to delete item', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete item', variant: 'destructive' })
    } finally {
      setSubmitting(false)
      setDeleteDialogOpen(false)
      setDeleteTarget(null)
    }
  }

  // ── Recipe ingredient helpers ──────────────────────────────────────────────

  const addRecipeIngredient = () => {
    setRecipeForm(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { itemId: '', quantity: '', unit: 'kg' }],
    }))
  }

  const removeRecipeIngredient = (index: number) => {
    setRecipeForm(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }))
  }

  const updateRecipeIngredient = (index: number, field: string, value: string) => {
    setRecipeForm(prev => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, i) => {
        if (i !== index) return ing
        const updated = { ...ing, [field]: value }
        if (field === 'itemId') {
          const item = inventoryItems.find(it => it.id === value)
          if (item) updated.unit = item.unit
        }
        return updated
      }),
    }))
  }

  // ── Menu item helpers ──────────────────────────────────────────────────────

  const addMenuItem = () => {
    setMenuForm(prev => ({
      ...prev,
      items: [...prev.items, { recipeId: '', dishName: '', servings: '1' }],
    }))
  }

  const removeMenuItem = (index: number) => {
    setMenuForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }))
  }

  const updateMenuItem = (index: number, field: string, value: string) => {
    setMenuForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i !== index) return item
        const updated = { ...item, [field]: value }
        if (field === 'recipeId' && value) {
          const recipe = data?.recipes.find(r => r.id === value)
          if (recipe) updated.dishName = recipe.name
        }
        return updated
      }),
    }))
  }

  // ── Edit recipe ingredient helpers ─────────────────────────────────────────

  const addEditRecipeIngredient = () => {
    setEditRecipeForm(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { itemId: '', quantity: '', unit: 'kg' }],
    }))
  }

  const removeEditRecipeIngredient = (index: number) => {
    setEditRecipeForm(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }))
  }

  const updateEditRecipeIngredient = (index: number, field: string, value: string) => {
    setEditRecipeForm(prev => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, i) => {
        if (i !== index) return ing
        const updated = { ...ing, [field]: value }
        if (field === 'itemId') {
          const item = inventoryItems.find(it => it.id === value)
          if (item) updated.unit = item.unit
        }
        return updated
      }),
    }))
  }

  // ── Edit menu item helpers ─────────────────────────────────────────────────

  const addEditMenuItem = () => {
    setEditMenuForm(prev => ({
      ...prev,
      items: [...prev.items, { recipeId: '', dishName: '', servings: '1' }],
    }))
  }

  const removeEditMenuItem = (index: number) => {
    setEditMenuForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }))
  }

  const updateEditMenuItem = (index: number, field: string, value: string) => {
    setEditMenuForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i !== index) return item
        const updated = { ...item, [field]: value }
        if (field === 'recipeId' && value) {
          const recipe = data?.recipes.find(r => r.id === value)
          if (recipe) updated.dishName = recipe.name
        }
        return updated
      }),
    }))
  }

  // ── Computed values ────────────────────────────────────────────────────────

  const filteredIssues = useMemo(() => {
    if (!data?.issues) return []
    if (!issueSearch) return data.issues
    const q = issueSearch.toLowerCase()
    return data.issues.filter(
      issue =>
        issue.issueNumber.toLowerCase().includes(q) ||
        issue.item.name.toLowerCase().includes(q) ||
        issue.issuedTo.toLowerCase().includes(q) ||
        (issue.purpose || '').toLowerCase().includes(q)
    )
  }, [data?.issues, issueSearch])

  const filteredRecipes = useMemo(() => {
    if (!data?.recipes) return []
    if (!recipeSearch) return data.recipes
    const q = recipeSearch.toLowerCase()
    return data.recipes.filter(
      recipe =>
        recipe.name.toLowerCase().includes(q) ||
        recipe.category.toLowerCase().includes(q) ||
        recipe.mealType.toLowerCase().includes(q)
    )
  }, [data?.recipes, recipeSearch])

  const filteredMenus = useMemo(() => {
    if (!data?.menus) return []
    if (!menuSearch) return data.menus
    const q = menuSearch.toLowerCase()
    return data.menus.filter(
      menu =>
        menu.mealType.toLowerCase().includes(q) ||
        menu.status.toLowerCase().includes(q) ||
        menu.items.some(item => item.dishName.toLowerCase().includes(q))
    )
  }, [data?.menus, menuSearch])

  // Group menus by date for calendar view
  const menusByDate = useMemo(() => {
    const grouped: Record<string, MenuPlan[]> = {}
    filteredMenus.forEach(menu => {
      const dateKey = format(parseISO(menu.date), 'yyyy-MM-dd')
      if (!grouped[dateKey]) grouped[dateKey] = []
      grouped[dateKey].push(menu)
    })
    return grouped
  }, [filteredMenus])

  // Generate next 7 days for calendar view
  const upcomingDays = useMemo(() => {
    const days = []
    for (let i = 0; i < 7; i++) {
      const day = addDays(new Date(), i)
      const dateKey = format(day, 'yyyy-MM-dd')
      days.push({
        date: day,
        dateKey,
        label: isToday(day) ? 'Today' : isTomorrow(day) ? 'Tomorrow' : format(day, 'EEE, MMM d'),
        menus: menusByDate[dateKey] || [],
      })
    }
    return days
  }, [menusByDate])

  // ── Selected item info for issue form ──────────────────────────────────────

  const selectedInventoryItem = useMemo(() => {
    return inventoryItems.find(it => it.id === issueForm.itemId)
  }, [inventoryItems, issueForm.itemId])

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  const stats = data?.stats || { todayIssues: 0, todayItemsIssued: 0, activeRecipes: 0, plannedMenus: 0 }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Kitchen & Menu Planning</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage kitchen issues, menu plans, and recipes</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <ClipboardList className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Today&apos;s Issues</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.todayIssues}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <Package className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Items Issued Today</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.todayItemsIssued}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <BookOpen className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Active Recipes</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.activeRecipes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <CalendarDays className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Planned Menus</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.plannedMenus}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="issues" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            Kitchen Issues
          </TabsTrigger>
          <TabsTrigger value="menus" className="gap-2">
            <CalendarDays className="h-4 w-4" />
            Menu Plans
          </TabsTrigger>
          <TabsTrigger value="recipes" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Recipes
          </TabsTrigger>
        </TabsList>

        {/* ── Kitchen Issues Tab ──────────────────────────────────────────── */}
        <TabsContent value="issues" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search issues..."
                value={issueSearch}
                onChange={e => setIssueSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            {canCreate && (
              <Button onClick={() => setIssueDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Issue to Kitchen
              </Button>
            )}
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">Issue #</TableHead>
                      <TableHead className="whitespace-nowrap">Item Name</TableHead>
                      <TableHead className="whitespace-nowrap">Quantity</TableHead>
                      <TableHead className="whitespace-nowrap">Issued To</TableHead>
                      <TableHead className="whitespace-nowrap">Purpose</TableHead>
                      <TableHead className="whitespace-nowrap">Date</TableHead>
                      <TableHead className="whitespace-nowrap">Issued By</TableHead>
                      <TableHead className="whitespace-nowrap text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredIssues.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12 text-slate-500 dark:text-slate-400">
                          <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-30" />
                          <p className="text-lg font-medium">No kitchen issues found</p>
                          <p className="text-sm">Issue items to the kitchen to get started</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredIssues.map(issue => (
                        <TableRow key={issue.id}>
                          <TableCell className="font-mono text-sm font-medium whitespace-nowrap">
                            {issue.issueNumber}
                          </TableCell>
                          <TableCell className="font-medium whitespace-nowrap">
                            {issue.item.name}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {issue.quantity} {issue.unit}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">{issue.issuedTo}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            <PurposeBadge purpose={issue.purpose} />
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                            {format(parseISO(issue.createdAt), 'dd MMM yyyy, HH:mm')}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">{issue.issuedBy.name}</TableCell>
                          <TableCell className="text-right whitespace-nowrap">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    toast({ title: 'Issue Details', description: `${issue.issueNumber}: ${issue.item.name} - ${issue.quantity} ${issue.unit} issued to ${issue.issuedTo}` })
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                {canUpdate && (
                                  <DropdownMenuItem onClick={() => openEditIssueDialog(issue)}>
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Edit Issue
                                  </DropdownMenuItem>
                                )}
                                {canDelete && (
                                  <DropdownMenuItem
                                    onClick={() => openDeleteDialog('issue', issue.id, issue.issueNumber)}
                                    className="text-red-600 dark:text-red-400"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Issue
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Menu Plans Tab ───────────────────────────────────────────────── */}
        <TabsContent value="menus" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search menus..."
                value={menuSearch}
                onChange={e => setMenuSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            {canCreate && (
              <Button onClick={() => setMenuDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Menu Plan
              </Button>
            )}
          </div>

          {/* Calendar View */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {upcomingDays.map(day => (
              <Card key={day.dateKey} className={`${day.menus.length > 0 ? 'border-slate-200 dark:border-slate-700' : 'border-dashed border-slate-200 dark:border-slate-700'}`}>
                <CardHeader className="pb-3 pt-4 px-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-slate-500" />
                    <span className={isToday(day.date) ? 'text-blue-600 dark:text-blue-400 font-bold' : ''}>
                      {day.label}
                    </span>
                    {day.menus.length > 0 && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {day.menus.length} meal{day.menus.length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  {day.menus.length === 0 ? (
                    <p className="text-sm text-slate-400 dark:text-slate-500 italic">No meals planned</p>
                  ) : (
                    <div className="space-y-3">
                      {day.menus.map(menu => (
                        <div
                          key={menu.id}
                          className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <MealTypeIcon mealType={menu.mealType} />
                              <span className="text-sm font-medium capitalize">{menu.mealType}</span>
                            </div>
                            <MenuStatusBadge status={menu.status} />
                          </div>
                          {menu.headCount > 0 && (
                            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mb-2">
                              <Users className="h-3 w-3" />
                              {menu.headCount} people
                            </div>
                          )}
                          <div className="space-y-1">
                            {menu.items.map(item => (
                              <div key={item.id} className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <Utensils className="h-3 w-3 text-slate-400" />
                                {item.dishName}
                                {item.servings > 1 && (
                                  <span className="text-xs text-slate-400">({item.servings} servings)</span>
                                )}
                              </div>
                            ))}
                          </div>
                          {menu.status === 'planned' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-2 w-full gap-2 text-xs h-8"
                              onClick={() => {
                                setServingMenu(menu)
                                setServeConfirmOpen(true)
                              }}
                            >
                              <Play className="h-3 w-3" />
                              Serve Menu
                            </Button>
                          )}
                          {menu.status === 'preparing' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-2 w-full gap-2 text-xs h-8"
                              onClick={() => {
                                setServingMenu(menu)
                                setServeConfirmOpen(true)
                              }}
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              Mark as Served
                            </Button>
                          )}
                          {(canUpdate || canDelete) && (
                            <div className="flex gap-2 mt-2">
                              {canUpdate && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 gap-1 text-xs h-7"
                                  onClick={() => openEditMenuDialog(menu)}
                                >
                                  <Pencil className="h-3 w-3" />
                                  Edit
                                </Button>
                              )}
                              {canDelete && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 gap-1 text-xs h-7 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                                  onClick={() => openDeleteDialog('menu', menu.id, `${menu.mealType} - ${format(parseISO(menu.date), 'dd MMM yyyy')}`)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                  Delete
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ── Recipes Tab ─────────────────────────────────────────────────── */}
        <TabsContent value="recipes" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search recipes..."
                value={recipeSearch}
                onChange={e => setRecipeSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            {canCreate && (
              <Button onClick={() => setRecipeDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Recipe
              </Button>
            )}
          </div>

          {filteredRecipes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="h-12 w-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                <p className="text-lg font-medium text-slate-500 dark:text-slate-400">No recipes found</p>
                <p className="text-sm text-slate-400 dark:text-slate-500">Add recipes to create menu plans and manage BOM</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredRecipes.map(recipe => (
                <Card key={recipe.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate">{recipe.name}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1 flex-wrap">
                          <CategoryBadge category={recipe.category} />
                          <Badge variant="outline" className="text-xs capitalize">
                            <MealTypeIcon mealType={recipe.mealType} className="h-3 w-3 mr-1" />
                            {recipe.mealType}
                          </Badge>
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full whitespace-nowrap">
                        <Users className="h-3 w-3" />
                        {recipe.baseServings}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Ingredients (BOM)
                      </p>
                      <ScrollArea className="max-h-32">
                        <div className="space-y-1">
                          {recipe.ingredients.map(ing => (
                            <div key={ing.id} className="flex items-center justify-between text-sm">
                              <span className="text-slate-700 dark:text-slate-300 truncate">{ing.item.name}</span>
                              <span className="text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap ml-2">
                                {ing.quantity} {ing.unit}
                                {ing.item.currentStock < ing.quantity && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <AlertTriangle className="h-3 w-3 inline ml-1 text-amber-500" />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        Low stock: {ing.item.currentStock} {ing.unit} available
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                    <Separator className="my-3" />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-2"
                        onClick={() => {
                          setSelectedRecipe(recipe)
                          setRecipeDetailOpen(true)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                      {canUpdate && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={() => openEditRecipeDialog(recipe)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={() => openDeleteDialog('recipe', recipe.id, recipe.name)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Issue to Kitchen Dialog ────────────────────────────────────────── */}
      <Dialog open={issueDialogOpen} onOpenChange={setIssueDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Issue to Kitchen
            </DialogTitle>
            <DialogDescription>
              Issue items from inventory to the kitchen. Stock will be deducted automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Select Item from Inventory</Label>
              <Select value={issueForm.itemId} onValueChange={v => setIssueForm(prev => ({ ...prev, itemId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an item..." />
                </SelectTrigger>
                <SelectContent>
                  <ScrollArea className="max-h-48">
                    {inventoryItems.map(item => (
                      <SelectItem key={item.id} value={item.id}>
                        <span className="flex items-center gap-2">
                          {item.name}
                          <span className="text-xs text-slate-400">
                            (Stock: {item.currentStock} {item.unit})
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
              {selectedInventoryItem && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Available stock: <span className="font-medium">{selectedInventoryItem.currentStock} {selectedInventoryItem.unit}</span>
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="Enter quantity"
                  value={issueForm.quantity}
                  onChange={e => setIssueForm(prev => ({ ...prev, quantity: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Input
                  value={selectedInventoryItem?.unit || 'kg'}
                  disabled
                  className="bg-slate-50 dark:bg-slate-800"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Purpose</Label>
              <Select value={issueForm.purpose} onValueChange={v => setIssueForm(prev => ({ ...prev, purpose: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select purpose..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="breakfast">Breakfast</SelectItem>
                  <SelectItem value="lunch">Lunch</SelectItem>
                  <SelectItem value="dinner">Dinner</SelectItem>
                  <SelectItem value="snacks">Snacks</SelectItem>
                  <SelectItem value="special">Special</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Issued To</Label>
              <Input
                placeholder="Enter name (e.g., Kitchen, Chef Name)"
                value={issueForm.issuedTo}
                onChange={e => setIssueForm(prev => ({ ...prev, issuedTo: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea
                placeholder="Additional notes..."
                value={issueForm.notes}
                onChange={e => setIssueForm(prev => ({ ...prev, notes: e.target.value }))}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIssueDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleIssueToKitchen} disabled={submitting} className="gap-2">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
              Issue Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Recipe Dialog ──────────────────────────────────────────────── */}
      <Dialog open={recipeDialogOpen} onOpenChange={setRecipeDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Add Recipe
            </DialogTitle>
            <DialogDescription>
              Create a new recipe with ingredients (Bill of Materials). When served, all ingredient quantities are deducted from stock.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Recipe Name</Label>
                <Input
                  placeholder="e.g., Chicken Biryani"
                  value={recipeForm.name}
                  onChange={e => setRecipeForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={recipeForm.category} onValueChange={v => setRecipeForm(prev => ({ ...prev, category: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="veg">Vegetarian</SelectItem>
                    <SelectItem value="non_veg">Non-Vegetarian</SelectItem>
                    <SelectItem value="vegan">Vegan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Meal Type</Label>
                <Select value={recipeForm.mealType} onValueChange={v => setRecipeForm(prev => ({ ...prev, mealType: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="breakfast">Breakfast</SelectItem>
                    <SelectItem value="lunch">Lunch</SelectItem>
                    <SelectItem value="dinner">Dinner</SelectItem>
                    <SelectItem value="snacks">Snacks</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Base Servings</Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="100"
                  value={recipeForm.baseServings}
                  onChange={e => setRecipeForm(prev => ({ ...prev, baseServings: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Instructions</Label>
              <Textarea
                placeholder="Cooking instructions..."
                value={recipeForm.instructions}
                onChange={e => setRecipeForm(prev => ({ ...prev, instructions: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Ingredients */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Ingredients (Bill of Materials)</Label>
                <Button type="button" variant="outline" size="sm" onClick={addRecipeIngredient} className="gap-1">
                  <Plus className="h-3 w-3" />
                  Add Ingredient
                </Button>
              </div>
              {recipeForm.ingredients.length === 0 ? (
                <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4 border border-dashed rounded-lg">
                  No ingredients added yet. Click &quot;Add Ingredient&quot; to start.
                </p>
              ) : (
                <div className="space-y-2">
                  {recipeForm.ingredients.map((ing, idx) => (
                    <div key={idx} className="flex items-end gap-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <Label className="text-xs text-slate-500">Item</Label>
                        <Select value={ing.itemId} onValueChange={v => updateRecipeIngredient(idx, 'itemId', v)}>
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Select item..." />
                          </SelectTrigger>
                          <SelectContent>
                            <ScrollArea className="max-h-40">
                              {inventoryItems.map(item => (
                                <SelectItem key={item.id} value={item.id}>
                                  {item.name} ({item.unit})
                                </SelectItem>
                              ))}
                            </ScrollArea>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-24">
                        <Label className="text-xs text-slate-500">Qty</Label>
                        <Input
                          type="number"
                          min="0.01"
                          step="0.01"
                          placeholder="0"
                          value={ing.quantity}
                          onChange={e => updateRecipeIngredient(idx, 'quantity', e.target.value)}
                          className="h-9"
                        />
                      </div>
                      <div className="w-20">
                        <Label className="text-xs text-slate-500">Unit</Label>
                        <Input
                          value={ing.unit}
                          onChange={e => updateRecipeIngredient(idx, 'unit', e.target.value)}
                          className="h-9"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0 text-slate-400 hover:text-red-500"
                        onClick={() => removeRecipeIngredient(idx)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecipeDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleAddRecipe} disabled={submitting} className="gap-2">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookOpen className="h-4 w-4" />}
              Create Recipe
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Create Menu Plan Dialog ────────────────────────────────────────── */}
      <Dialog open={menuDialogOpen} onOpenChange={setMenuDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Create Menu Plan
            </DialogTitle>
            <DialogDescription>
              Plan meals for a specific date. Add dishes from recipes or type custom dish names.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={menuForm.date}
                  onChange={e => setMenuForm(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Meal Type</Label>
                <Select value={menuForm.mealType} onValueChange={v => setMenuForm(prev => ({ ...prev, mealType: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="breakfast">Breakfast</SelectItem>
                    <SelectItem value="lunch">Lunch</SelectItem>
                    <SelectItem value="dinner">Dinner</SelectItem>
                    <SelectItem value="snacks">Snacks</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Head Count</Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="100"
                  value={menuForm.headCount}
                  onChange={e => setMenuForm(prev => ({ ...prev, headCount: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Input
                  placeholder="Special instructions..."
                  value={menuForm.notes}
                  onChange={e => setMenuForm(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </div>

            {/* Menu Dishes */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Dishes</Label>
                <Button type="button" variant="outline" size="sm" onClick={addMenuItem} className="gap-1">
                  <Plus className="h-3 w-3" />
                  Add Dish
                </Button>
              </div>
              {menuForm.items.length === 0 ? (
                <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4 border border-dashed rounded-lg">
                  No dishes added yet. Click &quot;Add Dish&quot; to start.
                </p>
              ) : (
                <div className="space-y-2">
                  {menuForm.items.map((item, idx) => (
                    <div key={idx} className="flex items-end gap-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <Label className="text-xs text-slate-500">Recipe (Optional)</Label>
                        <Select value={item.recipeId} onValueChange={v => updateMenuItem(idx, 'recipeId', v)}>
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Select recipe..." />
                          </SelectTrigger>
                          <SelectContent>
                            <ScrollArea className="max-h-40">
                              {(data?.recipes || []).map(recipe => (
                                <SelectItem key={recipe.id} value={recipe.id}>
                                  {recipe.name} ({recipe.category})
                                </SelectItem>
                              ))}
                            </ScrollArea>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1 min-w-0">
                        <Label className="text-xs text-slate-500">Dish Name</Label>
                        <Input
                          placeholder="Custom dish name"
                          value={item.dishName}
                          onChange={e => updateMenuItem(idx, 'dishName', e.target.value)}
                          className="h-9"
                        />
                      </div>
                      <div className="w-24">
                        <Label className="text-xs text-slate-500">Servings</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.servings}
                          onChange={e => updateMenuItem(idx, 'servings', e.target.value)}
                          className="h-9"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0 text-slate-400 hover:text-red-500"
                        onClick={() => removeMenuItem(idx)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMenuDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleCreateMenu} disabled={submitting} className="gap-2">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarDays className="h-4 w-4" />}
              Create Menu Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Recipe Detail Dialog ───────────────────────────────────────────── */}
      <Dialog open={recipeDetailOpen} onOpenChange={setRecipeDetailOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ChefHat className="h-5 w-5" />
              {selectedRecipe?.name}
            </DialogTitle>
            <DialogDescription>
              Full recipe details with Bill of Materials (BOM)
            </DialogDescription>
          </DialogHeader>
          {selectedRecipe && (
            <div className="space-y-4 py-2">
              <div className="flex flex-wrap gap-2">
                <CategoryBadge category={selectedRecipe.category} />
                <Badge variant="outline" className="capitalize gap-1">
                  <MealTypeIcon mealType={selectedRecipe.mealType} className="h-3 w-3" />
                  {selectedRecipe.mealType}
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Users className="h-3 w-3" />
                  {selectedRecipe.baseServings} servings
                </Badge>
              </div>

              {selectedRecipe.instructions && (
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Instructions</Label>
                  <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
                    {selectedRecipe.instructions}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-sm font-medium">Bill of Materials (BOM)</Label>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  When this recipe is served, all ingredient quantities below are deducted from stock
                </p>
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ingredient</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Unit</TableHead>
                          <TableHead className="text-right">Current Stock</TableHead>
                          <TableHead className="text-right">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedRecipe.ingredients.map(ing => {
                          const isLow = ing.item.currentStock < ing.quantity
                          return (
                            <TableRow key={ing.id}>
                              <TableCell className="font-medium">{ing.item.name}</TableCell>
                              <TableCell>{ing.quantity}</TableCell>
                              <TableCell>{ing.unit}</TableCell>
                              <TableCell className="text-right">
                                {ing.item.currentStock} {ing.item.unit}
                              </TableCell>
                              <TableCell className="text-right">
                                {isLow ? (
                                  <Badge variant="destructive" className="gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    Low
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 gap-1">
                                    <CheckCircle2 className="h-3 w-3" />
                                    OK
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecipeDetailOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Serve Menu Confirmation Dialog ─────────────────────────────────── */}
      <Dialog open={serveConfirmOpen} onOpenChange={setServeConfirmOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Serve Menu
            </DialogTitle>
            <DialogDescription>
              This will deduct all recipe ingredients from stock automatically. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {servingMenu && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-2">
                <MealTypeIcon mealType={servingMenu.mealType} />
                <span className="font-medium capitalize">{servingMenu.mealType}</span>
                <span className="text-slate-500 dark:text-slate-400">•</span>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {format(parseISO(servingMenu.date), 'dd MMM yyyy')}
                </span>
              </div>
              {servingMenu.headCount > 0 && (
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Users className="h-4 w-4" />
                  Head count: {servingMenu.headCount}
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Dishes to be served</Label>
                {servingMenu.items.map(item => (
                  <div key={item.id} className="flex items-center gap-2 text-sm p-2 bg-slate-50 dark:bg-slate-800/50 rounded">
                    <Utensils className="h-3 w-3 text-slate-400" />
                    <span className="font-medium">{item.dishName}</span>
                    <span className="text-xs text-slate-400">({item.servings} servings)</span>
                    {item.recipe && (
                      <span className="text-xs text-slate-400 ml-auto">
                        {item.recipe.ingredients.length} ingredients
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Show ingredients that will be deducted */}
              {servingMenu.items.some(item => item.recipe && item.recipe.ingredients.length > 0) && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Ingredients to be deducted from stock</Label>
                  <Card>
                    <CardContent className="p-0">
                      <ScrollArea className="max-h-48">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Dish</TableHead>
                              <TableHead>Ingredient</TableHead>
                              <TableHead className="text-right">Qty</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {servingMenu.items.map(item =>
                              item.recipe?.ingredients.map(ing => (
                                <TableRow key={`${item.id}-${ing.id}`}>
                                  <TableCell className="text-sm">{item.dishName}</TableCell>
                                  <TableCell className="text-sm">{ing.item.name}</TableCell>
                                  <TableCell className="text-right text-sm">
                                    {ing.quantity} {ing.unit}
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>
              )}

              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-amber-800 dark:text-amber-300">
                    All recipe ingredients will be automatically deducted from inventory stock. Please ensure stock levels are sufficient.
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setServeConfirmOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleServeMenu} disabled={submitting} className="gap-2">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Confirm & Serve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Issue Dialog ────────────────────────────────────────────────── */}
      <Dialog open={editIssueDialogOpen} onOpenChange={setEditIssueDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Edit Kitchen Issue
            </DialogTitle>
            <DialogDescription>
              Update the details of this kitchen issue.
            </DialogDescription>
          </DialogHeader>
          {editingIssue && (
            <div className="space-y-4 py-2">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <p className="text-sm font-medium">{editingIssue.issueNumber}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{editingIssue.item.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={editIssueForm.quantity}
                    onChange={e => setEditIssueForm(prev => ({ ...prev, quantity: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Input
                    value={editingIssue.unit}
                    disabled
                    className="bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Purpose</Label>
                <Select value={editIssueForm.purpose} onValueChange={v => setEditIssueForm(prev => ({ ...prev, purpose: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select purpose..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="breakfast">Breakfast</SelectItem>
                    <SelectItem value="lunch">Lunch</SelectItem>
                    <SelectItem value="dinner">Dinner</SelectItem>
                    <SelectItem value="snacks">Snacks</SelectItem>
                    <SelectItem value="special">Special</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Issued To</Label>
                <Input
                  value={editIssueForm.issuedTo}
                  onChange={e => setEditIssueForm(prev => ({ ...prev, issuedTo: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Textarea
                  value={editIssueForm.notes}
                  onChange={e => setEditIssueForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditIssueDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleEditIssue} disabled={submitting} className="gap-2">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
              Update Issue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Recipe Dialog ────────────────────────────────────────────────── */}
      <Dialog open={editRecipeDialogOpen} onOpenChange={setEditRecipeDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Edit Recipe
            </DialogTitle>
            <DialogDescription>
              Update the recipe details and ingredients.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Recipe Name</Label>
                <Input
                  value={editRecipeForm.name}
                  onChange={e => setEditRecipeForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={editRecipeForm.category} onValueChange={v => setEditRecipeForm(prev => ({ ...prev, category: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="veg">Vegetarian</SelectItem>
                    <SelectItem value="non_veg">Non-Vegetarian</SelectItem>
                    <SelectItem value="vegan">Vegan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Meal Type</Label>
                <Select value={editRecipeForm.mealType} onValueChange={v => setEditRecipeForm(prev => ({ ...prev, mealType: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="breakfast">Breakfast</SelectItem>
                    <SelectItem value="lunch">Lunch</SelectItem>
                    <SelectItem value="dinner">Dinner</SelectItem>
                    <SelectItem value="snacks">Snacks</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Base Servings</Label>
                <Input
                  type="number"
                  min="1"
                  value={editRecipeForm.baseServings}
                  onChange={e => setEditRecipeForm(prev => ({ ...prev, baseServings: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Instructions</Label>
              <Textarea
                value={editRecipeForm.instructions}
                onChange={e => setEditRecipeForm(prev => ({ ...prev, instructions: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Ingredients */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Ingredients (Bill of Materials)</Label>
                <Button type="button" variant="outline" size="sm" onClick={addEditRecipeIngredient} className="gap-1">
                  <Plus className="h-3 w-3" />
                  Add Ingredient
                </Button>
              </div>
              {editRecipeForm.ingredients.length === 0 ? (
                <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4 border border-dashed rounded-lg">
                  No ingredients added yet. Click &quot;Add Ingredient&quot; to start.
                </p>
              ) : (
                <div className="space-y-2">
                  {editRecipeForm.ingredients.map((ing, idx) => (
                    <div key={idx} className="flex items-end gap-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <Label className="text-xs text-slate-500">Item</Label>
                        <Select value={ing.itemId} onValueChange={v => updateEditRecipeIngredient(idx, 'itemId', v)}>
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Select item..." />
                          </SelectTrigger>
                          <SelectContent>
                            <ScrollArea className="max-h-40">
                              {inventoryItems.map(item => (
                                <SelectItem key={item.id} value={item.id}>
                                  {item.name} ({item.unit})
                                </SelectItem>
                              ))}
                            </ScrollArea>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-24">
                        <Label className="text-xs text-slate-500">Qty</Label>
                        <Input
                          type="number"
                          min="0.01"
                          step="0.01"
                          placeholder="0"
                          value={ing.quantity}
                          onChange={e => updateEditRecipeIngredient(idx, 'quantity', e.target.value)}
                          className="h-9"
                        />
                      </div>
                      <div className="w-20">
                        <Label className="text-xs text-slate-500">Unit</Label>
                        <Input
                          value={ing.unit}
                          onChange={e => updateEditRecipeIngredient(idx, 'unit', e.target.value)}
                          className="h-9"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0 text-slate-400 hover:text-red-500"
                        onClick={() => removeEditRecipeIngredient(idx)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRecipeDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleEditRecipe} disabled={submitting} className="gap-2">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
              Update Recipe
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Menu Plan Dialog ────────────────────────────────────────────── */}
      <Dialog open={editMenuDialogOpen} onOpenChange={setEditMenuDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Edit Menu Plan
            </DialogTitle>
            <DialogDescription>
              Update the menu plan details and dishes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={editMenuForm.date}
                  onChange={e => setEditMenuForm(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Meal Type</Label>
                <Select value={editMenuForm.mealType} onValueChange={v => setEditMenuForm(prev => ({ ...prev, mealType: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="breakfast">Breakfast</SelectItem>
                    <SelectItem value="lunch">Lunch</SelectItem>
                    <SelectItem value="dinner">Dinner</SelectItem>
                    <SelectItem value="snacks">Snacks</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Head Count</Label>
                <Input
                  type="number"
                  min="1"
                  value={editMenuForm.headCount}
                  onChange={e => setEditMenuForm(prev => ({ ...prev, headCount: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Input
                  value={editMenuForm.notes}
                  onChange={e => setEditMenuForm(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </div>

            {/* Menu Dishes */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Dishes</Label>
                <Button type="button" variant="outline" size="sm" onClick={addEditMenuItem} className="gap-1">
                  <Plus className="h-3 w-3" />
                  Add Dish
                </Button>
              </div>
              {editMenuForm.items.length === 0 ? (
                <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4 border border-dashed rounded-lg">
                  No dishes added yet. Click &quot;Add Dish&quot; to start.
                </p>
              ) : (
                <div className="space-y-2">
                  {editMenuForm.items.map((item, idx) => (
                    <div key={idx} className="flex items-end gap-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <Label className="text-xs text-slate-500">Recipe (Optional)</Label>
                        <Select value={item.recipeId} onValueChange={v => updateEditMenuItem(idx, 'recipeId', v)}>
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Select recipe..." />
                          </SelectTrigger>
                          <SelectContent>
                            <ScrollArea className="max-h-40">
                              {(data?.recipes || []).map(recipe => (
                                <SelectItem key={recipe.id} value={recipe.id}>
                                  {recipe.name} ({recipe.category})
                                </SelectItem>
                              ))}
                            </ScrollArea>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1 min-w-0">
                        <Label className="text-xs text-slate-500">Dish Name</Label>
                        <Input
                          value={item.dishName}
                          onChange={e => updateEditMenuItem(idx, 'dishName', e.target.value)}
                          className="h-9"
                        />
                      </div>
                      <div className="w-24">
                        <Label className="text-xs text-slate-500">Servings</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.servings}
                          onChange={e => updateEditMenuItem(idx, 'servings', e.target.value)}
                          className="h-9"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0 text-slate-400 hover:text-red-500"
                        onClick={() => removeEditMenuItem(idx)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditMenuDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleEditMenu} disabled={submitting} className="gap-2">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
              Update Menu Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation AlertDialog ──────────────────────────────────── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?
              {deleteTarget?.type === 'issue' && ' This kitchen issue record will be permanently removed.'}
              {deleteTarget?.type === 'recipe' && ' This recipe and all its ingredients will be permanently removed. Menu plan items referencing this recipe will also be affected.'}
              {deleteTarget?.type === 'menu' && ' This menu plan and all its dishes will be permanently removed.'}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={submitting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

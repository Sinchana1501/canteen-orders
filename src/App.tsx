import { useEffect, useState, type FormEvent } from 'react'
import './App.css'

type Role = 'admin' | 'student' | 'faculty'
type AuthMode = 'login' | 'register'
type SectionId =
  | 'home'
  | 'types'
  | 'orders'
  | 'transactions'
  | 'settings'
  | 'about'
  | 'contact'
  | 'account'

type Unit = 'plate' | 'piece' | 'cup'
type PaymentMethod = 'upi' | 'card' | 'cash'
type AdminOrderFilter = 'all' | 'Preparing' | 'Prepared' | 'Done'

type Dish = {
  id: string
  name: string
  category: string
  description: string
  price: number
  available: number
  unit: Unit
  slots: string[]
  emoji: string
  featured: boolean
}

type CartItem = {
  dishId: string
  quantity: number
}

type StoredUser = {
  id: string
  fullName: string
  email: string
  password: string
  role: Role
}

type Session = Pick<StoredUser, 'id' | 'fullName' | 'email' | 'role'>

type Order = {
  id: string
  token: string
  createdAt: string
  customerName: string
  role: Role
  pickupSlot: string
  paymentMethod: PaymentMethod
  paymentStatus: 'Paid' | 'Pending'
  items: Array<{
    dishId: string
    name: string
    unit: Unit
    quantity: number
    price: number
  }>
  total: number
  status: 'Preparing' | 'Prepared' | 'Done'
}

type DishDraft = {
  name: string
  category: string
  description: string
  price: string
  available: string
  unit: Unit
  slots: string
  emoji: string
  featured: boolean
}

type AuthDraft = {
  fullName: string
  email: string
  password: string
}

const STORAGE_KEYS = {
  dishes: 'canteen:dishes',
  users: 'canteen:users',
  session: 'canteen:session',
  orders: 'canteen:orders',
} as const

type DrawerItem = {
  id: SectionId
  label: string
}

function getMenuItems(role: Role): DrawerItem[] {
  return [
    { id: 'home', label: 'Dashboard' },
    { id: 'types', label: role === 'admin' ? 'Manage dishes' : 'Types of dishes' },
    { id: 'orders', label: role === 'admin' ? 'Orders' : 'My orders' },
    { id: 'transactions', label: 'Transactions' },
    { id: 'settings', label: role === 'admin' ? 'Dish settings' : 'Settings' },
    { id: 'about', label: 'About us' },
    { id: 'contact', label: 'Contact help' },
    { id: 'account', label: role === 'admin' ? 'Admin account' : 'My account' },
  ]
}

const pageMeta: Record<
  SectionId,
  {
    eyebrow: string
    title: string
    description: string
  }
> = {
  home: {
    eyebrow: 'Dashboard',
    title: 'Live canteen ordering',
    description:
      'Browse live dishes, manage stock, and generate tokens without leaving the same workspace.',
  },
  types: {
    eyebrow: 'Menu',
    title: 'Available dishes',
    description:
      'Cards show the current dish price, unit, quantity, and active time slot before checkout.',
  },
  orders: {
    eyebrow: 'Orders',
    title: 'Cart and generated tokens',
    description:
      'Review your cart, create tokens, and delete any saved order when you need to clear history.',
  },
  transactions: {
    eyebrow: 'Transactions',
    title: 'Payment and activity summary',
    description:
      'See recent token values, totals, and the overall activity snapshot in one compact view.',
  },
  settings: {
    eyebrow: 'Settings',
    title: 'Menu controls and preferences',
    description:
      'Admins can publish dishes here while everyone can see the saved app preferences.',
  },
  about: {
    eyebrow: 'About us',
    title: 'Built for a college canteen',
    description:
      'This frontend prototype is designed for student and faculty ordering with live menu updates.',
  },
  contact: {
    eyebrow: 'Help',
    title: 'Need support?',
    description: 'Use the contact details here when you want help with canteen ordering flows.',
  },
  account: {
    eyebrow: 'Account',
    title: 'Your profile',
    description: 'Check the current role, email, and online state for the active session.',
  },
}

const unitLabels: Record<Unit, string> = {
  plate: 'Plate',
  piece: 'Piece',
  cup: 'Cup',
}

const paymentLabels: Record<PaymentMethod, string> = {
  upi: 'UPI',
  card: 'Card',
  cash: 'Cash',
}

const initialDishes: Dish[] = [
  {
    id: 'dish-1',
    name: 'Masala Dosa',
    category: 'Breakfast',
    description: 'Crispy dosa with potato masala, chutney, and sambar.',
    price: 48,
    available: 32,
    unit: 'plate',
    slots: ['7:30 AM - 10:00 AM', '11:30 AM - 1:00 PM'],
    emoji: '🥞',
    featured: true,
  },
  {
    id: 'dish-2',
    name: 'Veg Thali',
    category: 'Lunch',
    description: 'Balanced meal with rice, curry, dal, salad, and pickle.',
    price: 70,
    available: 18,
    unit: 'plate',
    slots: ['12:00 PM - 2:30 PM'],
    emoji: '🍛',
    featured: true,
  },
  {
    id: 'dish-3',
    name: 'Samosa',
    category: 'Snacks',
    description: 'Crisp, spicy potato-filled pastry served hot.',
    price: 12,
    available: 80,
    unit: 'piece',
    slots: ['10:30 AM - 5:30 PM'],
    emoji: '🥟',
    featured: false,
  },
  {
    id: 'dish-4',
    name: 'Tea',
    category: 'Beverages',
    description: 'Freshly brewed tea with a strong canteen-style finish.',
    price: 10,
    available: 60,
    unit: 'cup',
    slots: ['7:00 AM - 6:00 PM'],
    emoji: '☕',
    featured: true,
  },
  {
    id: 'dish-5',
    name: 'Idli Set',
    category: 'Breakfast',
    description: 'Soft idlis with coconut chutney and sambar.',
    price: 35,
    available: 25,
    unit: 'plate',
    slots: ['7:00 AM - 10:30 AM'],
    emoji: '🍚',
    featured: false,
  },
  {
    id: 'dish-6',
    name: 'Fresh Juice',
    category: 'Beverages',
    description: 'Seasonal fruit juice made fresh in small batches.',
    price: 25,
    available: 20,
    unit: 'cup',
    slots: ['9:00 AM - 4:00 PM'],
    emoji: '🧃',
    featured: false,
  },
]

const initialAdmin: StoredUser = {
  id: 'admin-1',
  fullName: 'Canteen Admin',
  email: 'admin@college.edu',
  password: 'admin123',
  role: 'admin',
}

const initialUsers: StoredUser[] = [initialAdmin]

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback

  const raw = window.localStorage.getItem(key)
  if (!raw) return fallback

  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function formatMoney(value: number) {
  return `₹${value.toFixed(0)}`
}

function buildToken(index: number) {
  return `CT-${String(index).padStart(4, '0')}`
}

function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

function normalizeSlots(value: string) {
  return value
    .split(',')
    .map((slot) => slot.trim())
    .filter(Boolean)
}

function normalizeOrders(
  orders: Array<
    Omit<Order, 'status' | 'paymentMethod' | 'paymentStatus'> & {
      paymentMethod?: PaymentMethod
      paymentStatus?: 'Paid' | 'Pending'
      status?: string
    }
  >,
): Order[] {
  return orders.map((order) => ({
    ...order,
    paymentMethod: order.paymentMethod ?? 'upi',
    paymentStatus: order.paymentStatus ?? 'Paid',
    status: (() => {
      const rawStatus = order.status
      if (rawStatus === 'Done') return 'Done' as const
      if (rawStatus === 'Prepared' || rawStatus === 'Ready') return 'Prepared' as const
      return 'Preparing' as const
    })(),
  }))
}

function useDebouncedValue<T>(value: T, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedValue(value), delay)

    return () => window.clearTimeout(timer)
  }, [delay, value])

  return debouncedValue
}

function App() {
  const [dishes, setDishes] = useState<Dish[]>(() =>
    readJson<Dish[]>(STORAGE_KEYS.dishes, initialDishes),
  )
  const [users, setUsers] = useState<StoredUser[]>(() =>
    readJson<StoredUser[]>(STORAGE_KEYS.users, initialUsers),
  )
  const [session, setSession] = useState<Session | null>(() =>
    readJson<Session | null>(STORAGE_KEYS.session, null),
  )
  const [orders, setOrders] = useState<Order[]>(() =>
    normalizeOrders(readJson<Order[]>(STORAGE_KEYS.orders, [])),
  )
  const [authRole, setAuthRole] = useState<Role>('student')
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [authDraft, setAuthDraft] = useState<AuthDraft>({
    fullName: '',
    email: '',
    password: '',
  })
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<SectionId>('home')
  const [cart, setCart] = useState<CartItem[]>([])
  const [pickupSlot, setPickupSlot] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi')
  const [adminOrderFilter, setAdminOrderFilter] =
    useState<AdminOrderFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDishId, setSelectedDishId] = useState<string | null>(null)
  const [alert, setAlert] = useState('')
  const [editingDishId, setEditingDishId] = useState<string | null>(null)
  const [dishDraft, setDishDraft] = useState<DishDraft>({
    name: '',
    category: 'Breakfast',
    description: '',
    price: '',
    available: '',
    unit: 'plate',
    slots: '',
    emoji: '🍽️',
    featured: false,
  })

  const debouncedQuery = useDebouncedValue(searchQuery, 260)
  const selectedDish = dishes.find((dish) => dish.id === selectedDishId) ?? null
  const currentUser = session
    ? users.find((user) => user.id === session.id) ?? session
    : null

  const availableDishes = dishes.filter((dish) => dish.available > 0)
  const searchMatches = availableDishes.filter((dish) => {
    const query = debouncedQuery.trim().toLowerCase()
    if (!query) return false

    return (
      dish.name.toLowerCase().includes(query) ||
      dish.category.toLowerCase().includes(query) ||
      dish.description.toLowerCase().includes(query)
    )
  })
  const searchSuggestions = searchMatches.slice(0, 6)
  const catalogDishes =
    debouncedQuery.trim() === '' ? availableDishes : searchMatches

  const categoryGroups = dishes.reduce<Record<string, number>>((acc, dish) => {
    acc[dish.category] = (acc[dish.category] ?? 0) + 1
    return acc
  }, {})

  const visibleOrders =
    session?.role === 'admin'
      ? orders
      : orders.filter((order) => order.customerName === currentUser?.fullName)

  const adminOrders =
    adminOrderFilter === 'all'
      ? orders
      : orders.filter((order) => order.status === adminOrderFilter)

  const pickupSlotOptions = cart.reduce<string[]>((options, item, index) => {
    const dish = dishes.find((entry) => entry.id === item.dishId)
    if (!dish) return options

    const dishSlots = dish.slots
    if (index === 0) return dishSlots

    const commonSlots = options.filter((slot) => dishSlots.includes(slot))
    return commonSlots.length > 0 ? commonSlots : Array.from(new Set([...options, ...dishSlots]))
  }, [])

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const cartTotal = cart.reduce((sum, item) => {
    const dish = dishes.find((entry) => entry.id === item.dishId)
    return sum + (dish?.price ?? 0) * item.quantity
  }, 0)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.dishes, JSON.stringify(dishes))
  }, [dishes])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users))
  }, [users])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(orders))
  }, [orders])

  useEffect(() => {
    if (session) {
      window.localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session))
    } else {
      window.localStorage.removeItem(STORAGE_KEYS.session)
    }
  }, [session])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDrawerOpen(false)
        setSelectedDishId(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (alert === '') return

    const timer = window.setTimeout(() => setAlert(''), 3200)
    return () => window.clearTimeout(timer)
  }, [alert])

  function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const email = authDraft.email.trim().toLowerCase()
    const fullName = authDraft.fullName.trim()
    const password = authDraft.password.trim()

    if (!email || !password) {
      setAlert('Email and password are required.')
      return
    }

    if (authMode === 'register') {
      if (!fullName) {
        setAlert('Full name is required for registration.')
        return
      }

      const existingUser = users.find((user) => user.email.toLowerCase() === email)
      if (existingUser) {
        setAlert('An account with this email already exists.')
        return
      }

      const nextUser: StoredUser = {
        id: makeId(authRole),
        fullName,
        email,
        password,
        role: authRole,
      }

      setUsers((current) => [...current, nextUser])
      setSession({
        id: nextUser.id,
        fullName: nextUser.fullName,
        email: nextUser.email,
        role: nextUser.role,
      })
      setAuthDraft({
        fullName: '',
        email: '',
        password: '',
      })
      setAlert(`${authRole === 'admin' ? 'Admin' : 'Student/faculty'} account created.`)
      return
    }

    const matchedUser = users.find(
      (user) =>
        user.email.toLowerCase() === email &&
        user.password === password &&
        user.role === authRole,
    )

    if (!matchedUser) {
      setAlert('Invalid credentials for the selected role.')
      return
    }

    setSession({
      id: matchedUser.id,
      fullName: matchedUser.fullName,
      email: matchedUser.email,
      role: matchedUser.role,
    })
    setAuthDraft({
      fullName: '',
      email: '',
      password: '',
    })
    setAlert(`Welcome back, ${matchedUser.fullName}.`)
  }

  function handleLogout() {
    setSession(null)
    setCart([])
    setPickupSlot('')
    setPaymentMethod('upi')
    setDrawerOpen(false)
    setSelectedDishId(null)
    setActiveSection('home')
    setAlert('You have been logged out.')
  }

  function handleNavigate(section: SectionId) {
    setActiveSection(section)
    setDrawerOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleAddToCart(dish: Dish) {
    if (dish.available <= 0) {
      setAlert('This dish is currently out of stock.')
      return
    }

    let added = false
    setCart((current) => {
      const existingItem = current.find((item) => item.dishId === dish.id)
      if (!existingItem) {
        added = true
        return [...current, { dishId: dish.id, quantity: 1 }]
      }

      if (existingItem.quantity >= dish.available) {
        setAlert('Cart already has the maximum available quantity for this dish.')
        return current
      }

      added = true
      return current.map((item) =>
        item.dishId === dish.id ? { ...item, quantity: item.quantity + 1 } : item,
      )
    })

    if (added) {
      setAlert(`${dish.name} added to cart.`)
    }
  }

  function handleCheckout() {
    if (cart.length === 0) {
      setAlert('Add at least one dish to place a token.')
      return
    }

    const finalPickupSlot = pickupSlotOptions.includes(pickupSlot)
      ? pickupSlot
      : pickupSlotOptions[0] ?? ''

    if (!finalPickupSlot) {
      setAlert('No pickup slots are available for the current cart.')
      return
    }

    const insufficientItem = cart.find((item) => {
      const dish = dishes.find((entry) => entry.id === item.dishId)
      return !dish || item.quantity > dish.available
    })

    if (insufficientItem) {
      setAlert('One of the cart items no longer has enough stock.')
      return
    }

    const nextIndex = orders.length + 1
    const token = buildToken(nextIndex)
    const paymentStatus = paymentMethod === 'cash' ? 'Pending' : 'Paid'
    const orderItems = cart
      .map((item) => {
        const dish = dishes.find((entry) => entry.id === item.dishId)
        if (!dish) return null

        return {
          dishId: dish.id,
          name: dish.name,
          unit: dish.unit,
          quantity: item.quantity,
          price: dish.price,
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)

    const total = orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    )

    setOrders((current) => [
      {
        id: makeId('order'),
        token,
        createdAt: new Date().toISOString(),
        customerName: currentUser?.fullName ?? 'Guest',
        role: session?.role ?? 'student',
        pickupSlot: finalPickupSlot,
        paymentMethod,
        paymentStatus,
        items: orderItems,
        total,
        status: 'Preparing',
      },
      ...current,
    ])

    setDishes((current) =>
      current.map((dish) => {
        const orderedItem = cart.find((item) => item.dishId === dish.id)
        if (!orderedItem) return dish

        return {
          ...dish,
          available: Math.max(0, dish.available - orderedItem.quantity),
        }
      }),
    )

    setCart([])
    setPickupSlot('')
    setPaymentMethod('upi')
    setActiveSection('orders')
    setAlert(`Token ${token} generated successfully.`)
  }

  function handleCartChange(dishId: string, delta: number) {
    setCart((current) =>
      current
        .map((item) =>
          item.dishId === dishId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    )
  }

  function handleRemoveFromCart(dishId: string) {
    setCart((current) => current.filter((item) => item.dishId !== dishId))
  }

  function handleDishDraftChange<K extends keyof DishDraft>(
    key: K,
    value: DishDraft[K],
  ) {
    setDishDraft((current) => ({ ...current, [key]: value }))
  }

  function resetDishForm() {
    setEditingDishId(null)
    setDishDraft({
      name: '',
      category: 'Breakfast',
      description: '',
      price: '',
      available: '',
      unit: 'plate',
      slots: '',
      emoji: '🍽️',
      featured: false,
    })
  }

  function handleDishSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const name = dishDraft.name.trim()
    const category = dishDraft.category.trim()
    const description = dishDraft.description.trim()
    const price = Number(dishDraft.price)
    const available = Number(dishDraft.available)
    const slots = normalizeSlots(dishDraft.slots)

    if (!name || !category || !description || !slots.length || !Number.isFinite(price)) {
      setAlert('Please fill the dish name, category, description, price, and time slots.')
      return
    }

    const nextDish: Dish = {
      id: editingDishId ?? makeId('dish'),
      name,
      category,
      description,
      price,
      available: Number.isFinite(available) ? Math.max(0, available) : 0,
      unit: dishDraft.unit,
      slots,
      emoji: dishDraft.emoji || '🍽️',
      featured: dishDraft.featured,
    }

    setDishes((current) => {
      if (editingDishId) {
        return current.map((dish) => (dish.id === editingDishId ? nextDish : dish))
      }

      return [nextDish, ...current]
    })

    setAlert(
      editingDishId ? `${nextDish.name} has been updated.` : `${nextDish.name} added to menu.`,
    )
    resetDishForm()
  }

  function handleDeleteDish(dishId: string) {
    const targetDish = dishes.find((dish) => dish.id === dishId)
    if (!targetDish) return

    const confirmed = window.confirm(`Delete ${targetDish.name} from the menu?`)
    if (!confirmed) return

    setDishes((current) => current.filter((dish) => dish.id !== dishId))
    setCart((current) => current.filter((item) => item.dishId !== dishId))

    if (selectedDishId === dishId) {
      setSelectedDishId(null)
    }

    if (editingDishId === dishId) {
      resetDishForm()
    }

    setAlert(`${targetDish.name} removed from the menu.`)
  }

  function handleDeleteOrder(orderId: string) {
    const targetOrder = orders.find((order) => order.id === orderId)
    if (!targetOrder) return

    const sessionRole = session?.role ?? 'student'
    if (
      sessionRole !== 'admin' &&
      targetOrder.customerName.toLowerCase() !== currentUser?.fullName.toLowerCase()
    ) {
      setAlert('You can only delete your own orders.')
      return
    }

    const confirmed = window.confirm(`Delete order ${targetOrder.token}?`)
    if (!confirmed) return

    setOrders((current) => current.filter((order) => order.id !== orderId))
    setDishes((current) =>
      current.map((dish) => {
        const restoreItem = targetOrder.items.find((item) => item.dishId === dish.id)
        if (!restoreItem) return dish

        return {
          ...dish,
          available: dish.available + restoreItem.quantity,
        }
      }),
    )
    setAlert(`${targetOrder.token} deleted and inventory restored.`)
  }

  function handleMarkPrepared(orderId: string) {
    if (session?.role !== 'admin') return

    setOrders((current) =>
      current.map((order) =>
        order.id === orderId ? { ...order, status: 'Prepared' } : order,
      ),
    )
    setAlert('Order marked as prepared.')
  }

  function handleMarkReceived(orderId: string) {
    if (session?.role === 'admin') return

    const targetOrder = orders.find((order) => order.id === orderId)
    if (!targetOrder || targetOrder.customerName !== currentUser?.fullName) return

    setOrders((current) =>
      current.map((order) =>
        order.id === orderId ? { ...order, status: 'Done' } : order,
      ),
    )
    setAlert(`${targetOrder.token} marked as received.`)
  }

  function openNewDishForm() {
    resetDishForm()
    setActiveSection('settings')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function startEditingDish(dish: Dish) {
    setEditingDishId(dish.id)
    setDishDraft({
      name: dish.name,
      category: dish.category,
      description: dish.description,
      price: String(dish.price),
      available: String(dish.available),
      unit: dish.unit,
      slots: dish.slots.join(', '),
      emoji: dish.emoji,
      featured: dish.featured,
    })
    setActiveSection('settings')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleSectionAction(section: SectionId) {
    handleNavigate(section)
  }

  const activePage = pageMeta[activeSection]
  const drawerItems = getMenuItems(session?.role ?? 'student')

  if (!session) {
    return (
      <main className="landing">
        <section className="landing-hero">
          <div className="landing-copy">
            <span className="eyebrow">Online tokens for college canteen orders</span>
            <h1>Fast ordering, live stock, and pickup tokens in one place.</h1>
            <p>
              Students, faculty, and the canteen admin can sign in from the same system.
              The menu updates on the homepage the moment the admin publishes a dish.
            </p>
            <div className="landing-points">
              <div>
                <strong>Live availability</strong>
                <span>Only dishes in stock appear in search suggestions.</span>
              </div>
              <div>
                <strong>Smart tokens</strong>
                <span>Checkout issues a pickup token with the next available slot.</span>
              </div>
              <div>
                <strong>Role-based access</strong>
                <span>Separate login and register flows for admin and users.</span>
              </div>
            </div>
          </div>

          <div className="auth-card">
            <div className="auth-switch">
              <button
                type="button"
                className={authRole === 'admin' ? 'chip active' : 'chip'}
                onClick={() => setAuthRole('admin')}
              >
                Canteen admin
              </button>
              <button
                type="button"
                className={authRole !== 'admin' ? 'chip active' : 'chip'}
                onClick={() => setAuthRole('student')}
              >
                Student / faculty
              </button>
            </div>

            <div className="auth-tabs">
              <button
                type="button"
                className={authMode === 'login' ? 'tab active' : 'tab'}
                onClick={() => setAuthMode('login')}
              >
                Login
              </button>
              <button
                type="button"
                className={authMode === 'register' ? 'tab active' : 'tab'}
                onClick={() => setAuthMode('register')}
              >
                Register
              </button>
            </div>

            <form className="auth-form" onSubmit={handleAuthSubmit}>
              {authMode === 'register' && (
                <label>
                  Full name
                  <input
                    value={authDraft.fullName}
                    onChange={(event) =>
                      setAuthDraft((current) => ({ ...current, fullName: event.target.value }))
                    }
                    placeholder={authRole === 'admin' ? 'Canteen Admin' : 'Student name'}
                  />
                </label>
              )}

              <label>
                Email
                <input
                  type="email"
                  value={authDraft.email}
                  onChange={(event) =>
                    setAuthDraft((current) => ({ ...current, email: event.target.value }))
                  }
                  placeholder="name@college.edu"
                />
              </label>

              <label>
                Password
                <input
                  type="password"
                  value={authDraft.password}
                  onChange={(event) =>
                    setAuthDraft((current) => ({ ...current, password: event.target.value }))
                  }
                  placeholder="Enter password"
                />
              </label>

              <button className="button primary" type="submit">
                {authMode === 'login' ? 'Sign in' : 'Create account'}
              </button>
            </form>

            <div className="auth-footer">
              <p>Admin demo: admin@college.edu / admin123</p>
              <p>Students and faculty can register with their college email.</p>
            </div>
          </div>
        </section>

        <section className="preview-strip">
          <div>
            <span>Available dishes</span>
            <strong>{availableDishes.length}</strong>
          </div>
          <div>
            <span>Menu categories</span>
            <strong>{Object.keys(categoryGroups).length}</strong>
          </div>
          <div>
            <span>Orders placed</span>
            <strong>{orders.length}</strong>
          </div>
        </section>

        {alert && <div className="toast landing-toast">{alert}</div>}
        <footer className="site-footer landing-footer">
          <div>
            <strong>College Canteen</strong>
            <p>Order faster, collect on time, and avoid queue delays.</p>
          </div>
          <p>Built for a campus canteen ordering and token system.</p>
        </footer>
      </main>
    )
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-left">
          <button
            type="button"
            className="icon-button"
            aria-label="Open menu"
            onClick={() => setDrawerOpen(true)}
          >
            <span />
            <span />
            <span />
          </button>

          <button type="button" className="button ghost" onClick={handleLogout}>
            Logout
          </button>
        </div>

        <div className="topbar-center">
          <div className="brand">
            <span>College Canteen</span>
            <small>Online tokens and food pickup</small>
          </div>

          <div className="search-wrap">
            <label className="search-input" aria-label="Search available dishes">
              <span className="search-icon">⌕</span>
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search available dishes, slots, or categories"
              />
            </label>

            {debouncedQuery.trim() !== '' && (
              <div className="search-suggestions" role="listbox">
                {searchSuggestions.length > 0 ? (
                  searchSuggestions.map((dish) => (
                    <button
                      key={dish.id}
                      type="button"
                      className="suggestion"
                      onClick={() => {
                        setSelectedDishId(dish.id)
                        setSearchQuery(dish.name)
                        handleNavigate('types')
                      }}
                    >
                      <strong>{dish.name}</strong>
                      <span>
                        {unitLabels[dish.unit]} • {formatMoney(dish.price)} • {dish.available} left
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="suggestion empty">No available dishes match the search.</div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="topbar-right">
          <button type="button" className="button ghost" onClick={() => handleNavigate('orders')}>
            Cart {cartCount > 0 ? `(${cartCount})` : ''}
          </button>
          <div className="session-pill">
            <span>{session.role}</span>
            <strong>{session.fullName}</strong>
          </div>
        </div>
      </header>

      <div
        className={drawerOpen ? 'drawer-backdrop open' : 'drawer-backdrop'}
        onClick={() => setDrawerOpen(false)}
      />

      <aside className={drawerOpen ? 'drawer open' : 'drawer'} aria-hidden={!drawerOpen}>
        <div className="drawer-head">
          <strong>{session.role === 'admin' ? 'Admin menu' : 'Menu'}</strong>
          <button type="button" className="icon-button close" onClick={() => setDrawerOpen(false)}>
            ×
          </button>
        </div>
        <nav className="drawer-nav">
          {drawerItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={activeSection === item.id ? 'active' : ''}
              onClick={() => handleSectionAction(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="dashboard">
        <section className="page-hero hero-panel">
          <div className="hero-copy">
            <span className="eyebrow">{activePage.eyebrow}</span>
            <h1>{activePage.title}</h1>
            <p>{activePage.description}</p>
            <div className="page-actions">
              <button
                type="button"
                className="button primary"
                onClick={() => handleNavigate(activeSection === 'home' ? 'types' : 'home')}
              >
                {activeSection === 'home' ? 'Open menu' : 'Back to home'}
              </button>
              <button
                type="button"
                className="button ghost"
                onClick={() => handleNavigate('account')}
              >
                My account
              </button>
            </div>
          </div>

          <div className="hero-stats">
            <article>
              <span>Visible dishes</span>
              <strong>{availableDishes.length}</strong>
            </article>
            <article>
              <span>Saved orders</span>
              <strong>{visibleOrders.length}</strong>
            </article>
            <article>
              <span>Cart total</span>
              <strong>{formatMoney(cartTotal)}</strong>
            </article>
          </div>
        </section>

        {alert && <div className="toast">{alert}</div>}

        {activeSection === 'home' && (
          <>
            <section className="panel">
              <div className="panel-head">
                <div>
                  <span className="section-label">Featured</span>
                  <h2>Fast access to popular dishes</h2>
                </div>
                <button type="button" className="button ghost" onClick={() => handleNavigate('types')}>
                  View full menu
                </button>
              </div>

              <div className="dish-grid">
                {availableDishes
                  .filter((dish) => dish.featured)
                  .slice(0, 3)
                  .map((dish) => (
                    <article key={dish.id} className="dish-card" onClick={() => setSelectedDishId(dish.id)}>
                      <div className="dish-top">
                        <div className="dish-emoji">{dish.emoji}</div>
                        <div className="dish-meta">
                          <span>{dish.category}</span>
                          <strong>{dish.name}</strong>
                        </div>
                        <span className="badge">Featured</span>
                      </div>
                      <p>{dish.description}</p>
                      <div className="dish-info">
                        <span>{formatMoney(dish.price)}</span>
                        <span>
                          {dish.available} {unitLabels[dish.unit].toLowerCase()}s
                        </span>
                      </div>
                      <div className="slot-list">
                        {dish.slots.map((slot) => (
                          <span key={slot}>{slot}</span>
                        ))}
                      </div>
                      <div className="dish-actions">
                        <button
                          type="button"
                          className="button ghost"
                          onClick={(event) => {
                            event.stopPropagation()
                            setSelectedDishId(dish.id)
                          }}
                        >
                          View details
                        </button>
                        <button
                          type="button"
                          className="button primary"
                          onClick={(event) => {
                            event.stopPropagation()
                            if (session.role === 'admin') {
                              startEditingDish(dish)
                            } else {
                              handleAddToCart(dish)
                            }
                          }}
                        >
                          {session.role === 'admin' ? 'Edit dish' : 'Add to cart'}
                        </button>
                        {session.role === 'admin' && (
                          <button
                            type="button"
                            className="button danger"
                            onClick={(event) => {
                              event.stopPropagation()
                              handleDeleteDish(dish.id)
                            }}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
              </div>
            </section>

            <section className="panel">
              <div className="panel-head">
                <div>
                  <span className="section-label">Overview</span>
                  <h2>Current activity</h2>
                </div>
              </div>

              <div className="summary-stack">
                <div>
                  <span>Menu categories</span>
                  <strong>{Object.keys(categoryGroups).length}</strong>
                </div>
                <div>
                  <span>Featured dishes</span>
                  <strong>{dishes.filter((dish) => dish.featured).length}</strong>
                </div>
                <div>
                  <span>Low stock items</span>
                  <strong>{dishes.filter((dish) => dish.available <= 10).length}</strong>
                </div>
              </div>
            </section>
          </>
        )}

        {activeSection === 'types' && (
          <>
            <section className="panel" id="types">
              <div className="panel-head">
                <div>
                  <span className="section-label">Catalog</span>
                  <h2>Available dishes</h2>
                </div>
                <p>{catalogDishes.length} dishes are visible right now.</p>
              </div>

              <div className="dish-grid">
                {catalogDishes.length > 0 ? (
                  catalogDishes.map((dish) => (
                    <article
                      key={dish.id}
                      className="dish-card"
                      onClick={() => setSelectedDishId(dish.id)}
                    >
                      <div className="dish-top">
                        <div className="dish-emoji">{dish.emoji}</div>
                        <div className="dish-meta">
                          <span>{dish.category}</span>
                          <strong>{dish.name}</strong>
                        </div>
                        {dish.featured && <span className="badge">Featured</span>}
                      </div>
                      <p>{dish.description}</p>
                      <div className="dish-info">
                        <span>{formatMoney(dish.price)}</span>
                        <span>
                          {dish.available} {unitLabels[dish.unit].toLowerCase()}s
                        </span>
                      </div>
                      <div className="slot-list">
                        {dish.slots.map((slot) => (
                          <span key={slot}>{slot}</span>
                        ))}
                      </div>
                      <div className="dish-actions">
                        {session.role === 'admin' ? (
                          <>
                            <button
                              type="button"
                              className="button ghost"
                              onClick={(event) => {
                                event.stopPropagation()
                                startEditingDish(dish)
                              }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="button danger"
                              onClick={(event) => {
                                event.stopPropagation()
                                handleDeleteDish(dish.id)
                              }}
                            >
                              Delete
                            </button>
                            <button
                              type="button"
                              className="button primary"
                              onClick={(event) => {
                                event.stopPropagation()
                                setSelectedDishId(dish.id)
                              }}
                            >
                              View details
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="button ghost"
                              onClick={(event) => {
                                event.stopPropagation()
                                setSelectedDishId(dish.id)
                              }}
                            >
                              View details
                            </button>
                            <button
                              type="button"
                              className="button primary"
                              onClick={(event) => {
                                event.stopPropagation()
                                handleAddToCart(dish)
                              }}
                            >
                              Add to cart
                            </button>
                          </>
                        )}
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="empty-state">
                    <h3>No matching dishes</h3>
                    <p>Try another search term or clear the search box to see the full live menu.</p>
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        {activeSection === 'orders' && (
          <>
            {session.role !== 'admin' && (
              <section className="panel">
                <div className="panel-head">
                  <div>
                    <span className="section-label">Checkout</span>
                    <h2>Choose slot and payment</h2>
                  </div>
                  <button type="button" className="button primary" onClick={handleCheckout}>
                    Generate token
                  </button>
                </div>

                {cart.length > 0 ? (
                  <div className="checkout-layout">
                    <div className="checkout-stack">
                      <div className="checkout-card">
                        <label>
                          Pickup time slot
                          <select
                            value={pickupSlot}
                            onChange={(event) => setPickupSlot(event.target.value)}
                          >
                            <option value="">Auto assign earliest slot</option>
                            {pickupSlotOptions.map((slot) => (
                              <option key={slot} value={slot}>
                                {slot}
                              </option>
                            ))}
                          </select>
                        </label>

                        <div className="payment-options">
                          <span>Payment method</span>
                          <div className="payment-choice-row">
                            {(Object.keys(paymentLabels) as PaymentMethod[]).map((method) => (
                              <button
                                key={method}
                                type="button"
                                className={paymentMethod === method ? 'choice active' : 'choice'}
                                onClick={() => setPaymentMethod(method)}
                              >
                                {paymentLabels[method]}
                              </button>
                            ))}
                          </div>
                        </div>

                        <p className="checkout-note">
                          Cash payments stay pending until the counter confirms them. UPI and card
                          are marked paid immediately.
                        </p>
                      </div>

                      <div className="cart-panel">
                        {cart.map((item) => {
                          const dish = dishes.find((entry) => entry.id === item.dishId)
                          if (!dish) return null

                          return (
                            <div key={item.dishId} className="cart-row">
                              <div>
                                <strong>{dish.name}</strong>
                                <span>
                                  {unitLabels[dish.unit]} • {formatMoney(dish.price)}
                                </span>
                              </div>
                              <div className="cart-controls">
                                <button
                                  type="button"
                                  className="stepper"
                                  onClick={() => handleCartChange(item.dishId, -1)}
                                >
                                  -
                                </button>
                                <span>{item.quantity}</span>
                                <button
                                  type="button"
                                  className="stepper"
                                  onClick={() => handleCartChange(item.dishId, 1)}
                                >
                                  +
                                </button>
                                <button
                                  type="button"
                                  className="button ghost"
                                  onClick={() => handleRemoveFromCart(item.dishId)}
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          )
                        })}

                        <div className="summary-row">
                          <span>Total</span>
                          <strong>{formatMoney(cartTotal)}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="checkout-summary">
                      <div>
                        <span>Pickup slot</span>
                        <strong>{pickupSlot || pickupSlotOptions[0] || 'Auto assigned'}</strong>
                      </div>
                      <div>
                        <span>Payment</span>
                        <strong>{paymentLabels[paymentMethod]}</strong>
                      </div>
                      <div>
                        <span>Items</span>
                        <strong>{cartCount}</strong>
                      </div>
                      <div>
                        <span>Token total</span>
                        <strong>{formatMoney(cartTotal)}</strong>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="empty-state">
                    <h3>Your cart is empty</h3>
                    <p>Add dishes from the menu to generate an online token.</p>
                  </div>
                )}
              </section>
            )}

            <section className="panel">
              <div className="panel-head">
                <div>
                  <span className="section-label">Orders</span>
                  <h2>Saved tokens</h2>
                </div>
              </div>

              <div className="order-list">
                {visibleOrders.length > 0 ? (
                  visibleOrders.map((order) => (
                    <article key={order.id} className="order-card">
                      <div className="order-head">
                        <div>
                          <strong>{order.token}</strong>
                          <span>{order.customerName}</span>
                        </div>
                        <span className="badge">{order.status}</span>
                      </div>
                      <div className="order-meta">
                        <span>{new Date(order.createdAt).toLocaleString()}</span>
                        <span>{order.pickupSlot}</span>
                        <span>
                          {paymentLabels[order.paymentMethod]} • {order.paymentStatus}
                        </span>
                      </div>
                      <ul>
                        {order.items.map((item) => (
                          <li key={`${order.id}-${item.dishId}`}>
                            {item.name} x{item.quantity} ({unitLabels[item.unit]})
                          </li>
                        ))}
                      </ul>
                      <div className="summary-row">
                        <span>Total paid</span>
                        <strong>{formatMoney(order.total)}</strong>
                      </div>
                      <div className="status-row">
                        <span
                          className={
                            order.paymentStatus === 'Paid' ? 'status paid' : 'status pending'
                          }
                        >
                          {order.paymentStatus}
                        </span>
                        <span
                          className={
                            order.status === 'Done'
                              ? 'status done'
                              : order.status === 'Prepared'
                                ? 'status prepared'
                                : 'status pending'
                          }
                        >
                          {order.status}
                        </span>
                      </div>
                      <div className="dish-actions">
                        {order.status === 'Prepared' && (
                          <button
                            type="button"
                            className="button primary"
                            onClick={() => handleMarkReceived(order.id)}
                          >
                            Mark received
                          </button>
                        )}
                        {order.status === 'Done' && (
                          <span className="status-label">Order received by user</span>
                        )}
                        <button
                          type="button"
                          className="button ghost"
                          onClick={() => handleDeleteOrder(order.id)}
                        >
                          Delete order
                        </button>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="empty-state">
                    <h3>No orders yet</h3>
                    <p>Generated tokens will appear here after checkout.</p>
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        {activeSection === 'transactions' && (
          <>
            <section className="panel">
              <div className="panel-head">
                <div>
                  <span className="section-label">Quick summary</span>
                  <h2>Current menu and activity</h2>
                </div>
              </div>

              <div className="summary-stack">
                <div>
                  <span>Active categories</span>
                  <strong>{Object.keys(categoryGroups).length}</strong>
                </div>
                <div>
                  <span>Featured dishes</span>
                  <strong>{dishes.filter((dish) => dish.featured).length}</strong>
                </div>
                <div>
                  <span>Recent orders</span>
                  <strong>{visibleOrders.length}</strong>
                </div>
              </div>
            </section>

            <section className="panel">
              <div className="panel-head">
                <div>
                  <span className="section-label">Transactions</span>
                  <h2>Recent tokens</h2>
                </div>
              </div>

              <div className="mini-list">
                {visibleOrders.length > 0 ? (
                  visibleOrders.slice(0, 4).map((order) => (
                    <div key={order.id} className="mini-item">
                      <div>
                        <strong>{order.token}</strong>
                        <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                      </div>
                      <span>{formatMoney(order.total)}</span>
                    </div>
                  ))
                ) : (
                  <p>No transaction history yet.</p>
                )}
              </div>
            </section>
          </>
        )}

        {activeSection === 'settings' && (
          <>
            {session.role === 'admin' && (
              <section className="panel" id="admin-tools">
                <div className="panel-head">
                  <div>
                    <span className="section-label">Admin tools</span>
                    <h2>{editingDishId ? 'Edit dish' : 'Add dish to live menu'}</h2>
                  </div>
                  <div className="header-actions">
                    {editingDishId && (
                      <button type="button" className="button ghost" onClick={resetDishForm}>
                        Cancel edit
                      </button>
                    )}
                    <button type="button" className="button ghost" onClick={openNewDishForm}>
                      Add new dish
                    </button>
                  </div>
                </div>

                <form className="dish-form" onSubmit={handleDishSubmit}>
                  <label>
                    Dish name
                    <input
                      value={dishDraft.name}
                      onChange={(event) => handleDishDraftChange('name', event.target.value)}
                      placeholder="Paneer Wrap"
                    />
                  </label>

                  <label>
                    Category
                    <input
                      value={dishDraft.category}
                      onChange={(event) => handleDishDraftChange('category', event.target.value)}
                      placeholder="Lunch"
                    />
                  </label>

                  <label>
                    Price
                    <input
                      type="number"
                      min="0"
                      value={dishDraft.price}
                      onChange={(event) => handleDishDraftChange('price', event.target.value)}
                      placeholder="55"
                    />
                  </label>

                  <label>
                    Quantity available
                    <input
                      type="number"
                      min="0"
                      value={dishDraft.available}
                      onChange={(event) => handleDishDraftChange('available', event.target.value)}
                      placeholder="20"
                    />
                  </label>

                  <label>
                    Unit
                    <select
                      value={dishDraft.unit}
                      onChange={(event) => handleDishDraftChange('unit', event.target.value as Unit)}
                    >
                      <option value="plate">Plate</option>
                      <option value="piece">Piece</option>
                      <option value="cup">Cup</option>
                    </select>
                  </label>

                  <label>
                    Dish icon
                    <input
                      value={dishDraft.emoji}
                      onChange={(event) => handleDishDraftChange('emoji', event.target.value)}
                      placeholder="🍲"
                    />
                  </label>

                  <label className="wide">
                    Description
                    <textarea
                      value={dishDraft.description}
                      onChange={(event) => handleDishDraftChange('description', event.target.value)}
                      placeholder="Short dish description that will appear in the product card"
                    />
                  </label>

                  <label className="wide">
                    Time slots
                    <input
                      value={dishDraft.slots}
                      onChange={(event) => handleDishDraftChange('slots', event.target.value)}
                      placeholder="7:30 AM - 10:00 AM, 11:30 AM - 2:00 PM"
                    />
                  </label>

                  <label className="checkbox">
                    <input
                      type="checkbox"
                      checked={dishDraft.featured}
                      onChange={(event) => handleDishDraftChange('featured', event.target.checked)}
                    />
                    Highlight as featured
                  </label>

                  <button className="button primary wide" type="submit">
                    {editingDishId ? 'Update dish' : 'Publish dish'}
                  </button>
                </form>
              </section>
            )}

            <section className="panel">
              <div className="panel-head">
                <div>
                  <span className="section-label">Preferences</span>
                  <h2>Saved settings</h2>
                </div>
              </div>
              <div className="settings-grid">
                <article>
                  <strong>Auto save</strong>
                  <p>Dishes, users, sessions, and orders stay in local storage during this demo.</p>
                </article>
                <article>
                  <strong>Pickup workflow</strong>
                  <p>Orders generate a token and move to the orders list after checkout.</p>
                </article>
                <article>
                  <strong>Search behavior</strong>
                  <p>Suggestions are debounced and limited to dishes that are actually available.</p>
                </article>
              </div>
            </section>
          </>
        )}

        {activeSection === 'about' && (
          <section className="panel info-panel">
            <div className="panel-head">
              <div>
                <span className="section-label">About us</span>
                <h2>Built for campus canteen ordering</h2>
              </div>
            </div>
            <p>
              This frontend prototype is designed for a college canteen where the admin publishes
              live menu availability and students or faculty place orders without standing in a
              queue.
            </p>
          </section>
        )}

        {activeSection === 'contact' && (
          <section className="panel info-panel">
            <div className="panel-head">
              <div>
                <span className="section-label">Contact help</span>
                <h2>Need support?</h2>
              </div>
            </div>
            <div className="contact-grid">
              <article>
                <strong>Email</strong>
                <p>canteen-support@college.edu</p>
              </article>
              <article>
                <strong>Phone</strong>
                <p>+91 90000 00000</p>
              </article>
              <article>
                <strong>Hours</strong>
                <p>7:00 AM to 7:00 PM</p>
              </article>
            </div>
          </section>
        )}

        {activeSection === 'account' && (
          <>
            <section className="panel info-panel">
              <div className="panel-head">
                <div>
                  <span className="section-label">My account</span>
                  <h2>Logged in as {session.fullName}</h2>
                </div>
              </div>
              <div className="account-grid">
                <article>
                  <strong>Role</strong>
                  <p>{session.role}</p>
                </article>
                <article>
                  <strong>Email</strong>
                  <p>{session.email}</p>
                </article>
                <article>
                  <strong>Status</strong>
                  <p>Online</p>
                </article>
              </div>
            </section>

            {session.role === 'admin' && (
              <section className="panel info-panel">
                <div className="panel-head">
                  <div>
                    <span className="section-label">Admin orders</span>
                    <h2>User orders and preparation status</h2>
                  </div>
                  <div className="account-summary">
                    <span>
                      Pending{' '}
                      <strong>{orders.filter((order) => order.status === 'Preparing').length}</strong>
                    </span>
                    <span>
                      Prepared{' '}
                      <strong>{orders.filter((order) => order.status === 'Prepared').length}</strong>
                    </span>
                    <span>
                      Done <strong>{orders.filter((order) => order.status === 'Done').length}</strong>
                    </span>
                  </div>
                </div>

                <div className="filter-row" role="tablist" aria-label="Admin order filters">
                  <button
                    type="button"
                    className={adminOrderFilter === 'all' ? 'choice active' : 'choice'}
                    onClick={() => setAdminOrderFilter('all')}
                  >
                    All ({orders.length})
                  </button>
                  <button
                    type="button"
                    className={adminOrderFilter === 'Preparing' ? 'choice active' : 'choice'}
                    onClick={() => setAdminOrderFilter('Preparing')}
                  >
                    Preparing ({orders.filter((order) => order.status === 'Preparing').length})
                  </button>
                  <button
                    type="button"
                    className={adminOrderFilter === 'Prepared' ? 'choice active' : 'choice'}
                    onClick={() => setAdminOrderFilter('Prepared')}
                  >
                    Prepared ({orders.filter((order) => order.status === 'Prepared').length})
                  </button>
                  <button
                    type="button"
                    className={adminOrderFilter === 'Done' ? 'choice active' : 'choice'}
                    onClick={() => setAdminOrderFilter('Done')}
                  >
                    Done ({orders.filter((order) => order.status === 'Done').length})
                  </button>
                </div>

                <div className="admin-order-list">
                  {adminOrders.length > 0 ? (
                    adminOrders.map((order) => (
                      <article key={order.id} className="order-card admin-order-card">
                        <div className="order-head">
                          <div>
                            <strong>{order.token}</strong>
                            <span>{order.customerName}</span>
                          </div>
                          <span className="badge">{order.status}</span>
                        </div>
                        <div className="order-meta">
                          <span>{new Date(order.createdAt).toLocaleString()}</span>
                          <span>{order.pickupSlot}</span>
                          <span>{paymentLabels[order.paymentMethod]}</span>
                        </div>
                        <ul>
                          {order.items.map((item) => (
                            <li key={`${order.id}-${item.dishId}`}>
                              {item.name} x{item.quantity} ({unitLabels[item.unit]})
                            </li>
                          ))}
                        </ul>
                        <div className="summary-row">
                          <span>Total</span>
                          <strong>{formatMoney(order.total)}</strong>
                        </div>
                        <div className="dish-actions">
                          {order.status === 'Preparing' && (
                            <button
                              type="button"
                              className="button primary"
                              onClick={() => handleMarkPrepared(order.id)}
                            >
                              Mark prepared
                            </button>
                          )}
                          <button
                            type="button"
                            className="button ghost"
                            onClick={() => handleDeleteOrder(order.id)}
                          >
                            Delete order
                          </button>
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="empty-state">
                      <h3>No matching orders</h3>
                      <p>Switch the filter or wait for more student and faculty orders.</p>
                    </div>
                  )}
                </div>
              </section>
            )}
          </>
        )}

        <footer className="site-footer">
          <div>
            <strong>College Canteen</strong>
            <p>Live dish updates, online tokens, and a faster pickup flow.</p>
          </div>
          <p>
            Logged in as {session.fullName} • {session.role} • {cartCount} item cart
          </p>
        </footer>
      </main>

      {selectedDish && (
        <div className="modal-backdrop" onClick={() => setSelectedDishId(null)}>
          <article
            className="modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={selectedDish.name}
          >
            <button
              type="button"
              className="icon-button close modal-close"
              onClick={() => setSelectedDishId(null)}
            >
              ×
            </button>
            <div className="modal-head">
              <div className="dish-emoji large">{selectedDish.emoji}</div>
              <div>
                <span className="section-label">{selectedDish.category}</span>
                <h2>{selectedDish.name}</h2>
                <p>{selectedDish.description}</p>
              </div>
            </div>

            <div className="modal-grid">
              <div>
                <strong>Price</strong>
                <p>{formatMoney(selectedDish.price)}</p>
              </div>
              <div>
                <strong>Available</strong>
                <p>
                  {selectedDish.available} {unitLabels[selectedDish.unit].toLowerCase()}
                  {selectedDish.available === 1 ? '' : 's'}
                </p>
              </div>
              <div>
                <strong>Unit</strong>
                <p>{unitLabels[selectedDish.unit]}</p>
              </div>
              <div>
                <strong>Slots</strong>
                <p>{selectedDish.slots.join(' · ')}</p>
              </div>
            </div>

            <div className="dish-actions modal-actions">
              <button type="button" className="button ghost" onClick={() => setSelectedDishId(null)}>
                Close
              </button>
              {session.role !== 'admin' && (
                <button
                  type="button"
                  className="button primary"
                  onClick={() => {
                    handleAddToCart(selectedDish)
                    setSelectedDishId(null)
                  }}
                >
                  Add to cart
                </button>
              )}
            </div>
          </article>
        </div>
      )}
    </div>
  )
}

export default App

"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { useSearchParams } from 'next/navigation'
import { QRCodeScanner } from "@/components/QRCodeScanner"
import {
  ArrowLeft,
  Search,
  ShoppingCart,
  Star,
  X,
  Minus,
  Plus,
  CheckCircle,
  CreditCard,
  Smartphone,
  Wallet,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"

const mockFoodData = [
  {
    id: "P00001",
    h: "Margherita Pizza",
    op: 45000,
    dp: 45000,
    ct: "PIZZA",
    veg: true,
    bestSeller: true,
    i: "/margherita-pizza.png",
    wt: "350g",
    en: "520 kcal",
  },
  {
    id: "P00002",
    h: "Chicken Caesar Salad",
    op: 38000,
    dp: 38000,
    ct: "SALAD",
    veg: false,
    bestSeller: false,
    i: "/chicken-caesar-salad.png",
    wt: "280g",
    en: "420 kcal",
    customizable: true,
    comboItems: [
      { name: "Grilled Chicken Breast", calories: "180 kcal" },
      { name: "Fresh Romaine Lettuce", calories: "15 kcal" },
      { name: "Caesar Dressing", calories: "120 kcal" },
    ],
    addOns: [
      { id: "extra-chicken", name: "Extra Chicken", price: 8000 },
      { id: "extra-cheese", name: "Extra Parmesan", price: 5000 },
    ],
  },
  {
    id: "P00003",
    h: "Truffle Mushroom Pasta",
    op: 52000,
    dp: 52000,
    ct: "PASTA",
    veg: true,
    bestSeller: true,
    i: "/truffle-mushroom-pasta.jpg",
    wt: "320g",
    en: "680 kcal",
  },
  {
    id: "P00004",
    h: "Grilled Salmon Bowl",
    op: 65000,
    dp: 65000,
    ct: "BOWL",
    veg: false,
    bestSeller: false,
    i: "/grilled-salmon-bowl.jpg",
    wt: "400g",
    en: "580 kcal",
  },
  {
    id: "P00005",
    h: "Gourmet Burger",
    op: 42000,
    dp: 42000,
    ct: "BURGER",
    veg: false,
    bestSeller: true,
    i: "/gourmet-burger.png",
    wt: "380g",
    en: "720 kcal",
    customizable: true,
    comboItems: [
      { name: "Beef Patty", calories: "280 kcal" },
      { name: "Brioche Bun", calories: "180 kcal" },
      { name: "Fresh Vegetables", calories: "25 kcal" },
    ],
    addOns: [
      { id: "extra-patty", name: "Extra Patty", price: 15000 },
      { id: "bacon", name: "Crispy Bacon", price: 8000 },
    ],
  },
  {
    id: "P00006",
    h: "Mediterranean Wrap",
    op: 35000,
    dp: 35000,
    ct: "WRAP",
    veg: true,
    bestSeller: false,
    i: "/mediterranean-wrap.png",
    wt: "250g",
    en: "480 kcal",
  },
]

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image: string
  addOns?: string[]
}

export default function FoodListingPage() {
  const [vegFilter, setVegFilter] = useState(false)
  const [nonVegFilter, setNonVegFilter] = useState(false)
  const [bestsellerFilter, setBestsellerFilter] = useState(false)
  const [cart, setCart] = useState<CartItem[]>([])
  const [showItemModal, setShowItemModal] = useState<string | null>(null)
  const [showCart, setShowCart] = useState(false)
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([])
  const [showCheckout, setShowCheckout] = useState(false)
  const [showPhoneVerification, setShowPhoneVerification] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isRobotChecked, setIsRobotChecked] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("card")
  const [cardNumber, setCardNumber] = useState("")
  const [expiryDate, setExpiryDate] = useState("")
  const [cvv, setCvv] = useState("")
  const [cardholderName, setCardholderName] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [showSearch, setShowSearch] = useState(false)
  const filtersContainerRef = useRef<HTMLDivElement>(null)
  const [location, setLocation] = useState<{city: string; state: string; lat: number; lon: number} | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [foodData, setFoodData] = useState<any[]>([])
  // Show QR scanner by default if no outletId in URL
  const [showQRScanner, setShowQRScanner] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return !params.has('outletId');
    }
    return false;
  })
  const searchParams = useSearchParams()
  const [outletId, setOutletId] = useState<string | null>(null)

  // Add OTP state
  const [otp, setOtp] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [verificationInProgress, setVerificationInProgress] = useState(false)

  // Close Order Summary if cart becomes empty
  useEffect(() => {
    if (showCheckout && cart.length === 0) {
      setShowCheckout(false)
    }
  }, [cart, showCheckout])

  useEffect(() => {
    // Don't fetch data if we're showing the QR scanner
    if (showQRScanner) return;
    
    // Check for URL parameters
    const urlOutletId = searchParams.get('outletId')
    const urlLat = searchParams.get('lat')
    const urlLon = searchParams.get('lon')
    const urlCity = searchParams.get('city')
    const urlState = searchParams.get('state')

    if (urlOutletId) {
      setOutletId(urlOutletId)
      
      // If we have coordinates in URL, use them
      if (urlLat && urlLon) {
        fetchFoodData({
          city: urlCity || '',
          state: urlState || '',
          lat: parseFloat(urlLat),
          lon: parseFloat(urlLon)
        })
      } else {
        // Otherwise, try to get current location
        getLocationAndFetchData(urlOutletId)
      }
    } else if (navigator.geolocation) {
      // No outlet ID in URL, check for geolocation
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          
          // Use a reverse geocoding service to get city and state
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`)
            .then(response => response.json())
            .then(data => {
              const address = data.address || {}
              const city = address.city || address.town || address.village || ''
              const state = address.state || ''
              
              // Now fetch food data with location
              fetchFoodData({
                city,
                state,
                lat: latitude,
                lon: longitude
              })
            })
            .catch(err => {
              console.error('Error getting address:', err)
              // Continue with just coordinates if address lookup fails
              fetchFoodData({
                city: '',
                state: '',
                lat: latitude,
                lon: longitude
              })
            })
        },
        (err) => {
          console.error('Error getting location:', err)
          // If user denies location, fetch without it
          fetchFoodData({
            city: '',
            state: '',
            lat: 0,
            lon: 0
          })
        }
      )
    } else {
      // If geolocation is not available, fetch without location
      fetchFoodData({
        city: '',
        state: '',
        lat: 0,
        lon: 0
      })
    }
  }, [])

  const getLocationAndFetchData = (outletId: string) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          
          // Use a reverse geocoding service to get city and state
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`)
            .then(response => response.json())
            .then(data => {
              const address = data.address || {}
              const city = address.city || address.town || address.village || ''
              const state = address.state || ''
              
              // Now fetch food data with location
              fetchFoodData({
                city,
                state,
                lat: latitude,
                lon: longitude
              }, outletId)
            })
            .catch(err => {
              console.error('Error getting address:', err)
              // Continue with just coordinates if address lookup fails
              fetchFoodData({
                city: '',
                state: '',
                lat: latitude,
                lon: longitude
              }, outletId)
            })
        },
        (err) => {
          console.error('Error getting location:', err)
          // If user denies location, fetch without it
          fetchFoodData({
            city: '',
            state: '',
            lat: 0,
            lon: 0
          }, outletId)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      )
    } else {
      // If geolocation is not available, fetch without location
      fetchFoodData({
        city: '',
        state: '',
        lat: 0,
        lon: 0
      }, outletId)
    }
  }

  const fetchFoodData = async (locationData: {city: string; state: string; lat: number; lon: number}, outletIdParam?: string) => {
    try {
      setLoading(true)
      const currentDate = new Date().toISOString()
      const outletIdToUse = outletIdParam || outletId || '200' // Default to 200 if no outlet ID
      
      const response = await fetch('https://foodie-backend-786353173154.us-central1.run.app/api/getOutletFood', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          platform: 'web',
          country: 'India',
          city: locationData.city,
          state: locationData.state,
          lat: locationData.lat,
          lon: locationData.lon,
          outletid: parseInt(outletIdToUse, 10),
          foodCategory: searchParams.get('category') || '',
          date: currentDate,
        }),
        mode: 'cors',
        credentials: 'omit'
      })

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`)
      }

      const data = await response.json()
      console.log('API Response:', data)
      
      if (data.status === 200 && data.output && Array.isArray(data.output.r)) {
        // Remove duplicates by creating a Map with item.id as the key
        const uniqueItems = Array.from(new Map(
          data.output.r.map((item: any) => [item.id, item])
        ).values())
        
        setFoodData(uniqueItems)
      } else {
        setError("No food items available at the moment.")
        setFoodData([])
      }
    } catch (err) {
      console.error("Error fetching food data:", err)
      setError("Failed to load menu. Please try again later.")
      setFoodData([])
    } finally {
      setLoading(false)
    }
  }

  // Function to scroll filter into view
  const scrollFilterIntoView = (element: HTMLElement | null) => {
    if (!element || !filtersContainerRef.current) return
    
    const container = filtersContainerRef.current
    const containerWidth = container.offsetWidth
    const containerLeft = container.scrollLeft
    const containerRight = containerLeft + containerWidth
    
    const elementLeft = element.offsetLeft
    const elementRight = elementLeft + element.offsetWidth
    const elementWidth = element.offsetWidth
    
    // Calculate the center position
    const scrollTo = elementLeft - (containerWidth / 2) + (elementWidth / 2)
    
    // Smooth scroll to center the element
    container.scrollTo({
      left: scrollTo,
      behavior: 'smooth'
    })
  }

  // Effect to scroll to active filter when it changes
  useEffect(() => {
    if (!filtersContainerRef.current) return
    
    const activeFilter = filtersContainerRef.current.querySelector<HTMLElement>(
      '.bg-primary, [data-active-veg="true"], [data-active-nonveg="true"]'
    )
    
    if (activeFilter) {
      // Small timeout to ensure the DOM has updated
      setTimeout(() => {
        scrollFilterIntoView(activeFilter)
      }, 50)
    }
  }, [vegFilter, nonVegFilter, selectedCategories])

  const categories = Array.from(new Set((foodData || []).flatMap((item: any) => item.ct ? [item.ct] : [])))

  const formatPrice = (price: number) => {
    // Prices are already in paise (e.g., 45000 = ₹450)
    return `₹${(price / 100).toFixed(2)}`
  }

  const categoryIcons: Record<string, JSX.Element> = {
    'PIZZA': <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>,
    'SALAD': <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"/><path d="M18 13H6"/></svg>,
    'PASTA': <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3.5h-.5z"/></svg>,
    'BURGER': <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12c-2.5 0-4.5-2-4.5-4.5S9.5 3 12 3s4.5 2 4.5 4.5-2 4.5-4.5 4.5z"/><path d="M18.5 10h-13a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1z"/></svg>,
    'BOWL': <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z"/><path d="M5.5 12h13"/></svg>,
    'WRAP': <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M18 6H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2z"/><path d="M6 6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V6z"/></svg>,
  }

  const getCategoryIcon = (category: string) => {
    return categoryIcons[category] || <span className="h-4 w-4">•</span>
  }

  const filteredItems = foodData?.filter((item: any) => {
    const matchesSearch = item.h.toLowerCase().includes(searchQuery.toLowerCase())
    
    // If no category is selected, show all items
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(item.ct)
    
    // Only apply veg/non-veg filter if a category is not selected
    const shouldApplyVegFilter = selectedCategories.length === 0 && vegFilter
    const shouldApplyNonVegFilter = selectedCategories.length === 0 && nonVegFilter
    
    const matchesVeg = !shouldApplyVegFilter || item.veg
    const matchesNonVeg = !shouldApplyNonVegFilter || !item.veg
    
    return matchesSearch && matchesCategory && matchesVeg && matchesNonVeg
  })

  const addToCart = (item: any, addOns: string[] = []) => {
    setCart((prev) => {
      const cartItemId = `${item.id}-${addOns.sort().join("-")}`
      const existing = prev.find((cartItem) => cartItem.id === cartItemId)

      // Start with the base price in paise
      let totalPrice = item.dp
      
      // Add any add-ons prices (also in paise)
      if (item.addOns && addOns.length > 0) {
        const addOnPrice = addOns.reduce((sum, addOnId) => {
          const addOn = item.addOns.find((ao: any) => ao.id === addOnId)
          return sum + (addOn ? addOn.price : 0)
        }, 0)
        totalPrice += addOnPrice
      }

      if (existing) {
        return prev.map((cartItem) =>
          cartItem.id === cartItemId ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem,
        )
      }
      return [
        ...prev,
        {
          id: cartItemId,
          name: item.h,
          price: totalPrice,
          quantity: 1,
          image: item.i, // This is the image URL from the API
          addOns,
        },
      ]
    })
  }

  const handleAddClick = (item: any) => {
    setShowItemModal(item.id)
    setSelectedAddOns([])
  }

  const getModalTotalPrice = (item: any) => {
    let total = item.dp
    if (item.addOns && selectedAddOns.length > 0) {
      const addOnPrice = selectedAddOns.reduce((sum, addOnId) => {
        const addOn = item.addOns.find((ao: any) => ao.id === addOnId)
        return sum + (addOn ? addOn.price : 0)
      }, 0)
      total += addOnPrice
    }
    return total
  }

  const updateCartItemQuantity = (cartItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart((prev) => prev.filter((item) => item.id !== cartItemId))
    } else {
      setCart((prev) => prev.map((item) => (item.id === cartItemId ? { ...item, quantity: newQuantity } : item)))
    }
  }

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  const handleCartClick = () => {
    if (cart.length > 0) {
      setShowCart(true)
    }
  }

  const proceedToCheckout = () => {
    setShowCart(false)
    setShowCheckout(true)
  }

  const proceedToPhoneVerification = () => {
    setShowCheckout(false)
    setShowPhoneVerification(true)
  }

  const proceedToPayment = () => {
    if (phoneNumber && isRobotChecked) {
      setShowPhoneVerification(false)
      setShowPayment(true)
    }
  }

  // Function to handle OTP submission
  const handleOtpSubmit = () => {
    if (otp.length < 4) {
      // Show error or validation message
      return
    }
    setVerificationInProgress(true)
    
    // Simulate OTP verification
    setTimeout(() => {
      setVerificationInProgress(false)
      setShowPhoneVerification(false)
      setShowPayment(true)
      setOtpSent(false)
      setOtp("")
    }, 1000)
  }

  // Function to handle sending OTP
  const handleSendOtp = () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      // Show error or validation message
      return
    }
    setOtpSent(true)
    // In a real app, you would call an API to send OTP here
  }

  const handlePayment = () => {
    // Handle payment logic here
    alert("Payment successful! Your order has been placed.")
    // Reset all states
    setCart([])
    setShowPayment(false)
    setShowCheckout(false)
    setShowPhoneVerification(false)
    setPhoneNumber("")
    setIsRobotChecked(false)
    setSelectedPaymentMethod("card")
    setCardNumber("")
    setExpiryDate("")
    setCvv("")
    setCardholderName("")
  }

  const currentModalItem = foodData.find((item: any) => item.id === showItemModal)

  const getCartItemQuantity = (itemId: string) => {
    // Sum quantities of all variations of this item (with different add-ons)
    const baseId = getBaseCartItemId(itemId)
    return cart.reduce((total, cartItem) => {
      if (cartItem.id.startsWith(baseId)) {
        return total + cartItem.quantity
      }
      return total
    }, 0)
  }

  const getBaseCartItemId = (itemId: string) => {
    return `${itemId}-` // ID format for base item without add-ons
  }

  // Add a function to format time in IST
  const getDeliveryTime = () => {
    const now = new Date()
    // Add 15 minutes
    const deliveryTime = new Date(now.getTime() + 15 * 60000)
    
    // Format time in 12-hour format with AM/PM
    const hours = deliveryTime.getHours()
    const minutes = deliveryTime.getMinutes()
    const ampm = hours >= 12 ? 'PM' : 'AM'
    const formattedHours = hours % 12 || 12 // Convert 0 to 12 for 12-hour format
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes
    
    // Get day name
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const dayName = days[deliveryTime.getDay()]
    
    return {
      time: `${formattedHours}:${formattedMinutes} ${ampm}`,
      day: dayName
    }
  }

  // Add these states near the top with other state declarations
  const [showPaymentMethod, setShowPaymentMethod] = useState(true)
  const [showUpiApps, setShowUpiApps] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [selectedUpiApp, setSelectedUpiApp] = useState<string | null>(null)

  // UPI Apps data
  const upiApps = [
    { id: 'gpay', icon: '/gpay.svg' },
    { id: 'phonepe', icon: '/phonepe.png' },
    { id: 'paytm', icon: '/paytm.png' },
    { id: 'other', icon: '/upi.png' },
  ]

  // Handle payment method selection
  const handlePaymentMethodSelect = (method: string) => {
    setSelectedPaymentMethod(method)
    
    if (method === 'paylater') {
      // For pay later, show success animation after a delay
      setShowPaymentMethod(false)
      setPaymentSuccess(true)
      setTimeout(() => {
        handlePaymentSuccess()
      }, 2000)
    } else if (method === 'upi') {
      setShowUpiApps(true)
    }
  }

  // Handle UPI app selection
  const handleUpiAppSelect = (appId: string) => {
    setSelectedUpiApp(appId)
    
    // Get total price in paise (e.g., 45000 = ₹450)
    const totalInPaise = getTotalPrice()
    // Convert to rupees by dividing by 100
    const amountInRupees = (totalInPaise / 100).toFixed(2)
    
    // Debug logs
    console.log('Cart items:', cart)
    console.log('Total in paise:', totalInPaise)
    console.log('Amount in rupees:', amountInRupees)
    console.log('Amount being sent to UPI:', amountInRupees)
    
    // UPI deep links
    const merchantName = 'Foodie%20Restaurant' // URL-encoded merchant name
    const transactionNote = 'Food%20Order%20Payment'
    
    const upiLinks = {
      gpay: `tez://upi/pay?pa=devanshsaxena1019-1@okicici&pn=${merchantName}&am=${amountInRupees}&cu=INR&tn=${transactionNote}`,
      phonepe: `phonepe://pay?pa=devanshsaxena1019-1@okicici&pn=${merchantName}&am=${amountInRupees}&cu=INR&tn=${transactionNote}`,
      other: `upi://pay?pa=devanshsaxena1019-1@okicici&pn=${merchantName}&am=${amountInRupees}&cu=INR&tn=${transactionNote}`
    }

    // Open the selected UPI app
    const upiLink = upiLinks[appId as keyof typeof upiLinks] || upiLinks.other
    
    // Try to open the UPI app
    window.location.href = upiLink
    
    // Fallback: If UPI app not installed, show success after delay
    setTimeout(() => {
      if (document.hidden) return // If app opened successfully
      
      // If still on page, show success animation
      setPaymentSuccess(true)
      setTimeout(() => {
        handlePaymentSuccess()
      }, 2000)
    }, 500)
  }

  // Handle payment success
  const handlePaymentSuccess = () => {
    // In a real app, you would handle the successful payment here
    setShowPayment(false)
    setShowPhoneVerification(false)
    setPaymentSuccess(false)
    setShowUpiApps(false)
    setShowPaymentMethod(true)
    setCart([])
    // Show success message or navigate to order confirmation
  }

  useEffect(() => {
    if (showPayment) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showPayment])

  return (
    <div className={`min-h-screen bg-background ${showPayment ? 'overflow-hidden' : ''}`}>
      {/* Payment Page */}
      {showPayment && (
        <div className="fixed inset-0 bg-background z-50 overflow-y-auto">
          <div className="bg-card border-b px-6 py-4 sticky top-0 z-20">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => setShowPayment(false)} className="p-2">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-semibold">Payment</h1>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="bg-card rounded-xl border p-6">
              <h3 className="font-semibold text-lg mb-4">Order Summary</h3>
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-muted-foreground text-sm">×{item.quantity}</span>
                    </div>
                    <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
                <div className="border-t pt-3 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total</span>
                    <span className="text-xl font-bold">{formatPrice(getTotalPrice())}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            {showPaymentMethod && !showUpiApps && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Select Payment Method</h3>
                
                {/* Pay After Food Option */}
                <div 
                  className={`bg-card rounded-xl border-2 p-4 cursor-pointer transition-all ${
                    selectedPaymentMethod === 'paylater' ? 'border-primary' : 'border-border'
                  }`}
                  onClick={() => handlePaymentMethodSelect('paylater')}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="bg-white rounded-full p-2 shadow-sm border">
                          <ShoppingCart className="h-5 w-5 text-gray-600" />
                        </div>
                        {cart.length > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {cart.reduce((total, item) => total + item.quantity, 0)}
                          </span>
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium">Pay After Food</h4>
                        <p className="text-sm text-muted-foreground">Pay at your table before leaving</p>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 ${
                      selectedPaymentMethod === 'paylater' ? 'border-primary bg-primary' : 'border-muted-foreground'
                    }`}>
                      {selectedPaymentMethod === 'paylater' && (
                        <div className="w-full h-full rounded-full bg-primary-foreground scale-50"></div>
                      )}
                    </div>
                  </div>
                </div>

                {/* UPI Payment Option - Disabled */}
                <div 
                  className="bg-muted/40 rounded-xl border-2 p-4 cursor-not-allowed border-border/50"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-muted p-2 rounded-lg">
                        <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-muted-foreground">UPI Payment</h4>
                          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Not available</span>
                        </div>
                        <p className="text-sm text-muted-foreground">Payment support is not active in this outlet</p>
                      </div>
                    </div>
                    <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30">
                      <div className="w-full h-full rounded-full bg-muted-foreground/20 scale-75"></div>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={() => {
                    if (selectedPaymentMethod === 'paylater') {
                      handlePaymentMethodSelect('paylater')
                    } else if (selectedPaymentMethod === 'upi') {
                      setShowUpiApps(true)
                    }
                  }}
                  className="w-full h-12 text-base font-semibold mt-6"
                >
                  {selectedPaymentMethod === 'paylater' ? 'Confirm Order' : 'Proceed to Pay'}
                </Button>
              </div>
            )}

            {/* UPI Apps Selection */}
            {showUpiApps && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setShowUpiApps(false)}
                    className="rounded-full"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <h3 className="font-semibold text-lg">Choose UPI App</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {upiApps.map((app) => (
                    <div 
                      key={app.id}
                      className="bg-card rounded-xl border p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleUpiAppSelect(app.id)}
                    >
                      <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center p-2 relative">
                        <Image
                          src={app.icon}
                          width={100}
                          height={100}
                          className="object-contain"
                          onError={(e) => {
                            // Fallback to placeholder if image fails to load
                            const target = e.target as HTMLImageElement
                            target.src = '/placeholder.svg'
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Success Animation */}
            {paymentSuccess && (
              <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-card rounded-2xl p-8 max-w-sm w-full mx-4 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    {selectedPaymentMethod === 'paylater' 
                      ? 'Order Confirmed!' 
                      : 'Payment Successful!'}
                  </h3>
                  <p className="text-muted-foreground">
                    {selectedPaymentMethod === 'paylater'
                      ? 'Your order has been placed. Enjoy your meal!'
                      : 'Your payment was successful. Enjoy your meal!'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {showPhoneVerification ? (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl w-full max-w-md p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Verify Phone Number</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setShowPhoneVerification(false)
                  setShowCheckout(true)
                  setOtpSent(false)
                  setOtp("")
                  setPhoneNumber("")
                  setShowCheckout(true);
                  setOtpSent(false);
                  setOtp("");
                  setPhoneNumber("");
                }}
                className="p-2"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="space-y-4">
              {!otpSent ? (
                <>
                  <div className="space-y-2">
                    <label htmlFor="phone" className="text-sm font-medium">
                      Enter your phone number
                    </label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Phone number"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="h-12 text-base"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-3 pt-2">
                    <Checkbox 
                      id="robot-check" 
                      checked={isRobotChecked} 
                      onCheckedChange={setIsRobotChecked} 
                    />
                    <label htmlFor="robot-check" className="text-sm font-medium">
                      I'm not a robot
                    </label>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    We've sent a verification code to +91{phoneNumber}
                  </p>
                  <Input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                      setOtp(value.slice(0, 6)); // Limit to 6 digits
                    }}
                    className="h-12 text-base text-center text-lg tracking-widest"
                    maxLength={6}
                  />
                  <p className="text-sm text-muted-foreground text-center">
                    Didn't receive code? <button 
                      className="text-primary font-medium"
                      onClick={handleSendOtp}
                    >
                      Resend
                    </button>
                  </p>
                </div>
              )}
            </div>
            
            <div className="pt-2">
              <Button
                onClick={otpSent ? handleOtpSubmit : handleSendOtp}
                disabled={verificationInProgress || !isRobotChecked || (otpSent ? !otp : !phoneNumber)}
                className="w-full h-12 text-base font-semibold"
              >
                {verificationInProgress ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Verifying...
                  </div>
                ) : otpSent ? (
                  'Verify OTP'
                ) : (
                  'Send OTP'
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : showCheckout ? (
        <div className="min-h-screen bg-background pb-24">
          <div className="bg-card border-b px-6 py-4 sticky top-0 z-20">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => setShowCheckout(false)} className="p-2">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-semibold">Order Summary</h1>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item.id} className="bg-card rounded-xl border p-4">
                  <div className="flex gap-4">
                    {(() => {
                          const baseId = item.id.split("-")[0];
                          const product = mockFoodData.find((p) => p.id === baseId);
                          return (
                            <div className="relative">
                              <img
                                src={item.image || "/placeholder.svg"}
                                alt={item.name}
                                className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                              />
                              {product && (
                                <img
                                  src={product.veg ? "/veg.png" : "/nonveg.png"}
                                  alt={product.veg ? "Veg" : "Non-Veg"}
                                  className="absolute top-1 left-1 w-4 h-4"
                                />
                              )}
                            </div>
                          );
                        })()}
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{item.name}</h3>
                            <span className="text-muted-foreground text-sm">×{item.quantity}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{item.addOns && item.addOns.length > 0 ? `Add-ons: ${item.addOns.join(", ")}` : ""}</p>
                        </div>
                        <span className="text-lg font-bold">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 bg-muted rounded-lg">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                            className="h-8 w-8 p-0"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="text-sm font-medium px-3">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                            className="h-8 w-8 p-0"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-card rounded-xl border p-6">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="h-px bg-border flex-1"></div>
                <span className="text-sm font-medium text-muted-foreground px-3">DELIVERY</span>
                <div className="h-px bg-border flex-1"></div>
              </div>
              <div className="bg-muted rounded-lg p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Deliver to table</h3>
                  <p className="text-sm text-muted-foreground">
                    {getDeliveryTime().day}, {getDeliveryTime().time} (approx.)
                  </p>
                </div>
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
            </div>

            <div className="bg-card rounded-xl border p-6">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="h-px bg-border flex-1"></div>
                <span className="text-sm font-medium text-muted-foreground px-3">BILL DETAILS</span>
                <div className="h-px bg-border flex-1"></div>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold">Food Total</span>
                <span className="text-xl font-bold">{formatPrice(getTotalPrice())}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">*Inclusive of all taxes</p>
            </div>
          </div>

          <div className="fixed bottom-0 left-0 right-0 bg-card border-t p-6">
            <Button onClick={proceedToPhoneVerification} className="w-full h-12 text-base font-semibold">
              Proceed
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-white border-b shadow-sm sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex items-start justify-between py-3">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Order Food</h1>
                  <p className="text-sm text-muted-foreground -mt-1">Fresh & Delicious</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowSearch(!showSearch)} 
                  className="p-2"
                >
                  <Search className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            {showSearch && (
              <div className="mt-3 mb-6 px-4">
              <Input
                  placeholder="Search for dishes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onBlur={() => { setShowSearch(false); setSearchQuery(""); }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      (e.target as HTMLInputElement).blur(); // closes keyboard
                      setShowSearch(false);
                      setSearchQuery("");
                    }
                  }}
                  className="w-full text-base rounded-lg border px-4 py-3 shadow-sm" /* text-base=16px to prevent mobile zoom */
                  autoFocus
                />
              </div>
            )}
          </div>

          <div className="bg-white border-t border-b sticky top-[72px] z-10">
            <div 
              ref={filtersContainerRef}
              className="flex items-center gap-4 overflow-x-auto px-4 py-3 hide-scrollbar scroll-smooth max-w-7xl mx-auto"
              style={{ scrollBehavior: 'smooth' }}
            >
              {/* Veg/Non-Veg Filters */}
              <div 
                className="flex items-center gap-2 whitespace-nowrap"
                data-active-veg={vegFilter}
                ref={el => vegFilter && el && scrollFilterIntoView(el)}
              >
                <Switch 
                  id="veg-filter" 
                  checked={vegFilter} 
                  onCheckedChange={(checked) => {
                    setVegFilter(checked);
                    setNonVegFilter(false);
                    setSelectedCategories([]);
                  }}
                  className={`${vegFilter ? 'bg-green-500' : 'bg-gray-300'}`}
                />
                <label htmlFor="veg-filter" className="text-sm font-medium flex items-center gap-1">
                  <span className={` ${vegFilter ? 'bg-green-500' : 'bg-gray-400'}`}></span> Veg
                </label>
              </div>
              
              <div 
                className="flex items-center gap-2 whitespace-nowrap"
                data-active-nonveg={nonVegFilter}
                ref={el => nonVegFilter && el && scrollFilterIntoView(el)}
              >
                <Switch 
                  id="non-veg-filter" 
                  checked={nonVegFilter} 
                  onCheckedChange={(checked) => {
                    setNonVegFilter(checked);
                    setVegFilter(false);
                    setSelectedCategories([]);
                  }}
                  className={`${nonVegFilter ? 'bg-red-500' : 'bg-gray-300'}`}
                />
                <label htmlFor="non-veg-filter" className="text-sm font-medium flex items-center gap-1">
                  <span className={`${nonVegFilter ? 'bg-red-500' : 'bg-gray-400'}`}></span> Non-Veg
                </label>
              </div>
              
              {/* Category Chips */}
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => {
                    setSelectedCategories(prev => 
                      prev.includes(category) ? [] : [category]
                    );
                    setVegFilter(false);
                    setNonVegFilter(false);
                  }}
                  className={`px-3 py-1.5 text-sm rounded-full whitespace-nowrap flex items-center gap-2 transition-colors ${
                    selectedCategories.includes(category)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                  ref={el => selectedCategories.includes(category) && el && scrollFilterIntoView(el)}
                >
                  {getCategoryIcon(category)}
                  {category}
                </button>
              ))}
            </div>
            
            {/* Add some custom scrollbar styling */}
            <style jsx>{`
              .hide-scrollbar {
                scrollbar-width: none; /* Firefox */
                -ms-overflow-style: none; /* IE and Edge */
              }
              .hide-scrollbar::-webkit-scrollbar {
                display: none; /* Chrome, Safari */
              }
            `}</style>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-3">
            {filteredItems.length === 0 ? (
              <div className="col-span-full text-center py-10 text-muted-foreground">
                {searchQuery ? `No results found for '${searchQuery}'` : 'No results found'}
              </div>
            ) : filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-card rounded-lg border hover:shadow-md transition-shadow overflow-hidden p-3 flex gap-3"
              >
                {/* Left: Image with veg/non-veg indicator */}
                <div className="relative">
                  <img
                    src={item.i || "/placeholder.svg"}
                    alt={item.h}
                    className="w-20 h-20 rounded-md object-cover"
                  />
                  <img
                    src={item.veg ? "/veg.png" : "/nonveg.png"}
                    alt={item.veg ? "Veg" : "Non-Veg"}
                    className="absolute top-1 left-1 w-4 h-4"
                  />
                </div>

                {/* Right: Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <h3 className="font-semibold text-sm mb-1">{item.h}</h3>

                  <div className="flex justify-between items-center">
                    {/* Price & Info */}
                    <div>
                      <p className="text-base font-bold">{formatPrice(item.dp)}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.wt} • {item.en}
                        {item.allergy && <> • {item.allergy}</>}
                      </p>
                      {item.customizable && (
                        <p className="text-xs text-blue-600 font-medium mt-0.5">
                          Customizable
                        </p>
                      )}
                    </div>

                    {/* Add / Quantity controls */}
                    {getCartItemQuantity(item.id) > 0 ? (
                      <div className="flex items-center gap-1 bg-muted rounded-lg">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            const baseId = getBaseCartItemId(item.id)
                            const cartItem = cart.find((ci) => ci.id.startsWith(baseId))
                            if (cartItem) {
                              updateCartItemQuantity(cartItem.id, cartItem.quantity - 1)
                            }
                          }}
                          className="h-7 w-7 p-0"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm font-medium px-1">
                          {getCartItemQuantity(item.id)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            const baseId = getBaseCartItemId(item.id)
                            const cartItem = cart.find((ci) => ci.id.startsWith(baseId))
                            if (cartItem) {
                              updateCartItemQuantity(cartItem.id, cartItem.quantity + 1)
                            } else {
                              addToCart(item)
                            }
                          }}
                          className="h-7 w-7 p-0"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowItemModal(item.id)
                            setSelectedAddOns([])
                        }}
                        size="sm"
                        className="px-4 font-semibold"
                      >
                        Add
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>


          {cart.length > 0 && (
            <div className="fixed bottom-0 left-0 right-0 bg-card border-t p-6">
              <div className="flex items-center justify-between mb-3 cursor-pointer" onClick={handleCartClick}>
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  <span className="font-medium">{getTotalItems() === 0 ? "No items added" : `${getTotalItems()} Items`}</span>
                </div>
                <span className="text-lg font-bold">{formatPrice(getTotalPrice())}</span>
              </div>
              <Button
                onClick={handleCartClick}
                className="w-full h-12 text-base font-semibold"
                disabled={cart.length === 0}
              >
                Proceed
              </Button>
            </div>
          )}

          <div className="h-24"></div>
        </>
      )}

      {showItemModal && currentModalItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-card w-full max-h-[90vh] overflow-y-auto rounded-t-2xl">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-lg font-semibold">Customize Item</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowItemModal(null)} className="p-2">
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-6 space-y-6">
              <div className="text-center">
                <img
                  src={currentModalItem.i || "/placeholder.svg"}
                  alt={currentModalItem.h}
                  className="w-32 h-32 rounded-xl object-cover mx-auto mb-4"
                />
                <h3 className="text-xl font-bold mb-2">{currentModalItem.h}</h3>
                <p className="text-2xl font-bold text-primary">{formatPrice(getModalTotalPrice(currentModalItem))}</p>
              </div>

              {currentModalItem.comboItems && (
                <div>
                  <h4 className="font-semibold mb-3">Includes:</h4>
                  <div className="space-y-2">
                    {currentModalItem.comboItems.map((combo: any, index: number) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{combo.name}</span>
                        <span className="text-muted-foreground">{combo.calories}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentModalItem.addOns && (
                <div>
                  <h4 className="font-semibold mb-3">Add Extras</h4>
                  <div className="space-y-3">
                    {currentModalItem.addOns.map((addOn: any) => (
                      <div key={addOn.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={selectedAddOns.includes(addOn.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedAddOns([...selectedAddOns, addOn.id])
                              } else {
                                setSelectedAddOns(selectedAddOns.filter((id) => id !== addOn.id))
                              }
                            }}
                          />
                          <span className="font-medium">{addOn.name}</span>
                        </div>
                        <span className="font-semibold">{formatPrice(addOn.price)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t">
              <Button
                onClick={() => {
                  addToCart(currentModalItem, selectedAddOns)
                  setShowItemModal(null)
                  setSelectedAddOns([])
                }}
                className="w-full h-12 text-base font-semibold"
              >
                Add to Cart • {formatPrice(getModalTotalPrice(currentModalItem))}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showCart && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-card w-full max-h-[90vh] overflow-y-auto rounded-t-2xl">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-lg font-semibold">Your Cart</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowCart(false)} className="p-2">
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-6 space-y-4">
              {cart.map((cartItem) => (
                <div key={cartItem.id} className="flex gap-4 bg-muted rounded-xl p-4">
                  <img
                    src={cartItem.image || "/placeholder.svg"}
                    alt={cartItem.name}
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    onError={(e) => {
                      // Fallback to placeholder if image fails to load
                      (e.target as HTMLImageElement).src = "/placeholder.svg";
                    }}
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{cartItem.name}</h3>
                    {cartItem.addOns && cartItem.addOns.length > 0 && (
                      <p className="text-sm text-muted-foreground mb-2">Add-ons: {cartItem.addOns.join(", ")}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 bg-background rounded-lg">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateCartItemQuantity(cartItem.id, cartItem.quantity - 1)}
                          className="h-8 w-8 p-0"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-medium px-3">{cartItem.quantity}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateCartItemQuantity(cartItem.id, cartItem.quantity + 1)}
                          className="h-8 w-8 p-0"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <span className="font-bold">{formatPrice(cartItem.price * cartItem.quantity)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 border-t">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  <span className="font-medium">{getTotalItems()} Items</span>
                </div>
                <span className="text-xl font-bold">{formatPrice(getTotalPrice())}</span>
              </div>
              <Button onClick={proceedToCheckout} className="w-full h-12 text-base font-semibold">
                Proceed
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

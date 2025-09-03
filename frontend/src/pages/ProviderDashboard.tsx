import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import Breadcrumb from '../components/Breadcrumb'
import TalentsLogo from '../components/Logo'

interface ProviderStats {
  totalBookings: number
  activeBookings: number
  completedBookings: number
  totalEarnings: number
}

interface Booking {
  id: string
  status: string
  startTime: string
  endTime: string
  date: string
  notes?: string
  service: {
    name: string
    description: string
    price: number
    duration: number
  }
  user: {
    name: string
    email: string
  }
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const ProviderDashboard: React.FC = () => {
  const [user] = useState({ name: 'Service Provider' })
  const [isLoaded, setIsLoaded] = useState(false)
  const [stats, setStats] = useState<ProviderStats>({
    totalBookings: 0,
    activeBookings: 0,
    completedBookings: 0,
    totalEarnings: 0
  })
  const [recentBookings, setRecentBookings] = useState<Booking[]>([])
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [statusUpdate, setStatusUpdate] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      fetchDashboardData()
    }
    
    setTimeout(() => setIsLoaded(true), 100)

    return () => {
    }
  }, [])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${BACKEND_URL}/api/provider/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
        setRecentBookings(data.recentBookings)
      }
    } catch (error) {
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate({ to: '/login' })
  }

  const openBookingModal = (booking: Booking) => {
    setSelectedBooking(booking)
    setIsModalOpen(true)
    setStatusUpdate(booking.status)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedBooking(null)
    setStatusUpdate('')
  }

  const updateBookingStatus = async () => {
    if (!selectedBooking) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${BACKEND_URL}/api/provider/bookings/${selectedBooking.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          status: statusUpdate,
          notes: 'Status updated by provider'
        })
      })

      if (response.ok) {
        fetchDashboardData()
        closeModal()
      }
    } catch (error) {
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'text-yellow-400'
      case 'CONFIRMED': return 'text-green-400'
      case 'IN_PROGRESS': return 'text-blue-400'
      case 'COMPLETED': return 'text-purple-400'
      case 'CANCELLED': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return '⏳'
      case 'CONFIRMED': return '✅'
      case 'IN_PROGRESS': return '🔄'
      case 'COMPLETED': return '🎉'
      case 'CANCELLED': return '❌'
      default: return '📋'
    }
  }

  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .animate-fadeInUp { animation: fadeInUp 0.6s ease-out forwards; }
        .animate-slideInLeft { animation: slideInLeft 0.5s ease-out forwards; }
        .animate-slideInDown { animation: slideInDown 0.4s ease-out forwards; }
        .animate-pulse-hover:hover { animation: pulse 0.3s ease-in-out; }
        .modal-backdrop { backdrop-filter: blur(8px); }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white">
        {/* Booking Update Modal */}
        {isModalOpen && selectedBooking && (
          <div className="fixed inset-0 bg-black/50 modal-backdrop flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/20 animate-fadeInUp">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">Update Booking Status</h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-gray-400 text-sm">Customer</p>
                  <p className="text-white font-semibold">{selectedBooking.user.name}</p>
                </div>
                
                <div>
                  <p className="text-gray-400 text-sm">Service</p>
                  <p className="text-white font-semibold">{selectedBooking.service.name}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Date</p>
                    <p className="text-white">{new Date(selectedBooking.date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Time</p>
                    <p className="text-white">
                      {new Date(selectedBooking.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                </div>
                
                <div>
                  <p className="text-gray-400 text-sm mb-2">Update Status</p>
                  <select
                    value={statusUpdate}
                    onChange={(e) => setStatusUpdate(e.target.value)}
                    className="w-full bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-2"
                  >
                    <option value="PENDING">⏳ Pending</option>
                    <option value="CONFIRMED">✅ Confirmed</option>
                    <option value="IN_PROGRESS">🔄 In Progress</option>
                    <option value="COMPLETED">🎉 Completed</option>
                    <option value="CANCELLED">❌ Cancelled</option>
                  </select>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={closeModal}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={updateBookingStatus}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-lg transition-all"
                >
                  Update Status
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className={`bg-white/95 backdrop-blur-sm text-black p-4 flex justify-between items-center shadow-xl border-b border-gray-200 transition-all duration-500 ${isLoaded ? 'animate-slideInLeft' : 'opacity-0'}`}>
            <TalentsLogo size="md" variant="light" showText={true} />
          <div className="flex items-center space-x-4">
            <Link 
              to="/provider/services"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all"
            >
              Manage Services
            </Link>
            <button
              onClick={handleLogout}
              className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-all transform hover:translate-y-[-2px] hover:shadow-lg animate-pulse-hover"
            >
              Logout
            </button>
          </div>
        </nav>

        {/* Breadcrumb */}
        <Breadcrumb />
        
        {/* Main Content */}
        <div className="container mx-auto p-8">
          {/* Welcome Section */}
          <div className={`mb-8 transition-all duration-700 delay-200 ${isLoaded ? 'animate-fadeInUp' : 'opacity-0'}`}>
            <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Welcome back, {user.name}! 🛠️
            </h2>
            <p className="text-gray-400 text-lg">Manage your services and bookings</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Bookings */}
            <div className={`bg-white/10 backdrop-blur-sm text-white p-6 rounded-2xl shadow-xl border border-white/20 hover:bg-white/20 transition-all transform hover:translate-y-[-5px] hover:shadow-2xl duration-300 ${isLoaded ? 'animate-fadeInUp' : 'opacity-0'}`} style={{animationDelay: '0.3s'}}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Total Bookings</h3>
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-2xl">📊</span>
                </div>
              </div>
              <p className="text-3xl font-bold text-blue-400">{stats.totalBookings}</p>
              <p className="text-gray-300 text-sm mt-2">All time bookings</p>
            </div>

            {/* Active Bookings */}
            <div className={`bg-white/10 backdrop-blur-sm text-white p-6 rounded-2xl shadow-xl border border-white/20 hover:bg-white/20 transition-all transform hover:translate-y-[-5px] hover:shadow-2xl duration-300 ${isLoaded ? 'animate-fadeInUp' : 'opacity-0'}`} style={{animationDelay: '0.4s'}}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Active Jobs</h3>
                <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-2xl">⚡</span>
                </div>
              </div>
              <p className="text-3xl font-bold text-yellow-400">{stats.activeBookings}</p>
              <p className="text-gray-300 text-sm mt-2">Pending & in progress</p>
            </div>

            {/* Completed Bookings */}
            <div className={`bg-white/10 backdrop-blur-sm text-white p-6 rounded-2xl shadow-xl border border-white/20 hover:bg-white/20 transition-all transform hover:translate-y-[-5px] hover:shadow-2xl duration-300 ${isLoaded ? 'animate-fadeInUp' : 'opacity-0'}`} style={{animationDelay: '0.5s'}}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Completed</h3>
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-2xl">✅</span>
                </div>
              </div>
              <p className="text-3xl font-bold text-green-400">{stats.completedBookings}</p>
              <p className="text-gray-300 text-sm mt-2">Successfully finished</p>
            </div>

            {/* Total Earnings */}
            <div className={`bg-white/10 backdrop-blur-sm text-white p-6 rounded-2xl shadow-xl border border-white/20 hover:bg-white/20 transition-all transform hover:translate-y-[-5px] hover:shadow-2xl duration-300 ${isLoaded ? 'animate-fadeInUp' : 'opacity-0'}`} style={{animationDelay: '0.6s'}}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Total Earnings</h3>
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-2xl">💰</span>
                </div>
              </div>
              <p className="text-3xl font-bold text-purple-400">${stats.totalEarnings}</p>
              <p className="text-gray-300 text-sm mt-2">Revenue generated</p>
            </div>
          </div>

          {/* Recent Bookings */}
          <div className={`bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 transition-all duration-700 delay-700 ${isLoaded ? 'animate-fadeInUp' : 'opacity-0'}`}>
            <h3 className="text-2xl font-bold mb-6 text-white">Recent Bookings</h3>
            <div className="space-y-4">
              {recentBookings.length > 0 ? recentBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      booking.status === 'PENDING' ? 'bg-yellow-500' :
                      booking.status === 'CONFIRMED' ? 'bg-green-500' :
                      booking.status === 'IN_PROGRESS' ? 'bg-blue-500' :
                      booking.status === 'COMPLETED' ? 'bg-purple-500' :
                      'bg-gray-500'
                    }`}>
                      <span className="text-white font-bold">{getStatusIcon(booking.status)}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-lg">{booking.service.name}</p>
                      <p className="text-gray-400 text-sm">{booking.user.name}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <span>📅 {new Date(booking.date).toLocaleDateString()}</span>
                        <span>⏰ {new Date(booking.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        <span className={`capitalize font-medium ${getStatusColor(booking.status)}`}>
                          {booking.status.replace('_', ' ').toLowerCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-green-400 font-bold">${booking.service.price}</span>
                    <button
                      onClick={() => openBookingModal(booking)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                    >
                      Update Status
                    </button>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-lg">No bookings yet.</p>
                  <p className="text-gray-500 text-sm mt-2">Start by creating your services!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Background decorations */}
        <div className="fixed top-20 left-20 w-64 h-64 bg-purple-500 opacity-10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="fixed bottom-20 right-20 w-96 h-96 bg-blue-500 opacity-10 rounded-full blur-3xl pointer-events-none"></div>
      </div>
    </>
  )
}

export default ProviderDashboard
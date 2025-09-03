import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { bookingsAPI } from '../utils/apiClient'
import Breadcrumb from '../components/Breadcrumb'
import TalentsLogo from '../components/Logo'

interface Notification {
  id: string
  type: string
  message: string
  timestamp: string
  read: boolean
}

interface Booking {
  id: string
  serviceName: string
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
    category: string
  }
}

const Dashboard: React.FC = () => {
  const [user] = useState({ name: 'User' })
  const [isLoaded, setIsLoaded] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [recentBookings, setRecentBookings] = useState<Booking[]>([])
  const [activeBookingsCount, setActiveBookingsCount] = useState(0)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      fetchUserBookings()
    }
    
    setTimeout(() => setIsLoaded(true), 100)

    return () => {
      // Cleanup on unmount
    }
  }, [])

  const getNotificationMessage = (data: any) => {
    switch (data.type) {
      case 'BOOKING_CREATED':
        return ` Booking confirmed for ${data.booking.serviceName}`
      case 'STATUS_UPDATE':
        return `🔄 ${data.booking.serviceName} status: ${data.booking.status}`
      default:
        return 'New update available'
    }
  }

  const fetchUserBookings = async () => {
    try {
      const bookings = await bookingsAPI.getUserBookings()
      setRecentBookings(bookings.slice(0, 5))
      setActiveBookingsCount(bookings.filter((b: any) => ['confirmed', 'in_progress'].includes(b.status)).length)
    } catch (error) {
      console.error('Failed to fetch bookings:', error)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate({ to: '/login' })
  }

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    )
  }

  const openBookingModal = (booking: Booking) => {
    setSelectedBooking(booking)
    setIsModalOpen(true)
    // websocketService.requestBookingStatus(booking.id)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedBooking(null)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-400'
      case 'in_progress': return 'text-blue-400'
      case 'completed': return 'text-purple-400'
      case 'cancelled': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return '✅'
      case 'in_progress': return '🔄'
      case 'completed': return '🎉'
      case 'cancelled': return '❌'
      default: return '📋'
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

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
        {/* Real-time Notifications */}
        {notifications.length > 0 && (
          <div className="fixed top-4 right-4 space-y-3 z-50 max-w-sm">
            {notifications.slice(0, 3).map((notification, index) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg shadow-xl border transition-all cursor-pointer animate-slideInDown ${
                  notification.read 
                    ? 'bg-gray-800/90 border-gray-600' 
                    : notification.type === 'BOOKING_CREATED'
                      ? 'bg-green-600/90 border-green-400'
                      : 'bg-blue-600/90 border-blue-400'
                }`}
                style={{animationDelay: `${index * 0.1}s`}}
                onClick={() => markNotificationAsRead(notification.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Use the getNotificationMessage function here */}
                    <p className="text-white font-medium text-sm">
                      {getNotificationMessage(notification)}
                    </p>
                    <p className="text-gray-200 text-xs mt-1">
                      {new Date(notification.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-white rounded-full ml-2 mt-1"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Booking Details Modal */}
        {isModalOpen && selectedBooking && (
          <div className="fixed inset-0 bg-black/50 modal-backdrop flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/20 animate-fadeInUp">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">Booking Details</h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-gray-400 text-sm">Service</p>
                  <p className="text-white font-semibold text-lg">{selectedBooking.service.name}</p>
                  <p className="text-gray-300 text-sm">{selectedBooking.service.description}</p>
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
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Duration</p>
                    <p className="text-white">{selectedBooking.service.duration} minutes</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Price</p>
                    <p className="text-green-400 font-semibold">${selectedBooking.service.price}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-gray-400 text-sm">Status</p>
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">{getStatusIcon(selectedBooking.status)}</span>
                    <span className={`font-semibold capitalize ${getStatusColor(selectedBooking.status)}`}>
                      {selectedBooking.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                
                {selectedBooking.notes && (
                  <div>
                    <p className="text-gray-400 text-sm">Notes</p>
                    <p className="text-white bg-white/5 p-3 rounded-lg">{selectedBooking.notes}</p>
                  </div>
                )}
                
                <div>
                  <p className="text-gray-400 text-sm">Booking ID</p>
                  <p className="text-gray-300 font-mono text-sm">{selectedBooking.id}</p>
                </div>
              </div>
              
              <button
                onClick={closeModal}
                className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-lg transition-all"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className={`bg-white/95 backdrop-blur-sm text-black p-4 flex justify-between items-center shadow-xl border-b border-gray-200 transition-all duration-500 ${isLoaded ? 'animate-slideInLeft' : 'opacity-0'}`}>
            <Link to="/dashboard" className="flex items-center hover:opacity-70 transition-opacity">
              <TalentsLogo size="md" variant="light" showText={true} />
              </Link>
          
          <button
            onClick={handleLogout}
            className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-all transform hover:translate-y-[-2px] hover:shadow-lg animate-pulse-hover"
          >
            Logout
          </button>
        </nav>
        
        <Breadcrumb />

        
        {/* Main Content */}
        <div className="container mx-auto p-8">
          {/* Welcome Section */}
          <div className={`mb-6 transition-all duration-700 delay-200 ${isLoaded ? 'animate-fadeInUp' : 'opacity-0'}`}>
            <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Welcome back, {user.name}! 👋
            </h2>
            <p className="text-gray-400 text-lg">Ready to manage your service bookings?</p>
          </div>


          {/* Dashboard Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Active Bookings Card */}
            <div className={`bg-white/10 backdrop-blur-sm text-white p-6 rounded-2xl shadow-xl border border-white/20 hover:bg-white/20 transition-all transform hover:translate-y-[-5px] hover:shadow-2xl duration-300 ${isLoaded ? 'animate-fadeInUp' : 'opacity-0'}`} style={{animationDelay: '0.4s'}}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Active Bookings</h3>
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-2xl">📅</span>
                </div>
              </div>
              <p className="text-3xl font-bold text-green-400">{activeBookingsCount}</p>
              <p className="text-gray-300 text-sm mt-2">Services scheduled this week</p>
            </div>

            {/* Quick Actions Card */}
            <div className={`bg-white/10 backdrop-blur-sm text-white p-6 rounded-2xl shadow-xl border border-white/20 hover:bg-white/20 transition-all transform hover:translate-y-[-5px] hover:shadow-2xl duration-300 ${isLoaded ? 'animate-fadeInUp' : 'opacity-0'}`} style={{animationDelay: '0.5s'}}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Quick Book</h3>
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-2xl">⚡</span>
                </div>
              </div>
              <Link 
                to="/services"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition-colors transform hover:scale-105 flex items-center justify-center"
              >
                Book New Service
              </Link>
            </div>

            {/* Live Notifications Card */}
            <div className={`bg-white/10 backdrop-blur-sm text-white p-6 rounded-2xl shadow-xl border border-white/20 hover:bg-white/20 transition-all transform hover:translate-y-[-5px] hover:shadow-2xl duration-300 ${isLoaded ? 'animate-fadeInUp' : 'opacity-0'}`} style={{animationDelay: '0.6s'}}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Live Updates</h3>
                <div className="relative w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🔔</span>
                  {unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-black">{unreadCount}</span>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-3xl font-bold text-red-400">{notifications.length}</p>
              <p className="text-gray-300 text-sm mt-2">Real-time notifications</p>
            </div>
          </div>

          {/* Recent Bookings */}
          <div className={`mt-8 bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 transition-all duration-700 delay-700 ${isLoaded ? 'animate-fadeInUp' : 'opacity-0'}`}>
            <h3 className="text-2xl font-bold mb-6 text-white">Recent Bookings</h3>
            <div className="space-y-4">
              {recentBookings.length > 0 ? recentBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      booking.status === 'confirmed' ? 'bg-green-500' :
                      booking.status === 'in_progress' ? 'bg-blue-500' :
                      booking.status === 'completed' ? 'bg-purple-500' :
                      'bg-gray-500'
                    }`}>
                      <span className="text-white font-bold">{getStatusIcon(booking.status)}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-lg">{booking.service.name}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <span>📅 {new Date(booking.date).toLocaleDateString()}</span>
                        <span>⏰ {new Date(booking.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        <span className={`capitalize font-medium ${getStatusColor(booking.status)}`}>
                          {booking.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-gray-300 text-sm mt-1">{booking.service.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-green-400 font-bold">${booking.service.price}</span>
                    <button
                      onClick={() => openBookingModal(booking)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-lg">No bookings yet.</p>
                  <Link 
                    to="/services"
                    className="inline-block mt-4 text-blue-400 hover:text-blue-300 underline"
                  >
                    Book your first service! 🚀
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Background decorations */}
        <div className="fixed top-20 left-20 w-64 h-64 bg-blue-500 opacity-10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="fixed bottom-20 right-20 w-96 h-96 bg-purple-500 opacity-10 rounded-full blur-3xl pointer-events-none"></div>
      </div>
    </>
  )
}

export default Dashboard
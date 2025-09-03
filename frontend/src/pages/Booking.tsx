import React, { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from '@tanstack/react-router'
import { servicesAPI, bookingsAPI } from '../utils/apiClient'
import Breadcrumb from '../components/Breadcrumb'

interface Service {
  id: string
  name: string
  description: string
  price: number
  duration: number
  category: string
}

interface TimeSlot {
  startTime: string
  endTime: string
  display: string
}

const Booking: React.FC = () => {
  const { serviceId } = useParams({ strict: false })
  const navigate = useNavigate()
  
  const [service, setService] = useState<Service | null>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (serviceId) {
      fetchServiceDetails()
    }
  }, [serviceId])

  useEffect(() => {
    if (selectedDate && serviceId) {
      fetchAvailableSlots()
    }
  }, [selectedDate, serviceId])

  const fetchServiceDetails = async () => {
    try {
      const services = await servicesAPI.getServices()
      const foundService = services.find((s: Service) => s.id === serviceId)
      if (foundService) {
        setService(foundService)
      } else {
        setError('Service not found')
      }
    } catch (err) {
      setError('Failed to load service details')
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableSlots = async () => {
    setSlotsLoading(true)
    setSelectedSlot(null)
    try {
      // The API returns an object like { availableSlots: [...] }
      const response = await servicesAPI.getAvailableSlots(serviceId!, selectedDate)
      // FIX: We need to set the array from the response, not the response object itself.
      setAvailableSlots(response.availableSlots || [])
    } catch (err) {
      setError('Failed to load available slots')
      // Also ensure we clear slots on error
      setAvailableSlots([])
    } finally {
      setSlotsLoading(false)
    }
  }

  const handleBooking = async () => {
    if (!selectedSlot || !serviceId) return

    setBookingLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await bookingsAPI.createBooking(
        serviceId,
        selectedDate,
        selectedSlot.startTime,
        notes
      )
        setSuccess(`Booking confirmed! ID: ${response.booking.id}`)
        setTimeout(() => navigate({ to: '/dashboard' }), 2000)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create booking')
    } finally {
      setBookingLoading(false)
    }
  }

  const getTomorrowDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    )
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-2xl mb-4">Service not found</div>
          <Link to="/services" className="text-blue-400 hover:underline">Back to Services</Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeInUp { animation: fadeInUp 0.6s ease-out forwards; }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white">
        {error && (
          <div className="fixed top-0 left-0 right-0 bg-red-600 text-white p-4 text-center z-50 animate-fadeInUp">
            <div className="flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          </div>
        )}
        {success && (
          <div className="fixed top-0 left-0 right-0 bg-green-600 text-white p-4 text-center z-50 animate-fadeInUp">
            <div className="flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {success}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="bg-white/95 backdrop-blur-sm text-black p-4 flex justify-between items-center shadow-xl">
          <Link to="/services" className="flex items-center space-x-3 hover:opacity-70 transition-opacity">
            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">←</span>
            </div>
            <span className="font-semibold">Back to Services</span>
          </Link>
        </nav>
        <Breadcrumb />

        <div className="container mx-auto p-8 max-w-2xl">
          {/* Service Details */}
          <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/20 mb-8 animate-fadeInUp">
            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Book {service.name}
            </h2>
            <p className="text-gray-300 mb-4">{service.description}</p>
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold text-green-400">${service.price}</span>
              <span className="text-gray-400">⏱️ {service.duration} minutes</span>
            </div>
          </div>

          {/* Booking Form */}
          <div className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10 animate-fadeInUp" style={{animationDelay: '0.2s'}}>
            <h3 className="text-2xl font-bold mb-6 text-white">Select Date & Time</h3>
            
            {/* Date Selection */}
            <div className="mb-6">
              <label className="block text-white font-semibold mb-3">Select Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={getTomorrowDate()}
                className="w-full p-4 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Time Slots */}
            {selectedDate && (
              <div className="mb-6">
                <label className="block text-white font-semibold mb-3">Available Time Slots</label>
                {slotsLoading ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400">Loading available slots...</div>
                  </div>
                ) : availableSlots.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {availableSlots.map((slot, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-3 rounded-lg transition-all transform hover:scale-105 ${
                          selectedSlot?.startTime === slot.startTime
                            ? 'bg-blue-600 text-white'
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                      >
                        {slot.display}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-400">No available slots for this date</div>
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            <div className="mb-6">
              <label className="block text-white font-semibold mb-3">Additional Notes (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special requirements or notes..."
                rows={3}
                className="w-full p-4 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Book Button */}
            <button
              onClick={handleBooking}
              disabled={!selectedSlot || bookingLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-semibold text-lg"
            >
              {bookingLoading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                'Confirm Booking ⚡'
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default Booking
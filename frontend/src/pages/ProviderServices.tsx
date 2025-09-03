import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import Breadcrumb from '../components/Breadcrumb'
import { 
  ServiceIcons, 
  getCategoryIcon, 
  NavigationIcons, 
  BusinessIcons, 
  UIIcons,
  BookingIcons 
} from '../components/Icons'
import TalentsLogo from '../components/Logo'
import { providerAPI } from '../utils/apiClient'

interface Service {
  workingHours: { monday: { enabled: boolean; start: string; end: string }; tuesday: { enabled: boolean; start: string; end: string }; wednesday: { enabled: boolean; start: string; end: string }; thursday: { enabled: boolean; start: string; end: string }; friday: { enabled: boolean; start: string; end: string }; saturday: { enabled: boolean; start: string; end: string }; sunday: { enabled: boolean; start: string; end: string } }
  id: string
  name: string
  description: string
  price: number
  duration: number
  category: string
  isActive: boolean
  _count: {
    bookings: number
  }
}

// Add to your form data interface
interface ServiceFormData {
  name: string
  description: string
  price: string
  duration: string
  category: string
  isActive: boolean
  // NEW: Add working hours
  workingHours: {
    monday: { enabled: boolean; start: string; end: string }
    tuesday: { enabled: boolean; start: string; end: string }
    wednesday: { enabled: boolean; start: string; end: string }
    thursday: { enabled: boolean; start: string; end: string }
    friday: { enabled: boolean; start: string; end: string }
    saturday: { enabled: boolean; start: string; end: string }
    sunday: { enabled: boolean; start: string; end: string }
  }
}


// Update your initial form data
const initialFormData: ServiceFormData = {
  name: '',
  description: '',
  price: '',
  duration: '60',
  category: 'cleaning',
  isActive: true,
  workingHours: {
    monday: { enabled: true, start: '09:00', end: '17:00' },
    tuesday: { enabled: true, start: '09:00', end: '17:00' },
    wednesday: { enabled: true, start: '09:00', end: '17:00' },
    thursday: { enabled: true, start: '09:00', end: '17:00' },
    friday: { enabled: true, start: '09:00', end: '17:00' },
    saturday: { enabled: false, start: '09:00', end: '17:00' },
    sunday: { enabled: false, start: '09:00', end: '17:00' }
  }
}

const ProviderServices: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [services, setServices] = useState<Service[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState<ServiceFormData>(initialFormData)
  const [, setError] = useState('')
  const [, setSubmitting] = useState(false)
  const navigate = useNavigate()

  const categories = ['cleaning', 'plumbing', 'electrical', 'landscaping', 'repair', 'moving', 'other']

  useEffect(() => {
    fetchServices()
    setTimeout(() => setIsLoaded(true), 100)
  }, [])



  // Update the fetchServices function
  const fetchServices = async () => {
    try {
      setLoading(true)
      setError('')
      
      const data = await providerAPI.getServices()
      setServices(data.services || data)
      
    } catch (error: any) {
      setError(error.message || 'Failed to fetch services')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate({ to: '/login' })
  }

  const openCreateModal = () => {
    setFormData(initialFormData)
    setIsCreateModalOpen(true)
  }

  const openEditModal = (service: Service) => {
    setSelectedService(service)
    setFormData({
      name: service.name,
      description: service.description,
      price: service.price.toString(),
      duration: service.duration.toString(),
      category: service.category,
      isActive: service.isActive,
      workingHours: service.workingHours
    })
    setIsEditModalOpen(true)
  }

  const closeModals = () => {
    setIsCreateModalOpen(false)
    setIsEditModalOpen(false)
    setSelectedService(null)
    setFormData(initialFormData)
  }

  // Add missing service management functions
  const toggleServiceStatus = async (service: Service) => {
    try {
      await providerAPI.updateService(service.id, { isActive: !service.isActive })
      await fetchServices()
    } catch (error: any) {
      setError(error.message || 'Failed to update service status')
    }
  }

  const deleteService = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return
    
    try {
      await providerAPI.deleteService(serviceId)
      await fetchServices()
    } catch (error: any) {
      setError(error.message || 'Failed to delete service')
    }
  }

  // Update the handleSubmit function  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      // Convert price and duration to numbers before sending to API
      const payload = {
        ...formData,
        price: Number(formData.price),
        duration: Number(formData.duration),
      }

      if (selectedService) {
        await providerAPI.updateService(selectedService.id, payload)
      } else {
        await providerAPI.createService(payload)
      }
      
      closeModals()
      await fetchServices()
      
    } catch (error: any) {
      setError(error.message || 'Failed to save service')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-white text-2xl">Loading services...</div>
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
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fadeInUp { animation: fadeInUp 0.6s ease-out forwards; }
        .animate-slideInLeft { animation: slideInLeft 0.5s ease-out forwards; }
        .modal-backdrop { backdrop-filter: blur(8px); }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white">
        {/* Service Form Modal */}
        {(isCreateModalOpen || isEditModalOpen) && (
          <div className="fixed inset-0 bg-black/50 modal-backdrop flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-white/20 animate-fadeInUp max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white flex items-center space-x-2">
                  <ServiceIcons.Tools className="w-6 h-6" />
                  <span>{isEditModalOpen ? 'Edit Service' : 'Create New Service'}</span>
                </h3>
                <button
                  onClick={closeModals}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  <NavigationIcons.Close className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Form fields with icons */}
                <div>
                  <label className="block text-gray-400 text-sm mb-2 flex items-center space-x-2">
                    <ServiceIcons.Tools className="w-4 h-4" />
                    <span>Service Name</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-2"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-gray-400 text-sm mb-2 flex items-center space-x-2">
                    <UIIcons.Info className="w-4 h-4" />
                    <span>Description</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-2 h-20"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-2 flex items-center space-x-2">
                      <BusinessIcons.Revenue className="w-4 h-4" />
                      <span>Price ($)</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      className="w-full bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-400 text-sm mb-2 flex items-center space-x-2">
                      <BookingIcons.Clock className="w-4 h-4" />
                      <span>Duration (min)</span>
                    </label>
                    <input
                      type="number"
                      min="15"
                      step="15"
                      value={formData.duration}
                      onChange={(e) => setFormData({...formData, duration: e.target.value})}
                      className="w-full bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-400 text-sm mb-2 flex items-center space-x-2">
                    <UIIcons.Filter className="w-4 h-4" />
                    <span>Category</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-2"
                    required
                  >
                    {categories.map(category => {
                      return (
                        <option key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </option>
                      )
                    })}
                  </select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    className="w-4 h-4"
                  />
                  <label htmlFor="isActive" className="text-gray-400 text-sm flex items-center space-x-2">
                    <UIIcons.Verified className="w-4 h-4" />
                    <span>Service is active and available for booking</span>
                  </label>
                </div>

                {/* NEW: Working Hours Fields */}
                <div>
                  <label className="block text-gray-400 text-sm mb-2 flex items-center space-x-2">
                    <BookingIcons.Clock className="w-4 h-4" />
                    <span>Working Hours & Availability</span>
                  </label>
                  
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {Object.entries(formData.workingHours).map(([day, hours]) => (
                      <div key={day} className="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg">
                        <input
                          type="checkbox"
                          checked={hours.enabled}
                          onChange={(e) => setFormData({
                            ...formData,
                            workingHours: {
                              ...formData.workingHours,
                              [day]: { ...hours, enabled: e.target.checked }
                            }
                          })}
                          className="w-4 h-4"
                        />
                        
                        <span className="w-20 text-sm capitalize text-gray-300">
                          {day}
                        </span>
                        
                        {hours.enabled ? (
                          <div className="flex items-center space-x-2 flex-1">
                            <input
                              type="time"
                              value={hours.start}
                              onChange={(e) => setFormData({
                                ...formData,
                                workingHours: {
                                  ...formData.workingHours,
                                  [day]: { ...hours, start: e.target.value }
                                }
                              })}
                              className="bg-gray-700 text-white border border-gray-600 rounded px-2 py-1 text-sm"
                            />
                            <span className="text-gray-400">to</span>
                            <input
                              type="time"
                              value={hours.end}
                              onChange={(e) => setFormData({
                                ...formData,
                                workingHours: {
                                  ...formData.workingHours,
                                  [day]: { ...hours, end: e.target.value }
                                }
                              })}
                              className="bg-gray-700 text-white border border-gray-600 rounded px-2 py-1 text-sm"
                            />
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm flex-1">Closed</span>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-3 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                    <div className="flex items-center space-x-2 text-blue-300 text-sm">
                      <UIIcons.Info className="w-4 h-4" />
                      <span>Customers will only see available booking slots during these hours</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={closeModals}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-lg transition-all"
                  >
                    {isEditModalOpen ? 'Update Service' : 'Create Service'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className={`bg-white/95 backdrop-blur-sm text-black p-4 flex justify-between items-center shadow-xl border-b border-gray-200 transition-all duration-500 ${isLoaded ? 'animate-slideInLeft' : 'opacity-0'}`}>
          <Link to="/provider" className="flex items-center hover:opacity-70 transition-opacity">
            <TalentsLogo size="md" variant="light" showText={true} />
          </Link>
          
          <div className="flex items-center space-x-4">
            <Link 
              to="/provider"
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-all flex items-center space-x-2"
            >
              <NavigationIcons.Back className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Link>
            <button
              onClick={handleLogout}
              className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-all flex items-center space-x-2"
            >
              <NavigationIcons.Logout className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </nav>

        {/* Breadcrumb */}
        <Breadcrumb />
        
        {/* Main Content */}
        <div className="container mx-auto p-8">
          {/* Header */}
          <div className={`flex justify-between items-center mb-8 transition-all duration-700 delay-200 ${isLoaded ? 'animate-fadeInUp' : 'opacity-0'}`}>
            <div>
              <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent flex items-center space-x-3">
                <ServiceIcons.Tools className="w-10 h-10 text-blue-400" />
                <span>Manage Services</span>
              </h2>
              <p className="text-gray-400 text-lg">Create and manage your service offerings</p>
            </div>
            <button
              onClick={openCreateModal}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg transition-all transform hover:scale-105 flex items-center space-x-2"
            >
              <ServiceIcons.Add className="w-5 h-5" />
              <span>Create Service</span>
            </button>
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => {
              const CategoryIcon = getCategoryIcon(service.category)
              
              return (
                <div
                  key={service.id}
                  className={`bg-white/10 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/20 hover:bg-white/20 transition-all transform hover:translate-y-[-5px] hover:shadow-2xl duration-300 animate-fadeInUp ${
                    !service.isActive ? 'opacity-60' : ''
                  }`}
                  style={{animationDelay: `${0.3 + index * 0.1}s`}}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                      <CategoryIcon className="w-8 h-8 text-blue-400" />
                      <div>
                        <h3 className="text-xl font-bold text-white">{service.name}</h3>
                        <span className="text-gray-400 text-sm capitalize">{service.category}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`w-3 h-3 rounded-full ${service.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      <span className="text-xs text-gray-400">
                        {service.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-gray-300 text-sm mb-4 line-clamp-2">{service.description}</p>
                  
                  <div className="flex justify-between items-center mb-4">
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
                      <div className="flex items-center space-x-1">
                        <BusinessIcons.Revenue className="w-4 h-4" />
                        <div>
                          <span className="block">Price</span>
                          <span className="text-green-400 font-bold">${service.price}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <BookingIcons.Clock className="w-4 h-4" />
                        <div>
                          <span className="block">Duration</span>
                          <span className="text-blue-400 font-bold">{service.duration}m</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4 flex items-center space-x-2">
                    <BusinessIcons.BarChart className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-400 text-sm">Total Bookings: </span>
                    <span className="text-white font-bold">{service._count.bookings}</span>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openEditModal(service)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors text-sm flex items-center justify-center space-x-1"
                    >
                      <ServiceIcons.Edit className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => toggleServiceStatus(service)}
                      className={`flex-1 ${
                        service.isActive 
                          ? 'bg-yellow-600 hover:bg-yellow-700' 
                          : 'bg-green-600 hover:bg-green-700'
                      } text-white py-2 rounded-lg transition-colors text-sm flex items-center justify-center space-x-1`}
                    >
                      {service.isActive ? (
                        <>
                          <ServiceIcons.Hide className="w-4 h-4" />
                          <span>Deactivate</span>
                        </>
                      ) : (
                        <>
                          <ServiceIcons.View className="w-4 h-4" />
                          <span>Activate</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => deleteService(service.id)}
                      className="bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded-lg transition-colors text-sm flex items-center justify-center"
                    >
                      <ServiceIcons.Delete className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {services.length === 0 && (
            <div className="text-center py-12">
              <ServiceIcons.Tools className="w-24 h-24 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-xl mb-4">No services created yet</p>
              <button
                onClick={openCreateModal}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-lg transition-all transform hover:scale-105 flex items-center space-x-2 mx-auto"
              >
                <ServiceIcons.Add className="w-5 h-5" />
                <span>Create Your First Service</span>
              </button>
            </div>
          )}
        </div>

        {/* Background decorations */}
        <div className="fixed top-20 left-20 w-64 h-64 bg-purple-500 opacity-10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="fixed bottom-20 right-20 w-96 h-96 bg-blue-500 opacity-10 rounded-full blur-3xl pointer-events-none"></div>
      </div>
    </>
  )
}

export default ProviderServices
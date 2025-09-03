import React, { useState, useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { servicesAPI } from '../utils/apiClient'
import Breadcrumb from '../components/Breadcrumb'
import { TalentsLogo } from '../components/Logo'
import { BookingIcons, getCategoryIcon, ServiceIcons, UIIcons } from '../components/Icons'

interface Service {
  id: string
  name: string
  description: string
  price: number
  duration: number
  category: string
}

const Services: React.FC = () => {
  const [services, setServices] = useState<Service[]>([])
  const [filteredServices, setFilteredServices] = useState<Service[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchServices()
  }, [])

  useEffect(() => {
    if (selectedCategory) {
      setFilteredServices(services.filter(service => service.category === selectedCategory))
    } else {
      setFilteredServices(services)
    }
  }, [services, selectedCategory])

  const fetchServices = async () => {
    try {
      const data = await servicesAPI.getServices()
      setServices(data)
      setFilteredServices(data)
    } catch (err: any) {
      setError('Failed to load services')
    } finally {
      setLoading(false)
    }
  }

  const categories = [...new Set(services.map(service => service.category))]

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
        .animate-fadeInUp { animation: fadeInUp 0.6s ease-out forwards; }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white">
        {error && (
          <div className="fixed top-0 left-0 right-0 bg-red-600 text-white p-4 text-center z-50">
            {error}
          </div>
        )}

        {/* Navigation - FIXED */}
        <nav className="bg-white/95 backdrop-blur-sm text-black p-4 flex justify-between items-center shadow-xl">
          <Link to="/dashboard" className="flex items-center hover:opacity-70 transition-opacity">
            <TalentsLogo size="md" variant="light" showText={true} />
          </Link>
        </nav>

        {/* Breadcrumb */}
        <Breadcrumb />

        <div className="container mx-auto p-8">
          <div className="animate-fadeInUp">
            <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent flex items-center space-x-3">
              <ServiceIcons.Tools className="w-10 h-10 text-blue-400" />
              <span>Available Services</span>
            </h2>
            <p className="text-gray-400 text-lg mb-8">Choose from our professional services</p>
          </div>

          {/* Category Filter */}
          <div className="mb-8 animate-fadeInUp" style={{animationDelay: '0.2s'}}>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setSelectedCategory('')}
                className={`px-6 py-3 rounded-lg transition-all transform hover:scale-105 flex items-center space-x-2 ${
                  selectedCategory === '' 
                    ? 'bg-white text-black' 
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <ServiceIcons.Tools className="w-4 h-4" />
                <span>All Services</span>
              </button>
              {categories.map(category => {
                const CategoryIcon = getCategoryIcon(category)
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-6 py-3 rounded-lg transition-all transform hover:scale-105 capitalize flex items-center space-x-2 ${
                      selectedCategory === category 
                        ? 'bg-white text-black' 
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    <CategoryIcon className="w-4 h-4" />
                    <span>{category}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Services Grid - UPDATED WITH ICONS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service, index) => {
              const CategoryIcon = getCategoryIcon(service.category)
              
              return (
                <div
                  key={service.id}
                  className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/20 hover:bg-white/20 transition-all transform hover:translate-y-[-5px] hover:shadow-2xl duration-300 animate-fadeInUp"
                  style={{animationDelay: `${0.3 + index * 0.1}s`}}
                >
                  <div className="mb-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-3">
                        <CategoryIcon className="w-6 h-6 text-blue-400" />
                        <h3 className="text-xl font-bold text-white">{service.name}</h3>
                      </div>
                      <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center space-x-1">
                        <span>$</span>
                        <span>{service.price}</span>
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm mb-3">{service.description}</p>
                    <div className="flex justify-between text-sm text-gray-400">
                      <span className="flex items-center space-x-1">
                        <BookingIcons.Clock className="w-4 h-4" />
                        <span>{service.duration} minutes</span>
                      </span>
                      <span className="capitalize flex items-center space-x-1">
                        <UIIcons.Filter className="w-4 h-4" />
                        <span>{service.category}</span>
                      </span>
                    </div>
                  </div>
                  
                  <Link 
                    to="/book/$serviceId"
                    params={{ serviceId: service.id }}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-lg transition-all transform hover:scale-105 flex items-center justify-center font-semibold space-x-2"
                  >
                    <BookingIcons.Calendar className="w-4 h-4" />
                    <span>Book Now</span>
                  </Link>
                </div>
              )
            })}
          </div>

          {filteredServices.length === 0 && (
            <div className="text-center py-12">
              <ServiceIcons.Tools className="w-24 h-24 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-xl">No services found for the selected category</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default Services
import React, { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { TalentsLogo } from '../components/Logo'
import { apiClient, authAPI } from '../utils/apiClient'

const ProviderLogin: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await authAPI.providerLogin(email, password)
      localStorage.setItem('token', response.token)
      localStorage.setItem('user', JSON.stringify(response.user))
      
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${response.token}`;

      // Provider login always goes to provider dashboard
      navigate({ to: '/provider' })
    } catch (error: any) {
      setError(error.message || 'Login failed')
    } finally {
      setLoading(false)
    }
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

      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header with Logo */}
          <div className="text-center mb-8 animate-fadeInUp">
            <div className="flex justify-center mb-4">
              <TalentsLogo size="lg" variant="gradient" showText={false} />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Provider Login</h1>
            <p className="text-gray-400">Access your service provider dashboard</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-600/20 border border-red-600 text-red-400 px-4 py-3 rounded-lg mb-6 animate-fadeInUp">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6 animate-fadeInUp" style={{animationDelay: '0.2s'}}>
            <div>
              <label htmlFor="email" className="block text-gray-300 text-sm font-medium mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="provider@example.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-gray-300 text-sm font-medium mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing In...' : 'Sign In as Provider'}
            </button>
          </form>

          {/* Navigation Links */}
          <div className="mt-8 text-center space-y-4 animate-fadeInUp" style={{animationDelay: '0.4s'}}>
            <div className="text-gray-400">
              Don't have a provider account?{' '}
              <Link to="/provider/register" className="text-blue-400 hover:text-blue-300 font-medium">
                Register as Provider
              </Link>
            </div>
            
            <div className="text-gray-400">
              Are you a customer?{' '}
              <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium">
                Customer Login
              </Link>
            </div>
          </div>
        </div>

        {/* Background decorations */}
        <div className="fixed top-10 left-10 w-72 h-72 bg-blue-500 opacity-10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="fixed bottom-10 right-10 w-80 h-80 bg-purple-500 opacity-10 rounded-full blur-3xl pointer-events-none"></div>
      </div>
    </>
  )
}

export default ProviderLogin
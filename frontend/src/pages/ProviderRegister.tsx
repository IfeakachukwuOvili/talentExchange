import React, { useState, useMemo } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { TalentsLogo } from '../components/Logo'
import { validatePassword } from '../utils/passwordValidator'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL 

const ProviderRegister: React.FC = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  // Actually validate the password when it changes
  const passwordValidation = useMemo(() => {
    if (!password) return { isValid: false, errors: [], strength: 'weak' as const }
    return validatePassword(password)
  }, [password])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!passwordValidation.isValid) {
      setError(`Password requirements: ${passwordValidation.errors.join(', ')}`)
      return
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/provider/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('userRole', data.user.role)
        navigate({ to: '/provider' })
      } else {
        setError(data.message || 'Registration failed')
      }
    } catch (err) {
      setError('Network error. Please try again.')
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
            <h1 className="text-3xl font-bold text-white mb-2">Join as Provider</h1>
            <p className="text-gray-400">Start offering your professional services</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-600/20 border border-red-600 text-red-400 px-4 py-3 rounded-lg mb-6 animate-fadeInUp">
              {error}
            </div>
          )}

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-6 animate-fadeInUp" style={{animationDelay: '0.2s'}}>
            <div>
              <label htmlFor="name" className="block text-gray-300 text-sm font-medium mb-2">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="John Doe"
                required
              />
            </div>

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
                className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                  password && !passwordValidation.isValid 
                    ? 'border-red-500 focus:ring-red-500' 
                    : password && passwordValidation.isValid 
                    ? 'border-green-500 focus:ring-green-500'
                    : 'border-white/20 focus:ring-blue-500'
                }`}
                placeholder="Create a password"
                required
              />
              
              {/* Password Requirements */}
              {password && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${passwordValidation.strength === 'strong' ? 'bg-green-500' : passwordValidation.strength === 'medium' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                    <span className={`text-xs ${passwordValidation.strength === 'strong' ? 'text-green-400' : passwordValidation.strength === 'medium' ? 'text-yellow-400' : 'text-red-400'}`}>
                      Password strength: {passwordValidation.strength}
                    </span>
                  </div>
                  
                  {passwordValidation.errors.length > 0 && (
                    <div className="text-xs text-red-400">
                      <div className="font-medium">Requirements needed:</div>
                      <ul className="ml-2 mt-1 space-y-1">
                        {passwordValidation.errors.map((error, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <span className="text-red-400">•</span>
                            {error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {passwordValidation.isValid && (
                    <div className="text-xs text-green-400 flex items-center gap-2">
                      <span className="text-green-400">✓</span>
                      Password meets all requirements
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-gray-300 text-sm font-medium mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                  confirmPassword && password !== confirmPassword 
                    ? 'border-red-500 focus:ring-red-500' 
                    : confirmPassword && password === confirmPassword
                    ? 'border-green-500 focus:ring-green-500'
                    : 'border-white/20 focus:ring-blue-500'
                }`}
                placeholder="Confirm your password"
                required
              />
              
              {/* Password Match Indicator */}
              {confirmPassword && (
                <div className="mt-2">
                  {password === confirmPassword ? (
                    <div className="text-xs text-green-400 flex items-center gap-2">
                      <span className="text-green-400">✓</span>
                      Passwords match
                    </div>
                  ) : (
                    <div className="text-xs text-red-400 flex items-center gap-2">
                      <span className="text-red-400">✗</span>
                      Passwords do not match
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !passwordValidation.isValid || password !== confirmPassword}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Register as Provider'}
            </button>
          </form>

          {/* Navigation Links */}
          <div className="mt-8 text-center space-y-4 animate-fadeInUp" style={{animationDelay: '0.4s'}}>
            <div className="text-gray-400">
              Already have a provider account?{' '}
              <Link to="/provider/login" className="text-blue-400 hover:text-blue-300 font-medium">
                Sign In
              </Link>
            </div>
            
            <div className="text-gray-400">
              Want to book services instead?{' '}
              <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium">
                Customer Registration
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

export default ProviderRegister
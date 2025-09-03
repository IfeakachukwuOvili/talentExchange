import React, { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { authAPI } from '../utils/apiClient'
import { validatePassword } from '../utils/passwordValidator'
import type { PasswordValidation } from '../utils/passwordValidator'
import { TalentsLogo } from '../components/Logo'

const Register: React.FC = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidation>({ 
    isValid: false, 
    errors: [], 
    strength: 'weak' as const 
  })
  const navigate = useNavigate()

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value
    setPassword(newPassword)
    setPasswordValidation(validatePassword(newPassword))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!passwordValidation.isValid) {
      setError('Password does not meet security requirements')
      return
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const response = await authAPI.register(name, email, password)
      localStorage.setItem('token', response.token)
      localStorage.setItem('userRole', 'CUSTOMER')
      navigate({ to: '/dashboard' })
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const getPasswordStrengthColor = () => {
    switch (passwordValidation.strength) {
      case 'strong': return 'border-green-500 focus:ring-green-500'
      case 'medium': return 'border-yellow-500 focus:ring-yellow-500'
      default: return 'border-white/20 focus:ring-blue-500'
    }
  }

  const getPasswordStrengthText = () => {
    switch (passwordValidation.strength) {
      case 'strong': return 'Strong password ✓'
      case 'medium': return 'Medium strength'
      case 'weak': return 'Weak password'
      default: return ''
    }
  }

  const getPasswordStrengthTextColor = () => {
    switch (passwordValidation.strength) {
      case 'strong': return 'text-green-400'
      case 'medium': return 'text-yellow-400'
      default: return 'text-red-400'
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
            <h1 className="text-3xl font-bold text-white mb-2">Join Talents Exchange</h1>
            <p className="text-gray-400">Create your account and start booking services</p>
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
                placeholder="Enter your full name"
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
                placeholder="Enter your email"
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
                onChange={handlePasswordChange}
                className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${getPasswordStrengthColor()}`}
                placeholder="Create a password"
                required
              />
              {password && (
                <div className="mt-2">
                  <div className={`text-xs font-medium ${getPasswordStrengthTextColor()}`}>
                    {getPasswordStrengthText()}
                  </div>
                  {passwordValidation.errors.length > 0 && (
                    <div className="text-xs mt-1 space-y-1">
                      {passwordValidation.errors.map((error, i) => (
                        <div key={i} className="text-red-400">• {error}</div>
                      ))}
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
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Confirm your password"
                required
              />
              {confirmPassword && password !== confirmPassword && (
                <div className="mt-1 text-xs text-red-400">
                  Passwords do not match
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !passwordValidation.isValid || password !== confirmPassword}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Navigation Links */}
          <div className="mt-8 text-center space-y-4 animate-fadeInUp" style={{animationDelay: '0.4s'}}>
            <div className="text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium">
                Sign In
              </Link>
            </div>
            
            <div className="text-gray-400">
              Want to offer services instead?{' '}
              <Link to="/provider/register" className="text-blue-400 hover:text-blue-300 font-medium">
                Provider Registration
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

export default Register
import React from 'react'
import { HiSparkles } from 'react-icons/hi2'
import { FiTrendingUp } from 'react-icons/fi'
import { MdSwapHoriz } from 'react-icons/md'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'light' | 'dark' | 'gradient'
  showText?: boolean
  className?: string
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12', 
  lg: 'w-16 h-16',
  xl: 'w-20 h-20'
}

const iconSizes = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8', 
  xl: 'w-10 h-10'
}

const textSizes = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
  xl: 'text-3xl'
}

export const TalentsLogo: React.FC<LogoProps> = ({ 
  size = 'md', 
  variant = 'gradient',
  showText = true,
  className = ''
}) => {
  const getLogoStyles = () => {
    switch (variant) {
      case 'light':
        return 'bg-white text-black border-2 border-gray-200'
      case 'dark':
        return 'bg-black text-white border-2 border-gray-800'
      case 'gradient':
      default:
        return 'bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 text-white shadow-lg'
    }
  }

  const getTextStyles = () => {
    switch (variant) {
      case 'light':
        return 'text-black'
      case 'dark':
        return 'text-white'
      case 'gradient':
      default:
        return 'bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'
    }
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Logo Icon */}
      <div className={`
        ${sizeClasses[size]} 
        ${getLogoStyles()}
        rounded-xl flex items-center justify-center
        transition-all duration-300 hover:scale-105 hover:shadow-xl
        relative overflow-hidden
      `}>
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1 left-1">
            <HiSparkles className={iconSizes[size]} />
          </div>
          <div className="absolute bottom-1 right-1 rotate-180">
            <FiTrendingUp className={iconSizes[size]} />
          </div>
        </div>
        
        {/* Main T logo */}
        <span className={`font-bold ${textSizes[size]} relative z-10`}>
          T
        </span>
        
        {/* Exchange arrows overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-30">
          <MdSwapHoriz className={iconSizes[size]} />
        </div>
      </div>

      {/* Text */}
      {showText && (
        <div className="flex flex-col">
          <h1 className={`${textSizes[size]} font-bold ${getTextStyles()}`}>
            Talents Exchange
          </h1>
          {size === 'lg' || size === 'xl' ? (
            <p className="text-gray-400 text-sm -mt-1">
              Multiplying what you've been given
            </p>
          ) : null}
        </div>
      )}
    </div>
  )
}

// Simple version for favicon/small spaces
export const TalentsIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 32, 
  className = '' 
}) => {
  return (
    <div 
      className={`
        bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 
        text-white rounded-xl flex items-center justify-center
        shadow-lg relative overflow-hidden ${className}
      `}
      style={{ width: size, height: size }}
    >
      {/* Background sparkles */}
      <div className="absolute inset-0 opacity-20">
        <HiSparkles className="w-3 h-3 absolute top-1 left-1" />
        <FiTrendingUp className="w-3 h-3 absolute bottom-1 right-1 rotate-180" />
      </div>
      
      {/* Main T */}
      <span className="font-bold text-sm relative z-10">T</span>
      
      {/* Exchange indicator */}
      <div className="absolute inset-0 flex items-center justify-center opacity-30">
        <MdSwapHoriz className="w-3 h-3" />
      </div>
    </div>
  )
}

export default TalentsLogo
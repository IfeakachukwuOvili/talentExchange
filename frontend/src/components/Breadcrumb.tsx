import React from 'react'
import { Link, useLocation } from '@tanstack/react-router'

interface BreadcrumbItem {
  label: string
  path: string
  icon: string
  isActive?: boolean
}

const Breadcrumb: React.FC = () => {
  const location = useLocation()
  const currentPath = location.pathname

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Dashboard', path: '/dashboard', icon: '🏠' }
    ]

    if (currentPath === '/dashboard') {
      breadcrumbs[0].isActive = true
      return breadcrumbs
    }

    if (currentPath === '/services') {
      breadcrumbs.push({ 
        label: 'Services', 
        path: '/services', 
        icon: '🛠️', 
        isActive: true 
      })
    }

    if (currentPath.startsWith('/book/')) {
      breadcrumbs.push({ 
        label: 'Services', 
        path: '/services', 
        icon: '🛠️' 
      })
      breadcrumbs.push({ 
        label: 'Book Service', 
        path: currentPath, 
        icon: '📝', 
        isActive: true 
      })
    }

    return breadcrumbs
  }

  const breadcrumbs = getBreadcrumbs()

  return (
    <div className="bg-white/5 backdrop-blur-sm border-b border-white/10 py-3">
      <div className="container mx-auto px-8">
        <nav className="flex items-center space-x-2 text-sm">
          {breadcrumbs.map((item, index) => (
            <React.Fragment key={item.path}>
              {index > 0 && (
                <span className="text-gray-500 mx-2">›</span>
              )}
              {item.isActive ? (
                <span className="text-white font-medium flex items-center space-x-1">
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </span>
              ) : (
                <Link 
                  to={item.path}
                  className="text-blue-400 hover:text-blue-300 transition-colors flex items-center space-x-1"
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>
    </div>
  )
}

export default Breadcrumb
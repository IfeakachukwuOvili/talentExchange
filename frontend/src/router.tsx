import { createRouter, createRoute, createRootRoute, Outlet } from '@tanstack/react-router'
import { useEffect } from 'react'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Services from './pages/Services'
import Booking from './pages/Booking'
import ProviderLogin from './pages/ProviderLogin'
import ProviderRegister from './pages/ProviderRegister'
import ProviderDashboard from './pages/ProviderDashboard'
import ProviderServices from './pages/ProviderServices'
import { websocketService } from './utils/websocketService'

// Use createRootRoute for the top-level route. It does NOT need getParentRoute.
const rootRoute = createRootRoute({
  component: () => {
    useEffect(() => {
      const token = localStorage.getItem('token')
      if (token) {
        websocketService.connect(token)
      }

      return () => {
        websocketService.disconnect()
      }
    }, [])

    return <Outlet /> 
  }
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Login,
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: Login,
})

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  component: Register,
})

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: Dashboard,
})

const servicesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/services',
  component: Services,
})

const bookingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/book/$serviceId',
  component: Booking,
})

// Provider Auth Routes
const providerLoginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/provider/login',
  component: ProviderLogin,
})

const providerRegisterRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/provider/register',
  component: ProviderRegister,
})

// Provider Dashboard Routes
const providerDashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/provider',
  component: ProviderDashboard,
})

const providerServicesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/provider/services',
  component: ProviderServices,
})

const routeTree = rootRoute.addChildren([
  indexRoute, 
  loginRoute, 
  registerRoute, 
  dashboardRoute, 
  servicesRoute, 
  bookingRoute,
  providerLoginRoute,
  providerRegisterRoute,
  providerDashboardRoute,
  providerServicesRoute
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
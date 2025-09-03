import React from 'react'
import {
  // Navigation & UI
  FiHome, FiSettings, FiUser, FiLogOut, FiMenu, FiX, FiArrowLeft,
  FiCalendar, FiClock, FiDollarSign, FiMapPin, FiStar, FiSearch,
  FiFilter, FiPlus, FiEdit3, FiTrash2, FiEye, FiEyeOff,
  
  // Service Categories
  FiTool, 
  
  
  // Status & Actions
  FiCheck, FiCheckCircle, FiXCircle, FiAlertCircle, FiClock as FiPending,
  FiPlay, FiRefreshCw, FiDownload, FiUpload,
  
  // Business & Analytics
  FiTrendingUp, FiPieChart, FiBarChart,
  FiUsers, FiBookOpen, FiFileText,
  
  // Communication
  FiBell, FiMail, FiPhone, FiMessageSquare, FiSend,
  
  // General
  FiInfo, FiHelpCircle, FiShield, FiLock, FiUnlock
} from 'react-icons/fi'

import {
  // Material Design Icons for additional options
  MdCleaningServices, MdElectricalServices, MdPlumbing, MdLandscape,
  MdConstruction, MdLocalShipping, MdHandyman, MdPrint,
  
  // Business Icons
  MdDashboard, MdAnalytics, MdDevices, 
  MdWorkOutline
} from 'react-icons/md'

import {
  // Heroicons for modern alternatives
  HiOutlineSparkles, HiOutlineCheck, HiOutlineShieldCheck} from 'react-icons/hi2'

// Export organized icon sets
export const NavigationIcons = {
  Home: FiHome,
  Settings: FiSettings,
  User: FiUser,
  Logout: FiLogOut,
  Menu: FiMenu,
  Close: FiX,
  Back: FiArrowLeft,
  Dashboard: MdDashboard
}

export const ServiceIcons = {
  // Categories
  Cleaning: MdCleaningServices,
  Electrical: MdElectricalServices,
  Plumbing: MdPlumbing,
  Landscaping: MdLandscape,
  Repair: MdConstruction,
  Moving: MdLocalShipping,
  Handyman: MdHandyman,
  Painting: MdPrint,
  Other: MdWorkOutline,
  
  // Actions
  Add: FiPlus,
  Edit: FiEdit3,
  Delete: FiTrash2,
  View: FiEye,
  Hide: FiEyeOff,
  Tools: FiTool
}

export const BookingIcons = {
  Calendar: FiCalendar,
  Clock: FiClock,
  Pending: FiPending,
  Confirmed: FiCheckCircle,
  InProgress: FiPlay,
  Completed: FiCheck,
  Cancelled: FiXCircle,
  Warning: FiAlertCircle
}

export const BusinessIcons = {
  Revenue: FiDollarSign,
  Analytics: MdAnalytics,
  TrendingUp: FiTrendingUp,
  BarChart: FiBarChart,
  PieChart: FiPieChart,
  Users: FiUsers,
  Bookings: FiBookOpen,
  Services: MdDevices,
  Reports: FiFileText
}

export const UIIcons = {
  Search: FiSearch,
  Filter: FiFilter,
  Star: FiStar,
  MapPin: FiMapPin,
  Info: FiInfo,
  Help: FiHelpCircle,
  Bell: FiBell,
  Mail: FiMail,
  Phone: FiPhone,
  Message: FiMessageSquare,
  Send: FiSend,
  Download: FiDownload,
  Upload: FiUpload,
  Refresh: FiRefreshCw,
  Shield: FiShield,
  Lock: FiLock,
  Unlock: FiUnlock,
  Verified: HiOutlineCheck,
  Security: HiOutlineShieldCheck,
  Sparkles: HiOutlineSparkles
}

// Helper function to get category icon
export const getCategoryIcon = (category: string) => {
  const categoryMap: { [key: string]: React.ComponentType<any> } = {
    cleaning: ServiceIcons.Cleaning,
    electrical: ServiceIcons.Electrical,
    plumbing: ServiceIcons.Plumbing,
    landscaping: ServiceIcons.Landscaping,
    repair: ServiceIcons.Repair,
    moving: ServiceIcons.Moving,
    handyman: ServiceIcons.Handyman,
    painting: ServiceIcons.Painting,
    other: ServiceIcons.Other
  }
  
  return categoryMap[category.toLowerCase()] || ServiceIcons.Other
}

// Helper function to get status icon
export const getStatusIcon = (status: string) => {
  const statusMap: { [key: string]: React.ComponentType<any> } = {
    PENDING: BookingIcons.Pending,
    CONFIRMED: BookingIcons.Confirmed,
    IN_PROGRESS: BookingIcons.InProgress,
    COMPLETED: BookingIcons.Completed,
    CANCELLED: BookingIcons.Cancelled
  }
  
  return statusMap[status] || BookingIcons.Warning
}

// Helper function to get status color
export const getStatusColor = (status: string) => {
  const colorMap: { [key: string]: string } = {
    PENDING: 'text-yellow-400',
    CONFIRMED: 'text-blue-400',
    IN_PROGRESS: 'text-purple-400',
    COMPLETED: 'text-green-400',
    CANCELLED: 'text-red-400'
  }
  
  return colorMap[status] || 'text-gray-400'
}
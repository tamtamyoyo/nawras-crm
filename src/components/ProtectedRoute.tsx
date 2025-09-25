import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuthHook'
import { Layout } from './Layout'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'manager' | 'sales_rep'
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()
  console.log('🔐 ProtectedRoute - Auth state:', { user: !!user, profile: !!profile, loading })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" role="status" aria-hidden="true"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Enforce authentication
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Check for required role if specified
  if (requiredRole && profile) {
    const roleHierarchy = {
      'sales_rep': 1,
      'manager': 2,
      'admin': 3
    }
    
    const userRoleLevel = roleHierarchy[profile.role as keyof typeof roleHierarchy] || 0
    const requiredRoleLevel = roleHierarchy[requiredRole] || 0
    
    if (userRoleLevel < requiredRoleLevel) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      )
    }
  }

  return (
    <Layout>
      {children}
    </Layout>
  )
}
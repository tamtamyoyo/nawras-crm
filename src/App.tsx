import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuthHook'
import { ProtectedRoute } from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'
import LoadingIndicator from './components/LoadingIndicator'
import OfflineIndicator from './components/OfflineIndicator'
import ApiRetryWrapper from './components/ApiRetryWrapper'
import { Toaster } from '@/components/ui/toaster'
import errorReportingService from './services/errorReportingService'
import performanceMonitoringService from './services/performanceMonitoringService'
import offlineService from './services/offlineService'
import loadingStateService from './services/loadingStateService'
import { useEffect, Suspense, lazy } from 'react'

// Lazy load page components for code splitting
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Customers = lazy(() => import('./pages/Customers'))
const Leads = lazy(() => import('./pages/Leads'))
const Deals = lazy(() => import('./pages/Deals'))
const Proposals = lazy(() => import('./pages/Proposals'))
const Invoices = lazy(() => import('./pages/Invoices'))
const Analytics = lazy(() => import('./pages/Analytics'))
const Settings = lazy(() => import('./pages/Settings'))

function App() {
  // Initialize services on app startup
  useEffect(() => {
    // Services are already initialized as singletons
    // Just setup cleanup on unmount
    return () => {
      performanceMonitoringService.destroy()
    }
  }, [])

  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}>
          <div className="min-h-screen bg-gray-50">
            {/* Global UI Components */}
            <LoadingIndicator />
            <OfflineIndicator />
            <ApiRetryWrapper />
            
            <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div></div>}>
              <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/customers" element={
                <ProtectedRoute>
                  <Customers />
                </ProtectedRoute>
              } />
              
              <Route path="/leads" element={
                <ProtectedRoute>
                  <Leads />
                </ProtectedRoute>
              } />
              
              <Route path="/deals" element={
                <ProtectedRoute>
                  <Deals />
                </ProtectedRoute>
              } />
              
              <Route path="/proposals" element={
                <ProtectedRoute>
                  <Proposals />
                </ProtectedRoute>
              } />
              
              <Route path="/invoices" element={
                <ProtectedRoute>
                  <Invoices />
                </ProtectedRoute>
              } />
              
              <Route path="/analytics" element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              } />
              
              <Route path="/settings" element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } />
              
              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Suspense>
          </div>
          <Toaster />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App

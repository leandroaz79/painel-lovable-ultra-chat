import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { useAuth } from './hooks/useAuth'
import { useTheme } from './hooks/useTheme'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Landing from './pages/Landing'

const UserDashboard = lazy(() => import('./pages/user/Dashboard'))
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'))
const Customers = lazy(() => import('./pages/admin/Customers'))
const Resellers = lazy(() => import('./pages/admin/Resellers'))
const Sales = lazy(() => import('./pages/admin/Sales'))
const Products = lazy(() => import('./pages/admin/Products'))
const ResellerDashboard = lazy(() => import('./pages/reseller/Dashboard'))
const AdminBranding = lazy(() => import('./pages/admin/Branding'))
const AdminTheme = lazy(() => import('./pages/admin/Theme'))
const ResellerBranding = lazy(() => import('./pages/reseller/Branding'))

function LoadingScreen() {
  return (
    <div className="app-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="loading-spinner-large" />
    </div>
  )
}

function ProtectedRoute({ 
  children, 
  requiredRole 
}: { 
  children: React.ReactNode
  requiredRole: 'admin' | 'reseller' | 'user'
}) {
  const { user, role, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-green-400 text-xl">Carregando...</div>
      </div>
    )
  }

  if (!user || role !== requiredRole) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function App() {
  useTheme()
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        <Route
          path="/user"
          element={
            <ProtectedRoute requiredRole="user">
              <Suspense fallback={<LoadingScreen />}>
                <UserDashboard />
              </Suspense>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <Suspense fallback={<LoadingScreen />}>
                <AdminDashboard />
              </Suspense>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin/customers"
          element={
            <ProtectedRoute requiredRole="admin">
              <Suspense fallback={<LoadingScreen />}>
                <Customers />
              </Suspense>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/resellers"
          element={
            <ProtectedRoute requiredRole="admin">
              <Suspense fallback={<LoadingScreen />}>
                <Resellers />
              </Suspense>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin/sales"
          element={
            <ProtectedRoute requiredRole="admin">
              <Suspense fallback={<LoadingScreen />}>
                <Sales />
              </Suspense>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin/products"
          element={
            <ProtectedRoute requiredRole="admin">
              <Suspense fallback={<LoadingScreen />}>
                <Products />
              </Suspense>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin/branding"
          element={
            <ProtectedRoute requiredRole="admin">
              <Suspense fallback={<LoadingScreen />}>
                <AdminBranding />
              </Suspense>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin/theme"
          element={
            <ProtectedRoute requiredRole="admin">
              <Suspense fallback={<LoadingScreen />}>
                <AdminTheme />
              </Suspense>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/reseller"
          element={
            <ProtectedRoute requiredRole="reseller">
              <Suspense fallback={<LoadingScreen />}>
                <ResellerDashboard />
              </Suspense>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/reseller/branding"
          element={
            <ProtectedRoute requiredRole="reseller">
              <Suspense fallback={<LoadingScreen />}>
                <ResellerBranding />
              </Suspense>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App

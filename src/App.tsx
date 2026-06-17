import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Login from './pages/Login'
import Landing from './pages/Landing'
import UserDashboard from './pages/user/Dashboard'
import AdminDashboard from './pages/admin/Dashboard'
import Resellers from './pages/admin/Resellers'
import Sales from './pages/admin/Sales'
import Products from './pages/admin/Products'
import ResellerDashboard from './pages/reseller/Dashboard'

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
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        
        <Route
          path="/user"
          element={
            <ProtectedRoute requiredRole="user">
              <UserDashboard />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin/resellers"
          element={
            <ProtectedRoute requiredRole="admin">
              <Resellers />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin/sales"
          element={
            <ProtectedRoute requiredRole="admin">
              <Sales />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin/products"
          element={
            <ProtectedRoute requiredRole="admin">
              <Products />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/reseller/*"
          element={
            <ProtectedRoute requiredRole="reseller">
              <ResellerDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App

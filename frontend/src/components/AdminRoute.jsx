import { useAuth } from '../context/AuthContext'
import { Navigate } from 'react-router-dom'

const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, hydrated } = useAuth();

  if (!hydrated) return null

  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }



  return children
}

export default AdminRoute
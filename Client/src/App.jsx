import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Pages/Home.page'
import Login from './Pages/Login.page'
import Register from './Pages/Register.page'
import Dashboard from './Pages/UserDashboard.page'
import AdminDashboard from './Pages/AdminDashboard.page'
import RequireAuth from './utils/RequireAuth'


const App = () => {
  return (
    <div className="bg-black min-h-screen">
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login/>}/>
          <Route path="/register" element={<Register/>}/>
          <Route path="/register/admin" element={<Register/>}/>
          <Route
            path="/dashboard"
            element={
              <RequireAuth allowedRoles={['user']}>
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <RequireAuth allowedRoles={['admin']}>
                <AdminDashboard />
              </RequireAuth>
            }
          />

        </Routes>
      </Router>
    </div>
  )
}

export default App

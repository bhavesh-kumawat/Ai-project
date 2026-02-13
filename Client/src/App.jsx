import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Pages/Home.page'
import Login from './Pages/Login.page'
import Register from './Pages/Register.page'


const App = () => {
  return (
    <div className="bg-black min-h-screen">
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login/>}/>
          <Route path="/register" element={<Register/>}/>
          <Route path="/register/admin" element={<Register/>}/>

        </Routes>
      </Router>
    </div>
  )
}

export default App

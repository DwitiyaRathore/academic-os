import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import SyllabusPage from './pages/SyllabusPage'
import TimetablePage from './pages/TimetablePage'
import Dashboard from './pages/Dashboard'

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>}>
          <Route path="syllabus" element={<SyllabusPage />} />
          <Route path="timetable" element={<TimetablePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
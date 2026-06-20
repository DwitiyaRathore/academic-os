import { Outlet, Link, useNavigate } from 'react-router-dom'

function Dashboard() {
  const navigate = useNavigate()
  
  let user = { name: 'Student' }
  try {
    const userData = localStorage.getItem('user')
    if (userData && userData !== 'undefined') {
      user = JSON.parse(userData)
    }
  } catch (e) {
    user = { name: 'Student' }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <div className="w-64 bg-white shadow-lg flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold text-blue-700">Academic OS</h1>
          <p className="text-sm text-gray-500 mt-1">
            Hi, {user.name || 'Student'}!
          </p>
        </div>

        <nav className="flex-1 p-4">
          <Link
            to="/timetable"
            className="flex items-center gap-3 p-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-700 mb-2"
          >
            📅 Timetable
          </Link>
          <Link
            to="/syllabus"
            className="flex items-center gap-3 p-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-700 mb-2"
          >
            📚 Syllabus Tracker
          </Link>
          <Link
            to="/quiz"
            className="flex items-center gap-3 p-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-700 mb-2"
          >
            🧠 Quiz
          </Link>
        </nav>

        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className="w-full bg-red-50 text-red-600 py-2 rounded-lg hover:bg-red-100 text-sm font-medium"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="flex-1 p-6">
        <Outlet />
      </div>
    </div>
  )
}

export default Dashboard
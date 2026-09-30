import { Routes, Route, Link } from 'react-router-dom'

function App() {
  return (
    <div style={{ padding: 20 }}>
      <nav style={{ display: 'flex', gap: 15, marginBottom: 20 }}>
        <Link to="/">Home</Link>
        <Link to="/login">Login</Link>
        <Link to="/search">Search</Link>
      </nav>

      <Routes>
        <Route path="/" element={<h1>GenMed Home</h1>} />
        <Route path="/login" element={<h1>Login Page</h1>} />
        <Route path="/search" element={<h1>Medicine Search Page</h1>} />
      </Routes>
    </div>
  )
}

export default App
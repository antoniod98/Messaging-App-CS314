import { useState, useEffect } from 'react'
import axios from 'axios'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const [backendMessage, setBackendMessage] = useState('Loading...')
  const [backendStatus, setBackendStatus] = useState('connecting')

  useEffect(() => {
    // Test backend connection
    const testBackend = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/test`)
        setBackendMessage(response.data.message)
        setBackendStatus('connected')
      } catch (error) {
        setBackendMessage('Failed to connect to backend')
        setBackendStatus('error')
        console.error('Backend connection error:', error)
      }
    }

    testBackend()
  }, [])

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>MERN Stack App</h1>

      <div className="card" style={{
        backgroundColor: backendStatus === 'connected' ? '#28a745' : backendStatus === 'error' ? '#dc3545' : '#ffc107',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3>Backend Status: {backendStatus}</h3>
        <p>{backendMessage}</p>
      </div>

      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App

import React, {useState} from 'react'
import Navbar from "./components/Navbar";
import "./index.css"
import "./Login.css"
import { useNavigate, Link } from 'react-router-dom';
import { Button, TextField } from '@mui/material';
const backendRoute = 'http://localhost:3000'

const handleSubmit = async (event, formData, navigate, setError) => {
  event.preventDefault();
  // console.log(formData)
  try {
    const response = await fetch(`${backendRoute}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    if (response.ok) {
      navigate('/login')
    } else {
      console.log(response)
      setError('Failed to login')
    }
  } catch (e) {
    console.log(e)
    // setError(e)
  }
}

export default function Login() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value })
  }
  const navigate = useNavigate(); // https://reactrouter.com/en/main/hooks/use-navigate
  const [error, setError] = useState(null)
  return (
    <>
    <Navbar/>
    <div className='content'>
    <h1 style={{color: "#4D4D4D"}}>Log In</h1>
        <p style={{color: "#808080"}}>Enter your credentials to access your account.</p>
        <form onSubmit={(event) => handleSubmit(event, formData, navigate, setError)}>
          <TextField margin="normal" label="Email" type="email" name="email" value={formData.email} onChange={handleChange} />
          <TextField margin="normal" label="Password" type="password" name="password" value={formData.password} onChange={handleChange} />
          <Button variant="contained" type="submit">Log In</Button>
          <p className='smallText'>Don't have an account? <Link to={'/signup'}>Sign up here</Link></p>
          {error && <p style={{ color: 'red' }}>{error}</p>}
        </form>
    </div>
    </>
  )
}

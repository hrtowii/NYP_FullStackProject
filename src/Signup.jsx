import { React, useState } from 'react'
import Navbar from "./components/Navbar";
import "./index.css"
import "./Signup.css"
import { useNavigate, Link } from 'react-router-dom';
import { Button, FormControl, TextField, InputLabel, MenuItem, Select } from '@mui/material';
const backendRoute = 'http://localhost:3000'

// TODO: handle roles on the backend routes, post to it with the role you want to create a user/donator depending on selection
// TODO: handle email OTP verification with Resend
const handleSubmit = async (event, formData, navigate, setError) => {
  event.preventDefault();
  console.log(formData)
  try {
    const response = await fetch(`${backendRoute}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    if (response.ok) {
      navigate('/login')
    } else {
      console.log(response)
      setError('Failed to create account')
    }
  } catch (e) {
    console.log(e)
    // setError(e)
  }
}

export default function Signup() {
  const [formData, setFormData] = useState({ role: '', name: '', email: '', password: '' });
  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value })
  }

  const navigate = useNavigate(); // https://reactrouter.com/en/main/hooks/use-navigate
  const [error, setError] = useState(null)


  return (
    <>
      <Navbar />
      <div className='content'>
        <h1 style={{ color: "#4D4D4D" }}>Sign up</h1>
        <p style={{ color: "#808080" }}>Create an account to access all features.</p>
        <form onSubmit={(event) => handleSubmit(event, formData, navigate, setError)}>
          <div className="inputSplit">
            <div className="roleField">
              <TextField
                select
                value={formData.role}
                label="Role"
                onChange={(event) => setFormData({ ...formData, 'role': event.target.value })}
              >
                <MenuItem value={'user'}>User</MenuItem>
                <MenuItem value={'donator'}>Donator</MenuItem>
              </TextField>
            </div>
            <TextField label="Username" type="text" name="name" value={formData.name} onChange={handleChange} />
          </div>
          <TextField margin="normal" label="Email" type="email" name="email" value={formData.email} onChange={handleChange} />
          <TextField margin="normal" label="Password" type="password" name="password" value={formData.password} onChange={handleChange} />
          <Button variant="contained" type="submit">Sign up</Button>
          <p className='smallText'>Already a member? <Link to={'/login'}>Log in here</Link></p>
          {error && <p style={{ color: 'red' }}>{error}</p>}
        </form>
      </div>
    </>
  )
}

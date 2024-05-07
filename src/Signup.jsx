import {React, useState} from 'react'
import Navbar from "./components/Navbar";
import "./index.css"
import "./Signup.css"
import { Form, useNavigate } from 'react-router-dom';
const backendRoute = 'http://localhost:3000'

const handleSubmit = async (event, formData, navigate, setError) => {
  event.preventDefault();
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
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value })
  }

  const navigate = useNavigate(); // https://reactrouter.com/en/main/hooks/use-navigate
  const [error, setError] = useState(null)


  return (
    <>
    <Navbar/>
    <div>
      {/* write a form here to post to backendRoute + signup */}
      {/* form should have name, email, and password. on getting back 200 success, reroute to login with react-router-dom. */}
      <div>
        <h1>Sign up</h1>
        <form onSubmit={(event) => handleSubmit(event, formData, navigate, setError)}>
          <label>
            Name:
            <input type="text" name="name" value={formData.name} onChange={handleChange} />
          </label>
          <br />
          <label>
            Email:
            <input type="email" name="email" value={formData.email} onChange={handleChange} />
          </label>
          <br />
          <label>
            Password:
            <input type="password" name="password" value={formData.password} onChange={handleChange} />
          </label>
          <br />
          <button type="submit">Sign up</button>
          {error && <p style={{ color: 'red' }}>{error}</p>}
        </form>
      </div>
    </div>
    </>
  )
}

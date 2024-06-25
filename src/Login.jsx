import React, {useContext, useState} from 'react'
import Navbar from "./components/Navbar";
import "./index.css"
import "./Login.css"
import { useNavigate, Link } from 'react-router-dom';
import { Button, TextField } from '@mui/material';
import { TokenContext } from './utils/TokenContext';

const backendRoute = 'http://localhost:3000'

function parseJwt(token) {
  var base64Url = token.split('.')[1];
  var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
  return JSON.parse(jsonPayload);
}

function navigateToAppropiatePage(navigate, token) {
  const payload = parseJwt(token)
  const userRole = payload.role;
  if (userRole == "user") {
    navigate("/user")
  } else if (userRole == "donator") {
    navigate("/donator")
  } else {
    console.log("wtf?")
  }
}

const handleSubmit = async (event, formData, setError, navigate, updateToken, token) => {
  event.preventDefault();
  // console.log(formData)
  try {
    const response = await fetch(`${backendRoute}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    if (response.ok) {
      // TODO: determine whether the user is donator or user, then navigate to the corresponding landing page. Ideally, get the token then send an api route to lookup
      let whatever = await response.json();
      const token = whatever.token
      console.log(token)
      updateToken(token);
      navigateToAppropiatePage(navigate, token)
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
  const { token, updateToken } = useContext(TokenContext);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const navigate = useNavigate();
  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value })
  }
  const [error, setError] = useState(null)
  return (
    <>
    <Navbar/>
    <div className='content'>
    <h1 style={{color: "#4D4D4D"}}>Log In</h1>
        <p style={{color: "#808080"}}>Enter your credentials to access your account.</p>
        <form onSubmit={(event) => handleSubmit(event, formData, setError, navigate, updateToken, token)}>
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
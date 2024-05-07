import React from 'react'
import "./Navbar.css"
import "../index.css"
import { NavLink } from 'react-router-dom'

export default function Navbar() {
  return (
    <div className='navbar'>
      <NavLink to={"/"}>Main</NavLink>
      <NavLink to={"/about"}>About Us</NavLink>

      <NavLink to={"/signup"}>Sign Up</NavLink>
      <NavLink to={"/login"}>Log In</NavLink>
    </div>
  )
}

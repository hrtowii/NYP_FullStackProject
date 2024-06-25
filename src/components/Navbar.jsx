import React from 'react'
import "./Navbar.css"
import "../index.css"
import { NavLink } from 'react-router-dom'

export default function Navbar() {
  return (
    <div className='navbar'>
      <NavLink to={"/"}>Home</NavLink>
      <NavLink to={"/about"}>About Us</NavLink>
      <NavLink to={"/signup"}>Sign Up</NavLink>
      <NavLink to={"/login"}>Log In</NavLink>
      <NavLink to={"/review"}>Reviews</NavLink>
      <NavLink to={"/reservation"}>Reservations (temporary)</NavLink>
      <NavLink to={"/fridge"}>Fridge (temporary)</NavLink>
    </div>
  )
}

export function DonatorNavbar() {
  return (
    <div className='navbar'>
      <NavLink to={"/donator"}>Home</NavLink>
      <NavLink to={"/donator/inventory"}>Inventory</NavLink>
      <NavLink to={"/donator/donations"}>Manage Donations</NavLink>
      <NavLink to={"/donator/feedback"}>View Feedback</NavLink>
    </div>
  )
}

export function UserNavbar() {
  return (
    <div className='navbar'>
      {/* Navlink to "User Home" */}
      {/* Navlink to "Reservation" Page */}
      {/* Navlink to "Fridge" Page */}
      {/* Navlink to "Reviews" Page */}
      {/* Navlink to "Events" Page */}

    </div>
  )
}
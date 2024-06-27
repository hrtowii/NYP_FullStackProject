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
      <NavLink to={"/review"}>Review</NavLink>
      <NavLink to={"/reservation"}>Reservations (user)</NavLink>
      <NavLink to={"/fridge"}>Fridge (user)</NavLink>
      <NavLink to={"/events"}>Manage Events</NavLink>
      <NavLink to={"/cart"}>Cart (user)</NavLink>

    </div>
  )
}

export function DonatorNavbar() {
  return (
    <div className='navbar'>
      <NavLink to={"/donator"}>Home</NavLink>
      <NavLink to={"/donator/inventory"}>Inventory</NavLink>
      <NavLink to={"/donator/ManageDonations"}>Manage Donations</NavLink>
      <NavLink to={"/donator/feedback"}>View Feedback</NavLink>
      {/* <NavLink to={"/donator/events"}>Manage Events</NavLink> */}
      {/* Commented this out ^ will change to put in donator */}
    </div>
  )
}

export function UserNavbar() {
  return (
    <div className='navbar'>
      {/* Navlink to "User Home" */}
      {/* <NavLink to={"/user/reservation"}>Reservations</NavLink> */}
      {/* <NavLink to={"/user/fridge"}>Fridge</NavLink> */}
      {/* Navlink to "Reviews" Page */}
      {/* Navlink to "Events" Page */}

    </div>
  )
}

export function AdminNavbar() {
  return (
    <div className='navbar'>
      <NavLink to={"/admin"}>Admin</NavLink>
      <NavLink to={"/donator"}>Donator</NavLink>
      <NavLink to={"/user"}>User</NavLink>
    </div>
  )
}


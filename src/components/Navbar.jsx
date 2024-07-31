import React, {useContext} from 'react'
import "./Navbar.css"
import "../index.css"
import { NavLink } from 'react-router-dom'
import {TokenContext} from '../utils/TokenContext.jsx'
import AvatarMenu from './AvatarMenu.jsx'

function parseJwt(token) {
  if (!token) return {};
  var base64Url = token.split('.')[1];
  var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
  return JSON.parse(jsonPayload);
}

export default function Navbar() {
  const { token } = useContext(TokenContext);
  const isLoggedIn = token !== null;
  const currentUserRole = isLoggedIn ? parseJwt(token).role : null;
  const currentUserId = isLoggedIn ? parseJwt(token).id : null;

  return (
    <div className='navbar'>
      <NavLink to={"/"}>Home</NavLink>
      <NavLink to={"/about"}>About Us</NavLink>
      {!isLoggedIn ? (
        <>
          <NavLink to={"/signup"}>Sign Up</NavLink>
          <NavLink to={"/login"}>Log In</NavLink>
        </>
      ) : (
        <AvatarMenu currentUserRole={currentUserRole} />
      )}
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
      <NavLink to={"/donator/events"}>Manage Events</NavLink>
    </div>
  )
}

export function UserNavbar() {
  return (
    <div className='navbar'>
      {/* Navlink to "User Home" */}
      <NavLink to={"/user/reservation"}>Reservations</NavLink>
      <NavLink to={"/user/fridge"}>Fridge</NavLink>
      <NavLink to={"/user/cart"}>Cart</NavLink>
      <NavLink to={"/listofdonators"}>Donators</NavLink>
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


import React, { useContext } from 'react'
import "./Navbar.css"
import "../index.css"
import { NavLink, useLocation } from 'react-router-dom'
import { TokenContext } from '../utils/TokenContext.jsx'
import AvatarMenu from './AvatarMenu.jsx'
import parseJwt from '../utils/parseJwt.jsx'
import CartIcon from './CartIcon';

export default function Navbar() {
  const { token, updateToken } = useContext(TokenContext);
  const isLoggedIn = token !== null;
  const currentUserName = isLoggedIn ? parseJwt(token).name : null;
  const currentUserRole = isLoggedIn ? parseJwt(token).role : null;
  const currentUserId = isLoggedIn ? parseJwt(token).id : null;
  return (
    <div className='navbar'>
      <div>
        <span className="navbar-logo">🍃 CommuniFridge</span>
        <NavLink to={"/"}>Home</NavLink>
        
        <NavLink to={"/about"}>About Us</NavLink>
        {/* <NavLink to={"/sustainabilitymetrics"}>Sustainability</NavLink> */}
        {!isLoggedIn ? (
          <>
            <NavLink to={"/signup"}>Sign Up</NavLink>
            <NavLink to={"/login"}>Log In</NavLink>
          </>
        ) : null}
      </div>
      {isLoggedIn && (
        <div className="avatarmenu">
          <AvatarMenu
            currentUserRole={currentUserRole}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            updateToken={updateToken}
          />
        </div>
      )}
    </div>
  )
}

export function DonatorNavbar() {
  const { token, updateToken } = useContext(TokenContext);
  const isLoggedIn = token !== null;
  const currentUserName = isLoggedIn ? parseJwt(token).name : null;
  const currentUserRole = isLoggedIn ? parseJwt(token).role : null;
  const currentUserId = isLoggedIn ? parseJwt(token).id : null;
  const location = useLocation();

  return (
    <div className='navbar'>
      <div>
        <span className="navbar-logo">🍃 CommuniFridge</span>
        <NavLink to="/donator" end>Dashboard</NavLink>
        <NavLink to="/donator/events" isActive={() => location.pathname.startsWith('/donator/events')}>Manage Events</NavLink>
        <NavLink to="/listofdonators">Donators</NavLink>
        <NavLink to="/contactus">Contact Us</NavLink>
      </div>
      <div className="avatarmenu">
        <AvatarMenu currentUserRole={currentUserRole} currentUserId={currentUserId} currentUserName={currentUserName} updateToken={updateToken} />
      </div>
    </div>
  )
}

export function UserNavbar() {
  const { token, updateToken } = useContext(TokenContext);
  const isLoggedIn = token !== null;
  const currentUserName = isLoggedIn ? parseJwt(token).name : null;
  const currentUserRole = isLoggedIn ? parseJwt(token).role : null;
  const currentUserId = isLoggedIn ? parseJwt(token).id : null;
  return (
    <div className='navbar'>
      <div>
        
        <NavLink to={"/userlanding"}><span className="navbar-logo">🍃 CommuniFridge</span></NavLink>
        <NavLink to={"/user/reservation"}>Reservations</NavLink>
        <NavLink to={"/user/fridge"}>Fridge</NavLink>
        <NavLink to={"/user/events"}>Events</NavLink>
        <NavLink to={"/listofdonators"}>Donators</NavLink>
        <NavLink to={"/contactus"}>Contact Us</NavLink>
        <NavLink to={"/about"}>About Us</NavLink>
      </div>
      <div className="navbar-right">
        <div className="user-actions">
          <CartIcon />
        </div>
        <div className="avatarmenu">
          <AvatarMenu currentUserRole={currentUserRole} currentUserId={currentUserId} currentUserName={currentUserName} updateToken={updateToken} />
        </div>
      </div>
    </div>
  )
}

export function AdminNavbar() {
  const { token, updateToken } = useContext(TokenContext);
  const isLoggedIn = token !== null;
  const currentUserName = isLoggedIn ? parseJwt(token).name : null;
  const currentUserRole = isLoggedIn ? parseJwt(token).role : null;
  const currentUserId = isLoggedIn ? parseJwt(token).id : null;
  return (
    <div className='navbar'>
      <div>
        <span className="navbar-logo">🍃 CommuniFridge</span>
        <NavLink to={"/admin"}>Admin</NavLink>
        <NavLink to={"/donator"}>Donator</NavLink>
        <NavLink to={"/user"}>User</NavLink>
      </div>
      <div className="avatarmenu">
        <AvatarMenu currentUserRole={currentUserRole} currentUserId={currentUserId} currentUserName={currentUserName} updateToken={updateToken} />
      </div>
    </div>
  )
}
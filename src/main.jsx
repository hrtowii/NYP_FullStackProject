import React from 'react'
import ReactDOM from 'react-dom/client'
// Note: If your pages aren't loading for whatever reason check that you imported the component that you want to route to
import Landing from './Landing.jsx'
import Signup from './Signup.jsx'
import Login from './Login.jsx'
import About from './About.jsx'
import Review from './review.jsx'
import Forbidden from './Forbidden.jsx'
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import UserLanding from "./user/UserLanding.jsx"
import DonatorLanding from './donator/DonatorLanding.jsx'
import Reservation from './user/Reservation.jsx'  // gon change to ./user/Reservation.jsx
import Fridge from './user/Fridge.jsx'  // gon change to ./user/Fridge.jsx
import DonatorEvents from './donator/DonatorEvents.jsx'
import Cart from './user/Cart.jsx'
import Profile from './Profile.jsx'
import ReservationForm from './user/Cart.jsx'
import DonatorEventsAdd from './donator/DonatorEventsAdd.jsx'
import fileRoute from './components/file.jsx'

import './index.css'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { TokenProvider } from './utils/TokenContext.jsx'
import AdminLanding from './admin/AdminLanding.tsx'


const router = createBrowserRouter([
  {
    path: "/",
    element: <Landing/>,
  },
  {
    path: "/signup",
    element: <Signup/>,
  },
  {
    path: "/login",
    element: <Login/>
  },
  {
    path: "/about",
    element: <About/>
  },
  {
    path: "/review",
    element: <Review/>
  },
  {
    path: "/reservation",
    element: <Reservation/>
  },
  {
    path: "/fridge",
    element: <Fridge/>
  },
  {
    path: "/events",
    element: <DonatorEvents/>
  },
  {
    path: "/cart",
    element: <Cart/>
  },
  {
    path: "/profile/:donatorId",
    element: <Profile/>
  },
  {
    path: "/eventsadd",
    element: <DonatorEventsAdd/>
  },
  {
    path: "/file",
    element: <fileRoute/>
  },
  {
    path: "/forbidden",
    element: <Forbidden/>
  },
  // What does this ProtectedRoute do? 
  // -> Essentially, every page that you want to go through that wants a specific role (admin, user, donator etc.) goes through this route. 
  // If it succeeds, it will render the child components inside it.
  // The roles can be determined by passing in the allowedRoles prop.
  // If it fails, it redirects to the forbidden route.

  // MARK: User protected routes
  {
    path: "/user",
    element: (
      <ProtectedRoute allowedRoles={['user', 'admin']}>
        <UserLanding />
      </ProtectedRoute>
    ),
  },
  // MARK: Donator protected routes
  {
    path: "/donator",
    element: (
      <ProtectedRoute allowedRoles={['donator', 'admin']}>
        <DonatorLanding />
      </ProtectedRoute>
    ),
  },
  {
    path: "/donator/donations",
    element: (
      <ProtectedRoute allowedRoles={['donator', 'admin']}>
        <DonatorLanding/>
      </ProtectedRoute>
    )
  },
  // MARK: Admin protected routes
  {
    path: "/admin",
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <AdminLanding/>
      </ProtectedRoute>
    )
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <TokenProvider>
      <RouterProvider router={router} />
    </TokenProvider>
  </React.StrictMode>,
)

import React from 'react'
import ReactDOM from 'react-dom/client'
// Note: If your pages aren't loading for whatever reason check that you imported the component that you want to route to
import Landing from './Landing.jsx'
import Signup from './Signup.jsx'
import Login from './Login.jsx'
import About from './About.jsx'
import Forbidden from './Forbidden.jsx'
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import UserLanding from "./user/UserLanding.jsx"
import DonatorLanding from './donator/DonatorLanding.jsx'

import './index.css'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { TokenProvider } from './utils/TokenContext.jsx'


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
    path: "user",
    element: (
      <ProtectedRoute allowedRoles={['user']}>
        <UserLanding />
      </ProtectedRoute>
    ),
    // NOTE: include subroutes under user here in the future 
    // children: [
    //   {
    //     path: "profile",
    //     element: <UserProfilePage />,
    //   },
    //   {
    //     path: "settings",
    //     element: <UserSettingsPage />,
    //   },
    // ],
  },
  // MARK: Donator protected routes
  {
    path: "donator",
    element: (
      <ProtectedRoute allowedRoles={['donator']}>
        <DonatorLanding />
      </ProtectedRoute>
    ),
    // children: [
    //   {
    //     path: "profile",
    //     element: <UserProfilePage />,
    //   },
    //   {
    //     path: "settings",
    //     element: <UserSettingsPage />,
    //   },
    // ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <TokenProvider>
      <RouterProvider router={router} />
    </TokenProvider>
  </React.StrictMode>,
)

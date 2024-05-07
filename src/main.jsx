import React from 'react'
import ReactDOM from 'react-dom/client'
// Note: If your pages aren't loading for whatever reason check that you imported the component that you want to route to
import Landing from './Landing.jsx'
import Signup from './Signup.jsx'
import Login from './Login.jsx'
import About from './About.jsx'

import './index.css'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
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
  }
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)

import React from 'react'
import Navbar from './components/Navbar'

export default function Forbidden() {
  return (
    <div>
      <>
      <Navbar/>
      <div className='content'>
        <h2>You are forbidden from entering this website.</h2>
        <h5>You might be a donator trying to access a user page, or vice versa.</h5>
      </div>
      </>
    </div>
  )
}

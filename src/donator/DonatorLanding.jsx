import React from 'react'
import '../index.css'
import './DonatorLanding.css'
import { DonatorNavbar } from '../components/Navbar'
export default function DonatorLanding() {
  return (
    <>
      <DonatorNavbar/>
      <div className="content">
        <div className='currentReservations'>

        </div>
        <div className='pastReservations'>

        </div>
      </div>
    </>
  )
}

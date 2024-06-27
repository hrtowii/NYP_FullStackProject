import React from 'react'
import '../index.css'
import './DonatorLanding.css'
import { DonatorNavbar } from '../components/Navbar'
// TODO: write a expressjs backend route to fetch Reservations from a certain user and sort them into different arrays based on their completion status, then populating the fields
export default function DonatorLanding() {
  return (
    <>
      <DonatorNavbar/>
      <div className="content">
        <div className='currentReservations'>
          <h4>Your current asdasdasd</h4>
        </div>
        <div className='pastReservations'>
          <h4>Your past reservations</h4>
        </div>
      </div>
    </>
  )
}

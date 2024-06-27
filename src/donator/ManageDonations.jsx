import React from 'react'
import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import '../index.css'
import './DonatorLanding.css'
import "./ManageDonations.css"
import { DonatorNavbar } from '../components/Navbar'
import SettingsIcon from '@mui/icons-material/Settings';
import { blue, grey } from '@mui/material/colors';
import { Widgets } from '@mui/icons-material';

// TODO: write a expressjs backend route to fetch Reservations from a certain user and sort them into different arrays based on their completion status, then populating the fields

export default function ManageDonations() {
  const [category, setCategory] = useState('');
  return (
    <div className="container">
      <DonatorNavbar />
      <div className='contents'>
        <div className="action-buttons">
          <button className="btn btn-primary">
            <SettingsIcon className="icon" />
            <NavLink to={"/donator/ManageDonations"}>Manage Donations</NavLink>
          </button>
          <button className="btn btn-secondary">
            <SettingsIcon className="icon" />
            <NavLink to={"/donator/TrackDonations"}>Track Donation Progress</NavLink>
          </button>
          <button className="btn btn-secondary">
            <SettingsIcon className="icon" />
            <NavLink to={"/donator/DonateItem"}>Donate Items</NavLink>
          </button>
        </div>

        <div className="sort-section">
          <label htmlFor="category">Sort by:</label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Category</option>
            {/* Add more options here */}
          </select>
        </div>

        <h2 className="title">My Donations</h2>

        <table className="donations-table">
          <thead>
            <tr>
              <th>Food</th>
              <th>Quantity</th>
              <th>Category</th>
              <th>Expiry Date</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {/* Add table rows here when there are donations */}
          </tbody>
        </table>

        <div className="no-donations">
          No Donations yet
        </div>

        <div className="pagination">
          <div className="rows-per-page">
            <span>Rows per page:</span>
            <select>
              <option>9</option>
            </select>
          </div>
          <div className="page-controls">
            <span>0 of 0</span>
            <button className="page-button"><SettingsIcon /></button>
            <button className="page-button"><SettingsIcon /></button>
          </div>
        </div>
      </div>
    </div>

  );
}


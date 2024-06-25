import React from 'react';
import '../index.css';
import './DonatorEvents.css';
import { DonatorNavbar } from '../components/Navbar';

// TODO: write a expressjs backend route to fetch Reservations from a certain user and sort them into different arrays based on their completion status, then populating the fields
export default function DonatorEvents() {
    return (
        <>
            <DonatorNavbar />
            <div className="image-container">
                <img className="full-width-image roundedimg" src="/Eventsphoto.png" alt="Events photos" />
                <div className="overlay">
                    <p className="overlay-text">Events</p>
                    <p className="overlay-text" id='events-description'>Building a strong community, and teaching each other to help each other in need, Events help us become a tight-knit community, and a safe place to ask for help.</p>
                </div>
            </div>
        </>
    );
}

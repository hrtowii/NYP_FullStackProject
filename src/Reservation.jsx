// import shit
import React, { useState, useEffect } from 'react';
import Navbar from "./components/Navbar";
import "./Reservation.css"


// hardcoded past n current reservations
const mockCurrentReservations = [
    { id: 1, item: 'Chicken', date: 'Tuesday, 24 May 2024', time: '23:00 - 23:30', status: 'Uncollected', amount: '100g' },
    { id: 2, item: 'Chicken', date: 'Tuesday, 24 May 2024', time: '23:00 - 23:30', status: 'Uncollected', amount: '100g' },
    { id: 3, item: 'Chicken', date: 'Tuesday, 24 May 2024', time: '23:00 - 23:30', status: 'Uncollected', amount: '100g' },
];

const mockPastReservations = [
    { id: 4, item: 'Chicken', date: 'Tuesday, 24 May 2024', time: '23:00 - 23:30', status: 'Collected', amount: '100g' },
    { id: 5, item: 'Chicken', date: 'Tuesday, 24 May 2024', time: '23:00 - 23:30', status: 'Collected', amount: '100g' },
    { id: 6, item: 'Chicken', date: 'Tuesday, 24 May 2024', time: '23:00 - 23:30', status: 'Collected', amount: '100g' },
];

const ReservationCard = ({ reservation, isPast }) => (
    <div className="reservation-card">
        <div className="reservation-content">
            <div className="reservation-details">
                <img src="/api/placeholder/50/50" alt={reservation.item} className="reservation-image" />
                <div>
                    <h3>{reservation.item}</h3>
                    <p>{reservation.date}</p>
                    <p>{reservation.time}</p>
                    {/* <p>Status: {reservation.status}</p> */}
                    <p className={`reservation-status ${reservation.status === 'Uncollected' ? 'uncollected' : 'collected'}`}>{reservation.status}</p>
                </div>
            </div>
            <div className="reservation-actions">
                <p className="reservation-amount">{reservation.amount}</p>
                {isPast ? (
                    <button className="btn btn-review">Write a review</button>
                ) : (
                    <button className="btn btn-cancel">Cancel</button>
                )}
            </div>
        </div>
    </div>
);

const ReservationDisplay = () => {
    // TO-DO: Replace mock data w actual data 
    const currentReservations = mockCurrentReservations;
    const pastReservations = mockPastReservations;

    return (
        <div className="reservation-display">
            <div className="reservation-column current-reservations">
                <h2>Your Current Reservations:</h2>
                {currentReservations.map(reservation => (
                    <ReservationCard key={reservation.id} reservation={reservation} isPast={false} />
                ))}
            </div>
            <div className="reservation-column past-reservations">
                <h2>Your Past Reservations:</h2>
                {pastReservations.map(reservation => (
                    <ReservationCard key={reservation.id} reservation={reservation} isPast={true} />
                ))}
            </div>
        </div>
    );
};

export default function Reservation() {
    return (
        <>
            <Navbar />

            <div className="reservation_header">
                <h1>Reservations</h1> <br></br>
                <p>To ensure a smooth experience for everyone, please remember to collect your reservations on
                    time. Timely pickups help us serve you better and maintain availability for other customers.
                    Thank you for your cooperation!</p>
            </div>
            <ReservationDisplay />
        </>
    )
}
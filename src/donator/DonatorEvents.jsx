import React, { useState, useEffect } from 'react';
import '../index.css';
import './DonatorEvents.css';
import { DonatorNavbar } from '../components/Navbar';
import Button from '@mui/material/Button';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { NavLink } from 'react-router-dom';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';

const API_BASE_URL = 'http://localhost:3000';

export default function DonatorEvents() {
    const [events, setEvents] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Fetch events when the component mounts
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            console.log('Fetching events from:', `${API_BASE_URL}/events`);
            const response = await fetch(`${API_BASE_URL}/events`);
            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);

            if (!response.ok) {
                const text = await response.text();
                console.error('Error response body:', text);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                const text = await response.text();
                console.error('Response was not JSON:', text);
                throw new TypeError("Oops, we haven't got JSON!");
            }

            const data = await response.json();
            setEvents(data);
            setError(null); // Clear any previous errors
        } catch (error) {
            console.error('Error fetching events:', error);
            setError('Failed to fetch events: ' + error.message);
        }
    };
    return (
        <>
            <DonatorNavbar />
            <div className="image-container">
                <img className="full-width-image roundedimg" src="/Eventsphoto.png" alt="Events photos" />
                <div className="overlay">
                    <p className="overlay-text title">Events</p>
                    <p className="overlay-text description">Building a strong community, and teaching each other to help each other in need. Events help us become a tight-knit community, and a safe place to ask for help.</p>
                </div>
            </div>
            <div className="middle-container">
                <NavLink to={"/eventsadd"}>
                    <Button variant="contained" color="success">
                        <div className="buttonicon">
                            <AddCircleOutlineIcon />
                        </div>
                        Add Event
                    </Button>
                </NavLink>
            </div>
            <hr />
            <div className="events-container">
                {events.map((event) => (
                    <Card key={event.id} sx={{ minWidth: 275, margin: 2 }}>
                        <CardContent>
                            <Typography variant="h5" component="div">
                                {event.title}
                            </Typography>
                            <Typography sx={{ mb: 1.5 }} color="text.secondary">
                                {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
                            </Typography>
                            <Typography variant="body2">
                                {event.briefSummary}
                            </Typography>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div>
                {error && <p style={{ color: 'red' }}>{error}</p>}
            </div>
        </>
    );
}
import React from 'react';
import { DonatorNavbar } from '../components/Navbar';
import CheckIcon from '@mui/icons-material/Check';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import { useNavigate, useLocation } from 'react-router-dom';
import {UserFooter, DonatorFooter} from '../components/Footer';

import './DonatorEventsAdd.css';


const AddEventThanks = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const eventId = location.state?.eventId;

    const handleEdit = () => {
        if (eventId) {
            navigate(`/donator/updateEvent/${eventId}`);
        } else {
            console.error("No event ID available for editing");
        }
    };

    const handleBackToEvents = () => {
        navigate("/donator/events");
    };

    return (
        <div className="donator-events-add-page">
            <DonatorNavbar />
            <div className="form-container">
                <h2>Add New Event</h2>
                <div className="stepper-wrapper">
                    <div className="stepper-item completed">
                        <div className="step-counter"><CheckIcon /></div>
                    </div>
                    <div className="stepper-item completed">
                        <div className="step-counter"><CheckIcon /></div>
                    </div>
                </div>
                <div className="form-response">
                    <div className="thank-you-container">
                        <div className="icon-wrapper">
                            <CheckCircleOutlineIcon className="checkcircleicon" />
                        </div>
                        <p className="thank-you-text">Thank you</p>
                    </div>
                    <div className="form-response-additional-info">
                        <p>Your event has been added.</p>
                        <p>Thank you for your contribution</p>
                    </div>
                    <div className="form-response-email">
                        <p>We have sent an email to example123@gmail.com with all the details.</p>
                    </div>
                    <div className="form-response-buttons">
                        {eventId && (
                            <button onClick={handleEdit} className="edit-button">
                                <EditIcon /> Edit your response
                            </button>
                        )}
                        <button onClick={handleBackToEvents} className="back-button">
                            Back to Events Page
                        </button>
                    </div>
                </div>
            </div>
            <DonatorFooter/>
        </div>
    );
};

export default AddEventThanks;
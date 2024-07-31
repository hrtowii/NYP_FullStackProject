import React, { useState } from 'react';
import { DonatorNavbar } from '../components/Navbar';
import CheckIcon from '@mui/icons-material/Check';
import 'react-toastify/dist/ReactToastify.css';
import './DonatorEventsAdd.css'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';


import dayjs from 'dayjs';

const API_BASE_URL = 'http://localhost:3000';

const AddEventForm = () => {



    return (
        <>
            <DonatorNavbar />

            <div className="form-container">
                <h2>Add New Event</h2>

                <div class="stepper-wrapper">
                    <div class="stepper-item completed">
                        <div class="step-counter"><CheckIcon></CheckIcon></div>
                    </div>
                    <div class="stepper-item completed">
                        <div class="step-counter"><CheckIcon></CheckIcon></div>
                    </div>
                </div>
                <div className="form-response">
                    <CheckCircleOutlineIcon className="checkcircleicon"></CheckCircleOutlineIcon>
                </div>
                

            </div>
        </>
    );
};

export default AddEventForm;

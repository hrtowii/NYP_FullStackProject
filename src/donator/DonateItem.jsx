import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import '../index.css';
import './DonatorLanding.css';
import "./DonateItem.css";
import { DonatorNavbar } from '../components/Navbar';

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const steps = ['Donation Details', 'Confirmation', 'Thank You'];

export default function DonateItem() {
    const [activeStep, setActiveStep] = useState(0);
    const [formData, setFormData] = useState({
        foodName: '',
        quantity: '',
        expiryDate: '',
        deliveryDate: '',
        location: '',
        type: '',
        image: null,
    });
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [snackbar, setSnackbar] = useState({ show: false, message: '', type: 'success' });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        setFormData({ ...formData, image: file });
    };

    const handleNext = () => {
        if (activeStep === 0) {
            setShowConfirmDialog(true);
        } else {
            setActiveStep((prevActiveStep) => prevActiveStep + 1);
        }
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const handleConfirm = async () => {
        setShowConfirmDialog(false);
        try {
            const result = await prisma.donation.create({
                data: {
                    title: formData.foodName,
                    donator: {
                        connect: {
                            id: 1, // Replace with actual donator ID
                        },
                    },
                    foods: {
                        create: {
                            name: formData.foodName,
                            quantity: parseInt(formData.quantity, 10),
                            type: formData.type,
                            expiryDate: new Date(formData.expiryDate),
                        },
                    },
                },
                include: {
                    foods: true,
                },
            });

            console.log('Donation created:', result);
            setActiveStep((prevActiveStep) => prevActiveStep + 1);
            setSnackbar({ show: true, message: 'Donation submitted successfully!', type: 'success' });
        } catch (error) {
            console.error('Error submitting donation:', error);
            setSnackbar({ show: true, message: 'Error submitting donation. Please try again.', type: 'error' });
        }
    };

    const renderStepContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <form className="donation-form">
                        <input
                            type="text"
                            name="foodName"
                            placeholder="Food Name"
                            value={formData.foodName}
                            onChange={handleInputChange}
                            required
                        />
                        <input
                            type="text"
                            name="quantity"
                            placeholder="Quantity (e.g., 1kg, 500ml)"
                            value={formData.quantity}
                            onChange={handleInputChange}
                            required
                        />
                        <input
                            type="date"
                            name="expiryDate"
                            placeholder="Expiry Date"
                            value={formData.expiryDate}
                            onChange={handleInputChange}
                            required
                        />
                        <input
                            type="date"
                            name="deliveryDate"
                            placeholder="Delivery Date"
                            value={formData.deliveryDate}
                            onChange={handleInputChange}
                            required
                        />
                        <p className="form-note">Please make sure the food is delivered by the end of the day</p>
                        <input
                            type="text"
                            name="location"
                            placeholder="Location"
                            value={formData.location}
                            onChange={handleInputChange}
                            required
                        />
                        <select
                            name="type"
                            value={formData.type}
                            onChange={handleInputChange}
                            required
                        >
                            <option value="">Select Type</option>
                            <option value="meat">Meat</option>
                            <option value="vegetable">Vegetable</option>
                            <option value="dairy">Dairy</option>
                        </select>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                        />
                        {formData.image && <p>{formData.image.name}</p>}
                    </form>
                );
            case 1:
                return (
                    <div className="donation-summary">
                        <h2>Donation Summary</h2>
                        <p>Food Name: {formData.foodName}</p>
                        <p>Quantity: {formData.quantity}</p>
                        <p>Expiry Date: {formData.expiryDate}</p>
                        <p>Delivery Date: {formData.deliveryDate}</p>
                        <p>Location: {formData.location}</p>
                        <p>Type: {formData.type}</p>
                        {formData.image && <p>Image: {formData.image.name}</p>}
                    </div>
                );
            case 2:
                return (
                    <div className="thank-you">
                        <h2>Thank You for Your Donation!</h2>
                        <p>Your contribution will make a difference in someone's life.</p>
                    </div>
                );
            default:
                return <div>Unknown step</div>;
        }
    };

    return (
        <div className="container">
            <DonatorNavbar />
            <div className='contents'>
                <div className="action-buttons">
                    <button className="btn btn-secondary">
                        <NavLink to="/donator/ManageDonations">Manage Donations</NavLink>
                    </button>
                    <button className="btn btn-secondary">
                        <NavLink to="/donator/TrackDonations">Track Donation Progress</NavLink>
                    </button>
                    <button className="btn btn-primary">
                        <NavLink to="/donator/DonateItem">Donate Items</NavLink>
                    </button>
                </div>
                <div className="donation-container">
                    <h1>Food Donation</h1>
                    <div className="stepper">
                        {steps.map((label, index) => (
                            <div key={label} className={`step ${index === activeStep ? 'active' : ''}`}>
                                {label}
                            </div>
                        ))}
                    </div>
                    {renderStepContent(activeStep)}
                    <div className="form-buttons">
                        {activeStep !== 0 && (
                            <button onClick={handleBack} className="btn btn-secondary">
                                Back
                            </button>
                        )}
                        <button onClick={handleNext} className="btn btn-primary">
                            {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
                        </button>
                    </div>
                </div>

                {showConfirmDialog && (
                    <div className="confirm-dialog">
                        <h2>Confirm Donation</h2>
                        <p>Are you sure you want to submit this donation?</p>
                        <button onClick={() => setShowConfirmDialog(false)} className="btn btn-secondary">Cancel</button>
                        <button onClick={handleConfirm} className="btn btn-primary">Confirm</button>
                    </div>
                )}

                {snackbar.show && (
                    <div className={`snackbar ${snackbar.type}`}>
                        {snackbar.message}
                        <button onClick={() => setSnackbar({ ...snackbar, show: false })}>Close</button>
                    </div>
                )}
            </div>
        </div>
    );
}
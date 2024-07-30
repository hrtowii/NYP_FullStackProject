import React, { useContext, useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import '../index.css';
import './DonatorLanding.css';
import "./DonateItem.css";
import { DonatorNavbar } from '../components/Navbar';
import { backendRoute } from '../utils/BackendUrl';
import { TokenContext } from '../utils/TokenContext';
import {
    Button,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Typography,
    FormHelperText,
    Box,
} from '@mui/material';

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
        category: '',
        remarks: '',
        imageURL: '',
    });
    const [errors, setErrors] = useState({});
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [snackbar, setSnackbar] = useState({ show: false, message: '', type: 'success' });
    const [shouldNavigate, setShouldNavigate] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        let timer;
        if (activeStep === 3) {
            timer = setTimeout(() => setShouldNavigate(true), 0);
        }
        return () => clearTimeout(timer);
    }, [activeStep]);

    useEffect(() => {
        if (shouldNavigate) {
            navigate('/donator');
        }
    }, [shouldNavigate, navigate]);

    const validateForm = () => {
        let tempErrors = {};
        tempErrors.foodName = formData.foodName ? "" : "Food name is required";
        tempErrors.quantity = formData.quantity ? "" : "Quantity is required";
        if (formData.quantity && !Number.isInteger(Number(formData.quantity))) {
            tempErrors.quantity = "Quantity must be an integer";
        }
        tempErrors.type = formData.type ? "" : "Type is required";
        tempErrors.category = formData.category ? "" : "Category is required";
        tempErrors.expiryDate = formData.expiryDate ? "" : "Expiry date is required";
        tempErrors.deliveryDate = formData.deliveryDate ? "" : "Delivery date is required";
        tempErrors.location = formData.location ? "" : "Location is required";
        tempErrors.imageURL = formData.imageURL ? "" : "Image is required";

        if (formData.expiryDate && formData.deliveryDate) {
            if (new Date(formData.expiryDate) <= new Date(formData.deliveryDate)) {
                tempErrors.expiryDate = "Expiry date must be after delivery date";
            }
        }

        setErrors(tempErrors);
        return Object.values(tempErrors).every(x => x === "");
    };

    function parseJwt(token) {
        var base64Url = token.split('.')[1];
        var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    }
    const { token, updateToken } = useContext(TokenContext);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'quantity') {
            // Only allow integer values for quantity
            const intValue = parseInt(value);
            if (!isNaN(intValue) && intValue.toString() === value) {
                setFormData({ ...formData, [name]: intValue.toString() });
            } else if (value === '') {
                setFormData({ ...formData, [name]: '' });
            }
        } else {
            setFormData({ ...formData, [name]: value });
        }
        if (errors[name]) {
            setErrors({ ...errors, [name]: "" });
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        setFormData({ ...formData, image: file });
    };

    const handleNext = () => {
        if (activeStep === 0) {
            const isValid = validateForm();
            if (isValid) {
                setShowConfirmDialog(true);
            }
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
            const id = parseJwt(token).id
            const response = await fetch(`${backendRoute}/donation/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (response.ok) {
                console.log('Donation created:', response);
                setActiveStep((prevActiveStep) => prevActiveStep + 1);
                setSnackbar({ show: true, message: 'Donation submitted successfully!', type: 'success' });
            } else {
                setSnackbar({ show: true, message: 'Error submitting donation. Please try again.', type: 'error' });
            }
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
                        <Typography variant="h6" gutterBottom>Food Information</Typography>
                        <TextField
                            fullWidth
                            label="Food Name"
                            name="foodName"
                            value={formData.foodName}
                            onChange={handleInputChange}
                            margin="normal"
                            required
                            error={!!errors.foodName}
                            helperText={errors.foodName}
                        />
                        <TextField
                            fullWidth
                            label="Quantity (integer value)"
                            name="quantity"
                            value={formData.quantity}
                            onChange={handleInputChange}
                            margin="normal"
                            required
                            error={!!errors.quantity}
                            helperText={errors.quantity}
                            type="number"
                            inputProps={{ step: 1 }}
                        />
                        <TextField
                            fullWidth
                            label="Remarks"
                            name="remarks"
                            value={formData.remarks}
                            onChange={handleInputChange}
                            margin="normal"
                        />
                        <FormControl fullWidth margin="normal" required error={!!errors.type}>
                            <InputLabel>Type</InputLabel>
                            <Select
                                name="type"
                                value={formData.type}
                                onChange={handleInputChange}
                            >
                                <MenuItem value="">Select Type</MenuItem>
                                <MenuItem value="meat">Meat</MenuItem>
                                <MenuItem value="vegetable">Vegetable</MenuItem>
                                <MenuItem value="dairy">Dairy</MenuItem>
                            </Select>
                            <FormHelperText>{errors.type}</FormHelperText>
                        </FormControl>
                        <FormControl fullWidth margin="normal" required error={!!errors.category}>
                            <InputLabel>Category</InputLabel>
                            <Select
                                name="category"
                                value={formData.category}
                                onChange={handleInputChange}
                            >
                                <MenuItem value="">Select Category</MenuItem>
                                <MenuItem value="perishable">Perishable</MenuItem>
                                <MenuItem value="non-perishable">Non-Perishable</MenuItem>
                                <MenuItem value="canned">Canned</MenuItem>
                                <MenuItem value="frozen">Frozen</MenuItem>
                            </Select>
                            <FormHelperText>{errors.category}</FormHelperText>
                        </FormControl>

                        <Typography variant="h6" gutterBottom style={{ marginTop: '20px' }}>Dates</Typography>
                        <TextField
                            fullWidth
                            label="Expiry Date"
                            type="date"
                            name="expiryDate"
                            value={formData.expiryDate}
                            onChange={handleInputChange}
                            margin="normal"
                            required
                            InputLabelProps={{ shrink: true }}
                            error={!!errors.expiryDate}
                            helperText={errors.expiryDate}
                        />
                        <TextField
                            fullWidth
                            label="Delivery Date"
                            type="date"
                            name="deliveryDate"
                            value={formData.deliveryDate}
                            onChange={handleInputChange}
                            margin="normal"
                            required
                            InputLabelProps={{ shrink: true }}
                            error={!!errors.deliveryDate}
                            helperText={errors.deliveryDate}
                        />
                        <Typography variant="body2" color="textSecondary" style={{ marginTop: '5px' }}>
                            Please make sure the food is delivered by the end of the day
                        </Typography>

                        <Typography variant="h6" gutterBottom style={{ marginTop: '20px' }}>Location</Typography>
                        <FormControl fullWidth margin="normal" required error={!!errors.location}>
                            <InputLabel>Location</InputLabel>
                            <Select
                                name="location"
                                value={formData.location}
                                onChange={handleInputChange}
                            >
                                <MenuItem value="">Select Location</MenuItem>
                                <MenuItem value="Ang Mo Kio">Ang Mo Kio</MenuItem>
                                <MenuItem value="Sengkang">Sengkang</MenuItem>
                            </Select>
                            <FormHelperText>{errors.location}</FormHelperText>
                        </FormControl>
                        <Typography variant="h6" gutterBottom style={{ marginTop: '20px' }}>Image URL</Typography>
                        <TextField
                            fullWidth
                            label="ImageURL"
                            name="imageURL"
                            value={formData.imageURL}
                            onChange={handleInputChange}
                            margin="normal"
                        />
                    </form>
                );
            case 1:
                return (
                    <div className="donation-summary">
                        <Typography variant="h6" gutterBottom>Donation Summary</Typography>
                        <Box
                            component="img"
                            sx={{
                                height: 233,
                                width: 350,
                                maxHeight: { xs: 233, md: 167 },
                                maxWidth: { xs: 350, md: 250 },
                            }}
                            alt="image."
                            src={formData.imageURL}
                        />
                        <Typography>Food Name: {formData.foodName}</Typography>
                        <Typography>Quantity: {formData.quantity}</Typography>
                        <Typography>Type: {formData.type}</Typography>
                        <Typography>Category: {formData.category}</Typography>
                        <Typography>Expiry Date: {formData.expiryDate}</Typography>
                        <Typography>Delivery Date: {formData.deliveryDate}</Typography>
                        <Typography>Location: {formData.location}</Typography>
                        {formData.remarks && <Typography>Remarks: {formData.remarks}</Typography>}
                    </div>
                );
            case 2:
                return (
                    <div className="thank-you">
                        <Typography variant="h6" gutterBottom>Thank You for Your Donation!</Typography>
                        <Typography>Your contribution will make a difference in someone's life.</Typography>
                    </div>
                );
            default:
                return <div></div>;
        }
    };

    return (
        <div className="container">
            <DonatorNavbar />
            <div className='contents'>
                <div className="centered">
                    <div className="action-buttons">
                        <Button variant="contained" color="primary" component={NavLink} to="/donator/ManageDonations">
                            Manage Donations
                        </Button>
                        <Button variant="contained" color="secondary" component={NavLink} to="/donator/DonateProgress">
                            Track Donation Progress
                        </Button>
                        <Button variant="contained" color="secondary" component={NavLink} to="/donator/DonateItem">
                            Donate New Item
                        </Button>
                    </div>
                </div>
                <div className="donation-container">
                    <Typography variant="h4" className='Title'>Food Donation</Typography>
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
                            <Button onClick={handleBack} variant="outlined" style={{ marginRight: '10px' }}>
                                Back
                            </Button>
                        )}
                        <Button onClick={handleNext} variant="contained" color="primary">
                            {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
                        </Button>
                    </div>
                </div>

                {showConfirmDialog && (
                    <div className="confirm-dialog">
                        <Typography variant="h6" gutterBottom>Confirm Donation</Typography>
                        <Typography>Are you sure you want to submit this donation?</Typography>
                        <Button onClick={() => setShowConfirmDialog(false)} variant="outlined" style={{ marginRight: '10px' }}>Cancel</Button>
                        <Button onClick={handleConfirm} variant="contained" color="primary">Confirm</Button>
                    </div>
                )}

                {snackbar.show && (
                    <div className={`snackbar ${snackbar.type}`}>
                        {snackbar.message}
                        <Button onClick={() => setSnackbar({ ...snackbar, show: false })}>Close</Button>
                    </div>
                )}
            </div>
        </div>
    );
}
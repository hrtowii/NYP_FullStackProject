import React, { useState } from 'react';
import Navbar from "./components/Navbar";
import { TextField, Button, FormControlLabel, Switch, Rating } from '@mui/material';
import "./index.css";
import './About.css';
import './review.css';
import './assets/odometer.css';
import { useNavigate } from 'react-router-dom';

const backendRoute = 'http://localhost:3000';

export default function Review() {
    const [formData, setFormData] = useState({
        rating: 0,
        comment: '',
        showUsername: false
    });

    const handleChange = (event) => {
        const { name, value, checked } = event.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: name === 'showUsername' ? checked : value
        }));
    };

    const handleRatingChange = (event, newValue) => {
        setFormData(prevState => ({
            ...prevState,
            rating: newValue
        }));
    };

    const handleSubmit = async (event) => {
        // const navigate = useNavigate();

        event.preventDefault();
        try {
            const response = await fetch(`${backendRoute}/review_submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', "Access-Control-Allow-Origin": "*" },
                body: JSON.stringify(formData),      
            });
            if (response.ok) {
                // Handle successful submission
                console.log("Review submitted successfully");
                
            } else {
                // Handle errors
                console.error("Failed to submit review");
            }
        } catch (e) {
            console.error("Unexpected error submitting review:", e);
        }
        // navigate("/")
    };

    return (
        <>
            <Navbar />
            <div className="centered">
                <div className='Profile'>
                    {/* Profile content */}
                </div>
                
                <div className='form-container'>
                    <form onSubmit={handleSubmit}>
                        <h2>Review Form</h2>
                        <div>
                            <label>Product Quality</label>
                            <Rating
                                name="star"
                                value={formData.rating}
                                onChange={handleRatingChange}
                            />
                        </div>
                        <TextField
                            id="comment"
                            name="comment"
                            label="Share your review..."
                            multiline
                            rows={4}
                            value={formData.comment}
                            onChange={handleChange}
                            fullWidth
                            margin="normal"
                            required
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.showUsername}
                                    onChange={handleChange}
                                    name="showUsername"
                                    color="primary"
                                />
                            }
                            label="Show username on review"
                        />
                        <Button variant="contained" type="submit" fullWidth>
                            Submit Review
                        </Button>
                    </form>
                </div>
            </div>
        </>
    );
}
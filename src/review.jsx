// import React, {useState, useEffect} from 'react'
// import Navbar from "./components/Navbar";
// import "./index.css"
// import './About.css'
// import './review.css'
// import './assets/odometer.css'
// import ReactOdometer from 'react-odometerjs';

// // list out all users with reviews

// export default function Review() {
//     return(
//         <>
//         <Navbar/>
//         <div className="centered">
//         <div className='Profile'>
            
//         </div>
        
//         <div className='form-container'>
//             <form action="/review_submit" method="post">
//                 <div class="form-group">
//                     <label>Review Form</label>
//                     <input id="button" class="button" type="submit" value="Submit"></input>
//                 </div>
//                 <div class="form-group">
//                     <label for="star">Product Quality</label>
//                     <div class="rating">
//                         <input id="star5" name="star" type="radio" value="5" class="radio-btn hide" required/>
//                         <label for="star5">☆</label>
//                         <input id="star4" name="star" type="radio" value="4" class="radio-btn hide" required/>
//                         <label for="star4">☆</label>
//                         <input id="star3" name="star" type="radio" value="3" class="radio-btn hide" required/>
//                         <label for="star3">☆</label>
//                         <input id="star2" name="star" type="radio" value="2" class="radio-btn hide" required/>
//                         <label for="star2">☆</label>
//                         <input id="star1" name="star" type="radio" value="1" class="radio-btn hide" required/>
//                         <label for="star1">☆</label>
//                         <div class="clear"></div>
//                     </div>
//                 </div>
//                 <textarea id="comment" name="comment" class="big-input" placeholder="Share your review..." required></textarea>
//                 <div class="form-group">
//                     <label for="switch">Show username on review</label>
//                     <label class="switch">
//                         <input type="checkbox"></input>
//                         <span class="slider round"></span>
//                     </label>
//                 </div>
//             </form>
//         </div>
//         </div>
//     </>)
// }

import React, { useState } from 'react';
import Navbar from "./components/Navbar";
import { TextField, Button, FormControlLabel, Switch, Rating } from '@mui/material';
import "./index.css";
import './About.css';
import './review.css';
import './assets/odometer.css';

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
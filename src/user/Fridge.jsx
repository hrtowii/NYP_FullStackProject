import React, { useState, useEffect, useContext } from 'react';
import Navbar, { UserNavbar } from "../components/Navbar";
import { NavLink, useNavigate } from 'react-router-dom';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography,
    Paper, Box, Checkbox, Button, Alert, CircularProgress
} from '@mui/material';
import "./Fridge.css"
import ReactOdometer from 'react-odometerjs';
import { TokenContext } from '../utils/TokenContext';
import { backendRoute } from '../utils/BackendUrl';


const AnimatedCounter = ({ value }) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        let start = displayValue;
        const end = value;
        const duration = 3000;  // 3s duration for animation
        let timer;

        const step = () => {
            const time = Math.min(1, (Date.now() - startTime) / duration);
            const currentValue = Math.floor(start + time * (end - start));
            setDisplayValue(currentValue);

            if (time < 1) {
                requestAnimationFrame(step);
            } else {
                setDisplayValue(end);
            }
        };

        const startTime = Date.now();
        timer = requestAnimationFrame(step);

        return () => cancelAnimationFrame(timer);
    }, [value]);

    return (
        <span className="animated-counter">
            {displayValue.toLocaleString()}
        </span>
    );
};

export default function Fridge() {
    const { token } = useContext(TokenContext);
    const [donations, setDonations] = useState([]);
    // const [sortBy, setSortBy] = useState('expiryDate');
    const [selectedItems, setSelectedItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [fridgesCount, setFridgesCount] = useState(0);
    const [foodDonated, setFoodDonated] = useState(0);
    const [familiesSupported, setFamiliesSupported] = useState(0);
    const [cartItems, setCartItems] = useState([]);
    const navigate = useNavigate();


    useEffect(() => {  // Fetch donations from backend
        const fetchDonations = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`${backendRoute}/donations`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
                if (!response.ok) throw new Error('Failed to fetch donations');
                const data = await response.json();
                setDonations(data.donations);
            } catch (error) {
                console.error('Error fetching donations:', error);
                setError('Failed to load donations. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchDonations();
    }, [token]);


    useEffect(() => {  // Load selected items from localstorage (so selected items dont disappear)
        const storedCartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
        setCartItems(storedCartItems);
    }, []);

    useEffect(() => {
        // Set intitial value after short delay
        const timeoutId = setTimeout(() => {
            setFridgesCount(43);
            setFoodDonated(58978);
            setFamiliesSupported(15673);
        }, 100);

        return () => clearTimeout(timeoutId);
    }, []);

    useEffect(() => {
        const intervalId = setInterval(() => {
            const foodIncrement = Math.floor(Math.random() * 7) + 4;  // Random value (4-10)
            const familiesIncrement = Math.floor(Math.random() * 3) + 1;  // Random value (1-3)

            setFoodDonated(prevValue => prevValue + foodIncrement);
            setFamiliesSupported(prevValue => prevValue + familiesIncrement);
        }, 5000);  // 5000ms

        return () => clearInterval(intervalId);
    }, []);


    // const handleSortChange = (event) => {
    //     setSortBy(event.target.value);
    // }

    const handleItemSelect = (donation) => {
        setCartItems(prev => {
            let updatedCart;
            if (prev.some(item => item.id === donation.id)) {
                updatedCart = prev.filter(item => item.id !== donation.id);
            } else if (prev.length < 5) {
                updatedCart = [...prev, donation];
            } else {
                alert("You can only select up to 5 items.");
                return prev;
            }
            localStorage.setItem('cartItems', JSON.stringify(updatedCart));
            return updatedCart;
        });
    };

    const handleAddToCart = () => {
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
        alert("Items added to cart successfully!");
    };

    const handleViewCart = () => {
        navigate('/user/cart')
    }


    if (loading) return <Typography>Loading...</Typography>;
    if (error) return <Typography color="error">{error}</Typography>;


    return (
        <>
            <UserNavbar />
            <div className="fridge-container">
                <div className="fridge-header">
                    <h1>Reducing Waste and Fostering Community</h1>
                    <br />
                    <p>Welcome to the Community Fridge! Choose the food items you need and take them home!
                        Our fridge is stocked with fresh donations, ensuring that everyone has access to nutritious meals</p>
                </div>

                <div className="fridge-stats">
                    <div className="fridge-stat-item">
                        <ReactOdometer value={fridgesCount} />
                        <p>Self-Collect Fridges</p>
                    </div>
                    <div className="fridge-stat-item">
                        <ReactOdometer value={foodDonated} />
                        <p>Fresh Food Donated</p>
                    </div>
                    <div className="fridge-stat-item">
                        <ReactOdometer value={familiesSupported} />
                        <p>Families Supported</p>
                    </div>
                </div>

                <h2>Fridge</h2>
                {/* Display fridge table */}
                {donations.length === 0 ? (
                    <Typography>No donations available at the moment.</Typography>
                ) : (
                    <>
                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Select</TableCell>
                                        <TableCell>Food</TableCell>
                                        <TableCell>Type</TableCell>
                                        <TableCell>Quantity</TableCell>
                                        <TableCell>Category</TableCell>
                                        <TableCell>Expiry Date</TableCell>
                                        <TableCell>Remarks</TableCell>
                                        <TableCell>Location</TableCell>
                                        <TableCell>Donator</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {donations.map((donation) => (
                                        donation.foods.map((food) => (
                                            <TableRow key={`${donation.id}-${food.id}`}>
                                                <TableCell>
                                                    <Checkbox
                                                        checked={cartItems.some(item => item.id === donation.id)}
                                                        onChange={() => handleItemSelect(donation)}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    {food.name}
                                                    {donation.imageUrl && (
                                                        <img
                                                            src={donation.imageUrl}
                                                            alt={food.name}
                                                            style={{ width: 50, height: 50, marginLeft: 10, objectFit: 'cover' }}
                                                        />
                                                    )}
                                                </TableCell>
                                                <TableCell>{food.type}</TableCell>
                                                <TableCell>{food.quantity}</TableCell>
                                                <TableCell>{donation.category}</TableCell>
                                                <TableCell>{new Date(food.expiryDate).toLocaleDateString()}</TableCell>
                                                <TableCell>{donation.remarks}</TableCell>
                                                <TableCell>{donation.location}</TableCell>
                                                <TableCell>{donation.donator.name}</TableCell>
                                            </TableRow>
                                        ))
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                            <Button variant="contained" onClick={handleAddToCart} disabled={cartItems.length === 0}>
                                Add to Cart
                            </Button>
                            <Button variant="outlined" onClick={handleViewCart}>
                                View Cart
                            </Button>
                        </Box>
                    </>
                )}
            </div>
        </>
    )
}
import React, { useState, useEffect, useCallback, useContext } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import '../index.css';
import './DonatorLanding.css';
import "./DonateItem.css";
import { DonatorNavbar } from '../components/Navbar';
import { backendRoute } from '../utils/BackendUrl';
import { TokenContext } from '../utils/TokenContext';
import {
    Button,
    Box,
    Typography,
    Card,
    CardContent,
    LinearProgress,
    Avatar,
    Rating,
    CircularProgress,
    Alert,

} from '@mui/material';

export default function DonateItem() {
    const [donations, setDonations] = useState([]);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [donationToDelete, setDonationToDelete] = useState(null);
    const [editingDonation, setEditingDonation] = useState(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [errors, setErrors] = useState({});
    const [sortBy, setSortBy] = useState('expiryDate');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { token, updateToken } = useContext(TokenContext);
    const { donatorId } = useParams();
    const [profiles, setProfiles] = useState([]);


    const fetchDonations = useCallback(async () => {
        function parseJwt(token) {
            var base64Url = token.split('.')[1];
            var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        }
        const donatorId = parseJwt(token).id
        if (!donatorId) {
            setError('No donator ID provided');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`${backendRoute}/donations/${donatorId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setDonations(data.donations);
            setError(null);
        } catch (error) {
            console.error('Error fetching donations:', error);
            setError('Failed to fetch donations. Please try again later.');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchProfiles = useCallback(async () => {
        function parseJwt(token) {
            var base64Url = token.split('.')[1];
            var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        }
        const donatorId = parseJwt(token).id
        console.log('Fetching profiles...');
        try {
            const response = await fetch(`${backendRoute}/reviews/${donatorId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                throw new Error('Failed to fetch profiles');
            }
            const data = await response.json();
            console.log('Profiles fetched:', data);
            setProfiles(data);
        } catch (error) {
            console.error('Error fetching profiles:', error);
            setSnackbar({ open: true, message: 'Failed to fetch profiles', severity: 'error' });
        }
    }, [donatorId]);

    useEffect(() => {
        fetchDonations();
        fetchProfiles();
    }, [fetchDonations, fetchProfiles]);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    const uncollectedItems = [
        { name: 'Chicken', date: 'Tuesday, 24 May 2023', time: '23:00 - 23:30', quantity: '100g', status: 'Uncollected' },
        { name: 'Chicken', date: 'Unreserved', time: 'Unreserved', quantity: '100g', status: 'Unreserved' },
    ];

    const collectedItems = [
        { name: 'Chicken', date: 'Tuesday, 24 May 2023', time: '23:00 - 23:30', quantity: '100g', status: 'Collected' },
    ];

    const reviews = [
        { name: 'Johnavon', rating: 5, comment: 'great food!', avatar: 'J' },
        { name: 'Ron Joshua', rating: 4, comment: 'Thanks for the food! It really helped me make ends meet.', avatar: 'R' },
        { name: 'Truss Eng', rating: 3, comment: 'Im the winner winner Im the Easter bunny', avatar: 'T' },
        { name: 'Andric Lim', rating: 4, comment: 'This program has been a real lifesaver. Ive been having a hard time feeding my family as my parents are in critical condition running funds short. Real life saver', avatar: 'A' },
        { name: 'Andric Lim', rating: 5, comment: 'I love this website', avatar: 'A' },
    ];

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

                <Box display="flex" justifyContent="space-between" mt={4}>
                    <Box width="60%">
                        <Typography variant="h6" gutterBottom>Uncollected</Typography>
                        <Box bgcolor="error.main" p={2} borderRadius={2}>
                            {donations.flatMap((donation) =>
                                donation.foods.map((food) => (
                                    <Card key={`${donation.id}-${food.id}`} sx={{ mb: 2, bgcolor: 'error.light' }}>
                                        <CardContent>
                                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                                <Box>
                                                    <Typography variant="h6">{food.name}</Typography>
                                                    <Typography variant="body2">{'Unreserved'}</Typography>
                                                    <Typography variant="body2">{'Unreserved'}</Typography>
                                                    <Typography variant="body2">Status: {'Unreserved'}</Typography>
                                                </Box>
                                                <Typography variant="h6">{food.quantity}</Typography>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                )))}
                        </Box>

                        <Typography variant="h6" gutterBottom mt={4}>Progress</Typography>
                        <LinearProgress variant="determinate" value={50} sx={{ height: 10, borderRadius: 5 }} />

                        <Typography variant="h6" gutterBottom mt={4}>Collected</Typography>
                        <Box bgcolor="success.main" p={2} borderRadius={2}>
                            {collectedItems.map((item, index) => (
                                <Card key={index} sx={{ mb: 2, bgcolor: 'success.light' }}>
                                    <CardContent>
                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                            <Box>
                                                <Typography variant="h6">{item.name}</Typography>
                                                <Typography variant="body2">{item.date}</Typography>
                                                <Typography variant="body2">{item.time}</Typography>
                                                <Typography variant="body2">Status: {item.status}</Typography>
                                            </Box>
                                            <Typography variant="h6">{item.quantity}</Typography>
                                        </Box>
                                    </CardContent>
                                </Card>
                            ))}
                        </Box>
                    </Box>

                    <Box width="35%">
                        <Typography variant="h6" gutterBottom>Reviews</Typography>
                        <Box bgcolor="grey.200" p={2} borderRadius={2}>
                            {profiles.map((profile, index) => (
                                <Card key={index} sx={{ mb: 2 }}>
                                    <CardContent>
                                        <Box display="flex" alignItems="center">
                                            <Avatar sx={{ mr: 2 }}>{'J'}</Avatar>
                                            <Box>
                                                <Typography variant="subtitle1">{'gay'}</Typography>
                                                <Rating value={profile.rating} readOnly size="small" />
                                            </Box>
                                        </Box>
                                        <Typography variant="body2" mt={1}>{profile.comment}</Typography>
                                    </CardContent>
                                </Card>
                            ))}
                        </Box>
                    </Box>
                </Box>
            </div>
        </div>
    );
}
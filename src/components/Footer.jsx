import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Link, Grid, Snackbar, Container, ThemeProvider} from '@mui/material';
import {theme} from '../user/UserLanding.jsx'
export function UserFooter() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '' });

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Form submitted:', { email, message });
        setSnackbar({ open: true, message: 'Message sent successfully!' });
        setEmail('');
        setMessage('');
    };

    return (
        <ThemeProvider theme={theme}>
        <Box 
            component="footer" 
            sx={{ 
                bgcolor: '#4e7240', // Same as DonatorFooter
                color: '#fff',
                py: 6,
                mt: 'auto',
                boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
            }}
        >
            <Container maxWidth="lg">
                <Grid container spacing={4}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="h6" gutterBottom fontWeight="bold">
                            Contact Us
                        </Typography>
                        <form onSubmit={handleSubmit}>
                            <TextField
                                fullWidth
                                label="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                margin="normal"
                                required
                                size="small"
                                sx={{
                                    mb: 2,
                                    '& .MuiOutlinedInput-root': {
                                        '& fieldset': {
                                            borderColor: 'rgba(255, 255, 255, 0.7)',
                                        },
                                        '&:hover fieldset': {
                                            borderColor: '#fff',
                                        },
                                    },
                                    '& .MuiInputLabel-root': {
                                        color: 'rgba(255, 255, 255, 0.9)',
                                    },
                                    '& .MuiInputBase-input': {
                                        color: '#fff',
                                    },
                                }}
                            />
                            <TextField
                                fullWidth
                                label="Message"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                margin="normal"
                                required
                                size="small"
                                multiline
                                rows={3}
                                sx={{
                                    mb: 2,
                                    '& .MuiOutlinedInput-root': {
                                        '& fieldset': {
                                            borderColor: 'rgba(255, 255, 255, 0.7)',
                                        },
                                        '&:hover fieldset': {
                                            borderColor: '#fff',
                                        },
                                    },
                                    '& .MuiInputLabel-root': {
                                        color: 'rgba(255, 255, 255, 0.9)',
                                    },
                                    '& .MuiInputBase-input': {
                                        color: '#fff',
                                    },
                                }}
                            />
                            <Button 
                                type="submit" 
                                variant="contained" 
                                sx={{
                                    bgcolor: '#3498db', // Blue button
                                    color: '#fff',
                                    '&:hover': {
                                        bgcolor: '#2980b9',
                                    },
                                }}
                            >
                                Send
                            </Button>
                        </form>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="h6" gutterBottom fontWeight="bold">
                            Quick Links
                        </Typography>
                        <Link href="/user/reservation" color="#fff" display="block" sx={{ mb: 1, '&:hover': { color: '#fff' } }}>Reservations</Link>
                        <Link href="/user/fridge" color="#fff" display="block" sx={{ mb: 1, '&:hover': { color: '#fff' } }}>Fridge</Link>
                        <Link href="/listofdonators" color="#fff" display="block" sx={{ mb: 1, '&:hover': { color: '#fff' } }}>Donators</Link>
                        <Link href="/About" color="#fff" display="block" sx={{ mb: 1, '&:hover': { color: '#fff' } }}>About Us</Link>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="h6" gutterBottom fontWeight="bold">
                            FAQ
                        </Typography>
                        <Typography variant="subtitle2" sx={{ mb: 1, color: '#fff' }}>What is CommuniFridge?</Typography>
                        <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>
                            A platform connecting food donors with individuals in need.
                        </Typography>
                        <Typography variant="subtitle2" sx={{ mb: 1, color: '#fff' }}>How can I donate food?</Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            Create a donator account and list your food items.
                        </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="h6" gutterBottom fontWeight="bold">
                            Connect With Us
                        </Typography>
                        <Link href="https://www.facebook.com/" color="#f1f8e9" display="block" sx={{ mb: 1, '&:hover': { color: '#f1f8e9' } }}>Facebook</Link>
                        <Link href="https://twitter.com/" color="#f1f8e9" display="block" sx={{ mb: 1, '&:hover': { color: '#f1f8e9' } }}>Twitter</Link>
                        <Link href="https://www.instagram.com/" color="#f1f8e9" display="block" sx={{ mb: 1, '&:hover': { color: '#f1f8e9' } }}>Instagram</Link>
                    </Grid>
                </Grid>
                <Box mt={5} pt={3} borderTop={1} borderColor="rgba(255,255,255,0.2)">
                    <Typography variant="body2" align="center">
                        © {new Date().getFullYear()} CommuniFridge. All rights reserved.
                    </Typography>
                </Box>
            </Container>
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                message={snackbar.message}
            />
        </Box>
        </ThemeProvider>
    );
}

export function DonatorFooter() {
    const currentYear = new Date().getFullYear();

    return (
        <Box 
            component="footer" 
            sx={{ 
                bgcolor: '#4e7240',
                color: '#fff',
                py: 6,
                mt: 'auto',
                boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
            }}
        >
            <Container maxWidth="lg">
                <Grid container spacing={4}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="h6" gutterBottom fontWeight="bold">
                            About
                        </Typography>
                        <Typography variant="body2">
                            CommuniFridge is dedicated to reducing food waste and helping those in need through community refrigerators.
                        </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="h6" gutterBottom fontWeight="bold">
                            Quick Links
                        </Typography>
                        <Link href="/donator" color="#fff" display="block" sx={{ mb: 1, '&:hover': { color: '#1a8c4a' } }}>Donator Dashboard</Link>
                        <Link href="/donator/ManageDonations" color="#fff" display="block" sx={{ mb: 1, '&:hover': { color: '#1a8c4a' } }}>Manage Donations</Link>
                        <Link href="/donator/DonateItem" color="#fff" display="block" sx={{ mb: 1, '&:hover': { color: '#1a8c4a' } }}>Donate Item</Link>
                        <Link href="/donator/events" color="#fff" display="block" sx={{ mb: 1, '&:hover': { color: '#1a8c4a' } }}>Events</Link>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="h6" gutterBottom fontWeight="bold">
                            More Info
                        </Typography>
                        <Link href="/listofdonators" color="inherit" display="block" sx={{ mb: 1, '&:hover': { color: '#1a8c4a' } }}>Donators</Link>
                        <Link href="/About" color="inherit" display="block" sx={{ mb: 1, '&:hover': { color: '#1a8c4a' } }}>About Us</Link>
                        <Link href="/contactus" color="inherit" display="block" sx={{ mb: 1, '&:hover': { color: '#1a8c4a' } }}>Contact Us</Link>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="h6" gutterBottom fontWeight="bold">
                            Connect With Us
                        </Typography>
                        <Link href="https://www.facebook.com/" color="inherit" display="block" sx={{ mb: 1, '&:hover': { color: '#1a8c4a' } }}>Facebook</Link>
                        <Link href="https://twitter.com/" color="inherit" display="block" sx={{ mb: 1, '&:hover': { color: '#1a8c4a' } }}>Twitter</Link>
                        <Link href="https://www.instagram.com/" color="inherit" display="block" sx={{ mb: 1, '&:hover': { color: '#1a8c4a' } }}>Instagram</Link>
                    </Grid>
                </Grid>
                <Box mt={5} pt={3} borderTop={1} borderColor="rgba(255,255,255,0.2)">
                    <Typography variant="body2" align="center">
                        © {currentYear} CommuniFridge. All rights reserved.
                    </Typography>
                </Box>
            </Container>
        </Box>
    );
}
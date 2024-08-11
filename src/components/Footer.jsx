import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Link, Grid, Snackbar, Container } from '@mui/material';

export function UserFooter() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '' });

    const handleSubmit = (e) => {
        e.preventDefault();
        // Here you would typically send the form data to your backend
        console.log('Form submitted:', { email, message });
        setSnackbar({ open: true, message: 'Message sent successfully!' });
        setEmail('');
        setMessage('');
    };


    return (
        <Box component="footer" sx={{ bgcolor: 'background.paper', py: 2 }}>
            <Grid container spacing={2} justifyContent="space-around">
                <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="h6" color="text.primary" gutterBottom>
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
                            rows={2}
                        />
                        <Button type="submit" variant="contained" color="primary" size="small" sx={{ mt: 1 }}>
                            Send
                        </Button>
                    </form>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="h6" color="text.primary" gutterBottom>
                        Quick Links
                    </Typography>
                    <Link href="/user/reservation" color="inherit" display="block">Reservations</Link>
                    <Link href="/user/fridge" color="inherit" display="block">Fridge</Link>
                    <Link href="/listofdonators" color="inherit" display="block">Donators</Link>
                    <Link href="/About" color="inherit" display="block">About Us</Link>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="h6" color="text.primary" gutterBottom>
                        FAQ
                    </Typography>
                    <Typography variant="body2">What is CommuniFridge?</Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                        A platform connecting food donors with individuals in need.
                    </Typography>
                    <Typography variant="body2">How can I donate food?</Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                        Create a donator account and list your food items.
                    </Typography>
                </Grid>
            </Grid>
            <Box mt={5}>
                <Typography variant="body2" color="text.secondary" align="center">
                    © {new Date().getFullYear()} CommuniFridge. All rights reserved.
                </Typography>
            </Box>
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                message={snackbar.message}
            />
        </Box>
    );
};

export function DonatorFooter() {
    const currentYear = new Date().getFullYear();

    return (
        <Box component="footer" sx={{ bgcolor: '#2ecc71', color: 'primary.contrastText', py: 6 }}>
            <Container maxWidth="lg">
                <Grid container spacing={4}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="h6" gutterBottom>
                            About
                        </Typography>
                        <Typography variant="body2">
                            CommuniFridge is dedicated to reducing food waste and helping those in need through community refrigerators.
                        </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="h6" gutterBottom>
                            Quick Links
                        </Typography>
                        <Link href="/donator" color="inherit" display="block">Donator Dashboard</Link>
                        <Link href="/donator/ManageDonations" color="inherit" display="block">Manage Donations</Link>
                        <Link href="/donator/DonateItem" color="inherit" display="block">Donate Item</Link>
                        <Link href="/donator/events" color="inherit" display="block">Events</Link>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="h6" gutterBottom>
                            More Info
                        </Typography>
                        <Link href="/listofdonators" color="inherit" display="block">Donators</Link>
                        <Link href="/About" color="inherit" display="block">About Us</Link>
                        <Link href="/contactus" color="inherit" display="block">Contact Us</Link>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="h6" gutterBottom>
                            Connect With Us
                        </Typography>
                        <Link href="https://www.instagram.com/gocommiteatrock/" color="inherit" display="block">Facebook</Link>
                        <Link href="https://www.instagram.com/gocommiteatrock/" color="inherit" display="block">Twitter</Link>
                        <Link href="https://www.instagram.com/gocommiteatrock/" color="inherit" display="block">Instagram</Link>
                    </Grid>
                </Grid>
                <Box mt={5}>
                    <Typography variant="body2" align="center">
                        © {currentYear} CommuniFridge. All rights reserved.
                    </Typography>
                </Box>
            </Container>
        </Box>
    );
}


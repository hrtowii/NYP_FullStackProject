import React, { useState } from 'react';
import {
    Container,
    Typography,
    TextField,
    Button,
    Box,
    Snackbar,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Divider,
    Grid,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { UserNavbar, DonatorNavbar } from './components/Navbar';
import { TokenContext } from './utils/TokenContext';
import parseJwt from './utils/parseJwt.jsx';
import { UserFooter } from './components/Footer.jsx';
import { backendRoute } from './utils/BackendUrl.jsx';
import ChatBot from './components/ChatBot.jsx';

export default function ContactUs() {
    const { token } = React.useContext(TokenContext);
    const userRole = parseJwt(token).role;

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: '',
    });
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'info',
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            console.log('Form submitted:', formData);
            setSnackbar({
                open: true,
                message: 'Message sent successfully!',
                severity: 'success',
            });
            setFormData({ name: '', email: '', message: '' });
        } catch (error) {
            console.error('Error submitting form:', error);
            setSnackbar({
                open: true,
                message: 'Failed to send message. Please try again.',
                severity: 'error',
            });
        }
    };

    const faqData = [
        {
            question: "What is CommuniFridge?",
            answer: "CommuniFridge is a platform that connects food donors with individuals in need, reducing food waste and addressing food insecurity in our community."
        },
        {
            question: "How can I donate food?",
            answer: "To donate food, you need to create a donator account. Once logged in, you can list the food items you wish to donate, including details such as quantity, expiration date, and pickup location."
        },
        {
            question: "Is my personal information safe?",
            answer: "Yes, we take data privacy seriously. We use industry-standard encryption and security measures to protect your personal information. We never share your data with third parties without your explicit consent."
        },
        {
            question: "How can I request food?",
            answer: "To request food, create a user account and browse available donations in your area. You can then reserve the items you need and arrange for pickup with the donor."
        },
        {
            question: "What if I have dietary restrictions?",
            answer: "When browsing donations, you can filter items based on dietary restrictions. We encourage donors to provide accurate information about allergens and ingredients in their food donations."
        }
    ];

    return (
        <>
            {userRole === 'donator' ? <DonatorNavbar /> : <UserNavbar />}
            <Container maxWidth="lg">
                <Grid container spacing={4}>
                    <Grid item xs={12} md={6}>
                        <Box sx={{ mt: 4, mb: 4 }}>
                            <Typography variant="h4" gutterBottom>
                                Contact Us
                            </Typography>
                            <Typography variant="body1" paragraph>
                                Have a question or feedback? We'd love to hear from you. Fill out the form below and we'll get back to you as soon as possible.
                            </Typography>
                            <form onSubmit={handleSubmit}>
                                <TextField
                                    fullWidth
                                    label="Name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    margin="normal"
                                />
                                <TextField
                                    fullWidth
                                    label="Email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    margin="normal"
                                />
                                <TextField
                                    fullWidth
                                    label="Message"
                                    name="message"
                                    multiline
                                    rows={4}
                                    value={formData.message}
                                    onChange={handleChange}
                                    required
                                    margin="normal"
                                />
                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    sx={{ mt: 2 }}
                                >
                                    Send Message
                                </Button>
                            </form>
                        </Box>

                        <Divider sx={{ my: 4 }} />

                        {/* <Box sx={{ mb: 4 }}>
                            <Typography variant="h4" gutterBottom>
                                Frequently Asked Questions
                            </Typography>
                            {faqData.map((faq, index) => (
                                <Accordion key={index}>
                                    <AccordionSummary
                                        expandIcon={<ExpandMoreIcon />}
                                        aria-controls={`panel${index+1}-content`}
                                        id={`panel${index+1}-header`}
                                    >
                                        <Typography>{faq.question}</Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <Typography>
                                            {faq.answer}
                                        </Typography>
                                    </AccordionDetails>
                                </Accordion>
                            ))}
                        </Box> */}
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Box sx={{ mt: 8}}>
                            <ChatBot />
                        </Box>
                    </Grid>
                </Grid>

                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={6000}
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    message={snackbar.message}
                />
            </Container>
            <UserFooter/>
        </>
    );
}
import React, { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { UserNavbar } from "../components/Navbar";
import { UserFooter, DonatorFooter } from '../components/Footer';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Button,
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Box,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from '@mui/material';
import { Leaf, Recycle, Apple, ShoppingBag, User, UserPlus } from 'lucide-react';

const theme = createTheme({
  palette: {
    primary: {
      main: '#4caf50',
      light: '#81c784',
      dark: '#388e3c',
    },
    secondary: {
      main: '#c5e1a5',
      light: '#f1f8e9',
      dark: '#aed581',
    },
    background: {
      default: '#f1f8e9',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 20,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        },
      },
    },
  },
});


const Feature = ({ icon, title, description }) => (
  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'secondary.light' }}>
    <CardContent sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        {icon}
      </Box>
      <Typography gutterBottom variant="h5" component="h2" align="center" color="primary.dark">
        {title}
      </Typography>
      <Typography align="center" color="text.secondary">
        {description}
      </Typography>
    </CardContent>
  </Card>
);

const ProcessStepper = ({ steps }) => (
  <Stepper orientation="vertical">
    {steps.map((step, index) => (
      <Step key={index} active={true}>
        <StepLabel>
          <Typography variant="h6" color="primary.dark">{step.label}</Typography>
        </StepLabel>
        <StepContent>
          <Typography>{step.description}</Typography>
        </StepContent>
      </Step>
    ))}
  </Stepper>
);

const UserLandingPage = () => {
  const [processType, setProcessType] = useState('user');

  const userSteps = [
    { label: 'Open Fridge Page', description: 'Select available foods ready for collection.' },
    { label: 'Add to Cart', description: 'Make a reservation for when to collect the food.' },
    { label: 'Manage Reservation', description: 'Cancel reservation if needed or confirm collection.' },
    { label: 'Leave Review', description: 'Provide feedback for the donator.' },
  ];

  const donatorSteps = [
    {
      label: 'Fill Donation Form', description: "Enter details about the food you're donating."
    },
    { label: 'View Donation History', description: 'See your donated food items and total donations.' },
    { label: 'Track Community Rank', description: 'Gain ranks within our community based on your contributions.' },
    { label: 'Monitor Collections', description: 'Check if your donated food has been collected.' },
  ];

  const navigate = useNavigate();
  const navigatefridge = () => {
    navigate('/user/fridge')
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
        <UserNavbar />
        <main>
          <Paper
            sx={{
              position: 'relative',
              backgroundColor: 'grey.800',
              color: '#fff',
              mb: 4,
              backgroundSize: 'cover',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              backgroundImage: `url('/api/placeholder/1200/400')`,
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                right: 0,
                left: 0,
                backgroundColor: 'rgba(76, 175, 80, 0.3)',
              }}
            />
            <Grid container>
              <Grid item md={6}>
                <Box
                  sx={{
                    position: 'relative',
                    p: { xs: 3, md: 6 },
                    pr: { md: 0 },
                  }}
                >
                  <Typography component="h1" variant="h3" color="inherit" gutterBottom>
                    Sustain & Share
                  </Typography>
                  <Typography variant="h5" color="inherit" paragraph>
                    Join our eco-friendly community in reducing food waste and fostering sustainability. Share surplus food and help those in need.
                  </Typography>
                  <Button variant="contained" color="secondary" size="large" startIcon={<Leaf />} onClick={navigatefridge}>
                    Reserve your food now
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Features Section */}
          <Container sx={{ py: 8 }} maxWidth="md">
            <Grid container spacing={4}>
              <Grid item xs={12} sm={4}>
                <Feature
                  icon={<Apple size={48} color={theme.palette.primary.main} />}
                  title="Find Sustainable Food"
                  description="Discover nearby community fridges with fresh, locally-sourced food items."
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Feature
                  icon={<ShoppingBag size={48} color={theme.palette.primary.main} />}
                  title="Donate Surplus"
                  description="Contribute excess food to reduce waste and support your community."
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Feature
                  icon={<Recycle size={48} color={theme.palette.primary.main} />}
                  title="Reduce Food Waste"
                  description="Schedule pickups to ensure no food goes to waste in our community."
                />
              </Grid>
            </Grid>
          </Container>

          {/* Process Section */}
          <Container maxWidth="md" sx={{ mt: 8, mb: 8 }}>
            <Typography variant="h4" align="center" color="primary.dark" gutterBottom>
              Our Eco-Friendly Process
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
              <Button
                variant={processType === 'user' ? 'contained' : 'outlined'}
                color="primary"
                onClick={() => setProcessType('user')}
                startIcon={<User />}
                sx={{ mr: 2 }}
              >
                User Process
              </Button>
              <Button
                variant={processType === 'donator' ? 'contained' : 'outlined'}
                color="primary"
                onClick={() => setProcessType('donator')}
                startIcon={<UserPlus />}
              >
                Donator Process
              </Button>
            </Box>
            <Card>
              <CardContent>
                <ProcessStepper steps={processType === 'user' ? userSteps : donatorSteps} />
              </CardContent>
            </Card>
          </Container>
        </main>
        <UserFooter />
      </Box>
      
    </ThemeProvider>
  );
};

export default UserLandingPage;
import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { NavLink, useNavigate } from 'react-router-dom';
import Navbar from "./components/Navbar";
import {
  Typography,
  Button,
  Container,
  Grid,
  Card,
  CardContent,
  Box,
  Paper,
  Tabs,
  Tab,
} from '@mui/material';
import { Leaf, Recycle, Apple } from 'lucide-react';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2ecc71',
      light: '#4cd787',
      dark: '#27ae60',
    },
    secondary: {
      main: '#ecf0f1',
      light: '#f5f7f7',
      dark: '#bdc3c7',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: "'Roboto', Arial, sans-serif",
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 30,
          textTransform: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        },
      },
    },
  },
});




const SustainabilityMetrics = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [animatedStats, setAnimatedStats] = useState({ foodSaved: 0, co2Reduced: 0, mealsProvided: 0 });

  const navigate = useNavigate();
  const signupnavigate = () => {
    navigate('/signup')
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatedStats(prev => ({
        foodSaved: Math.min(prev.foodSaved + 50, 10000),
        co2Reduced: Math.min(prev.co2Reduced + 20, 5000),
        mealsProvided: Math.min(prev.mealsProvided + 30, 7500),
      }));
    }, 20);

    return () => clearInterval(interval);
  }, []);

  const monthlyData = [
    { name: 'Jan', foodSaved: 800, co2Reduced: 400 },
    { name: 'Feb', foodSaved: 1000, co2Reduced: 500 },
    { name: 'Mar', foodSaved: 1200, co2Reduced: 600 },
    { name: 'Apr', foodSaved: 1100, co2Reduced: 550 },
    { name: 'May', foodSaved: 1300, co2Reduced: 650 },
    { name: 'Jun', foodSaved: 1500, co2Reduced: 750 },
    { name: 'Jul', foodSaved: 1400, co2Reduced: 700 },
    { name: 'Aug', foodSaved: 1700, co2Reduced: 850 },
  ];

  const foodTypeData = [
    { name: 'Fruits & Vegetables', value: 40 },
    { name: 'Dairy', value: 20 },
    { name: 'Grains', value: 15 },
    { name: 'Meat & Poultry', value: 15 },
    { name: 'Other', value: 10 },
  ];

  const COLORS = ['#2ecc71', '#3498db', '#e67e22', '#e74c3c', '#9b59b6'];

  const StatCard = ({ title, value, icon }) => (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'secondary.light' }}>
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <Box sx={{ mb: 2, color: 'primary.main' }}>
          {icon}
        </Box>
        <Typography variant="h6" component="h2" color="primary.dark" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h4" color="primary.main">
          {value.toLocaleString()}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <Container maxWidth="lg" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <Paper
            sx={{
              mt: 4,
              mb: 4,
              p: 4,
              backgroundImage: 'linear-gradient(rgba(46, 204, 113, 0.8), rgba(46, 204, 113, 0.8)), url("/sustainabilitypagepic.png")',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              color: 'white',
              textAlign: 'center',
            }}
          >
            <Typography variant="h3" component="h1" gutterBottom>
              Sustainability Metrics
            </Typography>
            <Typography variant="h6">
              Track our progress in reducing waste and making a positive impact on the environment.
            </Typography>
          </Paper>

          <Grid container spacing={4} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={4}>
              <StatCard title="Food Saved" value={animatedStats.foodSaved} icon={<Apple size={48} />} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatCard title="CO2 Emissions Reduced" value={animatedStats.co2Reduced} icon={<Leaf size={48} />} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatCard title="Meals Provided" value={animatedStats.mealsProvided} icon={<Recycle size={48} />} />
            </Grid>
          </Grid>

          <Paper sx={{ mb: 4 }}>
            <Tabs
              value={activeTab}
              onChange={(event, newValue) => setActiveTab(newValue)}
              centered
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="Monthly Trends" />
              <Tab label="Food Distribution" />
            </Tabs>
            <Box sx={{ p: 3 }}>
              {activeTab === 0 && (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="foodSaved" stroke="#2ecc71" activeDot={{ r: 8 }} />
                    <Line yAxisId="right" type="monotone" dataKey="co2Reduced" stroke="#3498db" />
                  </LineChart>
                </ResponsiveContainer>
              )}
              {activeTab === 1 && (
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={foodTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {foodTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Box>
          </Paper>

          <Paper sx={{ p: 3, mb: 4, bgcolor: 'secondary.light' }}>
            <Typography variant="h5" gutterBottom color="primary.dark">
              Did You Know?
            </Typography>
            <Typography paragraph>
              By participating in CommuniFridge, you're not just reducing food waste – you're making a significant impact on the environment and your community!
            </Typography>
            <ul>
              <li>Every kilogram of food saved prevents about 2.5 kg of CO2 emissions.</li>
              <li>The food we've saved so far is equivalent to taking 1,000 cars off the road for a year!</li>
              <li>Our community has provided meals to over 5,000 families in need.</li>
            </ul>
          </Paper>

          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h5" gutterBottom color="primary.dark">
              Join the Sustainability Movement
            </Typography>
            <Typography paragraph>
              Every donation and collection makes a difference. Start your journey towards a more sustainable future today!
            </Typography>
            <Button variant="contained" color="primary" size="large" onClick={signupnavigate}>
              Get Started Now
            </Button>
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default SustainabilityMetrics;
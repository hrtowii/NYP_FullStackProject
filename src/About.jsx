import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Tabs,
  Tab,
  Container,
  Paper
} from '@mui/material';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import Navbar, { UserNavbar, DonatorNavbar } from './components/Navbar';
import { DonatorFooter, UserFooter } from './components/Footer.jsx';
import "./index.css";
import './About.css';
import './assets/odometer.css';
import parseJwt from './utils/parseJwt.jsx';
import { TokenContext } from './utils/TokenContext';
import ReactOdometer from 'react-odometerjs';
import { Leaf, Recycle, Apple } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';

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
          boxShadow: 'none',
          background: 'transparent',
        },
      },
    },
  },
});

function ourBox(props) {
  return (
    <div className="ourBox">
      <h4>{props.title}</h4>
      {props.text}
    </div>
  );
}

const teamMembers = [
  {
    name: 'Lucas Leong',
    role: 'Account Security Manager',
    image: 'public/lucasimagefsdp.jpg',
    bio: 'Contributions: \n- Sign up, Login, Reset Password, Authentication, Navbar, Admin Panel Dashboard, Claude Chatbot',
  },
  {
    name: 'Andric Lim',
    role: 'Donations Operations Manager',
    image: 'public/andricimagefsdp.jpg',
    bio: "Contributions: \n- Dashboard Page, Donate new item, Manage Donations, Manage Donations\n- Calculation for Donator's Rank and Personal Goal",
  },
  {
    name: 'Johnavon Tan',
    role: 'Leaderboard & Feedback Coordinator',
    image: 'public/parisimagefsdp.jpg',
    bio: 'Contributions: \n- Donators Page, Reviews, Donator Replies, Leaderboard Ranking\n- Contact Us Page, User Landing Page, Footer',
  },
  {
    name: 'Iruss Eng',
    role: 'Donation Logistics Coordinator',
    image: 'public/irussimagefsdp.jpg',
    bio: 'Contributions: \n- Reservations, Fridge page, Add to cart',
  },
  {
    name: 'Ron Joshua',
    role: 'Events Coordinator',
    image: 'public/ronimagefsdp.jpg',
    bio: 'Contributions: \n- Events Page, Sign up feature for Users/Donators',
  },

];

export default function About() {
  const { token } = useContext(TokenContext);
  const [value, setValue] = useState(0);
  const [currentSection, setCurrentSection] = useState('main');
  const [selectedMember, setSelectedMember] = useState(null);

  let currentUserRole = null;
  if (token) {
    try {
      currentUserRole = parseJwt(token).role;
    } catch (error) {
      console.error('Error parsing token:', error);
      // If there's an error parsing the token, we'll leave currentUserRole as null
    }
  }

  const renderNavbar = () => {
    switch(currentUserRole) {
      case 'donator':
        return <DonatorNavbar />;
      case 'user':
        return <UserNavbar />;
      default:
        return <Navbar />;
    }
  };
  const BioText = ({ text }) => {
    return (
      <Typography
        variant="body1"
        component="div"  // Changed to div to safely render line breaks
      >
        {text.split('\n').map((line, index) => (
          <React.Fragment key={index}>
            {line}
            {index < text.split('\n').length - 1 && <br />}
          </React.Fragment>
        ))}
      </Typography>
    );
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => setValue(31238), 100);
    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      const incrementValue = Math.floor(Math.random() * 7) + 4;
      setValue(prevValue => prevValue + incrementValue);
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  const handleSectionChange = (section) => {
    setCurrentSection(section);
  };

  const handleMemberClick = (member) => {
    setSelectedMember(member);
  };

  const handleCloseDialog = () => {
    setSelectedMember(null);
  };

  const renderMainSection = () => (
    <>
      <h2 className="heroGreen">Connecting Your Kindness, Empowering Communities</h2>
      <div style={{ display: 'flex', gap: '10%', alignItems: 'center' }}>
        <div style={{ width: '50%' }}>
          <p>We believe in a Singapore where everyone has access to the food they need to thrive. That's why we created <b>CommuniFridge</b>, a community-driven app connecting individuals with <b>excess food</b> to those facing <b>food insecurity</b>.</p>
        </div>
        <div style={{ width: '50%' }}>
          <img style={{ width: '100%' }} className="roundedimg" src="/vegetables.png" alt="Vegetables" />
        </div>
      </div>

      <h2 style={{ marginBlock: "0px" }}>Our Mission</h2>
      <ul>
        <li><b>Reduce food waste:</b> We aim to minimize the environmental impact of discarded food by providing a convenient way for individuals and businesses to donate unwanted, yet edible, items.</li>
        <li><b>Empower communities:</b> We promote self-sufficiency and dignity by creating a platform where anyone can easily access essential food items.</li>
        <li><b>Build connections:</b> We foster a spirit of collaboration and compassion by creating a network of community fridges and users who share and support each other.</li>
      </ul>

      <h2>How does it work?</h2>
      <div style={{ display: "flex" }}>
        <div id="gridleft" className="gridthings">
          <h3>Donors</h3>
          <ul>
            <li><b>List your unwanted food:</b> Simply upload photos and descriptions of items you wish to donate (within expiry dates and following safety guidelines).</li>
            <li><b>Choose a community fridge:</b> Select the fridge closest to you or most convenient for pick-up.</li>
            <li><b>Track your impact:</b> See how your contributions have helped reduce food waste and support your community.</li>
          </ul>
        </div>
        <div id="gridright" className="gridthings">
          <h3>Recipients</h3>
          <ul>
            <li><b>Browse available items:</b> Explore a variety of food options across multiple community fridges in Singapore.</li>
            <li><b>Reserve your needs:</b> Secure items before they're gone, ensuring you get the food you want.</li>
            <li><b>Pick up with ease:</b> Collect your reserved items at the chosen fridge location without any cost or obligation.</li>
          </ul>
        </div>
      </div>

      <h2>Why CommmuniFridge?</h2>
      <div style={{ display: "flex" }}>
        <ourBox title="Transparency and Trust" text="We ensure clear communication and food safety guidelines for all donations and reservations." />
        <ourBox title="Accessibility and Convenience" text="Our app is user-friendly and accessible for everyone, regardless of technical skills." />
        <ourBox title="Community-Driven Impact" text="Every donation and reservation makes a difference, directly impacting lives and the environment." />
      </div>

      <div className="cssanimation sequence fadeInBottom" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <h2 style={{ marginBlock: "10px" }}>There have been</h2>
        <h3 style={{ marginBlock: "10px" }}>
          <ReactOdometer value={value} format="(,ddd),dd" />
        </h3>
        <p>donations since 2000</p>
      </div>

      <Button variant="contained" color="primary" onClick={() => handleSectionChange('team')}>
        Meet Our Team
      </Button>

    </>
  );

  const renderTeamSection = () => (
    <div className="team-section">
      <Typography variant="h3" gutterBottom>
        Our Team & Contributions
      </Typography>
      <Grid container spacing={3} justifyContent="center">
        {teamMembers.map((member, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card className="team-member-card" onClick={() => handleMemberClick(member)}>
              <div className="team-member-image-container">
                <img src={member.image} className="team-member-image" alt={member.name} />
              </div>
              <CardContent>
                <Typography variant="h5">{member.name}</Typography>
                <Typography variant="subtitle1" color="textSecondary">
                  {member.role}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Button variant="contained" color="primary" onClick={() => handleSectionChange('main')} style={{ marginTop: '20px' }}>
        Back to Main
      </Button>
    </div>
  );

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
        <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
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
              {/* {currentUserRole != 'user' || currentUserRole != "donator" ? 
              <Button variant="contained" color="primary" size="large" onClick={signupnavigate}>
                Get Started Now
              </Button> : <div></div>} */}

            </Box>
          </Container>
        </Box>
    );
  };
  return (
    <ThemeProvider theme={theme}>
      {renderNavbar()}
      <div className="content">
        {currentSection === 'main' && renderMainSection()}
        {currentSection === 'team' && renderTeamSection()}
        {SustainabilityMetrics()}
      </div>

      <Dialog open={!!selectedMember} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        {selectedMember && (
          <>
            <DialogTitle>
              <IconButton
                aria-label="close"
                onClick={handleCloseDialog}
                sx={{
                  position: 'absolute',
                  right: 8,
                  top: 8,
                }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <div className="team-member-image-container dialog-image">
                    <img src={selectedMember.image} className="team-member-image" alt={selectedMember.name} />
                  </div>
                </Grid>
                <Grid item xs={12} md={8}>
                  <Typography variant="h4" gutterBottom>
                    {selectedMember.name}
                  </Typography>
                  <Typography variant="h6" color="primary" gutterBottom>
                    {selectedMember.role}
                  </Typography>
                  <Typography variant="body1">
                    <BioText text={selectedMember.bio} />
                  </Typography>
                </Grid>
              </Grid>
            </DialogContent>
          </>
        )}
      </Dialog>

      {currentUserRole === 'donator' ? <DonatorFooter /> : <UserFooter />}
    </ThemeProvider>
  );
}
import React, { useState } from 'react';
import { Typography, Button, Grid, Card, CardContent, Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import Navbar from "./components/Navbar";
import './Aboutus.css';

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

const teamMembers = [
  {
    name: 'Ronald Stride',
    role: 'Handsome #1',
    image: 'public/lucasimagefsdp.jpg',
    bio: 'Ronald Stride is the Chairman of the Board...',
  },
  {
    name: 'Mahesh Buxani',
    role: 'Handsome #2',
    image: 'public/andricimagefsdp.jpg',
    bio: 'Chairman of Indian Chamber of Commerce, Hong Kong and has been a board member there since 1991. He has been recently appointed on the School of Design and Environment Advancement Advisory Council (SAAC). Deeply compassionate and inspired by spiritual teachings throughout his life, Mahesh follows a disciplinary life of strict vegetarianism and daily meditation. Despite his vast accomplishments in the corporate world, Mahesh does not lose sight of the value that lies within happiness and peace, and supports efforts to help others achieve the best version of themselves.',
  },
  {
    name: 'Knut Unger',
    role: 'Handsome #3',
    image: 'public/parisimagefsdp.jpg',
    bio: 'Knut Unger serves as the Secretary...',
  },
  {
    name: 'Ronald Stride',
    role: 'Handsome #4',
    image: 'public/irussimagefsdp.jpg',
    bio: 'Ronald Stride is the Chairman of the Board...',
  },
  {
    name: 'Mahesh Buxani',
    role: 'Handsome #5',
    image: 'public/ronimagefsdp.jpg',
    bio: 'Chairman of Indian Chamber of Commerce, Hong Kong and has been a board member there since 1991. He has been recently appointed on the School of Design and Environment Advancement Advisory Council (SAAC). Deeply compassionate and inspired by spiritual teachings throughout his life, Mahesh follows a disciplinary life of strict vegetarianism and daily meditation. Despite his vast accomplishments in the corporate world, Mahesh does not lose sight of the value that lies within happiness and peace, and supports efforts to help others achieve the best version of themselves.',
  },

];

const AboutUs = () => {
  const [currentSection, setCurrentSection] = useState('main');
  const [selectedMember, setSelectedMember] = useState(null);

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
    <div className="about-us-main">
      <Typography variant="h2" gutterBottom>
        About Food from the Heart
      </Typography>
      <Typography variant="body1" paragraph>
        Food from the Heart is steered by its board members, each of whom are recognised individuals in their respective fields and professions. Their combined experience and network has led the sustainable growth of the charity since it was founded in 2003. Day-to-day operations, such as the managing of programmes, logistics and fundraising, are run by a committed team of passionate individuals.
      </Typography>
      <div className="section-buttons">
        <Button variant="contained" color="primary" onClick={() => handleSectionChange('team')}>
          Our Team
        </Button>
      </div>
    </div>
  );

  const renderTeamSection = () => (
    <div className="team-section">
      <Typography variant="h3" gutterBottom>
        Our Team
      </Typography>
      <Grid container spacing={3} justifyContent="center">
        {teamMembers.map((member, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card className="team-member-card" onClick={() => handleMemberClick(member)}>
              <div className="team-member-image-container">
                <img src={member.image} className="team-member-image" />
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
    </div>
  );

  return (
    <ThemeProvider theme={theme}>
        <Navbar />
      <div className="about-us-container">
        {currentSection === 'main' && renderMainSection()}
        {currentSection === 'team' && renderTeamSection()}
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
                    <img src={selectedMember.image} className="team-member-image" />
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
                    {selectedMember.bio}
                  </Typography>
                </Grid>
              </Grid>
            </DialogContent>
          </>
        )}
      </Dialog>
    </ThemeProvider>
  );
};

export default AboutUs;
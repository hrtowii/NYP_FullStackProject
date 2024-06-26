import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { 
  List, 
  ListItem, 
  ListItemText, 
  Typography, 
  Paper, 
  Container 
} from '@mui/material';
import { backendRoute } from './utils/BackendUrl';

export default function Profile() {
    const { donatorId } = useParams();
    const [profiles, setProfiles] = useState([]);

    useEffect(() => {
        console.log(donatorId)
        const fetchProfiles = async () => {
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
                setProfiles(data);
            } catch (error) {
                console.error('Error fetching profiles:', error);
            }
        };

        fetchProfiles();
    }, []);

    return (
        <Container maxWidth="md">
            <Paper elevation={3} style={{ padding: '20px', marginTop: '20px' }}>
                <Typography variant="h4" gutterBottom>
                    Reviews for {donatorId}
                </Typography>
                <List>
                    {profiles.map((profile, index) => (
                        <ListItem key={index} divider>
                            <ListItemText
                                primary={`Rating: ${profile.rating}`}
                                secondary={`Comment: ${profile.comment}`}
                            />
                        </ListItem>
                    ))}
                </List>
            </Paper>
        </Container>
    );
}
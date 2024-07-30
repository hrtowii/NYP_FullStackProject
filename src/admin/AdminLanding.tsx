import React, { useContext, useEffect, useState } from 'react';
import {
  Container,
  Modal,
  Typography,
  TextField,
  Button,
  Snackbar,
  Tab,
  Tabs,
} from '@mui/material';
import Box from '@mui/material/Box';
import { AdminNavbar } from '../components/Navbar';
import { TokenContext } from '../utils/TokenContext';
import { backendRoute } from '../utils/BackendUrl';
import DataTable from '../components/DataTable.tsx';

const getUserRole = (user) => {
  if (user.admin) return 'Admin';
  if (user.donator) return 'Donator';
  if (user.user) return 'User';
  return 'Unknown';
};

export default function AdminLanding() {
  const [openModal, setOpenModal] = useState(false);
  const [editData, setEditData] = useState({ id: '', name: '', email: '' });
  const { token } = useContext(TokenContext);
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const userColumns = [
    { id: 'id', label: 'ID', minWidth: 50 },
    { id: 'name', label: 'Name', minWidth: 100 },
    { id: 'email', label: 'Email', minWidth: 170 },
    { id: 'role', label: 'Role', minWidth: 100 },
    { id: 'actions', label: 'Actions', minWidth: 100 },
  ];

  const eventColumns = [
    { id: 'id', label: 'ID', minWidth: 50 },
    { id: 'name', label: 'Name', minWidth: 150 },
    { id: 'date', label: 'Date', minWidth: 100 },
    { id: 'location', label: 'Location', minWidth: 150 },
    { id: 'actions', label: 'Actions', minWidth: 100 },
  ];

  const reviewColumns = [
    { id: 'id', label: 'ID', minWidth: 50 },
    { id: 'rating', label: 'Rating', minWidth: 50 },
    { id: 'userId', label: 'User ID', minWidth: 100 },
    { id: 'comment', label: 'Comment', minWidth: 200 },
    { id: 'createdAt', label: 'Created At', minWidth: 150 },
    { id: 'updatedAt', label: 'Updated At', minWidth: 150 },
    { id: 'actions', label: 'Actions', minWidth: 100 },
  ];

  useEffect(() => {
    fetchUsers();
    fetchEvents();
    fetchReviews();
  }, [token]);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${backendRoute}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      const formattedUsers = data.map(user => ({
        ...user,
        role: getUserRole(user)
      }));
      setUsers(formattedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await fetch(`${backendRoute}/events`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      console.log(data)
      setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await fetch(`${backendRoute}/reviews`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      console.log(data)
      setReviews(data);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  }
  const handleOpenModal = (row) => {
    setEditData(row);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const handleInputChange = (event) => {
    setEditData({ ...editData, [event.target.name]: event.target.value });
  };

  const handleSave = async () => {
    try {
      const endpoint = activeTab === 0 ? `users/${editData.id}` : `events/${editData.id}`;
      const response = await fetch(`${backendRoute}/${endpoint}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(editData)
      });
      if (response.ok) {
        activeTab === 0 ? fetchUsers() : fetchEvents();
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error('Error updating item:', error);
    }
    handleCloseModal();
  };

  const handleDelete = async (id) => {
    try {
      const endpoint = activeTab === 0 ? `users/${id}` : `events/${id}`;
      const response = await fetch(`${backendRoute}/${endpoint}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        activeTab === 0 ? fetchUsers() : activeTab === 1 ? fetchEvents() : fetchReviews();
      } else {
        console.error('Failed to delete item');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <>
      <AdminNavbar />
      <Container maxWidth='md'>
      <Box sx={{ width: '100%', bgcolor: 'background.paper' }}>
        <Tabs value={activeTab} onChange={handleTabChange} centered>
          <Tab label="Users" />
          <Tab label="Events" />
          <Tab label="Reviews" />
        </Tabs>
      </Box>
      {activeTab === 0 ? (
        <DataTable
          columns={userColumns}
          rows={users}
          onEdit={handleOpenModal}
          onDelete={handleDelete}
        />
      ) : activeTab === 1 ? <DataTable
          columns={eventColumns}
          rows={events}
          onEdit={handleOpenModal}
          onDelete={handleDelete}
        />
      : (
        <DataTable
          columns={reviewColumns}
          rows={reviews}
          onEdit={handleOpenModal}
          onDelete={handleDelete}
        />
      )}
      <Modal
        open={openModal}
        onClose={handleCloseModal}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: 'background.paper',
          borderRadius: '8px',
          boxShadow: 16,
          p: 4,
        }}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Edit {activeTab === 0 ? 'User' : 'Event'}
          </Typography>
          {activeTab === 0 ? (
            <>
              <TextField
                margin="normal"
                fullWidth
                id="name"
                label="Name"
                name="name"
                value={editData.name}
                onChange={handleInputChange}
              />
              <TextField
                margin="normal"
                fullWidth
                id="email"
                label="Email"
                name="email"
                value={editData.email}
                onChange={handleInputChange}
              />
            </>
          ) : (
            <>
              <TextField
                margin="normal"
                fullWidth
                id="name"
                label="Name"
                name="name"
                value={editData.name}
                onChange={handleInputChange}
              />
              <TextField
                margin="normal"
                fullWidth
                id="date"
                label="Date"
                name="date"
                type="date"
                value={editData.date}
                onChange={handleInputChange}
                InputLabelProps={{
                  shrink: true,
                }}
              />
              <TextField
                margin="normal"
                fullWidth
                id="location"
                label="Location"
                name="location"
                value={editData.location}
                onChange={handleInputChange}
              />
            </>
          )}
          <Button onClick={handleSave} variant="contained" sx={{ mt: 2 }}>
            Save
          </Button>
        </Box>
      </Modal>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={() => setSnackbarOpen(false)}
        message="Saved changes!"
      />
      </Container>
    </>
  );
}
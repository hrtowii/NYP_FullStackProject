import React, { useState, useContext } from 'react';
import { DonatorNavbar } from '../components/Navbar';
import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { LocalizationProvider } from '@mui/x-date-pickers-pro/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers-pro/AdapterDayjs';
import { DateRangePicker } from '@mui/x-date-pickers-pro/DateRangePicker';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import CheckIcon from '@mui/icons-material/Check';
import 'react-toastify/dist/ReactToastify.css';
import './DonatorEventsAdd.css'
import dayjs from 'dayjs';
import { TokenContext } from '../utils/TokenContext';
import {
  Button,
  Box,
  Typography,
  IconButton,
} from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';


const API_BASE_URL = 'http://localhost:3000';
function parseJwt(token) {
  var base64Url = token.split('.')[1];
  var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
  return JSON.parse(jsonPayload);
}

const AddEventForm = () => {
  const [selectedImages, setSelectedImages] = useState([]);


  
    
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    briefSummary: '',
    fullSummary: '',
    phoneNumber: '',
    emailAddress: '',
    dateRange: [null, null],
    imageFile: '',
    maxSlots: 0,
    attire: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phoneNumber') {
      // Allow only integers and limit to 8 digits
      const numericValue = value.replace(/\D/g, '').slice(0, 8);
      setFormData((prevData) => ({
        ...prevData,
        [name]: numericValue,
      }));
    } else if (name === 'maxSlots') {
      // Ensure the value is not negative
      const numericValue = Math.max(0, parseInt(value));
      setFormData((prevData) => ({
        ...prevData,
        [name]: numericValue,
      }));
    } else if (name === 'attire') {
      // Limit to 40 characters
      setFormData((prevData) => ({
        ...prevData,
        [name]: value.slice(0, 40),
      }));
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
  };
  const handleDateRangeChange = (newValue) => {
    // Ensure the start date is not before today
    const today = dayjs().startOf('day');
    let [start, end] = newValue;

    if (start && start.isBefore(today)) {
      start = today;
    }

    setFormData((prevData) => ({
      ...prevData,
      dateRange: [start, end],
    }));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (!formData.dateRange[0] || !formData.dateRange[1]) {
        throw new Error('Please select both start and end dates');
      }

      if (formData.phoneNumber.length !== 8) {
        throw new Error('Phone number must be exactly 8 digits');
      }

      const eventData = {
        ...formData,
        maxSlots: formData.maxSlots, // Already an integer, no need to parse
        startDate: formData.dateRange[0].toISOString(),
        endDate: formData.dateRange[1].toISOString(),
        donatorId: userId,
      };

      console.log('Submitting form data:', eventData);
      const response = await fetch(`${API_BASE_URL}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      // Log response status and headers
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      // Check if the response is in JSON format
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const responseData = await response.json();
        console.log('Response body:', responseData);

        if (!response.ok) {
          throw new Error(responseData.error || `Server error: ${response.status}`);
        }

        alert('Event added successfully!');
        // Reset form
        setFormData({
          title: '',
          briefSummary: '',
          fullSummary: '',
          phoneNumber: '',
          emailAddress: '',
          dateRange: [null, null],
          imageFile: '',
          maxSlots: 0,
          attire: ''
        });
        navigate("/donator/eventAdded");
      } else {
        const responseText = await response.text();
        console.error('Unexpected response format:', responseText);
        throw new Error('Unexpected response format');
      }
    } catch (error) {
      console.error('Error adding event:', error);
      setError(`Failed to add event: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  //upload image
  const handleImageSelect = (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 2) {
      setSnackbar({ open: true, message: 'You can only upload up to 1 images', severity: 'error' });
      return;
    }
    setSelectedImages(files);
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };
  const handleRemoveImage = (index) => {
    setSelectedImages(prevImages => prevImages.filter((_, i) => i !== index));
  };

  const { token } = useContext(TokenContext);
  const userId = parseJwt(token).id;
  return (
    <>
      <div className="donator-events-add-page">

        <DonatorNavbar />

        <div className="form-container">
          <h2>Add New Event</h2>
          <div className="stepper-wrapper">
            <div className="stepper-item completed">
              <div className="step-counter"><CheckIcon></CheckIcon></div>
            </div>
            <div className="stepper-item active">
              <div className="step-counter"></div>
            </div>
          </div>
          {error && <div style={{ color: 'red' }}>{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-content">
              <div className="left-half">
                <div>
                  <label htmlFor="title">Title*<span className="titleInfo">(3-32 Characters)</span></label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    placeholder="Type Here"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="briefSummary">Brief Summary*<span className="titleInfo">(3-300 Characters)</span></label>
                  <textarea
                    id="briefSummary"
                    name="briefSummary"
                    placeholder="A short description"
                    value={formData.briefSummary}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="fullSummary">Full Summary*<span className="titleInfo">(300-600 Characters)</span></label>
                  <textarea
                    id="fullSummary"
                    name="fullSummary"
                    placeholder="Full Summary with relevant details."
                    value={formData.fullSummary}
                    onChange={handleInputChange}
                    required
                  />
                  <p className="detailsInfo">Provide details such as: Attire</p>
                </div>

                <div>
                  <label htmlFor="phoneNumber">Phone Number*<span className="titleInfo">(8 Digits)</span></label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    placeholder="e.g 1234 5678"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    required
                    pattern="\d{8}"
                    title="Phone number must be exactly 8 digits"
                  />
                  <p className="detailsInfo">Will be used to contact you.</p>

                </div>

                <div>
                  <label htmlFor="emailAddress">Email Address*</label>
                  <input
                    type="email"
                    id="emailAddress"
                    name="emailAddress"
                    placeholder="e.g example123@gmail.com"
                    value={formData.emailAddress}
                    onChange={handleInputChange}
                    required
                  />
                  <p className="detailsInfo">Will be used as an alternative to contact you.</p>

                </div>
              </div>
              <div className="right-half">
                <p id='datelabel'>Date/Period*</p>
                <div className="datepickercss">
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DemoContainer components={['DateRangePicker']}>
                      <DateRangePicker
                        name="datePicker"
                        id="datePicker"
                        value={formData.dateRange}
                        onChange={handleDateRangeChange}
                        minDate={dayjs()} // Set minimum date to today
                      />
                    </DemoContainer>
                  </LocalizationProvider>
                </div>

                <div className="maxSlots">
                  <label htmlFor="maxSlots">Maximum Slots*</label>
                  <input
                    type="number"
                    id="maxSlots"
                    name="maxSlots"
                    min="0"
                    value={formData.maxSlots}
                    onChange={handleInputChange}
                    required
                  />
                  <p className="detailsInfo">Enter the maximum number of slots available (minimum 0)</p>
                </div>

                <div className="attire">
                  <label htmlFor="attire">Attire<span className="titleInfo">(1-40 Characters)</span></label>
                  <input
                    type="text"
                    id="attire"
                    name="attire"
                    placeholder="Top, Bottom, Shoes"
                    value={formData.attire}
                    onChange={handleInputChange}
                    maxLength="40"
                    required
                  />
                  <p className="detailsInfo">Enter the clothing required </p>

                </div>


                <div className='flexybuttons'>
                  <Box sx={{ mt: 2 }}>
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="raised-button-file"
                      multiple
                      type="file"
                      onChange={handleImageSelect}
                    />
                    <label htmlFor="raised-button-file">
                      <Button variant="contained" component="span">
                        Upload Image (Max 1)
                      </Button>
                    </label>
                  </Box>
                  {selectedImages.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      {selectedImages.map((image, index) => (
                        <Box key={index} sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                          <Typography>{image.name}</Typography>
                          <IconButton onClick={() => handleRemoveImage(index)}>
                            <CancelIcon />
                          </IconButton>
                        </Box>
                      ))}
                    </Box>
                  )}

                  <div>
                    <Button variant="contained" type="submit" disabled={isLoading} className="add-event-button" color="success">
                      {isLoading ? 'Adding event...' : 'Add event'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default AddEventForm;

import React, { useState, useEffect } from 'react';
import { DonatorNavbar } from '../components/Navbar';
import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { LocalizationProvider } from '@mui/x-date-pickers-pro/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers-pro/AdapterDayjs';
import { DateRangePicker } from '@mui/x-date-pickers-pro/DateRangePicker';
import { useNavigate, useParams } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import CheckIcon from '@mui/icons-material/Check';
import 'react-toastify/dist/ReactToastify.css';
import './DonatorEventsAdd.css'
import dayjs from 'dayjs';
import {
  Button,
  Box,
  Typography,
  IconButton,
} from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';

const API_BASE_URL = 'http://localhost:3000';

const UpdateEventForm = () => {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageUpdated, setImageUpdated] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    briefSummary: '',
    fullSummary: '',
    phoneNumber: '',
    emailAddress: '',
    dateRange: [null, null],
    maxSlots: 0,
    takenSlots: '',
    attire: '',
    donatorId: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/events/${eventId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch event data');
        }
        const eventData = await response.json();
        setFormData({
          title: eventData.title,
          briefSummary: eventData.briefSummary,
          fullSummary: eventData.fullSummary,
          phoneNumber: eventData.phoneNumber,
          emailAddress: eventData.emailAddress,
          dateRange: [dayjs(eventData.startDate), dayjs(eventData.endDate)],
          maxSlots: eventData.maxSlots,
          takenSlots: eventData.takenSlots,
          attire: eventData.attire,
          donatorId: eventData.donatorId,
        });
      } catch (error) {
        console.error('Error fetching event data:', error);
        setError('Failed to load event data');
      }
    };

    fetchEventData();
  }, [eventId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phoneNumber') {
      const numericValue = value.replace(/\D/g, '').slice(0, 8);
      setFormData((prevData) => ({
        ...prevData,
        [name]: numericValue,
      }));
    } else if (name === 'maxSlots') {
      const numericValue = Math.max(0, parseInt(value));
      setFormData((prevData) => ({
        ...prevData,
        [name]: numericValue,
      }));
    } else if (name === 'attire') {
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

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      setImageUpdated(true);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
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

      const eventData = new FormData();
      eventData.append('title', formData.title);
      eventData.append('briefSummary', formData.briefSummary);
      eventData.append('fullSummary', formData.fullSummary);
      eventData.append('phoneNumber', formData.phoneNumber);
      eventData.append('emailAddress', formData.emailAddress);
      eventData.append('startDate', formData.dateRange[0].toISOString());
      eventData.append('endDate', formData.dateRange[1].toISOString());
      eventData.append('maxSlots', formData.maxSlots.toString());
      eventData.append('takenSlots', formData.takenSlots.toString());
      eventData.append('attire', formData.attire);
      eventData.append('donatorId', formData.donatorId.toString());

      if (imageUpdated) {
        eventData.append('images', selectedImage);
      }
      eventData.append('imageUpdated', imageUpdated.toString());

      console.log('Updating event data:', Object.fromEntries(eventData));
      const response = await fetch(`${API_BASE_URL}/events/update/${eventId}`, {
        method: 'PUT',
        body: eventData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const responseData = await response.json();
      console.log('Updated event:', responseData);

      toast.success('Event updated successfully!');
      navigate("/donator/eventAdded");
    } catch (error) {
      console.error('Error updating event:', error);
      setError(`Failed to update event: ${error.message}`);
      toast.error(`Failed to update event: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <>
      <div className="donator-events-add-page">
        <DonatorNavbar />
        <div className="form-container">
          <h2>Update Event</h2>
          <div className="stepper-wrapper">
            <div className="stepper-item completed">
              <div className="step-counter"><CheckIcon /></div>
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
                    value={formData.emailAddress}
                    onChange={handleInputChange}
                    required
                  />
                  <p className="detailsInfo">Will be used as an alternative  to contact you.</p>

                </div>
              </div>
              <div className="right-half">
                <div>
                  <p id='datelabel'>Date/Period*</p>
                  <div className="datepickercss">
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DemoContainer components={['DateRangePicker']}>
                        <DateRangePicker
                          value={formData.dateRange}
                          onChange={handleDateRangeChange}
                          minDate={dayjs()} // Set minimum date to today
                        />
                      </DemoContainer>
                    </LocalizationProvider>
                  </div>
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
                      type="file"
                      onChange={handleImageSelect}
                    />
                    <label htmlFor="raised-button-file">
                      <Button variant="contained" component="span">
                        Upload New Image
                      </Button>
                    </label>
                  </Box>
                  {selectedImage && (
                    <Box sx={{ mt: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <Typography>{selectedImage.name}</Typography>
                        <IconButton onClick={handleRemoveImage}>
                          <CancelIcon />
                        </IconButton>
                      </Box>
                    </Box>
                  )}

                  <div>
                    <Button variant="contained" type="submit" disabled={isLoading} className="update-event-button" color="primary">
                      {isLoading ? 'Updating event...' : 'Update event'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
        <ToastContainer />
      </div>
    </>
  );
};

export default UpdateEventForm;
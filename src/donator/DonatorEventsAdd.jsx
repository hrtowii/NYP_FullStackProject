import React, { useState } from 'react';
import { DonatorNavbar } from '../components/Navbar';
import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { LocalizationProvider } from '@mui/x-date-pickers-pro/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers-pro/AdapterDayjs';
import { DateRangePicker } from '@mui/x-date-pickers-pro/DateRangePicker';
import { useNavigate } from 'react-router-dom';

import dayjs from 'dayjs';

const API_BASE_URL = 'http://localhost:3000';

const AddEventForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    briefSummary: '',
    fullSummary: '',
    phoneNumber: '',
    emailAddress: '',
    dateRange: [null, null],
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleDateRangeChange = (newValue) => {
    setFormData((prevData) => ({
      ...prevData,
      dateRange: newValue,
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

      const eventData = {
        ...formData,
        startDate: formData.dateRange[0].format('YYYY-MM-DD'),
        endDate: formData.dateRange[1].format('YYYY-MM-DD'),
        donatorId: 1,
      };

      console.log('Submitting form data:', eventData);
      const response = await fetch(`${API_BASE_URL}/event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      const responseData = await response.text();
      console.log('Response body:', responseData);





      let jsonData;
      try {
        jsonData = JSON.parse(responseData);
      } catch (e) {
        console.error('Error parsing JSON:', e);
        throw new Error('Invalid response from server');
      }
      

      if (!response.ok) {
        throw new Error(jsonData.error || `Server error: ${response.status}`);
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
      });
      navigate("/events")
    } catch (error) {
      console.error('Error adding event:', error);
      setError(`Failed to add event: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <DonatorNavbar />
      <div>
        <h2>Add New Event</h2>
        {error && <div style={{ color: 'red' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="title">Title*</label>
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
            <label htmlFor="briefSummary">Brief Summary*</label>
            <textarea
              id="briefSummary"
              name="briefSummary"
              value={formData.briefSummary}
              onChange={handleInputChange}
              required
            />
          </div>

          <div>
            <label htmlFor="fullSummary">Full Summary*</label>
            <textarea
              id="fullSummary"
              name="fullSummary"
              value={formData.fullSummary}
              onChange={handleInputChange}
              required
            />
          </div>

          <div>
            <label htmlFor="phoneNumber">Phone Number*</label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              required
            />
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
          </div>

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DemoContainer components={['DateRangePicker']}>
              <DateRangePicker
                value={formData.dateRange}
                onChange={handleDateRangeChange}
              />
            </DemoContainer>
          </LocalizationProvider>

          <div>
            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Adding event...' : 'Add event'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default AddEventForm;
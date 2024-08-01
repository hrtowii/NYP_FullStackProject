import React, { useState, useEffect } from 'react';
import { DonatorNavbar } from '../components/Navbar';
import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { LocalizationProvider } from '@mui/x-date-pickers-pro/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers-pro/AdapterDayjs';
import { DateRangePicker } from '@mui/x-date-pickers-pro/DateRangePicker';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '@mui/material/Button';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CheckIcon from '@mui/icons-material/Check';
import './DonatorEventsAdd.css'

import dayjs from 'dayjs';

const API_BASE_URL = 'http://localhost:3000';

const UpdateEventForm = () => {
  const navigate = useNavigate();
  const { eventId } = useParams();

  const [formData, setFormData] = useState({
    title: '',
    briefSummary: '',
    fullSummary: '',
    phoneNumber: '',
    emailAddress: '',
    dateRange: [null, null],
    imageFile: '',
    donatorId: '',
    maxSlots: 0,
    attire: '',
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
          imageFile: eventData.imageFile,
          maxSlots: eventData.maxSlots,
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

  const onFileChange = (e) => {
    let file = e.target.files[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        toast.error('Maximum file size is 1MB');
        return;
      }
      let formData = new FormData();
      formData.append('file', file);

      fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error('Upload failed');
          }
          return res.json();
        })
        .then((data) => {
          console.log(data);
          toast.success('File uploaded successfully');
          setFormData(prevData => ({
            ...prevData,
            imageFile: data.filename
          }));
        })
        .catch((error) => {
          console.error('Error:', error);
          toast.error('Failed to upload file');
        });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phoneNumber') {
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
        title: formData.title,
        briefSummary: formData.briefSummary,
        fullSummary: formData.fullSummary,
        phoneNumber: formData.phoneNumber,
        emailAddress: formData.emailAddress,
        startDate: formData.dateRange[0].toISOString(),
        endDate: formData.dateRange[1].toISOString(),
        imageFile: formData.imageFile,
        maxSlots: formData.maxSlots,
        attire: formData.attire,
        donatorId: formData.donatorId,

      };

      console.log('Updating event data:', eventData);
      const response = await fetch(`${API_BASE_URL}/events/update/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      const responseText = await response.text();
      console.log('Full response:', responseText);

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}. Response: ${responseText}`);
      }

      const updatedEvent = JSON.parse(responseText);
      console.log('Updated event:', updatedEvent);

      toast.success('Event updated successfully!');
      navigate("/donator/events");
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
          <div class="stepper-wrapper">
            <div class="stepper-item completed">
              <div class="step-counter"><CheckIcon></CheckIcon></div>
            </div>
            <div class="stepper-item active">
              <div class="step-counter"></div>
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
                  <div>
                    <Button variant="contained" component="label" className="file-upload-button">
                      Upload New Image
                      <input hidden accept="image/*" multiple type="file" onChange={onFileChange} />
                    </Button>
                    {formData.imageFile && <span>Current image: {formData.imageFile}</span>}
                  </div>

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
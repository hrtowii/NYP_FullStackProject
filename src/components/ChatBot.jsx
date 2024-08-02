import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography, Paper, List, ListItem, ListItemText } from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import {backendRoute} from '../utils/BackendUrl'
const faqData = [
  {
    question: "What is CommuniFridge?",
    answer: "CommuniFridge is a platform that connects food donors with individuals in need, reducing food waste and addressing food insecurity in our community."
  },
  {
    question: "How can I donate food?",
    answer: "To donate food, you need to create a donator account. Once logged in, you can list the food items you wish to donate, including details such as quantity, expiration date, and pickup location."
  },
  {
    question: "Is my personal information safe?",
    answer: "Yes, we take data privacy seriously. We use industry-standard encryption and security measures to protect your personal information. We never share your data with third parties without your explicit consent."
  },
  {
    question: "How can I request food?",
    answer: "To request food, create a user account and browse available donations in your area. You can then reserve the items you need and arrange for pickup with the donor."
  },
  {
    question: "What if I have dietary restrictions?",
    answer: "When browsing donations, you can filter items based on dietary restrictions. We encourage donors to provide accurate information about allergens and ingredients in their food donations."
  }
];

const ChatBot = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { text: "Hello! How can I help you today? Here are some questions I can answer:", isBot: true },
    { text: "question-list", isBot: true }
  ]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleSend = async () => {
    if (input.trim() === '') return;

    const userMessage = { text: input, isBot: false };
    setMessages([...messages, userMessage]);

    try {
      const botResponse = await getBotResponse(input);
      setMessages(prevMessages => [...prevMessages, { text: botResponse, isBot: true }]);
    } catch (error) {
      console.error('Error getting bot response:', error);
      setMessages(prevMessages => [...prevMessages, { text: "I'm sorry, I encountered an error. Please try again later.", isBot: true }]);
    }

    setInput('');
  };

  const getBotResponse = async (userInput) => {
    const lowercaseInput = userInput.toLowerCase();
    for (const faq of faqData) {
      if (lowercaseInput.includes(faq.question.toLowerCase())) {
        return faq.answer;
      }
    }
    try {
      const response = await fetch(`${backendRoute}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userInput }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      console.log(data)
      return data.response;
    } catch (error) {
      console.error('Error calling backend API:', error);
      return "I'm sorry, I couldn't generate a response at the moment. Please try again later or ask another question from the list above.";
    }
  };

  const renderMessage = (message, index) => {
    if (message.text === "question-list") {
      return (
        <List key={index} dense>
          {faqData.map((faq, faqIndex) => (
            <ListItem key={faqIndex}>
              <ListItemText primary={`• ${faq.question}`} />
            </ListItem>
          ))}
        </List>
      );
    }
    return (
      <Box
        key={index}
        sx={{
          display: 'flex',
          justifyContent: message.isBot ? 'flex-start' : 'flex-end',
          mb: 1,
        }}
      >
        <Paper
          elevation={1}
          sx={{
            p: 1,
            backgroundColor: message.isBot ? 'primary.light' : 'secondary.light',
            maxWidth: '80%',
          }}
        >
          <Typography variant="body2">{message.text}</Typography>
        </Paper>
      </Box>
    );
  };

  return (
    <Paper elevation={3} sx={{ p: 2, maxWidth: 400, mx: 'auto', mt: 4 }}>
      <Typography variant="h6" gutterBottom>
        FAQ ChatBot
      </Typography>
      <Box sx={{ height: 340, overflowY: 'auto', mb: 2 }}>
        {messages.map((message, index) => renderMessage(message, index))}
      </Box>
      <Box sx={{ display: 'flex' }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Type your question..."
          value={input}
          onChange={handleInputChange}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
        />
        <Button
          variant="contained"
          color="primary"
          endIcon={<SendIcon />}
          onClick={handleSend}
          sx={{ ml: 1 }}
        >
          Send
        </Button>
      </Box>
    </Paper>
  );
};

export default ChatBot;
import React, { useState } from 'react';
import { Box, Container, Typography, TextField, Grid, Button, MenuItem } from '@mui/material';
import axios from 'axios';

const LoginScreen = ({ onLoginSuccess }) => {
  const [selectedProfile, setSelectedProfile] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleKeyPress = (digit) => {
    if (pin.length < 4) {
      setPin(pin + digit);
    }
  };

  const handleClear = () => {
    setPin('');
  };

  const handleLogin = async () => {
    if (!selectedProfile || !pin) {
      setError('Proszę wybrać profil i podać PIN.');
      return;
    }
    setError(''); // Clear previous errors
    try {
      const response = await axios.post('http://localhost:3001/api/login', {
        profile: selectedProfile,
        pin: pin,
      });
      if (response.data.success) {
        onLoginSuccess(response.data.user);
      } else {
        setError('Nieprawidłowy profil lub PIN.');
        setPin('');
      }
    } catch (err) {
      setError('Błąd logowania. Spróbuj ponownie.');
      setPin('');
    }
  };

  return (
    <Container maxWidth="sm" sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Box sx={{ bgcolor: 'grey.800', p: 4, borderRadius: 2, boxShadow: 24, width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="h4" component="h1" align="center" color="white" gutterBottom>
          Zaloguj się
        </Typography>

        <TextField select fullWidth label="Wybierz profil..." value={selectedProfile} onChange={(e) => setSelectedProfile(e.target.value)} sx={{ bgcolor: 'white', borderRadius: 1 }}>
          <MenuItem value="Manager">Manager</MenuItem>
        </TextField>

        <TextField readOnly fullWidth value={pin} placeholder="----" inputProps={{ style: { textAlign: 'center', fontSize: '2rem', letterSpacing: '0.5rem' } }} sx={{ bgcolor: 'white', borderRadius: 1 }} />

        {error && <Typography color="error" align="center">{error}</Typography>}

        <Grid container spacing={1}>
          {[...Array(9)].map((_, i) => (
            <Grid item xs={4} key={i + 1}>
              <Button variant="contained" size="large" fullWidth onClick={() => handleKeyPress(i + 1)}>
                {i + 1}
              </Button>
            </Grid>
          ))}
          <Grid item xs={4}>
            <Button variant="outlined" size="large" fullWidth onClick={handleClear}>C</Button>
          </Grid>
          <Grid item xs={4}>
            <Button variant="contained" size="large" fullWidth onClick={() => handleKeyPress(0)}>0</Button>
          </Grid>
          <Grid item xs={4}>
            <Button variant="contained" color="success" size="large" fullWidth onClick={handleLogin}>OK</Button>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default LoginScreen;
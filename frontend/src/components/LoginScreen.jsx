import React, { useState } from 'react';
import { Box, Container, Typography, TextField, MenuItem, Grid, Button } from '@mui/material';

const LoginScreen = () => {
  const [selectedProfile, setSelectedProfile] = useState('');
  const [pin, setPin] = useState('');
  
  return (
    <Container maxWidth="sm" sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Box sx={{ bgcolor: 'grey.800', p: 4, borderRadius: 2, boxShadow: 24, width: '100%' }}>
        <Typography variant="h4" component="h1" align="center" color="white">
          Zaloguj się
        </Typography>
        <TextField
          select
          fullWidth
          label="Wybierz profil..."
          value={selectedProfile}
          onChange={(e) => setSelectedProfile(e.target.value)}
          sx={{ mt: 4, bgcolor: 'white', borderRadius: 1 }}
        >
          <MenuItem value="Manager">Manager</MenuItem>
        </TextField>

        <TextField
          fullWidth
          value={pin}
          placeholder="----"
          inputProps={{ style: { textAlign: 'center', fontSize: '2rem', letterSpacing: '0.5rem' } }}
          sx={{ mt: 2, bgcolor: 'white', borderRadius: 1 }}
        />
        <Grid container spacing={2} sx={{ mt: 2 }}>
          {[...Array(9)].map((_, i) => (
            <Grid item xs={4} key={i + 1}>
              <Button variant="contained" size="large" fullWidth>
                {i + 1}
              </Button>
            </Grid>
          ))}
          <Grid item xs={4}>
            <Button variant="outlined" size="large" fullWidth>C</Button>
          </Grid>
          <Grid item xs={4}>
            <Button variant="contained" size="large" fullWidth>0</Button>
          </Grid>
          <Grid item xs={4}>
            <Button variant="contained" color="success" size="large" fullWidth>OK</Button>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default LoginScreen;
import React from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container
} from '@mui/material';

const MainPage = ({ user, onLogout }) => {
  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <Typography variant="h6">Madziarynka Cafe POS</Typography>
            <Box>
              <Typography sx={{ mr: 2 }}>Zalogowano jako: {user.name}</Typography>
              <Button color="inherit" onClick={onLogout}>Wyloguj</Button>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>
      <Container sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
          <Button variant="contained" size="large">Nowe Zamówienie</Button>
        </Box>
        <Box sx={{ mt: 4 }}></Box>
      </Container>
    </>
  );
};

export default MainPage;
const express = require('express');
const cors = require('cors');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Serwer Madziarynki wstał!');
});

// Mock users database
const MOCK_USERS = [
  { id: '1', name: 'Admin', role: 'admin' },
  { id: '2', name: 'Pracownik1', role: 'employee' },
  { id: '3', name: 'Pracownik2', role: 'employee' },
  { id: '4', name: 'Pracownik3', role: 'employee' },
];

// Mock PIN codes for demo
const USER_PINS = {
  '1': '1234',
  '2': '1234',
  '3': '1234',
  '4': '1234',
};

// Frontend-compatible login endpoint
app.post('/auth/login', async (req, res) => {
  try {
    console.log('Login attempt received. Request body:', req.body);
    const { userId, pin } = req.body;
    
    if (!userId || !pin) {
      return res.status(400).json({ message: 'userId and pin are required' });
    }
    
    const user = MOCK_USERS.find(u => u.id === userId);
    if (!user) {
      return res.status(401).json({ message: 'Nieprawidłowy użytkownik' });
    }
    
    if (USER_PINS[userId] !== pin) {
      return res.status(401).json({ message: 'Nieprawidłowy PIN' });
    }
    
    const token = `mock-jwt-token-${userId}-${Date.now()}`;
    
    res.status(200).json({
      user: user,
      token: token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

// Logout endpoint
app.post('/auth/logout', async (req, res) => {
  try {
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user endpoint
app.get('/auth/me', async (req, res) => {
  try {
    res.status(200).json({ id: '1', name: 'Admin', role: 'admin' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Also support the old API format for backward compatibility
app.post('/api/login', async (req, res) => {
  try {
    console.log('Legacy API login attempt. Request body:', req.body);
    const { profile, pin } = req.body;
    if (profile === "Manager" && pin) {
      res.status(200).json({ "success": true, "message": "Zalogowano pomyślnie", "user": { "name": "Manager", "role": "admin" } });
    } else {
      res.status(401).json({ "success": false, "message": "Nieprawidłowy profil lub PIN" });
    }
  } catch (error) {
    console.error('Legacy login error:', error);
    res.status(500).json({ "success": false, "message": "Wystąpił błąd serwera" });
  }
});

app.listen(port, () => {
  console.log(`Serwer nasłuchuje na porcie ${port}`);
});
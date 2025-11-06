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
  { id: '1', name: 'Anna Kowalska', role: 'admin' },
  { id: '2', name: 'Jan Nowak', role: 'employee' },
  { id: '3', name: 'Maria Wiśniewska', role: 'employee' },
  { id: '4', name: 'Piotr Zieliński', role: 'employee' },
];

// Mock PIN codes for demo
const USER_PINS = {
  '1': '1234',
  '2': '5678',
  '3': '9012',
  '4': '3456',
};

// Frontend-compatible login endpoint
app.post('/auth/login', async (req, res) => {
  try {
    console.log('Login attempt received. Request body:', req.body);
    const { userId, pin } = req.body;
    
    if (!userId || !pin) {
      return res.status(400).json({ message: 'userId and pin are required' });
    }
    
    // Find user by ID
    const user = MOCK_USERS.find(u => u.id === userId);
    if (!user) {
      return res.status(401).json({ message: 'Invalid user' });
    }
    
    // Check PIN
    if (USER_PINS[userId] !== pin) {
      return res.status(401).json({ message: 'Invalid PIN' });
    }
    
    // Mock JWT token
    const token = `mock-jwt-token-${userId}-${Date.now()}`;
    
    res.status(200).json({
      user: user,
      token: token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Logout endpoint
app.post('/auth/logout', async (req, res) => {
  try {
    console.log('Logout attempt');
    // In a real app, you would invalidate the token here
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user endpoint
app.get('/auth/me', async (req, res) => {
  try {
    console.log('Get current user attempt');
    // In a real app, you would verify the token and return user info
    // For now, return a mock response
    res.status(200).json({ id: '1', name: 'Anna Kowalska', role: 'admin' });
  } catch (error) {
    console.error('Get current user error:', error);
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
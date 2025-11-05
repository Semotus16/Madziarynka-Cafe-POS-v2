const express = require('express');
const cors = require('cors');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Serwer Madziarynki wstał!');
});

app.post('/api/login', async (req, res) => {
  try {
    console.log('Otrzymano próbę logowania. Ciało zapytania (req.body):', req.body);
    const { profile, pin } = req.body;
    if (profile === "Manager" && pin) { // Sprawdzamy tylko, czy pin istnieje (nie jest pusty)
      res.status(200).json({ "success": true, "message": "Zalogowano pomyślnie", "user": { "name": "Manager", "role": "admin" } });
    } else {
      res.status(401).json({ "success": false, "message": "Nieprawidłowy profil lub PIN" });
    }
  } catch (error) {
    console.error('Błąd podczas logowania:', error);
    res.status(500).json({ "success": false, "message": "Wystąpił błąd serwera" });
  }
});

app.listen(port, () => {
  console.log(`Serwer nasłuchuje na porcie ${port}`);
});
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

const USERS_FILE = path.join(__dirname, '../assets/user.json');

// Multer setup
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, 'user-' + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) cb(null, true);
    else cb('Only .jpeg, .jpg, .png files are allowed');
  }
});

// POST /users - Save user locally
router.post('/', upload.single('image'), (req, res) => {
    console.log(req.body);
    
  const { name, email } = req.body;
  const image = req.file ? req.file.filename : null;

  if (!name || !email || !image) {
    return res.status(400).json({ message: 'Name, email, and image are required' });
  }

  fs.readFile(USERS_FILE, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ message: 'Failed to read users file' });

    let users = JSON.parse(data);
    const existingUser = users.find(u => u.email === email);
    if (existingUser) return res.status(400).json({ message: 'Email already exists' });

    const newUser = {
      id: Date.now(),
      name,
      email,
      image
    };

    users.push(newUser);

    fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), err => {
      if (err) return res.status(500).json({ message: 'Failed to write user to file' });

      res.status(201).json(newUser);
    });
  });
});

// GET /users - Read all users
router.get('/', (req, res) => {
  fs.readFile(USERS_FILE, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ message: 'Failed to read users file' });

    const users = JSON.parse(data);
    res.json(users);
  });
});

module.exports = router;

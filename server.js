// server.js (Simplified Express Example)
const express = require('express');
const app = express();
app.use(express.json());

// Mock Database (Replace with MongoDB or PostgreSQL for the project)
let users = [];

app.post('/api/signup', (req, res) => {
    const { email, password, role } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Missing credentials" });
    }

    // Requirements specify at least Admin and User profiles [cite: 97, 185]
    const newUser = { 
        id: Date.now(), 
        email, 
        password, // In a real app, hash this!
        role: role || 'user', // Default to User
        savedDesigns: [] 
    };

    users.push(newUser);
    res.status(201).json({ message: "Account created successfully", user: newUser });
});

app.listen(5000, () => console.log("Opulentia Server running on port 5000"));
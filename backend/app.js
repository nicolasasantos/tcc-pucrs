require('dotenv').config();

const express = require('express');
const cors = require('cors');

const PORT = process.env.PORT || 8080;

const app = express();

app.get('/', (req, res) => {
    res.send('API is running...');
})

app.listen(PORT, (error) => {
    if (!error) {
        console.log(`Server is running on port ${PORT}`);
    } else {
        console.error('Error starting server:', error);
    }
})

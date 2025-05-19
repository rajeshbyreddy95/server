const express = require('express');
const dotenv = require('dotenv');
const movieRoutes = require('./routes/movies');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');

dotenv.config();
connectDB();

const app = express();

const allowedOrigin = 'https://client-rose-pi.vercel.app'; // ✅ Exact match
app.use(cors({
  origin: allowedOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());

app.use('/api', movieRoutes);
app.use('/api/auth', authRoutes)

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

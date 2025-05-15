const express = require('express');
const dotenv = require('dotenv');
const movieRoutes = require('./routes/movies'); // Adjust path as needed
const cors = require('cors');

dotenv.config();

const app = express();
app.use(cors({origin:'https://client-rose-pi.vercel.app/'}));
const PORT = process.env.PORT || 8000;

// Middleware (optional: bodyParser, cors, etc.)
app.use(express.json());

// Mount movie routes
app.use('/api', movieRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

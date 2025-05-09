const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
  res.send('Hello World from Node.js Server!');
});

// Add more routes here

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

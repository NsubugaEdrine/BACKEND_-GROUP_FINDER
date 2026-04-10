require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/groups', require('./routes/groups.routes'));

// We handle nested routes via parent router:
const groupsRouter = require('./routes/groups.routes');
// Mount sessions and posts recursively under group id by injecting it in groups.routes, 
// wait, a better way is to mount it directly in server.js! No, groups.routes is better. 
// Actually to avoid changing groups.routes again, I'll mount in server.js using params
app.use('/api/groups/:groupId/sessions', require('./routes/sessions.routes'));
app.use('/api/groups/:groupId/posts', require('./routes/posts.routes'));

app.use('/api/dashboard', require('./routes/dashboard.routes'));

// Basic route for dev or if not matching other routes
app.get('/api', (req, res) => {
  res.send('Student Study Group Finder API is running...');
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../FRONTEND/dist')));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../FRONTEND', 'dist', 'index.html'));
  });
} else {
  // If not prod, default catch-all for sanity
  app.get('/', (req, res) => {
    res.send('API is running. Please start the frontend separately.');
  });
}

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

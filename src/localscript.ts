const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://xixzeroxix:34nj6efH@cluster0.kjzuz.mongodb.net/MovNext', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('❌ MongoDB connection error:', err.message));
#!/usr/bin/env node

const { server } = require('./app');
const { sequelize } = require('./models');

// Set port
const PORT = process.env.PORT || 3000;

// Sync database and start server
const startServer = async () => {
  try {
    // Sync database (in production, use migrations instead)
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync();
      console.log('Database synced successfully');
    }

    // Start server
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
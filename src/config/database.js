const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

// Connection parameters
const DB_NAME = process.env.DB_NAME || 'dawidkocma_db';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 5432;
const DB_URL = process.env.DATABASE_URL;

// Create Sequelize instance
let sequelize;

if (process.env.NODE_ENV === 'production' && DB_URL) {
  // Use connection URL for Heroku
  sequelize = new Sequelize(DB_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false
  });
} else {
  // Use local connection parameters
  sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
    host: DB_HOST,
    port: DB_PORT,
    dialect: 'postgres',
    logging: process.env.NODE_ENV !== 'production' ? console.log : false
  });
}

// Test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

module.exports = {
  sequelize,
  testConnection
};
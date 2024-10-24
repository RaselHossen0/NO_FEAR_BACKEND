const { Sequelize } = require('sequelize');
require('dotenv').config();

// Create a connection to MySQL using Sequelize
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST,
  dialect: 'mysql',
  logging: false,  // Disable logging
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('MySQL Database connected...');
  } catch (error) {
    console.error('Error connecting to the database:', error);
  }
};

module.exports = { sequelize, connectDB };

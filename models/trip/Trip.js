const { DataTypes } = require('sequelize');
const {sequelize} = require('../../config/db');

// Trip Model Definition
const Trip = sequelize.define('Trip', {
  destination: {
    type: DataTypes.STRING,
    allowNull: false, // e.g., 'Saint Martin'
    validate: {
      notEmpty: true,
    },
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  estimatedCost: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  budgetPreference: {
    type: DataTypes.ENUM('Budget', 'Mid-range', 'Luxury'),
    allowNull: false,
  },
  tripDuration: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  weatherForecast: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  notableLocations: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
  },
  tripStatus: {
    type: DataTypes.ENUM('Planned', 'In Progress', 'Completed', 'Cancelled'),
    allowNull: false,
    defaultValue: 'Planned',
  },
  userId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Users', // Refers to the User model
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
}, {
  timestamps: true,
});



module.exports = Trip;

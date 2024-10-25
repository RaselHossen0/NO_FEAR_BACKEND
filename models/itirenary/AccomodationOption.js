const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');
const { i } = require('mathjs');

const AccommodationOption = sequelize.define('AccommodationOption', {
  type: {
    type: DataTypes.ENUM('Budget', 'Mid-range', 'Luxury'),
    allowNull: true, // User's preference category for accommodation
  },
  name: {
    type: DataTypes.STRING, // e.g., 'Hotel X'
    allowNull: true,
  },
  cost: {
    type: DataTypes.FLOAT, // e.g., 3000
    allowNull: true,
  },
  photos: {
    type: DataTypes.JSON,
    allowNull: true,
  },

}, {
  timestamps: true,
});

// Associations
AccommodationOption.belongsTo(require('./Iternery'), { foreignKey: 'itineraryId', as: 'itinerary' });

module.exports = AccommodationOption;
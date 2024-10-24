const { DataTypes } = require('sequelize');
const {sequelize }= require('../../config/db');

const AccommodationOption = sequelize.define('AccommodationOption', {
  type: {
    type: DataTypes.ENUM('Budget', 'Mid-range', 'Luxury'),
    allowNull: false, // User's preference category for accommodation
  },
  name: {
    type: DataTypes.STRING, // e.g., 'Hotel X'
    allowNull: false,
  },
  cost: {
    type: DataTypes.FLOAT, // e.g., 3000
    allowNull: true,
  },
  tripId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Trips', // Refers to the Trip model
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  photos : {
    type: DataTypes.JSON,
    allowNull: true,
  },
}, {
  timestamps: true,
});

module.exports = AccommodationOption;

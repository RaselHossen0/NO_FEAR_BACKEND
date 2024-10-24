const { DataTypes } = require('sequelize');
const {sequelize} = require('../../config/db');

const MealPlan = sequelize.define('MealPlan', {
  type: {
    type: DataTypes.STRING, // e.g., 'Breakfast', 'Lunch'
    allowNull: false,
  },
  cost: {
    type: DataTypes.FLOAT, // e.g., 200
    allowNull: true,
  },
  location: {
    type: DataTypes.STRING, // e.g., 'Cafe Y'
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
}, {
  timestamps: true,
});

module.exports = MealPlan;

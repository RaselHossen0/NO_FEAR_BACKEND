const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');

const MealPlan = sequelize.define('MealPlan', {
  type: {
    type: DataTypes.STRING, // e.g., 'Breakfast', 'Lunch'
    allowNull: false,
    defaultValue: 'Breakfast',
  },
  cost: {
    type: DataTypes.FLOAT, // e.g., 200
    allowNull: true,
  },
  location: {
    type: DataTypes.STRING, // e.g., 'Cafe Y'
    allowNull: true,
  },

}, {
  timestamps: true,
});

// Associations
MealPlan.belongsTo(require('./Iternery'), { foreignKey: 'itineraryId', as: 'itinerary' });

module.exports = MealPlan;
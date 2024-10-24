const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');

// Itinerary Model Definition
const Itinerary = sequelize.define('Itinerary', {
  dayNumber: {
    type: DataTypes.INTEGER,
    allowNull: false, // Represents the day of the trip (Day 1, Day 2, etc.)
  },
  activity: {
    type: DataTypes.JSON,
    allowNull: false, // E.g., 'Visit the beach', 'Snorkeling'
    validate: {
      notEmpty: true,
    },
  },
//   transportOptionId: {
//     type: DataTypes.INTEGER,
//     references: {
//       model: 'TransportOption',
//       key: 'id',
//     },
//     allowNull: true, // Transport for that day (optional)
//   },
//   accommodationOptionId: {
//     type: DataTypes.INTEGER,
//     references: {
//       model: 'AccommodationOptions',
//       key: 'id',
//     },
//     allowNull: true, // Accommodation for that day (optional)
//   },
//   mealPlanId: {
//     type: DataTypes.INTEGER,
//     references: {
//       model: 'MealPlans',
//       key: 'id',
//     },
//     allowNull: true, // Meal Plan for that day (optional)
//   },
  tripId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Trips',
      key: 'id',
    },
    onDelete: 'CASCADE',
    allowNull: false,
  },
}, {
  timestamps: true,
});

// Associations

Itinerary.belongsTo(require('../trip/Trip'), { foreignKey: 'tripId', as: 'Trips' });

module.exports = Itinerary;
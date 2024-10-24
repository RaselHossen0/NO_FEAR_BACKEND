const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');

const TransportOption = sequelize.define('TransportOption', {
  type: {
    type: DataTypes.STRING, // e.g., 'Bus', 'Flight'
    allowNull: false,
  },
  timeEstimate: {
    type: DataTypes.STRING, // e.g., '8 hours'
    allowNull: true,
  },
  cost: {
    type: DataTypes.FLOAT, // e.g., 1000
    allowNull: true,
  },

}, {
  timestamps: true,
});

// Associations
TransportOption.belongsTo(require('./Iternery'), { foreignKey: 'itineraryId', as: 'itinerary' });

module.exports = TransportOption;
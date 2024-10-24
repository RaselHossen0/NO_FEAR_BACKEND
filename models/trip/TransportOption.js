const { DataTypes } = require('sequelize');
const{ sequelize }= require('../../config/db');

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

module.exports = TransportOption;

const { DataTypes } = require('sequelize');
const {sequelize} = require('../config/db');
const Trip = require('./trip/Trip');

const Blog = sequelize.define('Blog', {
   title: {
      type: DataTypes.STRING,
      allowNull: false, // Blog title, e.g., "Our Amazing Trip to Saint Martin"
   },
   description: {
      type: DataTypes.TEXT, // Detailed description or recap of the trip
      allowNull: false,
   },
   notableEvents: {
      type: DataTypes.TEXT, // Highlights or notable events during the trip
      allowNull: true, // Optional but important for trip recap
   },
   createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW, // Automatically set on creation
   },
   updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW, // Automatically set on update
   }
});

// Associations: Blog linked to Trip
Trip.hasOne(Blog, { onDelete: 'CASCADE' });
Blog.belongsTo(Trip);

module.exports = Blog;

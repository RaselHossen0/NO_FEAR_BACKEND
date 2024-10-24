const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Trip = require('./Trip');

const Blog = sequelize.define('Blog', {
   title: {
      type: DataTypes.STRING,
      allowNull: false, // Blog title
   },
   description: {
      type: DataTypes.TEXT, // Description of the trip or notable events
      allowNull: false,
   },
   createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW, // Timestamp for when the blog is created
   },
   updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW, // Timestamp for updates
   }
});

Trip.hasOne(Blog, { onDelete: 'CASCADE' });
Blog.belongsTo(Trip);

module.exports = Blog;

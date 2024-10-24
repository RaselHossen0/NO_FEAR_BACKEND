const { DataTypes } = require('sequelize');
const {sequelize }= require('../config/db');
const Blog = require('./Blog');
const Image = require('./Image');

const Album = sequelize.define('Album', {
   title: {
      type: DataTypes.STRING,
      allowNull: false, // Album title, e.g., "Day 1: Arrival at Saint Martin"
   },
   description: {
      type: DataTypes.TEXT, // Brief description of the album (e.g., "Our first day at the island")
      allowNull: true,
   },
   createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW, // Automatically set on creation
   }
});

// Associations: An album belongs to a blog
Blog.hasMany(Album, { onDelete: 'CASCADE' });
Album.belongsTo(Blog);
Album.hasMany(Image, { onDelete: 'CASCADE' });

module.exports = Album;

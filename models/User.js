const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Blog = require('./Blog');

// Define the User model
const User = sequelize.define('User', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  image : {
    type: DataTypes.STRING,
    allowNull: true
  },
  otp: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Add new fields here
});
User.hasMany(Blog, { onDelete: 'CASCADE' });  // One user can have many blogs
Blog.belongsTo(User);  // Blog belongs to a single user
module.exports = User;

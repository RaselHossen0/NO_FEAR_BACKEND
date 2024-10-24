const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db"); // Adjust the path as per your config

const Image = sequelize.define("Image", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  tags: {
    type: DataTypes.JSON, // Storing tags and descriptions as JSON
    allowNull: false,
  },
});


module.exports = Image;

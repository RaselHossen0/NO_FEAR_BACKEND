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
  embedding: {
    type: DataTypes.JSON, // Storing embedding as JSON
    allowNull: false,
  },
});


module.exports = Image;

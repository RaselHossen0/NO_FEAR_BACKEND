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
<<<<<<< HEAD
  features: {
    type: DataTypes.JSON, // Storing embedding as JSON
=======
  tags: {
    type: DataTypes.JSON, // Storing tags and descriptions as JSON
>>>>>>> e9586f3f759e564e759fa52773b4e4a6099d308e
    allowNull: false,
  },
});


module.exports = Image;

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StudyGroup = sequelize.define('StudyGroup', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  course_name_code: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  location: {
    type: DataTypes.STRING, // Can be physical or link
    allowNull: true
  },
  maxCapacity: {
    type: DataTypes.INTEGER,
    defaultValue: 20
  },
  isVirtual: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  faculty: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true
});

module.exports = StudyGroup;

const { DataTypes, Op } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const StudyGroup = require('./StudyGroup');

const GroupMember = sequelize.define('GroupMember', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  role: {
    type: DataTypes.ENUM('MEMBER', 'LEADER'),
    defaultValue: 'MEMBER'
  }
}, {
  timestamps: true,
  hooks: {
    beforeCreate: async (membership, options) => {
      if (membership.role !== 'LEADER') return;
      const existingLeader = await GroupMember.findOne({
        where: { groupId: membership.groupId, role: 'LEADER' },
        transaction: options.transaction
      });
      if (existingLeader) {
        throw new Error('A group can only have one leader');
      }
    },
    beforeUpdate: async (membership, options) => {
      if (membership.role !== 'LEADER') return;
      const existingLeader = await GroupMember.findOne({
        where: {
          groupId: membership.groupId,
          role: 'LEADER',
          id: { [Op.ne]: membership.id }
        },
        transaction: options.transaction
      });
      if (existingLeader) {
        throw new Error('A group can only have one leader');
      }
    }
  }
});

module.exports = GroupMember;

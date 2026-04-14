const sequelize = require('../config/database');
const User = require('./User');
const StudyGroup = require('./StudyGroup');
const GroupMember = require('./GroupMember');
const StudySession = require('./StudySession');
const Post = require('./Post');
const ChatMessage = require('./ChatMessage');

// Setup Associations
User.belongsToMany(StudyGroup, { through: GroupMember, foreignKey: 'userId', as: 'groups' });
StudyGroup.belongsToMany(User, { through: GroupMember, foreignKey: 'groupId', as: 'members' });

// Add creator/leader association separately just in case easy access is needed, 
// but role LEADER is inside GroupMember too. For simplicity, we just use GroupMember roles.

// Study Sessions
StudyGroup.hasMany(StudySession, { foreignKey: 'groupId', as: 'sessions' });
StudySession.belongsTo(StudyGroup, { foreignKey: 'groupId', as: 'group' });

// Posts
StudyGroup.hasMany(Post, { foreignKey: 'groupId', as: 'posts' });
Post.belongsTo(StudyGroup, { foreignKey: 'groupId', as: 'group' });

User.hasMany(Post, { foreignKey: 'userId', as: 'posts' });
Post.belongsTo(User, { foreignKey: 'userId', as: 'author' });

// Chat messages
User.hasMany(ChatMessage, { foreignKey: 'userId', as: 'chatMessages' });
ChatMessage.belongsTo(User, { foreignKey: 'userId', as: 'sender' });

module.exports = {
  sequelize,
  User,
  StudyGroup,
  GroupMember,
  StudySession,
  Post,
  ChatMessage
};

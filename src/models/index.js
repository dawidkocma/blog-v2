const { sequelize } = require('../config/database');
const User = require('./user');
const Post = require('./post');
const Project = require('./project');
const Comment = require('./comment');
const Media = require('./media');

// Define associations
User.hasMany(Post, { foreignKey: 'authorId', as: 'posts' });
Post.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

User.hasMany(Project, { foreignKey: 'authorId', as: 'projects' });
Project.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

Post.hasMany(Comment, { foreignKey: 'postId', as: 'comments' });
Comment.belongsTo(Post, { foreignKey: 'postId', as: 'post' });

User.hasMany(Comment, { foreignKey: 'userId', as: 'comments' });
Comment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Post.hasMany(Media, { foreignKey: 'postId', as: 'media' });
Media.belongsTo(Post, { foreignKey: 'postId', as: 'post' });

Project.hasMany(Media, { foreignKey: 'projectId', as: 'media' });
Media.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

module.exports = {
  sequelize,
  User,
  Post,
  Project,
  Comment,
  Media
};
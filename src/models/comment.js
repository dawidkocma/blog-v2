const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Comment = sequelize.define('Comment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  postId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Posts',
      key: 'id'
    }
  },
  parentId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Comments',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending'
  },
  isEdited: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: true,
  hooks: {
    beforeCreate: async (comment) => {
      // Auto-approve comments for admin users
      if (comment.user && comment.user.role === 'admin') {
        comment.status = 'approved';
      }
    }
  }
});

// Class methods
Comment.findByPostId = async function(postId) {
  return this.findAll({ 
    where: { 
      postId,
      status: 'approved',
      parentId: null 
    },
    include: [
      'user',
      {
        model: Comment,
        as: 'replies',
        include: ['user']
      }
    ],
    order: [
      ['createdAt', 'DESC'],
      [{ model: Comment, as: 'replies' }, 'createdAt', 'ASC']
    ]
  });
};

Comment.findPendingModeration = async function() {
  return this.findAll({
    where: { status: 'pending' },
    include: ['user', 'post'],
    order: [['createdAt', 'ASC']]
  });
};

module.exports = Comment;
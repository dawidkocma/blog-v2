const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const slugify = require('../utils/slugify');

const Post = sequelize.define('Post', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  excerpt: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  authorId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  coverImage: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('draft', 'published', 'archived'),
    defaultValue: 'draft'
  },
  publishedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  metaTitle: {
    type: DataTypes.STRING,
    allowNull: true
  },
  metaDescription: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  viewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: true,
  hooks: {
    beforeValidate: (post) => {
      if (post.title && (!post.slug || post.changed('title'))) {
        post.slug = slugify(post.title);
      }
      
      // Set published date if status changed to published
      if (post.changed('status') && post.status === 'published' && !post.publishedAt) {
        post.publishedAt = new Date();
      }
      
      // Set excerpt if not provided
      if (post.content && !post.excerpt) {
        post.excerpt = post.content.substring(0, 160).replace(/\s+/g, ' ').trim() + '...';
      }
    }
  }
});

// Class methods
Post.findBySlug = async function(slug) {
  return this.findOne({ 
    where: { slug, status: 'published' },
    include: ['author', 'comments', 'media']
  });
};

Post.findAllPublished = async function(options = {}) {
  return this.findAll({ 
    where: { status: 'published' },
    order: [['publishedAt', 'DESC']],
    ...options
  });
};

Post.findFeatured = async function(limit = 3) {
  return this.findAll({
    where: { status: 'published', featured: true },
    order: [['publishedAt', 'DESC']],
    limit
  });
};

module.exports = Post;
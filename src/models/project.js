const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const slugify = require('../utils/slugify');

const Project = sequelize.define('Project', {
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
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  shortDescription: {
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
  projectUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  githubUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  technologies: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  status: {
    type: DataTypes.ENUM('draft', 'published', 'archived'),
    defaultValue: 'draft'
  },
  featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  timestamps: true,
  hooks: {
    beforeValidate: (project) => {
      if (project.title && (!project.slug || project.changed('title'))) {
        project.slug = slugify(project.title);
      }
      
      // Set short description if not provided
      if (project.description && !project.shortDescription) {
        project.shortDescription = project.description.substring(0, 120).replace(/\s+/g, ' ').trim() + '...';
      }
    }
  }
});

// Class methods
Project.findBySlug = async function(slug) {
  return this.findOne({ 
    where: { slug, status: 'published' },
    include: ['author', 'media']
  });
};

Project.findAllPublished = async function(options = {}) {
  return this.findAll({ 
    where: { status: 'published' },
    order: [
      ['featured', 'DESC'],
      ['sortOrder', 'ASC'],
      ['createdAt', 'DESC']
    ],
    ...options
  });
};

Project.findFeatured = async function(limit = 3) {
  return this.findAll({
    where: { status: 'published', featured: true },
    order: [['sortOrder', 'ASC']],
    limit
  });
};

module.exports = Project;
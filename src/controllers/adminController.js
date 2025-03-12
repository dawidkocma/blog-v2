const { User, Post, Project, Comment, Media } = require('../models');
const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');
const { promisify } = require('util');
const unlinkAsync = promisify(fs.unlink);

/**
 * Render admin dashboard with statistics
 */
exports.showDashboard = async (req, res) => {
  try {
    // Get counts for dashboard
    const [
      totalPosts, 
      totalProjects, 
      totalUsers, 
      totalComments,
      pendingComments,
      draftPosts
    ] = await Promise.all([
      Post.count(),
      Project.count(),
      User.count(),
      Comment.count(),
      Comment.count({ where: { status: 'pending' } }),
      Post.count({ where: { status: 'draft' } })
    ]);
    
    // Get recent posts
    const recentPosts = await Post.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'firstName', 'lastName']
        }
      ]
    });
    
    // Get recent comments
    const recentComments = await Comment.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'firstName', 'lastName', 'avatar']
        },
        {
          model: Post,
          as: 'post',
          attributes: ['id', 'title', 'slug']
        }
      ]
    });
    
    // Render dashboard
    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      stats: {
        totalPosts,
        totalProjects,
        totalUsers,
        totalComments,
        pendingComments,
        draftPosts
      },
      recentPosts,
      recentComments
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).render('errors/500', { error });
  }
};

// BLOG POSTS MANAGEMENT

/**
 * Render posts list page
 */
exports.showPosts = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    
    // Filter
    const status = req.query.status || 'all';
    const whereClause = status !== 'all' ? { status } : {};
    
    // Search
    if (req.query.search) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${req.query.search}%` } },
        { content: { [Op.iLike]: `%${req.query.search}%` } }
      ];
    }
    
    // Get posts with count
    const { count, rows: posts } = await Post.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'firstName', 'lastName']
        }
      ]
    });
    
    // Calculate pagination
    const totalPages = Math.ceil(count / limit);
    
    // Render posts list
    res.render('admin/posts/index', {
      title: 'Manage Posts',
      posts,
      pagination: {
        page,
        totalPages,
        prevPage: page > 1 ? page - 1 : null,
        nextPage: page < totalPages ? page + 1 : null
      },
      filters: {
        status,
        search: req.query.search || ''
      }
    });
  } catch (error) {
    console.error('Admin posts list error:', error);
    res.status(500).render('errors/500', { error });
  }
};

/**
 * Render create post page
 */
exports.showCreatePost = (req, res) => {
  res.render('admin/posts/create', {
    title: 'Create New Post'
  });
};

/**
 * Handle post creation
 */
exports.createPost = async (req, res) => {
  try {
    const { 
      title, content, excerpt, status, tags,
      metaTitle, metaDescription, featured 
    } = req.body;
    
    // Create new post
    const post = await Post.create({
      title,
      content,
      excerpt,
      status,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      metaTitle,
      metaDescription,
      featured: featured === 'on',
      authorId: req.user.id,
      publishedAt: status === 'published' ? new Date() : null
    });
    
    // Handle cover image if uploaded
    if (req.file) {
      // Save media
      await Media.create({
        filename: req.file.filename,
        originalFilename: req.file.originalname,
        path: `/uploads/${req.file.filename}`,
        mimeType: req.file.mimetype,
        size: req.file.size,
        width: req.file.width,
        height: req.file.height,
        postId: post.id,
        uploadedBy: req.user.id
      });
      
      // Update post cover image
      post.coverImage = `/uploads/${req.file.filename}`;
      await post.save();
    }
    
    req.flash('success', 'Post created successfully');
    res.redirect('/admin/posts');
  } catch (error) {
    console.error('Create post error:', error);
    req.flash('error', 'Failed to create post');
    res.redirect('/admin/posts/create');
  }
};

/**
 * Render edit post page
 */
exports.showEditPost = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find post by ID
    const post = await Post.findByPk(id, {
      include: [
        {
          model: Media,
          as: 'media'
        }
      ]
    });
    
    // If post not found
    if (!post) {
      req.flash('error', 'Post not found');
      return res.redirect('/admin/posts');
    }
    
    // Render edit post page
    res.render('admin/posts/edit', {
      title: `Edit Post: ${post.title}`,
      post
    });
  } catch (error) {
    console.error('Edit post page error:', error);
    req.flash('error', 'Failed to load post');
    res.redirect('/admin/posts');
  }
};

/**
 * Handle post update
 */
exports.updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, content, excerpt, status, tags,
      metaTitle, metaDescription, featured 
    } = req.body;
    
    // Find post
    const post = await Post.findByPk(id);
    
    // If post not found
    if (!post) {
      req.flash('error', 'Post not found');
      return res.redirect('/admin/posts');
    }
    
    // Check if status changed to published
    const isNewlyPublished = post.status !== 'published' && status === 'published';
    
    // Update post
    await post.update({
      title,
      content,
      excerpt,
      status,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      metaTitle,
      metaDescription,
      featured: featured === 'on',
      publishedAt: isNewlyPublished ? new Date() : post.publishedAt
    });
    
    // Handle cover image if uploaded
    if (req.file) {
      // Save media
      await Media.create({
        filename: req.file.filename,
        originalFilename: req.file.originalname,
        path: `/uploads/${req.file.filename}`,
        mimeType: req.file.mimetype,
        size: req.file.size,
        width: req.file.width,
        height: req.file.height,
        postId: post.id,
        uploadedBy: req.user.id
      });
      
      // Update post cover image
      post.coverImage = `/uploads/${req.file.filename}`;
      await post.save();
    }
    
    req.flash('success', 'Post updated successfully');
    res.redirect('/admin/posts');
  } catch (error) {
    console.error('Update post error:', error);
    req.flash('error', 'Failed to update post');
    res.redirect(`/admin/posts/edit/${req.params.id}`);
  }
};

/**
 * Handle post deletion
 */
exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find post
    const post = await Post.findByPk(id, {
      include: [
        {
          model: Media,
          as: 'media'
        },
        {
          model: Comment,
          as: 'comments'
        }
      ]
    });
    
    // If post not found
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    
    // Delete all associated media files
    for (const media of post.media) {
      // Delete file from filesystem
      const filePath = path.join(__dirname, '../../public', media.path);
      try {
        await unlinkAsync(filePath);
      } catch (err) {
        console.error(`Failed to delete file ${filePath}:`, err);
      }
      
      // Delete from database
      await media.destroy();
    }
    
    // Delete all associated comments
    await Comment.destroy({ where: { postId: id } });
    
    // Delete post
    await post.destroy();
    
    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete post'
    });
  }
};

// PROJECTS MANAGEMENT

/**
 * Render projects list page
 */
exports.showProjects = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    
    // Filter
    const status = req.query.status || 'all';
    const whereClause = status !== 'all' ? { status } : {};
    
    // Search
    if (req.query.search) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${req.query.search}%` } },
        { description: { [Op.iLike]: `%${req.query.search}%` } }
      ];
    }
    
    // Get projects with count
    const { count, rows: projects } = await Project.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'firstName', 'lastName']
        }
      ]
    });
    
    // Calculate pagination
    const totalPages = Math.ceil(count / limit);
    
    // Render projects list
    res.render('admin/projects/index', {
      title: 'Manage Projects',
      projects,
      pagination: {
        page,
        totalPages,
        prevPage: page > 1 ? page - 1 : null,
        nextPage: page < totalPages ? page + 1 : null
      },
      filters: {
        status,
        search: req.query.search || ''
      }
    });
  } catch (error) {
    console.error('Admin projects list error:', error);
    res.status(500).render('errors/500', { error });
  }
};

// Additional admin controller methods would be implemented similar to post management

// USER MANAGEMENT

/**
 * Render users list page
 */
exports.showUsers = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    
    // Filter
    const role = req.query.role || 'all';
    const whereClause = role !== 'all' ? { role } : {};
    
    // Search
    if (req.query.search) {
      whereClause[Op.or] = [
        { username: { [Op.iLike]: `%${req.query.search}%` } },
        { email: { [Op.iLike]: `%${req.query.search}%` } },
        { firstName: { [Op.iLike]: `%${req.query.search}%` } },
        { lastName: { [Op.iLike]: `%${req.query.search}%` } }
      ];
    }
    
    // Get users with count
    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      attributes: { exclude: ['password'] }
    });
    
    // Calculate pagination
    const totalPages = Math.ceil(count / limit);
    
    // Render users list
    res.render('admin/users/index', {
      title: 'Manage Users',
      users,
      pagination: {
        page,
        totalPages,
        prevPage: page > 1 ? page - 1 : null,
        nextPage: page < totalPages ? page + 1 : null
      },
      filters: {
        role,
        search: req.query.search || ''
      }
    });
  } catch (error) {
    console.error('Admin users list error:', error);
    res.status(500).render('errors/500', { error });
  }
};

// COMMENT MANAGEMENT

/**
 * Render comments list page
 */
exports.showComments = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;
    
    // Filter
    const status = req.query.status || 'all';
    const whereClause = status !== 'all' ? { status } : {};
    
    // Get comments with count
    const { count, rows: comments } = await Comment.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'firstName', 'lastName', 'avatar']
        },
        {
          model: Post,
          as: 'post',
          attributes: ['id', 'title', 'slug']
        }
      ]
    });
    
    // Calculate pagination
    const totalPages = Math.ceil(count / limit);
    
    // Render comments list
    res.render('admin/comments/index', {
      title: 'Manage Comments',
      comments,
      pagination: {
        page,
        totalPages,
        prevPage: page > 1 ? page - 1 : null,
        nextPage: page < totalPages ? page + 1 : null
      },
      filters: {
        status
      }
    });
  } catch (error) {
    console.error('Admin comments list error:', error);
    res.status(500).render('errors/500', { error });
  }
};

/**
 * Handle comment moderation (approve/reject)
 */
exports.moderateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;
    
    // Find comment
    const comment = await Comment.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'firstName', 'lastName', 'avatar']
        }
      ]
    });
    
    // If comment not found
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }
    
    // Update comment status
    if (action === 'approve') {
      comment.status = 'approved';
    } else if (action === 'reject') {
      comment.status = 'rejected';
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid action'
      });
    }
    
    await comment.save();
    
    res.json({
      success: true,
      comment,
      message: `Comment ${action}d successfully`
    });
  } catch (error) {
    console.error('Moderate comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to moderate comment'
    });
  }
};
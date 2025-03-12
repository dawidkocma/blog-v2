const { Post, Comment, User } = require('../models');

/**
 * Render blog index page with all published posts
 */
exports.showBlogIndex = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    
    // Get posts with count
    const { count, rows: posts } = await Post.findAndCountAll({
      where: { status: 'published' },
      order: [['publishedAt', 'DESC']],
      limit,
      offset,
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'firstName', 'lastName', 'avatar']
        }
      ]
    });
    
    // Calculate pagination
    const totalPages = Math.ceil(count / limit);
    
    // Render blog index
    res.render('blog/index', {
      title: 'Blog - Dawid Kocma',
      posts,
      pagination: {
        page,
        totalPages,
        prevPage: page > 1 ? page - 1 : null,
        nextPage: page < totalPages ? page + 1 : null
      }
    });
  } catch (error) {
    console.error('Blog index error:', error);
    res.status(500).render('errors/500', { error });
  }
};

/**
 * Render single blog post page
 */
exports.showPost = async (req, res) => {
  try {
    const { slug } = req.params;
    
    // Find post by slug
    const post = await Post.findBySlug(slug);
    
    // If post not found or not published
    if (!post || post.status !== 'published') {
      return res.status(404).render('errors/404');
    }
    
    // Increment view count
    post.viewCount += 1;
    await post.save();
    
    // Get comments
    const comments = await Comment.findAll({
      where: { 
        postId: post.id,
        status: 'approved',
        parentId: null
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'firstName', 'lastName', 'avatar']
        },
        {
          model: Comment,
          as: 'replies',
          where: { status: 'approved' },
          required: false,
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'username', 'firstName', 'lastName', 'avatar']
            }
          ]
        }
      ],
      order: [
        ['createdAt', 'DESC'],
        [{ model: Comment, as: 'replies' }, 'createdAt', 'ASC']
      ]
    });
    
    // Get related posts
    const relatedPosts = await Post.findAll({
      where: {
        id: { [Op.ne]: post.id },
        status: 'published',
        [Op.or]: [
          { 
            tags: { 
              [Op.overlap]: post.tags 
            } 
          }
        ]
      },
      limit: 3,
      order: [['publishedAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'firstName', 'lastName', 'avatar']
        }
      ]
    });
    
    // Render post page
    res.render('blog/post', {
      title: `${post.title} - Dawid Kocma Blog`,
      post,
      comments,
      relatedPosts
    });
  } catch (error) {
    console.error('Blog post error:', error);
    res.status(500).render('errors/500', { error });
  }
};

/**
 * Handle adding a new comment
 */
exports.addComment = async (req, res) => {
  try {
    const { postId, content, parentId } = req.body;
    const userId = req.user.id;
    
    // Validate post exists
    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    
    // Validate parent comment if provided
    if (parentId) {
      const parentComment = await Comment.findByPk(parentId);
      if (!parentComment || parentComment.postId !== postId) {
        return res.status(400).json({
          success: false,
          message: 'Invalid parent comment'
        });
      }
    }
    
    // Determine comment status (auto-approve for admins)
    const status = req.user.role === 'admin' ? 'approved' : 'pending';
    
    // Create comment
    const comment = await Comment.create({
      content,
      postId,
      userId,
      parentId: parentId || null,
      status
    });
    
    // Load user info for response
    await comment.reload({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'firstName', 'lastName', 'avatar']
        }
      ]
    });
    
    // Return response
    res.status(201).json({
      success: true,
      comment,
      message: status === 'approved' 
        ? 'Comment added successfully' 
        : 'Comment submitted for approval'
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment'
    });
  }
};
const { Project, User, Media } = require('../models');

/**
 * Render projects index page with all published projects
 */
exports.showProjectsIndex = async (req, res) => {
  try {
    // Get all published projects
    const projects = await Project.findAllPublished({
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'firstName', 'lastName']
        },
        {
          model: Media,
          as: 'media',
          limit: 1
        }
      ]
    });
    
    // Organize projects by technology for filtering
    const technologies = new Set();
    projects.forEach(project => {
      project.technologies.forEach(tech => technologies.add(tech));
    });
    
    // Render projects index
    res.render('projects/index', {
      title: 'Projects - Dawid Kocma',
      projects,
      technologies: Array.from(technologies).sort()
    });
  } catch (error) {
    console.error('Projects index error:', error);
    res.status(500).render('errors/500', { error });
  }
};

/**
 * Render single project page
 */
exports.showProject = async (req, res) => {
  try {
    const { slug } = req.params;
    
    // Find project by slug
    const project = await Project.findBySlug(slug);
    
    // If project not found or not published
    if (!project || project.status !== 'published') {
      return res.status(404).render('errors/404');
    }
    
    // Get project media
    const media = await Media.findAll({
      where: { projectId: project.id },
      order: [['createdAt', 'ASC']]
    });
    
    // Get related projects (with similar technologies)
    const relatedProjects = await Project.findAll({
      where: {
        id: { [Op.ne]: project.id },
        status: 'published',
        [Op.or]: [
          { 
            technologies: { 
              [Op.overlap]: project.technologies 
            } 
          }
        ]
      },
      limit: 3,
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'firstName', 'lastName']
        }
      ]
    });
    
    // Render project page
    res.render('projects/project', {
      title: `${project.title} - Dawid Kocma Projects`,
      project,
      media,
      relatedProjects
    });
  } catch (error) {
    console.error('Project page error:', error);
    res.status(500).render('errors/500', { error });
  }
};
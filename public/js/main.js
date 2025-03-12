// Main JavaScript file for the website
document.addEventListener('DOMContentLoaded', () => {
  // Initialize dark mode
  initDarkMode();
  
  // Initialize scroll animations
  initScrollAnimations();
  
  // Initialize mobile menu
  initMobileMenu();
  
  // Initialize comment system if on blog post page
  if (document.querySelector('#comment-form')) {
    initCommentSystem();
  }
  
  // Initialize admin features if in admin section
  if (document.querySelector('.admin-panel')) {
    initAdminFeatures();
  }
});

/**
 * Dark Mode Toggle Implementation
 */
function initDarkMode() {
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  if (!darkModeToggle) return;
  
  // Check for saved user preference or system preference
  const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const storedTheme = localStorage.getItem('theme');
  
  // Set initial theme
  if (storedTheme === 'dark' || (!storedTheme && prefersDarkMode)) {
    document.documentElement.classList.add('dark');
    darkModeToggle.checked = true;
  }
  
  // Toggle theme when switch is clicked
  darkModeToggle.addEventListener('change', () => {
    if (darkModeToggle.checked) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    
    // Animate transition
    document.documentElement.classList.add('theme-transition');
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transition');
    }, 500);
  });
}

/**
 * Scroll Animation Implementation
 */
function initScrollAnimations() {
  // Detect elements with animation classes
  const elements = document.querySelectorAll('.fade-in, .slide-up, .slide-down');
  
  // Create Intersection Observer
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Start animation when element is in view
        entry.target.style.animationPlayState = 'running';
        // Unobserve after animation starts
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1, // Trigger when 10% of the element is visible
    rootMargin: '0px 0px -50px 0px' // Trigger slightly before element comes into view
  });
  
  // Observe each element
  elements.forEach(element => {
    // Pause animation initially
    element.style.animationPlayState = 'paused';
    observer.observe(element);
  });
  
  // Parallax effect for hero section
  const parallaxElements = document.querySelectorAll('.parallax');
  if (parallaxElements.length > 0) {
    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      
      parallaxElements.forEach(element => {
        const speed = element.dataset.speed || 0.1;
        element.style.transform = `translateY(${scrollY * speed}px)`;
      });
    });
  }
}

/**
 * Mobile Menu Implementation
 */
function initMobileMenu() {
  const menuToggle = document.getElementById('mobile-menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  if (!menuToggle || !mobileMenu) return;
  
  menuToggle.addEventListener('click', () => {
    // Toggle menu visibility
    mobileMenu.classList.toggle('hidden');
    mobileMenu.classList.toggle('flex');
    
    // Animate menu
    if (mobileMenu.classList.contains('flex')) {
      // Menu is open - animate in
      mobileMenu.classList.add('animate-slide-down');
      mobileMenu.classList.remove('animate-slide-up');
    } else {
      // Menu is closed - animate out
      mobileMenu.classList.add('animate-slide-up');
      mobileMenu.classList.remove('animate-slide-down');
    }
  });
}

/**
 * Comment System Implementation
 */
function initCommentSystem() {
  const commentForm = document.getElementById('comment-form');
  const commentsContainer = document.getElementById('comments');
  if (!commentForm || !commentsContainer) return;
  
  // Initialize Socket.io connection for real-time comments
  const socket = io();
  
  // Listen for new comments
  socket.on('comment-added', (comment) => {
    // Only add comment if it's for the current post
    if (comment.postId === commentForm.dataset.postId) {
      addCommentToDOM(comment);
    }
  });
  
  // Listen for comment updates (e.g., moderation)
  socket.on('comment-updated', (comment) => {
    // Update comment in DOM if it exists
    const commentEl = document.querySelector(`#comment-${comment.id}`);
    if (commentEl) {
      if (comment.status === 'approved') {
        commentEl.classList.remove('bg-yellow-50');
        commentEl.classList.add('bg-green-50');
      } else if (comment.status === 'rejected') {
        commentEl.remove();
      }
    }
  });
  
  // Handle comment submission
  commentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const postId = commentForm.dataset.postId;
    const content = commentForm.querySelector('textarea').value.trim();
    const parentId = commentForm.dataset.parentId || null;
    
    if (!content) return;
    
    try {
      const response = await fetch('/blog/comment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          postId,
          content,
          parentId
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Clear form
        commentForm.querySelector('textarea').value = '';
        
        // Reset parent ID if replying
        if (parentId) {
          commentForm.dataset.parentId = '';
          commentForm.querySelector('button[type="submit"]').textContent = 'Add Comment';
          document.getElementById('cancel-reply').classList.add('hidden');
        }
        
        // If comment is pending, show message
        if (data.comment.status === 'pending') {
          const pendingMessage = document.createElement('div');
          pendingMessage.className = 'bg-yellow-50 p-4 rounded-lg mt-4';
          pendingMessage.innerHTML = '<p class="text-yellow-700">Your comment has been submitted and is awaiting approval.</p>';
          commentsContainer.prepend(pendingMessage);
        } else {
          // Emit new comment event
          socket.emit('new-comment', data.comment);
        }
      } else {
        alert(data.message || 'Failed to add comment');
      }
    } catch (error) {
      console.error('Comment error:', error);
      alert('An error occurred while submitting your comment');
    }
  });
  
  // Handle reply button clicks
  commentsContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('reply-button')) {
      const commentId = e.target.dataset.commentId;
      const commentAuthor = e.target.dataset.commentAuthor;
      
      // Set parent ID on form
      commentForm.dataset.parentId = commentId;
      
      // Update submit button
      commentForm.querySelector('button[type="submit"]').textContent = `Reply to ${commentAuthor}`;
      
      // Show cancel button
      const cancelButton = document.getElementById('cancel-reply');
      cancelButton.classList.remove('hidden');
      
      // Scroll to form
      commentForm.scrollIntoView({ behavior: 'smooth' });
      
      // Focus text area
      setTimeout(() => {
        commentForm.querySelector('textarea').focus();
      }, 500);
    }
  });
  
  // Handle cancel reply
  const cancelReplyButton = document.getElementById('cancel-reply');
  if (cancelReplyButton) {
    cancelReplyButton.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Reset parent ID
      commentForm.dataset.parentId = '';
      
      // Reset submit button
      commentForm.querySelector('button[type="submit"]').textContent = 'Add Comment';
      
      // Hide cancel button
      cancelReplyButton.classList.add('hidden');
    });
  }
  
  // Function to add new comment to DOM
  function addCommentToDOM(comment) {
    const commentTemplate = document.getElementById('comment-template');
    if (!commentTemplate) return;
    
    const newComment = commentTemplate.content.cloneNode(true);
    
    // Set comment ID
    newComment.querySelector('.comment').id = `comment-${comment.id}`;
    
    // Set author info
    newComment.querySelector('.comment-author').textContent = comment.user.username;
    
    // Set avatar
    const avatarImg = newComment.querySelector('.comment-avatar');
    if (comment.user.avatar) {
      avatarImg.src = comment.user.avatar;
    } else {
      avatarImg.src = `/images/default-avatar.png`;
    }
    
    // Set content
    newComment.querySelector('.comment-content').textContent = comment.content;
    
    // Set date
    const date = new Date(comment.createdAt);
    newComment.querySelector('.comment-date').textContent = date.toLocaleDateString();
    
    // Set reply button data
    const replyButton = newComment.querySelector('.reply-button');
    replyButton.dataset.commentId = comment.id;
    replyButton.dataset.commentAuthor = comment.user.username;
    
    // Add to DOM
    if (comment.parentId) {
      // This is a reply, add to replies container
      const parentComment = document.querySelector(`#comment-${comment.parentId}`);
      const repliesContainer = parentComment.querySelector('.comment-replies');
      repliesContainer.appendChild(newComment);
    } else {
      // This is a top-level comment
      commentsContainer.prepend(newComment);
    }
  }
}

/**
 * Admin Features Implementation
 */
function initAdminFeatures() {
  // Handle delete confirmations
  const deleteButtons = document.querySelectorAll('.delete-button');
  deleteButtons.forEach(button => {
    button.addEventListener('click', async (e) => {
      e.preventDefault();
      
      const id = button.dataset.id;
      const type = button.dataset.type; // 'post', 'project', 'user', etc.
      const name = button.dataset.name;
      
      if (confirm(`Are you sure you want to delete ${type} "${name}"? This action cannot be undone.`)) {
        try {
          const response = await fetch(`/admin/${type}s/${id}`, {
            method: 'DELETE'
          });
          
          const data = await response.json();
          
          if (data.success) {
            // Remove item from DOM
            const item = document.getElementById(`${type}-${id}`);
            if (item) {
              item.remove();
            }
          } else {
            alert(data.message || `Failed to delete ${type}`);
          }
        } catch (error) {
          console.error(`Delete ${type} error:`, error);
          alert(`An error occurred while deleting the ${type}`);
        }
      }
    });
  });
  
  // Handle comment moderation
  const moderationButtons = document.querySelectorAll('.moderate-button');
  moderationButtons.forEach(button => {
    button.addEventListener('click', async (e) => {
      e.preventDefault();
      
      const id = button.dataset.id;
      const action = button.dataset.action; // 'approve' or 'reject'
      
      try {
        const response = await fetch(`/admin/comments/${id}/moderate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ action })
        });
        
        const data = await response.json();
        
        if (data.success) {
          const commentEl = document.getElementById(`comment-${id}`);
          
          if (action === 'approve') {
            commentEl.classList.remove('bg-yellow-50');
            commentEl.classList.add('bg-green-50');
            button.textContent = 'Approved';
            button.disabled = true;
            
            // Enable reject button
            const rejectButton = commentEl.querySelector(`.moderate-button[data-action="reject"]`);
            if (rejectButton) {
              rejectButton.disabled = false;
            }
            
            // Emit comment update
            if (window.socket) {
              window.socket.emit('moderate-comment', data.comment);
            }
          } else if (action === 'reject') {
            commentEl.remove();
          }
        } else {
          alert(data.message || 'Failed to moderate comment');
        }
      } catch (error) {
        console.error('Moderate comment error:', error);
        alert('An error occurred while moderating the comment');
      }
    });
  });
  
  // Rich text editor initialization
  const editorElements = document.querySelectorAll('.rich-text-editor');
  if (editorElements.length > 0) {
    // Initialize rich text editor (using ClassicEditor from CKEditor)
    editorElements.forEach(element => {
      if (window.ClassicEditor) {
        ClassicEditor
          .create(element, {
            toolbar: ['heading', '|', 'bold', 'italic', 'link', 'bulletedList', 'numberedList', 'blockQuote', 'insertTable', 'undo', 'redo']
          })
          .catch(error => {
            console.error('Rich text editor error:', error);
          });
      }
    });
  }
}

/**
 * Page Transition Implementation
 */
window.addEventListener('beforeunload', () => {
  // Add fade-out class to body before navigation
  document.body.classList.add('fade-out');
});

document.addEventListener('DOMContentLoaded', () => {
  // Remove fade-out class and add fade-in class on load
  document.body.classList.remove('fade-out');
  document.body.classList.add('fade-in');
  
  // Remove fade-in class after animation completes
  setTimeout(() => {
    document.body.classList.remove('fade-in');
  }, 500);
});
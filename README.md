# Dawid Kocma - Personal Website

A modern, interactive personal website and blog built with Node.js, Express, and Tailwind CSS.

## Features

- **Modern Design**: Minimalistic design with glassmorphism, responsive layouts, and dark mode
- **Interactive UI**: Animation, parallax effects, and microinteractions
- **Blog**: Full-featured blog with rich text editor and comment system
- **Projects Showcase**: Display and filter projects by technology
- **Admin Dashboard**: Content management system for blogs and projects
- **Authentication**: Secure user authentication with role-based permissions
- **PostgreSQL Database**: Robust data storage with Sequelize ORM
- **Real-time Updates**: Socket.io integration for comments and notifications

## Tech Stack

### Frontend
- Tailwind CSS for styling
- EJS templates
- JavaScript for interactive features
- Responsive design for all devices

### Backend
- Node.js with Express
- PostgreSQL database with Sequelize ORM
- JWT-based authentication
- Socket.io for real-time features

## Getting Started

### Prerequisites

- Node.js (v16 or newer)
- PostgreSQL database

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/dawidkocma/dawidk-web.git
   cd dawidk-web
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```
   cp .env.example .env
   ```

4. Configure your environment variables in the `.env` file

5. Create the database:
   ```
   createdb dawidkocma_db
   ```

6. Run database migrations (if using Sequelize CLI):
   ```
   npx sequelize-cli db:migrate
   ```

7. (Optional) Seed the database with initial data:
   ```
   npx sequelize-cli db:seed:all
   ```

### Development

Run the development server:
```
npm run dev
```

Build and watch CSS:
```
npm run watch:css
```

### Production

Build CSS for production:
```
npm run build:css
```

Start the production server:
```
npm start
```

## Deployment

This application is configured for deployment on Heroku with PostgreSQL.

1. Create a Heroku app:
   ```
   heroku create
   ```

2. Add PostgreSQL addon:
   ```
   heroku addons:create heroku-postgresql:hobby-dev
   ```

3. Set environment variables:
   ```
   heroku config:set NODE_ENV=production
   heroku config:set SESSION_SECRET=your_session_secret
   heroku config:set JWT_SECRET=your_jwt_secret
   ```

4. Deploy to Heroku:
   ```
   git push heroku main
   ```

## License

This project is licensed under the ISC License.

## Author

Dawid Kocma - [Website](https://dawidkocma.com)
# 🎓 Automatic TimeTable Generator - ITPM

![Project Status](https://img.shields.io/badge/Status-Active%20Development-brightgreen)
![Node.js Version](https://img.shields.io/badge/Node.js-v24.13.0-green)
![NPM Version](https://img.shields.io/badge/npm-11.6.2-blue)
![License](https://img.shields.io/badge/License-ISC-red)

An intelligent, automated university timetable scheduling system for SLIIT using advanced optimization algorithms. This application provides multi-user role-based access with 7 different scheduling algorithms to generate optimal academic schedules.

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Scheduling Algorithms](#scheduling-algorithms)
- [User Roles & Dashboards](#user-roles--dashboards)
- [Database Schema](#database-schema)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## ✨ Features

### Core Features
- ✅ **Multi-User Authentication** - Secure JWT-based authentication system
- ✅ **Role-Based Access Control** - 7 different user roles with specific permissions
- ✅ **Advanced Scheduling Algorithms** - 7 optimization algorithms for timetable generation
- ✅ **Real-time Dashboard** - Interactive role-based dashboards
- ✅ **Responsive UI** - Modern React interface with Vite bundler
- ✅ **RESTful API** - Secure backend API with validation
- ✅ **Database Integration** - PostgreSQL with Supabase

### Scheduling Algorithms
1. **Genetic Algorithm** - Evolutionary approach to scheduling
2. **Ant Colony Optimization** - Swarm intelligence method
3. **Particle Swarm Optimization** - Population-based optimization
4. **Tabu Search** - Metaheuristic search algorithm
5. **Hybrid Scheduler** - Combines multiple algorithms
6. **Core Scheduler** - Basic reference implementation
7. **Optimizer** - Parameter optimization module

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 19.2.0 | UI Framework |
| **Vite** | 7.2.5 | Bundler & Dev Server |
| **React Router** | 6.21.0 | Client-side routing |
| **Axios** | 1.13.5 | HTTP Client |
| **CSS3** | Latest | Styling |
| **ESLint** | 9.39.1 | Code Quality |

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Node.js** | 24.13.0 | Runtime |
| **Express.js** | 5.2.1 | Web Framework |
| **PostgreSQL** | Latest | Database |
| **JWT** | 9.0.3 | Authentication |
| **Bcryptjs** | 3.0.3 | Password Hashing |
| **Validator** | 13.11.0 | Input Validation |
| **Nodemon** | 3.1.11 | Dev Auto-reload |

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v24.13.0 or higher) - [Download](https://nodejs.org/)
- **npm** (v11.6.2 or higher) - Comes with Node.js
- **PostgreSQL** (Latest) - [Download](https://www.postgresql.org/download/)
- **Git** - [Download](https://git-scm.com/)
- **VS Code** (Recommended) - [Download](https://code.visualstudio.com/)

### Verify Installation
```bash
node --version
npm --version
psql --version
```

---

## 📥 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/Automatic-TimeTable-Generator-ITPM.git
cd Automatic-TimeTable-Generator-ITPM
```

### 2. Install Backend Dependencies
```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

### 4. Environment Configuration
Create a `.env` file in the `backend/` directory:

```env
# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/timetable_db

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here

# Server Configuration
NODE_ENV=development
PORT=5000

# CORS Configuration
FRONTEND_URL=http://localhost:5173
```

---

## 📂 Project Structure

```
Automatic-TimeTable-Generator-ITPM/
│
├── backend/                          # Express.js API
│   ├── config/                       # Database configuration
│   ├── controllers/                  # Business logic
│   ├── middlewares/                  # Auth & validation
│   ├── models/                       # Data models
│   ├── routes/                       # API routes
│   ├── scheduler/                    # 7 scheduling algorithms
│   ├── utils/                        # Helper functions
│   ├── app.js                        # Server entry point
│   └── .env                          # Environment variables
│
└── frontend/                         # React + Vite
    ├── src/
    │   ├── components/               # Reusable components
    │   ├── pages/                    # Role-based dashboards (7)
    │   ├── api/                      # API integration
    │   ├── data/                     # Static data
    │   ├── assets/                   # Images & media
    │   ├── styles/                   # CSS styles
    │   ├── App.jsx                   # Main component
    │   └── main.jsx                  # Entry point
    ├── LoginandRegistration/         # Auth pages
    ├── Home/                         # Landing page
    └── index.html                    # HTML template
```

---

## ⚙️ Configuration

### Backend Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db` |
| `JWT_SECRET` | Secret key for JWT tokens | `your_secure_secret_key` |
| `NODE_ENV` | Environment mode | `development` or `production` |
| `PORT` | Backend server port | `5000` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` |

### Database Setup

1. Create PostgreSQL database:
```sql
CREATE DATABASE timetable_db;
```

2. The app will auto-initialize tables on first connection via `config/initDb.js`

---

## 🚀 Running the Application

### Option 1: Terminal Tabs (Recommended)

**Terminal 1 - Start Backend:**
```bash
cd backend
npm run dev           # Starts with auto-reload
```

Expected output:
```
Server is running on port 5000
```

**Terminal 2 - Start Frontend:**
```bash
cd frontend
npm run dev           # Starts Vite dev server
```

Expected output:
```
ROLLDOWN-VITE v7.2.5 ready in 259 ms
Local: http://localhost:5173/
```

### Option 2: Background Processes

```bash
# Backend (background)
cd backend && npm run dev &

# Frontend (new terminal)
cd frontend && npm run dev
```

### Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **API Base URL**: http://localhost:5000/api

---

## 📡 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "User Name"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "lecturer"
  }
}
```

### Scheduler Endpoints

#### Generate Timetable
```http
POST /api/scheduler/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "algorithm": "genetic",
  "constraints": {
    "maxHoursPerDay": 6,
    "minBreakTime": 30
  }
}
```

#### Get Schedule
```http
GET /api/scheduler/schedule/:id
Authorization: Bearer <token>
```

---

## 🧬 Scheduling Algorithms

### Algorithm Comparison

| Algorithm | Speed | Quality | Complexity |
|-----------|-------|---------|-----------|
| **Genetic** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Ant Colony** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **PSO** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Tabu Search** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Hybrid** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

### Implementation Details

Each algorithm is implemented in `backend/scheduler/`:
- **geneticScheduler.js** - Evolutionary computing approach
- **antColonyScheduler.js** - Stigmergy-based optimization
- **psoScheduler.js** - Velocity-based particle movement
- **tabuScheduler.js** - Adaptive memory search
- **hybridScheduler.js** - Combined algorithm approach
- **coreScheduler.js** - Foundation scheduler
- **optimizer.js** - Parameter tuning module

---

## 👥 User Roles & Dashboards

### 7 Role-Based Dashboards

1. **👨‍🏫 Lecturer**
   - View assigned classes
   - Check personal timetable
   - Report conflicts/issues

2. **👨‍💼 Instructor**
   - Manage course sessions
   - View allocation
   - Submit preferences

3. **👔 Faculty Coordinator**
   - Manage faculty schedules
   - Approve requests
   - Generate reports

4. **🎓 Academic Coordinator**
   - System-wide scheduling
   - Algorithm selection
   - Conflict resolution

5. **📋 LIC (Lecturer-in-Charge)**
   - Department scheduling
   - Resource allocation
   - Performance tracking

6. **👤 Common User**
   - View own schedule
   - Basic preferences

7. **🔧 Admin**
   - System configuration
   - User management
   - Database maintenance

---

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Schedules Table
```sql
CREATE TABLE schedules (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  algorithm VARCHAR(50),
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔧 Available Scripts

### Backend Scripts
```bash
npm start        # Start production server
npm run dev      # Start with auto-reload (nodemon)
npm test         # Run tests
npm audit fix    # Fix vulnerability issues
```

### Frontend Scripts
```bash
npm run dev      # Start Vite dev server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

---

## 🤝 Contributing

### Contributing Guidelines

1. **Fork the repository**
   ```bash
   git clone https://github.com/yourusername/fork.git
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Commit changes**
   ```bash
   git commit -m "Add your feature: description"
   ```

4. **Push to branch**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create Pull Request**

### Code Standards
- Use 2-space indentation
- Follow ES6+ standards
- Add comments for complex logic
- Test before committing

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Database Connection Error
```
Error: getaddrinfo ENOTFOUND db.example.com
```
**Solution:**
- Check DATABASE_URL in .env
- Verify PostgreSQL is running
- Ensure network connectivity to database

#### 2. Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution:**
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Change PORT in .env
PORT=5001
```

#### 3. JWT Token Expired
**Solution:**
- Re-login to get new token
- Check JWT_SECRET matches frontend

#### 4. CORS Errors
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solution:**
- Verify FRONTEND_URL in .env
- Check CORS middleware in app.js

#### 5. Missing Dependencies
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Debug Mode

Enable debug logging:
```bash
# Backend debug
DEBUG=* npm run dev

# Frontend debug (Chrome DevTools)
# Open localhost:5173 and press F12
```

---

## 📞 Support & Contact

### Getting Help

- **Issues**: Create a GitHub issue with detailed description
- **Discussions**: Start a discussion for feature requests
- **Email**: [Your Email]
- **Documentation**: Check `/docs` folder (if available)

### Before Creating Issue, Check:
- [ ] Latest version installed
- [ ] .env properly configured
- [ ] Database connection working
- [ ] Node/NPM versions match requirements
- [ ] Similar issues already reported

---

## 📄 License

This project is licensed under the **ISC License** - see the LICENSE file for details.

```
Copyright (c) 2024 Automatic TimeTable Generator

Permission is hereby granted, free of charge...
```

---

## 🎯 Project Status

- ✅ Backend API complete
- ✅ Frontend UI structure ready
- ⚠️ CSS/Styling in progress
- ⚠️ Login/Registration validation pending
- 🔄 Testing phase
- 📋 Documentation in progress

### Upcoming Features
- [ ] Email notifications
- [ ] SMS alerts
- [ ] Mobile app
- [ ] Analytics dashboard
- [ ] Bulk import/export
- [ ] Advanced conflict resolution

---

## 📊 Performance Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Page Load Time | < 2s | TBD |
| API Response | < 200ms | TBD |
| Database Queries | < 100ms | TBD |
| Schedule Generation | < 5s | TBD |

---

## 🙏 Acknowledgments

- SLIIT Faculty for requirements
- Open-source community for libraries
- Contributors and testers

---

**Last Updated**: March 21, 2026  
**Version**: 1.0.0  
**Maintained by**: Development Team

---

*For the latest updates and releases, visit the [GitHub Repository](https://github.com/yourusername/Automatic-TimeTable-Generator-ITPM)*

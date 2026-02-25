# Timetable Generator

A full-stack web application for generating and managing academic timetables with role-based access control.

## 🚀 Features

- ✅ User authentication (Register, Login, Logout)
- ✅ Role-based authorization (Faculty Coordinator, LIC, Academic Coordinator, Instructor, Lecturer/Senior Lecturer)
- ✅ Secure password hashing with bcrypt
- ✅ JWT-based authentication
- ✅ Rate limiting to prevent brute force attacks
- ✅ Input validation and sanitization
- ✅ PostgreSQL database
- ✅ RESTful API architecture

## 🛠️ Tech Stack

### Backend
- Node.js & Express.js
- PostgreSQL
- JWT for authentication
- bcrypt for password hashing
- Validator for input validation

### Frontend
- React 19
- React Router for navigation
- SweetAlert2 for notifications
- Vite for build tooling

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## 🔧 Installation & Setup

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd timetable-generator
```

### 2. Install dependencies
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Database Setup

Create a PostgreSQL database and user:
```sql
CREATE DATABASE timetable_db;
CREATE USER your_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE timetable_db TO your_user;
```

### 4. Environment Variables

Create a `.env` file in the `backend` folder (use `.env.example` as template):

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_postgres_user
DB_PASSWORD=your_secure_password
DB_NAME=timetable_db
PORT=5000
JWT_SECRET=your_secure_jwt_secret_at_least_64_characters_long
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

**⚠️ IMPORTANT SECURITY NOTES:**
- Never commit your `.env` file to version control
- Use a strong, randomly generated JWT_SECRET (at least 64 characters)
- Use a secure database password

### 5. Initialize Database Tables

```bash
cd backend
npm run init-db
```

This will create the necessary database tables.

### 6. Run the Application

#### Development Mode (runs both frontend and backend):
```bash
# From root directory
npm start
```

#### Or run separately:

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)
- `POST /api/auth/logout` - Logout user

### User Routes (Protected)
- `GET /api/users/faculty-coordinator` - Faculty Coordinator only
- `GET /api/users/lic` - LIC only
- `GET /api/users/academic-coordinator` - Academic Coordinator only
- `GET /api/users/instructor` - Instructor only
- `GET /api/users/lecturer-senior-lecturer` - Lecturer/Senior Lecturer only

## 🔐 Security Features

1. **Password Requirements:**
   - Minimum 8 characters
   - At least one uppercase letter
   - At least one lowercase letter
   - At least one number
   - At least one special character (@$!%*?&#)

2. **Rate Limiting:**
   - Authentication endpoints: 5 requests per 15 minutes
   - General API: 100 requests per 15 minutes

3. **Input Validation:**
   - Email format validation
   - Phone number validation
   - SQL injection prevention through parameterized queries
   - XSS prevention through input sanitization

4. **Authentication:**
   - JWT tokens with 1-hour expiration
   - HTTP-only cookies for token storage
   - Role-based access control

## 👥 User Roles

- **Faculty Coordinator** - Full administrative access
- **LIC** - Learning Innovation Center access
- **Academic Coordinator** - Academic management access
- **Instructor** - Teaching staff access
- **Lecturer/Senior Lecturer** - Senior teaching staff access

## 🐛 Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check your database credentials in `.env`
- Verify the database exists

### Port Already in Use
- Default ports are 5000 (backend) and 5173 (frontend)
- Change PORT in `.env` if needed

### JWT Token Errors
- Ensure JWT_SECRET is set in `.env`
- Clear browser cookies and try again

## 📝 License

ISC

## 👨‍💻 Development

### Project Structure
```
timetable-generator/
├── backend/
│   ├── config/         # Database and server config
│   ├── controllers/    # Route controllers
│   ├── middlewares/    # Custom middleware
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   ├── utils/          # Utility functions
│   └── app.js          # Express app entry point
├── frontend/
│   ├── src/            # React components
│   ├── LoginandRegistration/  # Auth components
│   └── public/         # Static assets
└── package.json        # Root package file
```

## 🚧 Future Enhancements

- Password reset functionality
- Email verification
- Timetable creation and management
- Course and room management
- Conflict detection
- Export to PDF/CSV
- Dashboard analytics

## 📞 Support

For issues and questions, please create an issue in the repository.

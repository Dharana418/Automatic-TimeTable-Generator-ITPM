# 🎓 Viva Preparation Guide - IT3040 ITPM
## Your Component: Module Management API (Backend)

---

## 📋 Your Details
- **Student ID:** IT23346468
- **Component:** Module Management API (CRUD Operations)
- **Testing Tool:** Jest + Supertest

---

## ❓ Expected Viva Questions & Answers

### 1. Basic Questions

**Q: What is your component about?**
> My component is the Module Management API for the Automatic Timetable Generator. It handles CRUD operations (Create, Read, Update, Delete) for academic modules in the system.

**Q: What endpoints did you implement?**
> - `GET /api/modules` - Get all modules
> - `GET /api/modules/:id` - Get specific module by ID
> - `POST /api/modules` - Create new module
> - `PUT /api/modules/:id` - Update existing module
> - `DELETE /api/modules/:id` - Delete module

---

### 2. Technical Questions

**Q: Why did you use Jest for testing?**
> Jest is a popular JavaScript testing framework that provides:
> - Easy setup with zero configuration
> - Built-in mocking capabilities
> - Good integration with Supertest for API testing
> - Clear test reports with coverage

**Q: What is Supertest and why use it?**
> Supertest is a super-agent driven library for testing HTTP servers. It allows us to make HTTP requests to our Express app and assert responses without actually starting the server.

**Q: How do your tests ensure data integrity?**
> My tests verify:
> - Status codes (200, 201, 404)
> - Response structure (`success` flag, `data` object)
> - Data correctness (e.g., module code, name)
> - Error handling (404 for non-existent modules)

---

### 3. Integration Questions

**Q: How does your module API integrate with the timetable generator?**
> The module data is used by the scheduling engine to:
> - Assign modules to time slots
> - Ensure no conflicts between modules
> - Match modules with appropriate halls

**Q: Where is the module data stored?**
> The module data is stored in a Supabase (PostgreSQL) database. The backend connects using the `@supabase/supabase-js` client.

---

### 4. Project Management Questions

**Q: How did you plan your work?**
> I used GitHub Issues or Trello/Jira to track tasks:
> - Create API endpoints
> - Write unit tests
> - Test CRUD operations
> - Fix bugs

**Q: Show me your Git commits related to this component**
> Be ready to show GitHub/Git desktop with meaningful commits like:
> - "Add GET /api/modules endpoint"
> - "Implement POST module with validation"
> - "Add Jest tests for module CRUD"
> - "Fix: Handle module not found error"

---

## 🎯 Tasks to Demonstrate (2.5 minutes)

### Must Show:
1. **Run the tests** - Execute `npm test` and show passing tests
2. **Show test file** - Point to `__tests__/api/modules.test.js`
3. **Show one test passing** - Highlight a specific test case

### Be Ready to Demo:
1. **Create a module** via POST request
2. **Retrieve modules** via GET request
3. **Update a module** via PUT request
4. **Delete a module** via DELETE request

---

## 💡 Quick Talking Points (2-3 sentences each)

> "My component handles all module-related operations in the backend. I implemented 5 API endpoints and wrote comprehensive Jest tests covering all CRUD operations. The tests verify both success and error scenarios, ensuring the API behaves correctly."

> "For testing, I used Jest with Supertest which allows me to test HTTP endpoints without starting the actual server. Each test makes a request and asserts the response status, data structure, and content."

> "The module data is essential for the timetable generation - each module has year, semester, and session requirements that the scheduler uses to create conflict-free timetables."

---

## 🔧 Commands to Remember

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Start development server
npm run dev
```

---

## ⚠️ Common Traps to Avoid

1. **Don't just read code** - Explain WHAT it does and WHY
2. **Know your student ID** - IT23346468
3. **Be ready for follow-up questions** - "What happens if I send invalid data?"
4. **Show confidence** - You built this, you know it!

---

## 📝 Evidence to Have Ready

- [ ] GitHub repository showing your commits
- [ ] Project management tool (Issues/Board) showing tasks
- [ ] Test results showing passing tests
- [ ] Code ready to run if asked to demo

---

**Good Luck! 🎉 You got this!**
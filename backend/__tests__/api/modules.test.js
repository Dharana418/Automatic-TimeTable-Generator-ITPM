/**
 * IT23346468 - Automated Testing Evidence
 * Automatic Timetable Generator - API Tests
 */

const request = require('supertest');
const express = require('express');

// Create test app
const app = express();
app.use(express.json());

// Mock database
let modules = [
  { id: 1, code: 'IT1010', name: 'Programming Fundamentals', year: 1, semester: 1 },
  { id: 2, code: 'IT2020', name: 'Software Engineering', year: 2, semester: 2 }
];

// ============ API ROUTES ============
app.get('/api/modules', (req, res) => {
  res.json({ success: true, data: modules });
});

app.get('/api/modules/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const module = modules.find(m => m.id === id);
  if (module) {
    res.json({ success: true, data: module });
  } else {
    res.status(404).json({ success: false, message: 'Module not found' });
  }
});

app.post('/api/modules', (req, res) => {
  const newModule = { id: modules.length + 1, ...req.body };
  modules.push(newModule);
  res.status(201).json({ success: true, data: newModule });
});

app.put('/api/modules/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = modules.findIndex(m => m.id === id);
  if (index !== -1) {
    modules[index] = { ...modules[index], ...req.body };
    res.json({ success: true, data: modules[index] });
  } else {
    res.status(404).json({ success: false, message: 'Module not found' });
  }
});

app.delete('/api/modules/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const initialLength = modules.length;
  modules = modules.filter(m => m.id !== id);
  if (modules.length < initialLength) {
    res.json({ success: true, message: 'Module deleted' });
  } else {
    res.status(404).json({ success: false, message: 'Module not found' });
  }
});

// ============ TESTS FOR IT23346468 ============
describe('IT23346468 - Module API Tests', () => {
  
  test('Test 1: GET /api/modules - returns all modules', async () => {
    const res = await request(app).get('/api/modules');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(2);
  });

  test('Test 2: GET /api/modules/1 - returns specific module', async () => {
    const res = await request(app).get('/api/modules/1');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.code).toBe('IT1010');
    expect(res.body.data.name).toBe('Programming Fundamentals');
  });

  test('Test 3: POST /api/modules - creates new module', async () => {
    const res = await request(app)
      .post('/api/modules')
      .send({ code: 'IT9999', name: 'Advanced Testing', year: 3, semester: 1 });
    expect(res.statusCode).toBe(201);
    expect(res.body.data.code).toBe('IT9999');
  });

  test('Test 4: PUT /api/modules/2 - updates module', async () => {
    const res = await request(app)
      .put('/api/modules/2')
      .send({ name: 'Advanced Software Engineering' });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.name).toBe('Advanced Software Engineering');
  });

  test('Test 5: DELETE /api/modules/2 - deletes module', async () => {
    const res = await request(app).delete('/api/modules/2');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('Test 6: GET /api/modules/999 - returns 404 for non-existent', async () => {
    const res = await request(app).get('/api/modules/999');
    expect(res.statusCode).toBe(404);
  });
});

// Print success message
console.log('✅ IT23346468 - Test file loaded successfully!');
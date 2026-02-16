# Flask Schedule Generator - Setup & Usage

## Prerequisites

- Python 3.8+
- pip (Python package manager)

## Installation

### 1. Install Dependencies

```bash
cd Backend
pip install -r requirements.txt
```

### 2. Run the API Server

```bash
python app.py
```

Expected output:
```
Loading data from C:\Users\...\ITPM-TimeTable Generator
Loaded: 86 modules, 100 teachers, 50 batches, 60 halls
Starting Flask API server...
 * Running on http://0.0.0.0:5000
```

The API will be available at `http://localhost:5000`

## Quick Start

### 1. Check Health Status
```bash
curl http://localhost:5000/api/health
```

### 2. Get Data Summary
```bash
curl http://localhost:5000/api/data
```

### 3. Generate Schedule with Genetic Algorithm
```bash
curl -X POST http://localhost:5000/api/schedule/genetic \
  -H "Content-Type: application/json" \
  -d '{"population_size": 50, "generations": 100, "mutation_rate": 0.1}'
```

### 4. Generate Schedule with Ant Colony Optimization
```bash
curl -X POST http://localhost:5000/api/schedule/colony \
  -H "Content-Type: application/json" \
  -d '{"num_ants": 30, "num_iterations": 100}'
```

### 5. Compare Both Algorithms
```bash
curl -X POST http://localhost:5000/api/schedule/compare \
  -H "Content-Type: application/json" \
  -d '{
    "population_size": 40,
    "ga_generations": 50,
    "num_ants": 20,
    "aco_iterations": 50
  }'
```

## Example Python Client

```python
import requests
import json

BASE_URL = "http://localhost:5000/api"

# Generate schedule using Genetic Algorithm
response = requests.post(f"{BASE_URL}/schedule/genetic", json={
    "population_size": 50,
    "generations": 100,
    "mutation_rate": 0.1,
    "elite_size": 5
})

schedule = response.json()
print(f"Fitness Score: {schedule['fitness_score']}")
print(f"Conflicts: {schedule['conflicts']['total']}")
print(f"Modules Scheduled: {schedule['schedule_summary']['modules_scheduled']}")

# Print sample schedule
for slot in schedule['sample_slots']:
    print(f"{slot['module']} - {slot['batch']} @ {slot['hall']} "
          f"({slot['day']} {slot['time']})")
```

## Example JavaScript Client

```javascript
const BASE_URL = "http://localhost:5000/api";

async function generateGeneticSchedule() {
  const response = await fetch(`${BASE_URL}/schedule/genetic`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      population_size: 50,
      generations: 100,
      mutation_rate: 0.1
    })
  });

  const schedule = await response.json();
  console.log('Fitness Score:', schedule.fitness_score);
  console.log('Total Conflicts:', schedule.conflicts.total);
  console.log('Sample Slots:', schedule.sample_slots);
  
  return schedule;
}

generateGeneticSchedule();
```

## Configuration

### Default Parameters

**Genetic Algorithm:**
- Population Size: 50
- Generations: 100
- Mutation Rate: 0.1 (10%)
- Elite Size: 5

**Ant Colony Optimization:**
- Number of Ants: 30
- Iterations: 100
- Alpha: 1.0 (pheromone importance)
- Beta: 2.0 (heuristic importance)

### Tuning Parameters

**For Faster Execution:**
- Reduce population_size to 20-30
- Reduce generations to 50
- Use fewer ants (10-15)
- Reduce iterations to 50

**For Better Quality:**
- Increase population_size to 100-150
- Increase generations to 200-300
- Use more ants (50-100)
- Increase iterations to 200-300

## Project Structure

```
Backend/
├── app.py                      # Flask API main application
├── models.py                   # Data models and classes
├── data_loader.py              # Load data from txt files
├── genetic_algorithm.py        # Genetic Algorithm implementation
├── colony_algorithm.py         # Ant Colony Optimization implementation
├── requirements.txt            # Python dependencies
├── API_DOCUMENTATION.md        # API documentation
└── README.md                   # This file
```

## File Data Format

### FileModules.txt
```
--Select module--
IE1030 - DCN
IT1120 - IP
...
```

### FileTeachers.txt
```
---Select Lecturer---
Prof. Nuwan Kodagoda - Main building (MB)
Dr. Samantha Rajapakshe
...
```

### FileBatches.txt
```
Y1.S2.WE.IT.01
Y1.S2.WD.IT.01
Y2.S1.WD.IT.01
...
```

### Halls.txt
```
A304
A503
B501
...
```

## Troubleshooting

### Issue: "Data not loaded" error
**Solution:** Ensure all txt files are in the parent directory of Backend folder.

### Issue: ModuleNotFoundError
**Solution:** Install dependencies: `pip install -r requirements.txt`

### Issue: Port 5000 already in use
**Solution:** Change port in app.py last line:
```python
app.run(debug=True, host='0.0.0.0', port=5001)
```

### Issue: Slow performance
**Solution:** 
- Reduce population_size and generations
- Use fewer ants and iterations
- Close other applications

## Testing

### Unit Tests (To be added)

Create test_genetic.py:
```python
from genetic_algorithm import GeneticAlgorithm
from models import Module, Teacher, Batch, Hall

def test_genetic_algorithm():
    ga = GeneticAlgorithm(modules, teachers, batches, halls)
    schedule = ga.evolve(population_size=20, generations=10)
    assert schedule is not None
    assert len(schedule.slots) > 0
```

## API Rate Limiting

Currently no rate limiting is implemented. For production use, add:

```python
from flask_limiter import Limiter

limiter = Limiter(app, key_func=lambda: request.remote_addr)

@app.route('/api/schedule/genetic', methods=['POST'])
@limiter.limit("5 per hour")
def generate_genetic():
    ...
```

## Performance Metrics

### Typical Results (on standard machine):

**Genetic Algorithm:**
- Generation time: 10-50 seconds
- Convergence: ~30-50 generations
- Initial fitness: ~200-500
- Final fitness: ~10-50

**Ant Colony Optimization:**
- Iteration time: 5-30 seconds
- Convergence: ~50-100 iterations
- Initial fitness: ~200-500
- Final fitness: ~5-40

## Next Steps

1. Integrate with frontend for visualization
2. Add persistent storage (database)
3. Implement advanced constraints
4. Add export functionality (PDF, Excel)
5. Build scheduling calendar view
6. Add real-time progress updates (WebSocket)

## Support

For issues or questions, check:
1. API_DOCUMENTATION.md for detailed API info
2. Models in models.py for data structure
3. Algorithm implementations for optimization details

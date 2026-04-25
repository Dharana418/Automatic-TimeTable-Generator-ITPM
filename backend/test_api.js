fetch('http://localhost:5001/api/scheduler/modules')
  .then(res => res.text())
  .then(console.log)
  .catch(console.error);

fetch('http://localhost:5001/api/scheduler/assignments')
  .then(res => res.text())
  .then(console.log)
  .catch(console.error);

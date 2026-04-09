import { GoogleGenerativeAI } from '@google/generative-ai';

export const generateTimetableWithGemini = async (options) => {
  const { halls, modules, instructors, lics, assignments, batches } = options;

  if (!process.env.GEMINI_API_KEY) {
    throw new Error("FATAL ENGINE ERROR: GEMINI_API_KEY is completely missing from local environment.");
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  // We use flash for speed, assuming a very robust JSON extraction prompt
  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

  const systemContext = `
You are an advanced mathematics and resource-allocation AI built into a University scheduling system.
Your absolute only purpose is to generate a comprehensive 5-Day Weekly Timetable (Monday-Friday) utilizing the provided Database Objects.

### SCHEDULING CONSTRAINTS
1. You must map the provided MODULES onto the provided HALLS.
2. A single INSTRUCTOR or LIC cannot teach two different classes at the exact same START_TIME and END_TIME. Check the ASSIGNMENTS matrix to see who teaches what.
3. Classes typically run from "08:30" to "10:30", "10:30" to "12:30", "13:30" to "15:30", or "15:30" to "17:30".
4. If a module requires 4 'lectures_per_week', you must schedule 2 blocks of 2-hours on different days.
5. If there is a mathematical impossibility (e.g., more classes than halls available), DO NOT hallucinate halls. Skip the class and flag it in the "conflicts" output array.

### EXPECTED OUTPUT
You MUST return ONLY a strictly formatted JSON string. NO markdown formatting. NO backticks. NO conversational text.

{
  "timetable": [
    {
      "module_id": "M1",
      "module_code": "CS101",
      "instructor_name": "Dr. Smith",
      "hall_id": "H1",
      "hall_name": "Main Hall",
      "dayOfWeek": "Monday",
      "startTime": "08:30",
      "endTime": "10:30",
      "batch_id": "B1",
      "batch_name": "Y1S1 IT"
    }
  ],
  "conflicts": [
    {
      "conflict_type": "Capacity Limitation",
      "description": "Module CS102 could not be scheduled due to overlapping hall availability on Monday."
    }
  ]
}
`;

  const dynamicData = `
--- DATABASE STATE DUMP ---
Halls:
${JSON.stringify(halls.map(h => ({ id: h.id, name: h.name, capacity: h.capacity })))}

Modules:
${JSON.stringify(modules.map(m => ({ id: m.id, code: m.code, name: m.name, batch_size: m.batch_size, lectures: m.lectures_per_week })))}

Assignments (Which Lecturer teaches Which Module):
${JSON.stringify(assignments.map(a => ({ module_id: a.module_id, lecturer_id: a.lecturer_id, lic_id: a.lic_id })))}

Batches:
${JSON.stringify(batches.map(b => ({ id: b.id, name: b.name, capacity: b.capacity })))}
  `;

  try {
    const result = await model.generateContent(`${systemContext}\n\n${dynamicData}`);
    let text = result.response.text();
    
    // Clean potential markdown blocks
    text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    const parsedGeneration = JSON.parse(text);
    return parsedGeneration;
  } catch (err) {
    console.error("Gemini Engine failure:", err);
    throw new Error("The Gemini API Engine failed to compile the matrices. Attempted parse of invalid JSON response.");
  }
};

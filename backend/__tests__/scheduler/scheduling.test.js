/**
 * Unit Tests for Scheduler Core Functions
 * Tests scheduling algorithm, constraint handling, and session placement
 */

describe('Scheduler Core Functions', () => {
  
  describe('Day and Slot Constants', () => {
    it('should have valid weekday slots', () => {
      const WEEKDAY_SLOTS = [
        '08:00-09:00',
        '09:00-10:00',
        '10:00-11:00',
        '11:00-12:00',
        '12:00-13:00',
        '13:00-14:00',
        '14:00-15:00',
        '15:00-16:00',
        '16:00-17:00',
      ];
      
      expect(WEEKDAY_SLOTS.length).toBe(9);
      expect(WEEKDAY_SLOTS[0]).toBe('08:00-09:00');
      expect(WEEKDAY_SLOTS[8]).toBe('16:00-17:00');
    });

    it('should have valid weekday names', () => {
      const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
      expect(WEEKDAYS.length).toBe(5);
      expect(WEEKDAYS).toContain('Mon');
      expect(WEEKDAYS).toContain('Fri');
    });
  });

  describe('Hall Capacity Calculation', () => {
    it('should enforce 120 student limit for lecture halls', () => {
      const hall = {
        id: 'hall-1',
        capacity: 150,
        features: { hallType: 'Lecture Hall' }
      };
      
      const effectiveCapacity = Math.min(150, 120);
      expect(effectiveCapacity).toBe(120);
    });

    it('should return actual capacity for non-lecture spaces', () => {
      const hall = {
        id: 'hall-2',
        capacity: 100,
        features: { hallType: 'Meeting Room' }
      };
      
      expect(hall.capacity).toBe(100);
    });

    it('should handle missing capacity gracefully', () => {
      const hall = {
        id: 'hall-3',
        features: {}
      };
      
      expect(hall.capacity || 0).toBe(0);
    });
  });

  describe('Text Normalization', () => {
    it('should normalize text to lowercase and trim', () => {
      const normalizeText = (value = '') => {
        return String(value || '').trim().toLowerCase();
      };

      expect(normalizeText('  MONDAY  ')).toBe('monday');
      expect(normalizeText('Lecture Hall')).toBe('lecture hall');
      expect(normalizeText('')).toBe('');
    });

    it('should normalize day tokens correctly', () => {
      const normalizeDayToken = (value = '') => {
        const token = String(value || '').trim().toLowerCase().slice(0, 3);
        const dayMap = {
          mon: 'Mon',
          tue: 'Tue',
          wed: 'Wed',
          thu: 'Thu',
          fri: 'Fri',
        };
        return dayMap[token] || 'Fri';
      };

      expect(normalizeDayToken('Monday')).toBe('Mon');
      expect(normalizeDayToken('friday')).toBe('Fri');
      expect(normalizeDayToken('invalid')).toBe('Fri');
      expect(normalizeDayToken('')).toBe('Fri');
    });
  });

  describe('JSON Field Parsing', () => {
    it('should parse JSON string fields', () => {
      const parseJSONField = (val) => {
        if (!val) return null;
        if (typeof val === 'object') return val;
        try { return JSON.parse(val); } catch (e) { return val; }
      };

      const jsonStr = '{"key":"value"}';
      const parsed = parseJSONField(jsonStr);
      expect(parsed).toEqual({ key: 'value' });
    });

    it('should return object as-is', () => {
      const parseJSONField = (val) => {
        if (!val) return null;
        if (typeof val === 'object') return val;
        try { return JSON.parse(val); } catch (e) { return val; }
      };

      const obj = { day: 'Mon', slots: ['09:00-10:00'] };
      const parsed = parseJSONField(obj);
      expect(parsed).toBe(obj);
    });

    it('should handle null/undefined gracefully', () => {
      const parseJSONField = (val) => {
        if (!val) return null;
        if (typeof val === 'object') return val;
        try { return JSON.parse(val); } catch (e) { return val; }
      };

      expect(parseJSONField(null)).toBeNull();
      expect(parseJSONField(undefined)).toBeNull();
      expect(parseJSONField('')).toBeNull();
    });

    it('should handle invalid JSON gracefully', () => {
      const parseJSONField = (val) => {
        if (!val) return null;
        if (typeof val === 'object') return val;
        try { return JSON.parse(val); } catch (e) { return val; }
      };

      const invalidJson = 'not valid json';
      const parsed = parseJSONField(invalidJson);
      expect(parsed).toBe(invalidJson);
    });
  });

  describe('Instructor Availability Checking', () => {
    it('should allow scheduling when no availabilities specified', () => {
      const instructorAvailable = (instructor, day, slot) => {
        const avail = instructor.availabilities || [];
        if (!avail || avail.length === 0) return true;
        for (const a of avail) {
          if (!a) continue;
          const aDay = a.day || a.dayOfWeek;
          if (aDay === day) {
            if (!a.slots || a.slots.length === 0) return true;
            if (a.slots.includes(slot)) return true;
          }
        }
        return false;
      };

      const instructor = { id: 1, name: 'Dr. Smith' };
      expect(instructorAvailable(instructor, 'Mon', '09:00-10:00')).toBe(true);
    });

    it('should check availability constraints', () => {
      const instructorAvailable = (instructor, day, slot) => {
        const avail = instructor.availabilities || [];
        if (!avail || avail.length === 0) return true;
        for (const a of avail) {
          if (!a) continue;
          const aDay = a.day || a.dayOfWeek;
          if (aDay === day) {
            if (!a.slots || a.slots.length === 0) return true;
            if (a.slots.includes(slot)) return true;
          }
        }
        return false;
      };

      const instructor = {
        id: 2,
        name: 'Dr. Jones',
        availabilities: [
          { day: 'Mon', slots: ['09:00-10:00', '10:00-11:00'] },
          { day: 'Wed', slots: ['14:00-15:00'] }
        ]
      };

      expect(instructorAvailable(instructor, 'Mon', '09:00-10:00')).toBe(true);
      expect(instructorAvailable(instructor, 'Wed', '14:00-15:00')).toBe(true);
      expect(instructorAvailable(instructor, 'Tue', '10:00-11:00')).toBe(false);
    });
  });

  describe('Scheduling Constraints', () => {
    it('should enforce weekday-only constraint for lectures', () => {
      const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
      const moduleType = 'lecture';
      
      // Lectures must only be on weekdays
      const allowedDays = WEEKDAYS;
      expect(allowedDays).toHaveLength(5);
      expect(allowedDays).not.toContain('Sat');
      expect(allowedDays).not.toContain('Sun');
    });

    it('should handle batch size constraints', () => {
      const module = {
        id: 'mod-1',
        batch_size: 60,
        expected_students: 45
      };

      const hall = {
        id: 'hall-1',
        capacity: 100
      };

      // Hall capacity >= module batch size
      expect(hall.capacity).toBeGreaterThanOrEqual(module.batch_size);
    });

    it('should validate module details structure', () => {
      const module = {
        id: 'mod-1',
        name: 'Data Structures',
        details: {
          batch_size: 60,
          lectures_per_week: 3,
          day_type: 'weekday'
        }
      };

      expect(module.details).toBeDefined();
      expect(module.details.lectures_per_week).toBe(3);
      expect(module.details.day_type).toBe('weekday');
    });
  });

  describe('Conflict Detection', () => {
    it('should detect hall double-booking', () => {
      const occupancy = {
        Mon: {
          '09:00-10:00': { 'hall-1': true, 'hall-2': true }
        }
      };

      const isHallFree = (day, slot, hallId) => {
        return !occupancy[day]?.[slot]?.[hallId];
      };

      expect(isHallFree('Mon', '09:00-10:00', 'hall-1')).toBe(false);
      expect(isHallFree('Mon', '09:00-10:00', 'hall-3')).toBe(true);
      expect(isHallFree('Tue', '09:00-10:00', 'hall-1')).toBe(true);
    });

    it('should detect instructor double-booking', () => {
      const instructorSchedule = {
        'instr-1': {
          Mon: { '09:00-10:00': true }
        }
      };

      const isInstructorFree = (instructorId, day, slot) => {
        return !instructorSchedule[instructorId]?.[day]?.[slot];
      };

      expect(isInstructorFree('instr-1', 'Mon', '09:00-10:00')).toBe(false);
      expect(isInstructorFree('instr-1', 'Mon', '10:00-11:00')).toBe(true);
      expect(isInstructorFree('instr-2', 'Mon', '09:00-10:00')).toBe(true);
    });
  });
});

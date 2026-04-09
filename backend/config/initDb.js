import pool from './db.js';

const DEMO_SPECIALIZATION_BLUEPRINTS = [
    {
        specialization: 'IT',
        department: 'Information Technology',
        year: 1,
        semester: 1,
        building: 'New Building',
        floor: '1',
        weekdayModule: { code: 'IT1010', name: 'Information Technology Foundations' },
        weekendModule: { code: 'IT1020', name: 'IT Systems Lab' },
    },
    {
        specialization: 'SE',
        department: 'Software Engineering',
        year: 1,
        semester: 2,
        building: 'New Building',
        floor: '2',
        weekdayModule: { code: 'SE1110', name: 'Software Engineering Principles' },
        weekendModule: { code: 'SE1120', name: 'Software Engineering Studio' },
    },
    {
        specialization: 'CYBER SECURITY',
        department: 'Cyber Security',
        year: 2,
        semester: 1,
        building: 'Main Building',
        floor: '2',
        weekdayModule: { code: 'CYB1210', name: 'Cyber Security Foundations' },
        weekendModule: { code: 'CYB1220', name: 'Cyber Security Lab' },
    },
    {
        specialization: 'CS',
        department: 'Computer Science',
        year: 2,
        semester: 1,
        building: 'Main Building',
        floor: '1',
        weekdayModule: { code: 'CS1210', name: 'Computer Science Foundations' },
        weekendModule: { code: 'CS1220', name: 'Computer Science Lab' },
    },
    {
        specialization: 'ISE',
        department: 'Information Systems Engineering',
        year: 2,
        semester: 2,
        building: 'Main Building',
        floor: '2',
        weekdayModule: { code: 'ISE1310', name: 'Information Systems Engineering' },
        weekendModule: { code: 'ISE1320', name: 'Information Systems Workshop' },
    },
    {
        specialization: 'CSNE',
        department: 'Computer Systems Network Engineering',
        year: 3,
        semester: 1,
        building: 'Main Building',
        floor: '3',
        weekdayModule: { code: 'CSNE1410', name: 'Network Engineering Fundamentals' },
        weekendModule: { code: 'CSNE1420', name: 'Network Engineering Lab' },
    },
    {
        specialization: 'IME',
        department: 'Interactive Media',
        year: 3,
        semester: 2,
        building: 'Main Building',
        floor: '4',
        weekdayModule: { code: 'IME1510', name: 'Interactive Media Systems' },
        weekendModule: { code: 'IME1520', name: 'Interactive Media Studio' },
    },
    {
        specialization: 'DS',
        department: 'Data Science',
        year: 4,
        semester: 1,
        building: 'Main Building',
        floor: '5',
        weekdayModule: { code: 'DS1610', name: 'Data Science Foundations' },
        weekendModule: { code: 'DS1620', name: 'Data Science Lab' },
    },
    {
        specialization: 'AI',
        department: 'Artificial Intelligence',
        year: 4,
        semester: 2,
        building: 'Main Building',
        floor: '6',
        weekdayModule: { code: 'AI1710', name: 'Artificial Intelligence Foundations' },
        weekendModule: { code: 'AI1720', name: 'Artificial Intelligence Lab' },
    },
];

const toSpecializationKey = (value = '') => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '');

const MODULE_SPECIALIZATIONS = ['IT', 'SE', 'CS', 'ISE', 'CSNE', 'IME', 'DS', 'AI', 'CYBER SECURITY'];
const MODULES_PER_SPECIALIZATION_PER_SEMESTER = 5;

const SPECIALIZATION_CODE_PREFIX = {
    IT: 'IT',
    SE: 'SE',
    CS: 'CS',
    ISE: 'IS',
    CSNE: 'CN',
    IME: 'IE',
    DS: 'DS',
    AI: 'AI',
    'CYBER SECURITY': 'CYB',
};

const buildHallFeatures = ({ building, floor, hallType }) => ({
    building,
    floor,
    hallType,
    roomType: hallType,
    amenities: {
        projector: true,
        wifi: true,
        ac: hallType === 'lecture_hall',
        lab_equipment: hallType === 'lab',
        accessibility: true,
        whiteboard: true,
        sound_system: hallType === 'lecture_hall',
    },
});

const buildDemoHalls = () => {
    const hallRows = [];
    const buildingBlueprints = [
        { building: 'Main Building', prefix: 'MB', floors: [1, 2, 3, 4, 5, 6, 7, 8] },
        { building: 'New Building', prefix: 'NB', floors: [1, 2, 3, 4] },
    ];

    for (const buildingBlueprint of buildingBlueprints) {
        for (const floor of buildingBlueprint.floors) {
            hallRows.push({
                id: `${buildingBlueprint.prefix}-F${String(floor).padStart(2, '0')}-LH-01`,
                name: `${buildingBlueprint.prefix} Floor ${floor} Lecture Hall 01`,
                capacity: floor <= 2 ? 120 : 100,
                features: buildHallFeatures({ building: buildingBlueprint.building, floor: String(floor), hallType: 'lecture_hall' }),
                status: 'available',
                maintenance_start: null,
                maintenance_end: null,
            });

            hallRows.push({
                id: `${buildingBlueprint.prefix}-F${String(floor).padStart(2, '0')}-LAB-01`,
                name: `${buildingBlueprint.prefix} Floor ${floor} Lab 01`,
                capacity: 60,
                features: buildHallFeatures({ building: buildingBlueprint.building, floor: String(floor), hallType: 'lab' }),
                status: 'available',
                maintenance_start: null,
                maintenance_end: null,
            });
        }
    }

    return hallRows;
};

const buildDemoDepartments = () => DEMO_SPECIALIZATION_BLUEPRINTS.map((blueprint) => ({
    id: `dept_${toSpecializationKey(blueprint.specialization)}`,
    code: blueprint.specialization,
    name: `Department of ${blueprint.department}`,
}));

const buildDemoLics = () => DEMO_SPECIALIZATION_BLUEPRINTS.map((blueprint) => ({
    id: `lic_${toSpecializationKey(blueprint.specialization)}`,
    name: `${blueprint.specialization} LIC`,
    department: blueprint.department,
    details: JSON.stringify({ specialization: blueprint.specialization, building: blueprint.building, floor: blueprint.floor }),
}));

const buildDemoInstructors = () => DEMO_SPECIALIZATION_BLUEPRINTS.map((blueprint) => ({
    id: `inst_${toSpecializationKey(blueprint.specialization)}`,
    name: `${blueprint.specialization} Instructor`,
    email: `${toSpecializationKey(blueprint.specialization)}@example.com`,
    department: blueprint.department,
    availabilities: JSON.stringify([
        { day: 'Mon', slots: ['09:00-10:00', '10:00-11:00', '11:00-12:00'] },
        { day: 'Sat', slots: ['09:00-10:00', '10:00-11:00'] },
    ]),
    details: JSON.stringify({ specialization: blueprint.specialization, building: blueprint.building, floor: blueprint.floor }),
    lic_id: `lic_${toSpecializationKey(blueprint.specialization)}`,
}));

const buildDemoModules = () => {
    const rows = [];

    const specializationMeta = new Map(
        DEMO_SPECIALIZATION_BLUEPRINTS.map((blueprint) => [
            blueprint.specialization,
            {
                building: blueprint.building,
                floor: blueprint.floor,
                department: blueprint.department,
            },
        ]),
    );

    for (let year = 1; year <= 4; year += 1) {
        for (const semester of [1, 2]) {
            for (const specialization of MODULE_SPECIALIZATIONS) {
                const meta = specializationMeta.get(specialization) || {
                    building: 'Main Building',
                    floor: String(Math.min(8, Math.max(1, year + semester))),
                    department: specialization,
                };

                const prefix = SPECIALIZATION_CODE_PREFIX[specialization] || 'GEN';

                for (let index = 1; index <= MODULES_PER_SPECIALIZATION_PER_SEMESTER; index += 1) {
                    const isWeekendLab = index === MODULES_PER_SPECIALIZATION_PER_SEMESTER;
                    const code = `${prefix}${year}${semester}${index}0`;
                    const moduleName = `${specialization} Year ${year} Semester ${semester} Module ${index}`;

                    rows.push({
                        id: `module_${toSpecializationKey(specialization)}_${year}_${semester}_${index}`,
                        code,
                        name: moduleName,
                        batch_size: isWeekendLab ? 100 : 120,
                        day_type: isWeekendLab ? 'weekend' : 'weekday',
                        credits: isWeekendLab ? 2 : 3,
                        lectures_per_week: isWeekendLab ? 2 : 3,
                        details: JSON.stringify({
                            specialization,
                            academic_year: year,
                            semester,
                            day_type: isWeekendLab ? 'weekend' : 'weekday',
                            expected_students: isWeekendLab ? 100 : 120,
                            requiredHallType: isWeekendLab ? 'lab' : 'lecture_hall',
                            preferredBuilding: meta.building,
                            preferredFloor: meta.floor,
                        }),
                        lic_id: `lic_${toSpecializationKey(specialization)}`,
                        academic_year: String(year),
                        semester: String(semester),
                        created_by: null,
                    });
                }
            }
        }
    }

    return rows;
};

const createBatchRow = ({ year, semester, mode, specialization, capacity }) => ({
    id: `Y${year}.S${semester}.${String(mode || 'WD').trim().toUpperCase()}.${specialization}.01.01`,
    name: `Y${year}.S${semester}.${String(mode || 'WD').trim().toUpperCase()}.${specialization}.01.01`,
    department_id: `dept_${toSpecializationKey(specialization)}`,
    capacity,
});

const buildDemoBatches = () => {
    const rows = [];

    const yearlyPlan = {
        1: [
            { specialization: 'IT', capacity: 1000 },
            { specialization: 'SE', capacity: 300 },
            { specialization: 'DS', capacity: 300 },
            { specialization: 'ISE', capacity: 200 },
            { specialization: 'IM', capacity: 50 },
            { specialization: 'CYBER SECURITY', capacity: 150 },
        ],
        2: [
            { specialization: 'IT', capacity: 1000 },
            { specialization: 'SE', capacity: 300 },
            { specialization: 'DS', capacity: 300 },
            { specialization: 'ISE', capacity: 200 },
            { specialization: 'IM', capacity: 50 },
            { specialization: 'CYBER SECURITY', capacity: 150 },
        ],
        3: [
            { specialization: 'IT', capacity: 1000 },
            { specialization: 'SE', capacity: 300 },
            { specialization: 'DS', capacity: 300 },
            { specialization: 'ISE', capacity: 200 },
            { specialization: 'IM', capacity: 50 },
            { specialization: 'CYBER SECURITY', capacity: 200 },
        ],
        4: [
            { specialization: 'IT', capacity: 1000 },
            { specialization: 'SE', capacity: 300 },
            { specialization: 'DS', capacity: 300 },
            { specialization: 'ISE', capacity: 200 },
            { specialization: 'IM', capacity: 50 },
            { specialization: 'CYBER SECURITY', capacity: 200 },
        ],
    };

    for (const year of [1, 2, 3, 4]) {
        for (const semester of [1, 2]) {
            const mode = semester === 1 ? 'WD' : 'WE';
            for (const plan of yearlyPlan[year]) {
                rows.push(createBatchRow({
                    year,
                    semester,
                    mode,
                    specialization: plan.specialization,
                    capacity: plan.capacity,
                }));
            }
        }
    }

    return rows;
};

const insertSeedRows = async (table, columns, rows) => {
    if (!rows.length) return;

    const values = [];
    const placeholders = rows
        .map((row, rowIndex) => {
            columns.forEach((column) => values.push(row[column] ?? null));
            const offset = rowIndex * columns.length;
            return `(${columns.map((_, columnIndex) => `$${offset + columnIndex + 1}`).join(', ')})`;
        })
        .join(', ');

    await pool.query(
        `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${placeholders} ON CONFLICT (id) DO NOTHING`,
        values,
    );
};

const upsertSeedRows = async (table, columns, rows) => {
    if (!rows.length) return;

    const values = [];
    const placeholders = rows
        .map((row, rowIndex) => {
            columns.forEach((column) => values.push(row[column] ?? null));
            const offset = rowIndex * columns.length;
            return `(${columns.map((_, columnIndex) => `$${offset + columnIndex + 1}`).join(', ')})`;
        })
        .join(', ');

    const updatableColumns = columns.filter((column) => column !== 'id');
    const updateAssignments = updatableColumns
        .map((column) => `${column} = EXCLUDED.${column}`)
        .join(', ');

    await pool.query(
        `INSERT INTO ${table} (${columns.join(', ')})
         VALUES ${placeholders}
         ON CONFLICT (id)
         DO UPDATE SET ${updateAssignments}`,
        values,
    );
};

const upsertModulesByCode = async (rows = []) => {
    if (!rows.length) return;

    const columns = ['id', 'code', 'name', 'batch_size', 'day_type', 'credits', 'lectures_per_week', 'details', 'lic_id', 'academic_year', 'semester', 'created_by'];
    const values = [];

    const placeholders = rows
        .map((row, rowIndex) => {
            columns.forEach((column) => values.push(row[column] ?? null));
            const offset = rowIndex * columns.length;
            return `(${columns.map((_, columnIndex) => `$${offset + columnIndex + 1}`).join(', ')})`;
        })
        .join(', ');

    await pool.query(
        `INSERT INTO modules (${columns.join(', ')})
         VALUES ${placeholders}
         ON CONFLICT (code)
         DO UPDATE SET
            name = EXCLUDED.name,
            batch_size = EXCLUDED.batch_size,
            day_type = EXCLUDED.day_type,
            credits = EXCLUDED.credits,
            lectures_per_week = EXCLUDED.lectures_per_week,
            details = EXCLUDED.details,
            lic_id = EXCLUDED.lic_id,
            academic_year = EXCLUDED.academic_year,
            semester = EXCLUDED.semester,
            created_by = EXCLUDED.created_by`,
        values,
    );
};

const seedDemoData = async () => {
    await insertSeedRows('departments', ['id', 'code', 'name'], buildDemoDepartments());
    await insertSeedRows('lics', ['id', 'name', 'department', 'details'], buildDemoLics());
    await insertSeedRows('instructors', ['id', 'name', 'email', 'department', 'availabilities', 'details', 'lic_id'], buildDemoInstructors());
    await insertSeedRows('halls', ['id', 'name', 'capacity', 'features', 'status', 'maintenance_start', 'maintenance_end'], buildDemoHalls().map((hall) => ({
        ...hall,
        features: JSON.stringify(hall.features),
    })));
    await upsertModulesByCode(buildDemoModules());
    await upsertSeedRows('batches', ['id', 'name', 'department_id', 'capacity'], buildDemoBatches());
};

export async function initDb() {
    try {
        // Check if pool is valid
        if (!pool || !pool.query) {
            console.error('❌ Database pool not available');
            return false;
        }

        console.log('📊 Initializing database tables...');

        // Create halls table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS halls (
                id TEXT PRIMARY KEY,
                name TEXT,
                capacity INTEGER,
                features JSONB,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);
        await pool.query(`ALTER TABLE halls ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'available'`);
        await pool.query(`ALTER TABLE halls ADD COLUMN IF NOT EXISTS maintenance_start DATE`);
        await pool.query(`ALTER TABLE halls ADD COLUMN IF NOT EXISTS maintenance_end DATE`);
        console.log('✓ halls table ready');

        // Create modules table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS modules (
                id TEXT PRIMARY KEY,
                code TEXT,
                name TEXT,
                batch_size INTEGER,
                day_type TEXT,
                credits INTEGER,
                lectures_per_week INTEGER,
                details JSONB,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('✓ modules table ready');

        // Create lics table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS lics (
                id TEXT PRIMARY KEY,
                name TEXT,
                department TEXT,
                details JSONB,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('✓ lics table ready');

        // Create instructors table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS instructors (
                id TEXT PRIMARY KEY,
                name TEXT,
                email TEXT,
                department TEXT,
                availabilities JSONB,
                details JSONB,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('✓ instructors table ready');

        await pool.query(`ALTER TABLE modules ADD COLUMN IF NOT EXISTS lic_id TEXT REFERENCES lics(id) ON DELETE SET NULL`);
        await pool.query(`ALTER TABLE modules ADD COLUMN IF NOT EXISTS academic_year VARCHAR(20)`);
        await pool.query(`ALTER TABLE modules ADD COLUMN IF NOT EXISTS semester VARCHAR(20)`);
        await pool.query(`ALTER TABLE modules ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL`);
        await pool.query(`ALTER TABLE instructors ADD COLUMN IF NOT EXISTS lic_id TEXT REFERENCES lics(id) ON DELETE SET NULL`);
        console.log('✓ LIC ownership columns ensured');
        console.log('✓ Module academic year and semester columns ensured');

        // Create departments table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS departments (
                id TEXT PRIMARY KEY,
                code TEXT,
                name TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('✓ departments table ready');

        // Create batches table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS batches (
                id TEXT PRIMARY KEY,
                name TEXT,
                department_id TEXT,
                capacity INTEGER,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('✓ batches table ready');

        // Create module_assignments table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS module_assignments (
                id TEXT PRIMARY KEY,
                module_id TEXT REFERENCES modules(id) ON DELETE CASCADE,
                lecturer_id TEXT REFERENCES instructors(id) ON DELETE CASCADE,
                lic_id TEXT REFERENCES lics(id) ON DELETE CASCADE,
                academic_year TEXT NOT NULL,
                semester TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(module_id, lecturer_id, lic_id, academic_year, semester)
            )
        `);
        console.log('✓ module_assignments table ready');

        try {
            await pool.query(`
                ALTER TABLE module_assignments 
                ADD CONSTRAINT module_assignments_unique_assignment 
                UNIQUE (module_id, lecturer_id, lic_id, academic_year, semester)
            `);
        } catch (e) {
            if (e.code !== '42710') { // 42710 is duplicate_object
                // Ignore if it already exists
            }
        }


        await pool.query(`
            CREATE TABLE IF NOT EXISTS faculty_soft_constraints (
                id SERIAL PRIMARY KEY,
                coordinator_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
                preferred_days TEXT[] DEFAULT ARRAY[]::TEXT[],
                preferred_time_slots TEXT[] DEFAULT ARRAY[]::TEXT[],
                w5_weight NUMERIC,
                notes TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('✓ faculty_soft_constraints table ready');

        // Create users table (for auth)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                address TEXT,
                birthday DATE,
                phonenumber TEXT,
                role TEXT DEFAULT 'user',
                role_assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
                role_assigned_at TIMESTAMP DEFAULT NOW(),
                role_assignment_note TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('✓ users table ready');

        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role_assigned_by UUID REFERENCES users(id) ON DELETE SET NULL`);
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role_assigned_at TIMESTAMP DEFAULT NOW()`);
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role_assignment_note TEXT`);
        console.log('✓ users role assignment metadata ensured');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS role_assignment_history (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                target_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                assigned_role TEXT NOT NULL,
                assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
                assignment_note TEXT,
                password_hash TEXT,
                password_encrypted TEXT,
                password_encryption_iv TEXT,
                password_encryption_tag TEXT,
                assigned_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('✓ role_assignment_history table ready');

        await pool.query(`ALTER TABLE role_assignment_history ADD COLUMN IF NOT EXISTS password_hash TEXT`);
        await pool.query(`ALTER TABLE role_assignment_history ADD COLUMN IF NOT EXISTS password_encrypted TEXT`);
        await pool.query(`ALTER TABLE role_assignment_history ADD COLUMN IF NOT EXISTS password_encryption_iv TEXT`);
        await pool.query(`ALTER TABLE role_assignment_history ADD COLUMN IF NOT EXISTS password_encryption_tag TEXT`);
        console.log('✓ role_assignment_history password snapshot columns ensured');

        // Create timetables table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS timetables (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255),
                semester VARCHAR(20),
                year VARCHAR(20),
                status VARCHAR(50) DEFAULT 'pending',
                generated_by UUID REFERENCES users(id),
                data JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✓ timetables table ready');

        // Create timetable_approvals table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS timetable_approvals (
                id SERIAL PRIMARY KEY,
                timetable_id INTEGER REFERENCES timetables(id),
                coordinator_id UUID REFERENCES users(id),
                status VARCHAR(50) CHECK (status IN ('pending', 'approved', 'rejected', 'needs_revision')),
                comments TEXT,
                approved_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(timetable_id)
            )
        `);
        console.log('✓ timetable_approvals table ready');

        // Create scheduling_conflicts table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS scheduling_conflicts (
                id SERIAL PRIMARY KEY,
                timetable_id INTEGER REFERENCES timetables(id),
                conflict_type VARCHAR(100),
                description TEXT,
                severity VARCHAR(50) CHECK (severity IN ('high', 'medium', 'low')),
                resolved BOOLEAN DEFAULT FALSE,
                resolved_at TIMESTAMP,
                resolved_by UUID REFERENCES users(id),
                resolution_notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✓ scheduling_conflicts table ready');

        // Create academic_calendar table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS academic_calendar (
                id SERIAL PRIMARY KEY,
                event_name VARCHAR(255),
                event_type VARCHAR(100) CHECK (event_type IN ('semester_start', 'semester_end', 'exam_period', 'holiday', 'special_event')),
                start_date DATE,
                end_date DATE,
                academic_year VARCHAR(20),
                semester VARCHAR(20),
                created_by UUID REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✓ academic_calendar table ready');

        // Create hall_resources table for equipment and furniture inventory
        await pool.query(`
            CREATE TABLE IF NOT EXISTS hall_resources (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                hall_id TEXT REFERENCES halls(id) ON DELETE CASCADE,
                resource_type VARCHAR(100),
                resource_name VARCHAR(255),
                quantity INTEGER DEFAULT 1,
                condition VARCHAR(50) CHECK (condition IN ('excellent', 'good', 'fair', 'poor')),
                notes TEXT,
                added_by UUID REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✓ hall_resources table ready');

        // Create hall_ratings table for feedback on hall condition
        await pool.query(`
            CREATE TABLE IF NOT EXISTS hall_ratings (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                hall_id TEXT REFERENCES halls(id) ON DELETE CASCADE,
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                rating INTEGER CHECK (rating >= 1 AND rating <= 5),
                comment TEXT,
                facility_condition VARCHAR(50),
                cleanliness_rating INTEGER CHECK (cleanliness_rating >= 1 AND cleanliness_rating <= 5),
                equipment_working BOOLEAN,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✓ hall_ratings table ready');

        // Create activity_logs table for edit/delete history
        await pool.query(`
            CREATE TABLE IF NOT EXISTS activity_logs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                entity_type VARCHAR(50),
                entity_id VARCHAR(255),
                entity_name VARCHAR(255),
                action VARCHAR(50) CHECK (action IN ('create', 'update', 'delete', 'assign_resource', 'remove_resource', 'add_rating')),
                changes JSONB,
                performed_by UUID REFERENCES users(id),
                ip_address VARCHAR(50),
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(id)
            )
        `);
        console.log('✓ activity_logs table ready');

        // Create hall_recommendations table for smart suggestions
        await pool.query(`
            CREATE TABLE IF NOT EXISTS hall_recommendations (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                for_module_id TEXT REFERENCES modules(id) ON DELETE CASCADE,
                batch_size INTEGER,
                recommended_hall_id TEXT REFERENCES halls(id) ON DELETE CASCADE,
                score DECIMAL(5,2),
                matching_resources JSONB,
                missing_resources JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP,
                UNIQUE(for_module_id, recommended_hall_id)
            )
        `);
        console.log('✓ hall_recommendations table ready');

        // Create indexes for better performance
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_module_assignments_module_id ON module_assignments(module_id);
            CREATE INDEX IF NOT EXISTS idx_module_assignments_lecturer_id ON module_assignments(lecturer_id);
            CREATE INDEX IF NOT EXISTS idx_module_assignments_lic_id ON module_assignments(lic_id);
            CREATE INDEX IF NOT EXISTS idx_modules_lic_id ON modules(lic_id);
            CREATE INDEX IF NOT EXISTS idx_modules_academic_year ON modules(academic_year);
            CREATE INDEX IF NOT EXISTS idx_modules_semester ON modules(semester);
            CREATE INDEX IF NOT EXISTS idx_modules_year_semester ON modules(academic_year, semester);
            CREATE INDEX IF NOT EXISTS idx_instructors_lic_id ON instructors(lic_id);
            CREATE INDEX IF NOT EXISTS idx_faculty_soft_constraints_coordinator ON faculty_soft_constraints(coordinator_id);
            CREATE INDEX IF NOT EXISTS idx_batches_department_id ON batches(department_id);
            CREATE INDEX IF NOT EXISTS idx_users_role_assigned_by ON users(role_assigned_by);
            CREATE INDEX IF NOT EXISTS idx_role_history_target_user ON role_assignment_history(target_user_id);
            CREATE INDEX IF NOT EXISTS idx_role_history_assigned_by ON role_assignment_history(assigned_by);
            CREATE INDEX IF NOT EXISTS idx_role_history_assigned_at ON role_assignment_history(assigned_at DESC);
            CREATE INDEX IF NOT EXISTS idx_timetables_status ON timetables(status);
            CREATE INDEX IF NOT EXISTS idx_timetable_approvals_status ON timetable_approvals(status);
            CREATE INDEX IF NOT EXISTS idx_scheduling_conflicts_resolved ON scheduling_conflicts(resolved);
            CREATE INDEX IF NOT EXISTS idx_hall_resources_hall_id ON hall_resources(hall_id);
            CREATE INDEX IF NOT EXISTS idx_hall_resources_resource_type ON hall_resources(resource_type);
            CREATE INDEX IF NOT EXISTS idx_hall_ratings_hall_id ON hall_ratings(hall_id);
            CREATE INDEX IF NOT EXISTS idx_hall_ratings_created_at ON hall_ratings(created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_id ON activity_logs(entity_id);
            CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_type ON activity_logs(entity_type);
            CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_hall_recommendations_module_id ON hall_recommendations(for_module_id);
            CREATE INDEX IF NOT EXISTS idx_hall_recommendations_hall_id ON hall_recommendations(recommended_hall_id)
        `);
        console.log('✓ indexes created');

        await seedDemoData();
        console.log('✓ demo timetable data seeded');

        console.log('✅ All database tables initialized successfully');
        return true;
    } catch (err) {
        console.error('❌ Error initializing DB tables:', err.message);
        console.error('Error details:', err);
        return false;
    }
}

export default initDb;
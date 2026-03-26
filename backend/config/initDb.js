import pool from './db.js';

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
        await pool.query(`ALTER TABLE instructors ADD COLUMN IF NOT EXISTS lic_id TEXT REFERENCES lics(id) ON DELETE SET NULL`);
        console.log('✓ LIC ownership columns ensured');

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
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('✓ module_assignments table ready');

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
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_token_hash TEXT`);
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_expires_at TIMESTAMP`);
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_requested_at TIMESTAMP`);
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_consumed_at TIMESTAMP`);
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo_url TEXT`);
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

        // Create indexes for better performance
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_module_assignments_module_id ON module_assignments(module_id);
            CREATE INDEX IF NOT EXISTS idx_module_assignments_lecturer_id ON module_assignments(lecturer_id);
            CREATE INDEX IF NOT EXISTS idx_module_assignments_lic_id ON module_assignments(lic_id);
            CREATE INDEX IF NOT EXISTS idx_modules_lic_id ON modules(lic_id);
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
        `);
        console.log('✓ indexes created');

        console.log('✅ All database tables initialized successfully');
        return true;
    } catch (err) {
        console.error('❌ Error initializing DB tables:', err.message);
        console.error('Error details:', err);
        return false;
    }
}

export default initDb;
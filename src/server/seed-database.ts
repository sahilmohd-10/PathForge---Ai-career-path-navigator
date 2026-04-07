import db from './db.ts';
import bcrypt from 'bcryptjs';

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');

    // Clear existing data (optional - comment out if you want to preserve existing data)
    // await db('applications').del();
    // await db('jobs').del();
    // await db('user_skills').del();
    // await db('users').del();

    // Check if data already exists
    const userCount = await db('users').count('id as count').first();
    if ((userCount as any).count > 0) {
      console.log('Database already has data. Skipping seed.');
      return;
    }

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await db('users').insert({
      email: 'admin@pathforge.com',
      password: adminPassword,
      full_name: 'Admin User',
      role: 'admin',
      is_verified: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    console.log('Created admin user');

    // Create student users
    const studentPasswords = await Promise.all([
      bcrypt.hash('student1', 10),
      bcrypt.hash('student2', 10),
      bcrypt.hash('student3', 10),
      bcrypt.hash('student4', 10),
      bcrypt.hash('student5', 10),
    ]);

    const students = await db('users').insert([
      {
        email: 'student1@example.com',
        password: studentPasswords[0],
        full_name: 'Alice Johnson',
        role: 'student',
        is_verified: 1,
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        email: 'student2@example.com',
        password: studentPasswords[1],
        full_name: 'Bob Smith',
        role: 'student',
        is_verified: 1,
        created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        email: 'student3@example.com',
        password: studentPasswords[2],
        full_name: 'Carol Davis',
        role: 'student',
        is_verified: 0,
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        email: 'student4@example.com',
        password: studentPasswords[3],
        full_name: 'David Wilson',
        role: 'student',
        is_verified: 1,
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        email: 'student5@example.com',
        password: studentPasswords[4],
        full_name: 'Emma Brown',
        role: 'student',
        is_verified: 1,
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ]);
    console.log('Created 5 student users');

    // Create recruiter users
    const recruiterPasswords = await Promise.all([
      bcrypt.hash('recruiter1', 10),
      bcrypt.hash('recruiter2', 10),
      bcrypt.hash('recruiter3', 10),
    ]);

    const recruiters = await db('users').insert([
      {
        email: 'recruiter1@company.com',
        password: recruiterPasswords[0],
        full_name: 'John Recruiter',
        role: 'recruiter',
        is_verified: 1,
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        email: 'recruiter2@company.com',
        password: recruiterPasswords[1],
        full_name: 'Jane Hiring',
        role: 'recruiter',
        is_verified: 1,
        created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        email: 'recruiter3@company.com',
        password: recruiterPasswords[2],
        full_name: 'Mike Talent',
        role: 'recruiter',
        is_verified: 1,
        created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ]);
    console.log('Created 3 recruiter users');

    // Get the actual IDs from inserted data
    const allStudents = await db('users').where({ role: 'student' }).select('id');
    const allRecruiters = await db('users').where({ role: 'recruiter' }).select('id');

    // Create jobs
    const jobs = await db('jobs').insert([
      {
        title: 'Senior Frontend Developer',
        company: 'Tech Corp',
        description: 'Looking for experienced React developer with 5+ years experience',
        requirements: JSON.stringify(['React', 'TypeScript', 'Node.js']),
        location: 'San Francisco, CA',
        salary_range: '120k-150k',
        posted_by: allRecruiters[0].id,
        type: 'Full-time',
        status: 'open',
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        title: 'Full Stack Developer',
        company: 'StartUp Inc',
        description: 'Join our fast-growing startup as a full stack developer',
        requirements: JSON.stringify(['JavaScript', 'Python', 'PostgreSQL']),
        location: 'Remote',
        salary_range: '100k-130k',
        posted_by: allRecruiters[1].id,
        type: 'Full-time',
        status: 'open',
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        title: 'Junior JavaScript Developer',
        company: 'Web Agency',
        description: 'Entry-level position for JavaScript enthusiasts',
        requirements: JSON.stringify(['JavaScript', 'HTML', 'CSS']),
        location: 'New York, NY',
        salary_range: '60k-80k',
        posted_by: allRecruiters[2].id,
        type: 'Full-time',
        status: 'open',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        title: 'Data Scientist',
        company: 'Analytics Pro',
        description: 'Analyze large datasets and build ML models',
        requirements: JSON.stringify(['Python', 'Machine Learning', 'SQL']),
        location: 'Boston, MA',
        salary_range: '130k-160k',
        posted_by: allRecruiters[0].id,
        type: 'Full-time',
        status: 'open',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        title: 'DevOps Engineer',
        company: 'Cloud Systems',
        description: 'Build and maintain cloud infrastructure',
        requirements: JSON.stringify(['Docker', 'Kubernetes', 'AWS']),
        location: 'Seattle, WA',
        salary_range: '110k-140k',
        posted_by: allRecruiters[1].id,
        type: 'Full-time',
        status: 'open',
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ]);
    console.log('Created 5 job postings');

    // Get all jobs
    const allJobs = await db('jobs').select('id');

    // Create applications
    const applications = await db('applications').insert([
      {
        job_id: allJobs[0].id,
        user_id: allStudents[0].id,
        status: 'pending',
        applied_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        job_id: allJobs[0].id,
        user_id: allStudents[1].id,
        status: 'shortlisted',
        applied_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        job_id: allJobs[1].id,
        user_id: allStudents[2].id,
        status: 'pending',
        applied_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        job_id: allJobs[1].id,
        user_id: allStudents[3].id,
        status: 'reviewed',
        applied_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        job_id: allJobs[2].id,
        user_id: allStudents[4].id,
        status: 'pending',
        applied_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        job_id: allJobs[3].id,
        user_id: allStudents[0].id,
        status: 'shortlisted',
        applied_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        job_id: allJobs[4].id,
        user_id: allStudents[1].id,
        status: 'pending',
        applied_at: new Date().toISOString(),
      },
    ]);
    console.log('Created 7 applications');

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\nDemo Credentials:');
    console.log('  Admin: admin@pathforge.com / admin123');
    console.log('  Student 1: student1@example.com / student1');
    console.log('  Student 2: student2@example.com / student2');
    console.log('  Recruiter 1: recruiter1@company.com / recruiter1');
    console.log('\nDashboard Stats:');
    console.log('  - 5 Students');
    console.log('  - 3 Recruiters');
    console.log('  - 1 Admin');
    console.log('  - 5 Active Jobs');
    console.log('  - 7 Applications');
    console.log('  - System Alerts: Activity spread across 7 days + 1 unverified user');

    process.exit(0);
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
}

// Run seed
seedDatabase();

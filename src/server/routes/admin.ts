import express from 'express';
import db from '../db.ts';

const router = express.Router();

// Middleware to check admin role
const isAdmin = async (req: any, res: any, next: any) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Simple token validation (in production, decode JWT)
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    const user = await db('users').where({ id: userId }).first();
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    (req as any).user = user;
    next();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Get all users (including OAuth users)
router.get('/users', isAdmin, async (req, res) => {
  try {
    const users = await db('users')
      .select('id', 'email', 'full_name', 'role', 'is_verified', 'is_oauth_user', 'created_at')
      .orderBy('created_at', 'desc');
    
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get user details by ID
router.get('/users/:id', isAdmin, async (req, res) => {
  try {
    const user = await db('users').where({ id: req.params.id }).first();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const profile = await db('profiles').where({ user_id: user.id }).first();
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        is_verified: user.is_verified,
        is_oauth_user: user.is_oauth_user,
        created_at: user.created_at
      },
      profile: profile || null
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update user (admin can change role, verification status, etc.)
router.put('/users/:id', isAdmin, async (req, res) => {
  const { role, is_verified, full_name } = req.body;
  
  try {
    const user = await db('users').where({ id: req.params.id }).first();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updates: any = {};
    if (role && ['student', 'recruiter', 'admin'].includes(role)) {
      updates.role = role;
    }
    if (typeof is_verified === 'boolean') {
      updates.is_verified = is_verified;
    }
    if (full_name) {
      updates.full_name = full_name;
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid updates provided' });
    }
    
    await db('users').where({ id: req.params.id }).update(updates);
    const updatedUser = await db('users').where({ id: req.params.id }).first();

    res.json({ 
      message: 'User updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        full_name: updatedUser.full_name,
        role: updatedUser.role,
        is_verified: updatedUser.is_verified,
        is_oauth_user: updatedUser.is_oauth_user
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user
router.delete('/users/:id', isAdmin, async (req, res) => {
  try {
    const user = await db('users').where({ id: req.params.id }).first();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deleting self
    if (user.id === (req as any).user.id) {
      return res.status(400).json({ error: 'Cannot delete your own admin account' });
    }

    // Delete user and related data
    await db.transaction(async (trx) => {
      await trx('profiles').where({ user_id: user.id }).delete();
      await trx('user_skills').where({ user_id: user.id }).delete();
      await trx('applications').where({ user_id: user.id }).delete();
      await trx('resume_data').where({ user_id: user.id }).delete();
      await trx('career_scores').where({ user_id: user.id }).delete();
      // Delete connections where user is requester or receiver
      await trx('connections').where({ requester_id: user.id }).orWhere({ receiver_id: user.id }).delete();
      // Delete messages where user is sender or receiver
      await trx('messages').where({ sender_id: user.id }).orWhere({ receiver_id: user.id }).delete();
      // Finally, delete the user
      await trx('users').where({ id: user.id }).delete();
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get stats about users
router.get('/stats/users', isAdmin, async (req, res) => {
  try {
    const stats = await db('users').select('role').then((users: any[]) => {
      const roles = { student: 0, recruiter: 0, admin: 0, total: users.length };
      users.forEach((user: any) => {
        if (roles[user.role as keyof typeof roles]) {
          roles[user.role as keyof typeof roles]++;
        }
      });
      return roles;
    });

    const oauthUsers = await db('users').where({ is_oauth_user: true }).count('id as count').first();
    const verifiedUsers = await db('users').where({ is_verified: true }).count('id as count').first();

    res.json({
      stats: {
        ...stats,
        oauthUsers: oauthUsers?.count || 0,
        verifiedUsers: verifiedUsers?.count || 0,
        unverifiedUsers: stats.total - ((verifiedUsers?.count as number) || 0)
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Search users
router.get('/search', isAdmin, async (req, res) => {
  const { email, name, role } = req.query;
  
  try {
    let query = db('users');

    if (email) {
      query = query.where('email', 'like', `%${email}%`);
    }
    if (name) {
      query = query.where('full_name', 'like', `%${name}%`);
    }
    if (role) {
      query = query.where('role', role);
    }

    const users = await query
      .select('id', 'email', 'full_name', 'role', 'is_verified', 'is_oauth_user', 'created_at')
      .limit(50);

    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Verify a user manually (admin override)
router.post('/users/:id/verify', isAdmin, async (req, res) => {
  try {
    const user = await db('users').where({ id: req.params.id }).first();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await db('users').where({ id: req.params.id }).update({
      is_verified: true
    });

    res.json({ message: 'User verified successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get OAuth users
router.get('/oauth-users', async (req, res) => {
  try {
    const oauthUsers = await db('users')
      .where({ is_oauth_user: true })
      .select('id', 'email', 'full_name', 'role', 'is_verified', 'created_at')
      .orderBy('created_at', 'desc');

    res.json(oauthUsers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create test/dummy users
router.post('/create-test-users', isAdmin, async (req, res) => {
  try {
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.default.hash('password123', 10);

    const testUsers = [
      { email: 'student1@test.com', full_name: 'John Smith', role: 'student', is_verified: 1 },
      { email: 'student2@test.com', full_name: 'Jane Doe', role: 'student', is_verified: 1 },
      { email: 'student3@test.com', full_name: 'Mike Johnson', role: 'student', is_verified: 1 },
      { email: 'student4@test.com', full_name: 'Sarah Williams', role: 'student', is_verified: 1 },
      { email: 'recruiter1@test.com', full_name: 'Alice Google', role: 'recruiter', is_verified: 1 },
      { email: 'recruiter2@test.com', full_name: 'Bob Meta', role: 'recruiter', is_verified: 1 },
      { email: 'recruiter3@test.com', full_name: 'Carol Amazon', role: 'recruiter', is_verified: 1 },
    ];

    const created: any[] = [];
    for (const user of testUsers) {
      try {
        const exists = await db('users').where({ email: user.email }).first();
        if (!exists) {
          const [id] = await db('users').insert({
            ...user,
            password: hashedPassword
          });
          
          // Create profile
          await db('profiles').insert({ user_id: id });
          created.push({ id, ...user });
        }
      } catch (e) {
        // User already exists, skip
      }
    }

    res.json({ 
      message: `Created ${created.length} test users`,
      created 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get user statistics
router.get('/user-stats', isAdmin, async (req, res) => {
  try {
    const totalUsers = await db('users').count('id as count').first();
    const byRole = await db('users')
      .select('role')
      .count('id as count')
      .groupBy('role');
    const verifiedUsers = await db('users').where({ is_verified: 1 }).count('id as count').first();
    const oauthUsers = await db('users').where({ is_oauth_user: 1 }).count('id as count').first();

    res.json({
      total: totalUsers?.count || 0,
      byRole: byRole.reduce((acc: any, row: any) => {
        acc[row.role] = row.count;
        return acc;
      }, {}),
      verified: verifiedUsers?.count || 0,
      oauth: oauthUsers?.count || 0,
      unverified: Number(totalUsers?.count || 0) - Number(verifiedUsers?.count || 0)
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update user role
router.put('/users/:id/role', isAdmin, async (req, res) => {
  const { role } = req.body;
  
  if (!['student', 'recruiter', 'admin', 'mentor'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  try {
    const user = await db('users').where({ id: req.params.id }).first();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent demoting self
    if (user.id === (req as any).user.id && role !== 'admin') {
      return res.status(400).json({ error: 'Cannot demote your own admin account' });
    }

    await db('users').where({ id: req.params.id }).update({ role });
    const updatedUser = await db('users').where({ id: req.params.id }).first();

    res.json({ 
      message: 'User role updated',
      user: updatedUser
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk verify users
router.post('/bulk-verify', isAdmin, async (req, res) => {
  const { userIds } = req.body;
  
  if (!Array.isArray(userIds)) {
    return res.status(400).json({ error: 'userIds must be an array' });
  }

  try {
    await db('users').whereIn('id', userIds).update({ is_verified: 1 });

    res.json({ 
      message: `Verified ${userIds.length} users`
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk delete users
router.post('/bulk-delete', isAdmin, async (req, res) => {
  const { userIds } = req.body;
  
  if (!Array.isArray(userIds)) {
    return res.status(400).json({ error: 'userIds must be an array' });
  }

  try {
    const adminId = (req as any).user.id;
    
    // Prevent deleting self
    if (userIds.includes(adminId)) {
      return res.status(400).json({ error: 'Cannot delete your own admin account' });
    }

    // Delete all related data
    await db.transaction(async (trx) => {
      await trx('profiles').whereIn('user_id', userIds).del();
      await trx('user_skills').whereIn('user_id', userIds).del();
      await trx('applications').whereIn('user_id', userIds).del();
      await trx('resume_data').whereIn('user_id', userIds).del();
      await trx('career_scores').whereIn('user_id', userIds).del();
      await trx('connections').where('requester_id', 'in', userIds).orWhere('receiver_id', 'in', userIds).del();
      await trx('messages').where('sender_id', 'in', userIds).orWhere('receiver_id', 'in', userIds).del();
      await trx('users').whereIn('id', userIds).del();
    });

    res.json({ 
      message: `Deleted ${userIds.length} users`
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Export all users as CSV
router.get('/export-users', isAdmin, async (req, res) => {
  try {
    const users = await db('users')
      .select('id', 'email', 'full_name', 'role', 'is_verified', 'is_oauth_user', 'created_at');

    // Convert to CSV
    const csv = [
      ['ID', 'Email', 'Full Name', 'Role', 'Verified', 'OAuth', 'Created At'],
      ...users.map((u: any) => [
        u.id,
        u.email,
        u.full_name,
        u.role,
        u.is_verified ? 'Yes' : 'No',
        u.is_oauth_user ? 'Yes' : 'No',
        new Date(u.created_at).toISOString()
      ])
    ]
      .map(row => row.map((cell: any) => `"${cell}"`).join(','))
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=users_export.csv');
    res.send(csv);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Add dummy career/data match data for students
router.get('/add-career-scores', isAdmin, async (req, res) => {
  try {
    const careerPaths = [
      'Software Engineer',
      'Data Scientist',
      'Product Manager',
      'UX Designer',
      'DevOps Engineer',
      'Machine Learning Engineer',
      'Business Analyst',
      'Solutions Architect',
      'Cloud Engineer',
      'Security Engineer'
    ];

    // Get all students
    const students = await db('users').where({ role: 'student' });
    
    const created: any[] = [];
    
    for (const student of students) {
      try {
        // Check if career score already exists
        const existing = await db('career_scores').where({ user_id: student.id }).first();
        
        if (!existing) {
          const careerPath = careerPaths[Math.floor(Math.random() * careerPaths.length)];
          
          const careerScore = {
            user_id: student.id,
            career_path: careerPath,
            confidence_score: Math.floor(Math.random() * 40) + 60, // 60-100
            market_fit_score: Math.floor(Math.random() * 40) + 60, // 60-100
            growth_potential: Math.floor(Math.random() * 40) + 60, // 60-100
            churn_risk: Math.floor(Math.random() * 40) + 10, // 10-50
            salary_min: Math.floor(Math.random() * 50000) + 60000, // 60k-110k
            salary_max: Math.floor(Math.random() * 50000) + 110000, // 110k-160k
            reasoning: `Strong potential in ${careerPath} based on profile analysis.`
          };
          
          await db('career_scores').insert(careerScore);
          created.push({
            full_name: student.full_name,
            ...careerScore
          });
        }
      } catch (e) {
        console.error(`Failed to create career score for user ${student.id}:`, e);
      }
    }

    res.json({
      message: `Created ${created.length} career scores`,
      created,
      total: created.length,
      success: true
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

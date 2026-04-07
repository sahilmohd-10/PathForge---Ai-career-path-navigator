import express from 'express';
import db from '../db.ts';

const router = express.Router();

// Middleware to verify JWT (simplified for brevity)
const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  // In real app, verify JWT here
  next();
};

router.get('/:userId', async (req, res) => {
  try {
    const profile = await db('profiles').where({ user_id: req.params.userId }).first();
    const user = await db('users').where({ id: req.params.userId }).first();
    const skills = await db('user_skills')
      .join('skills', 'user_skills.skill_id', 'skills.id')
      .where({ user_id: req.params.userId })
      .select('skills.name', 'user_skills.proficiency_level');
    
    res.json({ ...profile, fullName: user.full_name, email: user.email, skills });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:userId', async (req, res) => {
  const { bio, target_career, education, experience_years, avatar_url, location, website } = req.body;
  try {
    await db('profiles').where({ user_id: req.params.userId }).update({
      bio,
      target_career,
      education,
      experience_years,
      avatar_url,
      location,
      website
    });
    res.json({ message: 'Profile updated' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

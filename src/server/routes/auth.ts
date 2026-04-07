import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db.ts';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'pathforge_secret_key';

router.post('/register', async (req, res) => {
  const { email, password, fullName, role } = req.body;
  try {
    const existingUser = await db('users').where({ email }).first();
    if (existingUser) {
      return res.status(400).json({ error: 'Account already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user with verified status (email verification disabled)
    const [userId] = await db('users').insert({
      email,
      password: hashedPassword,
      full_name: fullName,
      role: role || 'student',
      is_verified: true,
      verification_code: null,
      verification_expires_at: null
    });
    
    await db('profiles').insert({ user_id: userId });
    
    console.log(`✓ User registered: ${email}`);
    
    // Generate JWT token for auto-login after registration
    const token = jwt.sign({ id: userId, role: role || 'student' }, JWT_SECRET, { expiresIn: '24h' });
    
    res.status(201).json({ 
      message: 'User registered successfully!',
      token,
      email: email,
      user: {
        id: userId,
        email: email,
        fullName: fullName,
        role: role || 'student'
      },
      requiresVerification: false
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});



router.post('/login', async (req, res) => {
  const { email, password, role } = req.body;
  try {
    const user = await db('users').where({ email }).first();
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Optional: Verify role if provided
    if (role && user.role !== role) {
      return res.status(403).json({ error: `This account is registered as a ${user.role}, not a ${role}.` });
    }
    
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, email: user.email, fullName: user.full_name, role: user.role } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/google', async (req, res) => {
  const { token, role } = req.body;
  try {
    if (!token) {
      return res.status(400).json({ error: 'Google token is required' });
    }

    // Parse the Google JWT token (without full verification for dev)
    let googleData: any = { sub: '', email: '', name: '' };
    
    try {
      // Decode JWT payload (third part after second dot)
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = parts[1];
        const padded = payload + '='.repeat((4 - payload.length % 4) % 4);
        const decoded = JSON.parse(Buffer.from(padded, 'base64').toString());
        googleData = {
          sub: decoded.sub || decoded.jti || '',
          email: decoded.email || '',
          name: decoded.name || 'Google User'
        };
      }
    } catch (decodeError) {
      console.warn('Could not decode token, using generated data');
      // Fallback for test tokens
      googleData = {
        sub: token.substring(0, 20).replace(/[^a-zA-Z0-9]/g, '0'),
        email: `google_${token.substring(0, 15).replace(/[^a-zA-Z0-9]/g, '0')}@pathforge.local`,
        name: 'Google User'
      };
    }

    const email = googleData.email || `google_${googleData.sub}@pathforge.local`;
    const fullName = googleData.name || 'Google User';

    let user = await db('users').where({ email }).first();

    // If user doesn't exist, create one
    if (!user) {
      // Generate a random password for Google OAuth users (they won't use it)
      const randomPassword = await bcrypt.hash(Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15), 10);
      
      const [userId] = await db('users').insert({
        email,
        password: randomPassword,
        full_name: fullName,
        role: role || 'student',
        is_verified: true, // OAuth users are automatically verified
        is_oauth_user: true // Mark as OAuth user
      });

      await db('profiles').insert({ user_id: userId });
      user = { id: userId, email, full_name: fullName, role: role || 'student' };
    }

    // Verify role match
    if (role && user.role !== role) {
      return res.status(403).json({ error: `This account is registered as a ${user.role}, not a ${role}.` });
    }

    const jwtToken = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token: jwtToken, user: { id: user.id, email: user.email, fullName: user.full_name, role: user.role } });
  } catch (error: any) {
    console.error('Google auth error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

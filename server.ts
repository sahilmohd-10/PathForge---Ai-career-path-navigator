// MUST load dotenv FIRST, before any other imports
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { initDb } from './src/server/db.ts';
import authRoutes from './src/server/routes/auth.ts';
import profileRoutes from './src/server/routes/profile.ts';
import jobRoutes from './src/server/routes/jobs.ts';
import aiRoutes from './src/server/routes/ai.ts';
import chatRoutes from './src/server/routes/chat.ts';
import dataRoutes from './src/server/routes/data.ts';
import statsRoutes from './src/server/routes/stats.ts';
import adminRoutes from './src/server/routes/admin.ts';
import geminiRoutes from './src/server/routes/gemini.ts';

async function startServer() {
  try {
    const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
    const isProduction = process.env.NODE_ENV === 'production';

    console.log('Initializing database...');
    await initDb();
    console.log('Database initialized.');
    
    const app = express();
    const server = http.createServer(app);
    const io = new Server(server, {
      cors: { origin: "*" }
    });

    app.use(cors());
    app.use(express.json({ limit: '50mb' })); // Increased limit for large imports
    app.use(express.urlencoded({ extended: true, limit: '50mb' }));

    // Socket.io logic
    io.on('connection', (socket) => {
      console.log('User connected:', socket.id);
      
      socket.on('join_room', (userId) => {
        socket.join(`user_${userId}`);
      });

      socket.on('send_message', (data) => {
        io.to(`user_${data.receiverId}`).emit('receive_message', data);
      });

      socket.on('disconnect', () => {
        console.log('User disconnected');
      });
    });

    // API Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/profile', profileRoutes);
    app.use('/api/jobs', jobRoutes);
    app.use('/api/ai', aiRoutes);
    app.use('/api/gemini', geminiRoutes);
    app.use('/api/chat', chatRoutes);
    app.use('/api/data', dataRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api', statsRoutes);

    // Vite Integration
    if (!isProduction) {
      console.log('Starting Vite in middleware mode...');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    server.listen(PORT, '127.0.0.1', () => {
      console.log(`PathForge running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('FAILED TO START SERVER:', error);
    process.exit(1);
  }
}

startServer();

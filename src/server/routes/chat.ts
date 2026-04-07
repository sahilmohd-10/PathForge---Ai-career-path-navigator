import express from 'express';
import db from '../db.ts';

const router = express.Router();

router.get('/notifications/:userId', async (req, res) => {
  const userId = Number(req.params.userId);
  if (Number.isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  try {
    const notifications = await db('messages')
      .where('receiver_id', userId)
      .orderBy('created_at', 'desc');
    res.json(notifications);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/history/:userId/:otherId', async (req, res) => {
  const { userId, otherId } = req.params;
  try {
    const messages = await db('messages')
      .where(function() {
        this.where({ sender_id: userId, receiver_id: otherId })
          .orWhere({ sender_id: otherId, receiver_id: userId });
      })
      .orderBy('created_at', 'asc');
    res.json(messages);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/send', async (req, res) => {
  const { senderId, receiverId, content } = req.body;
  try {
    await db('messages').insert({ sender_id: senderId, receiver_id: receiverId, content, is_read: false });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/notifications/:userId/read', async (req, res) => {
  const userId = Number(req.params.userId);
  if (Number.isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  try {
    const updated = await db('messages')
      .where('receiver_id', userId)
      .andWhere('is_read', false)
      .update({ is_read: true });

    res.json({ success: true, updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

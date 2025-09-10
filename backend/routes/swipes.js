const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Match = require('../models/Match');

const router = express.Router();

// Пользователь свайпнул вправо (лайк)
router.post('/like/:targetUserId', auth, async (req, res) => {
  const { targetUserId } = req.params;
  const currentUserId = req.user.userId;

  try {
    // Проверяем, не лайкал ли targetUser текущего пользователя
    const existingMatch = await Match.findOne({
      $or: [
        { user1: currentUserId, user2: targetUserId },
        { user1: targetUserId, user2: currentUserId }
      ]
    });

    if (existingMatch) {
      return res.status(400).json({ msg: 'Уже есть Match!' });
    }

    // Проверяем, лайкал ли targetUser текущего пользователя
    const reverseLike = await Match.findOne({
      $or: [
        { user1: targetUserId, user2: currentUserId }
      ]
    });

    if (reverseLike) {
      // Взаимный лайк → создаем Match
      const match = new Match({ user1: currentUserId, user2: targetUserId });
      await match.save();
      return res.json({ match: true, msg: '🎉 Match!' });
    } else {
      // Просто сохраняем лайк (можно хранить в отдельной коллекции Swipe, но для простоты — пропустим)
      return res.json({ match: false, msg: 'Лайк отправлен' });
    }

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Ошибка сервера');
  }
});

module.exports = router;
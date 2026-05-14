'use strict';

const { Router } = require('express');
const { authenticate } = require('../middleware/authenticate');
const { getMe, updateMe, deleteMe } = require('../controllers/user.controller');

const router = Router();

router.get('/me', authenticate, getMe);
router.patch('/me', authenticate, updateMe);
router.delete('/me', authenticate, deleteMe);

module.exports = router;

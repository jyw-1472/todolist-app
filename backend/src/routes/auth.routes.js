'use strict';

const { Router } = require('express');
const { authenticate } = require('../middleware/authenticate');
const { signup, login, logout, refresh } = require('../controllers/auth.controller');

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', authenticate, logout);
router.post('/refresh', refresh);

module.exports = router;

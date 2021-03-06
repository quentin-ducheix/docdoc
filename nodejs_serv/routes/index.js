const express = require('express');
const router = express.Router();
const { ensureAuthenticated, forwardAuthenticated } = require('../config/auth');

// Welcome Page
router.get('/', forwardAuthenticated, (req, res) => res.render('welcome'));

// Dashboard
router.get('/dashboard', ensureAuthenticated, (req, res) =>
  res.render('dashboard', {
    user: req.user
  })
);

// Dashboard-> prost
router.get('/prost', ensureAuthenticated, (req, res) =>
  res.render('prost', {
    user: req.user
  })
);

// Dashboard-> breast
router.get('/breast', ensureAuthenticated, (req, res) =>
  res.render('breast', {
    user: req.user
  })
);

// Dashboard-> skin
router.get('/skin', ensureAuthenticated, (req, res) =>
  res.render('skin', {
    user: req.user
  })
);

module.exports = router;

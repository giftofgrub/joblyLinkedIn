const express = require('express');
const ExpressError = require('../helpers/ExpressError');
const User = require('../models/user');
const { validate } = require('jsonschema');
const userNewSchema = require('../schemas/userNew.json');
const userUpdateSchema = require('../schemas/userUpdate.json');
const createToken = require('../helpers/createToken');
const { ensureSameUser } = require('../middleware/middleware');

const router = new express.Router();

// GET users => {users: [user, user,...]}

router.get('/', async function(req, res, next) {
    try {
        const users = await User.findAll(req.query);
        return res.json({ users });
    } catch (err) {
        return next(err);
    }
});

// GET user => {user: userData}

router.get('/:username', async function(req, res, next) {
    try {
        const user = await User.findOne(req.params.username);
        return res.json({ user });
    } catch (err) {
        return next(err);
    }
});

// POST user => {user: user}

router.post('/', async function(req, res, next) {
    try {
        const validation = validate(req.body, userNewSchema);
        if (!validation.valid) {
            throw new ExpressError(validation.errors.map(e=> e.stack), 400)
        }
        const newUser = await User.register(req.body);
        const token = createToken(newUser);
        return res.status(201).json({ token });
    } catch (err) {
        return next(err);
    }
});

// PATCH user => {user: userData}

router.patch('/:username', ensureSameUser, async function(req, res, next) {
    try {
        if ('username' in req.body || 'is_admin' in req.body) {
            throw new ExpressError(
              'You are not allowed to change username or is_admin properties.',
              400);
        }
        const validation = validate(req.body, userUpdateSchema);
        if (!validation.valid) {
            throw new ExpressError(validation.errors.map(e=> e.stack), 400)
        }

        if(req.body.constructor === Object && Object.keys(req.body).length === 0) {
            throw new ExpressError(`You did not specify what to update`,400)
          }
        
        const user = await User.update(req.params.username, req.body);
        return res.json({user})
    } catch (err) {
        return next(err);
    }
});

// DELETE user => {message: "User Deleted"}
router.delete('/:username', ensureSameUser, async function(req, res, next) {
    try {
        const user = await User.remove(req.params.username);
        return res.json({ message: "User Deleted" });
    } catch (err) {
        return next(err);
    }
});


module.exports = router;
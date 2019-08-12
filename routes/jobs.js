const express = require('express');
const ExpressError = require('../helpers/ExpressError');
const Job = require('../models/job');
const { validate } = require('jsonschema');
const jobNewSchema = require('../schemas/jobNew.json');
const jobUpdateSchema = require('../schemas/jobUpdate.json');
const { authRequired, ensureAdmin } = require('../middleware/middleware');

const router = new express.Router();

// GET jobs => {jobs: [job, job...]}

router.get('/', authRequired, async function(req, res, next) {
    try {
        const jobs = await Job.findAll(req.query);
        return res.json({ jobs });
    } catch (err) {
        return next(err);
    }
});

// GET job => {job: jobData}

router.get('/:id', authRequired, async function(req, res, next) {
    try {
        const job = await Job.findOne(req.params.id);
        return res.json({ job });
    } catch (err) {
        return next(err);
    }
});

// POST job => {job: jobData}

router.post('/', ensureAdmin, async function(req, res, next) {
    try {
        const validation = validate(req.body, jobNewSchema);
        if (!validation.valid) {
            throw new ExpressError(validation.errors.map(e=> e.stack), 400)
        }

        const job = await Job.create(req.body);
        return res.status(201).json({ job });
    } catch (err) {
        return next(err);
    }
});

// PATCH company => {company: companyData}

router.patch('/:id', ensureAdmin, async function(req, res, next) {
    try {
        const validation = validate(req.body, jobUpdateSchema);
        if (!validation.valid) {
            throw new ExpressError(validation.errors.map(e=> e.stack), 400)
        }
        
        if ('id' in req.body) {
            throw new ExpressError("Updating the id is not allowed",400)
        }

        if(req.body.constructor === Object && Object.keys(req.body).length === 0) {
            throw new ExpressError(`You did not specify what to update`,400)
          }
        
        const job = await Job.update(req.params.id, req.body);
        return res.json({job})
    } catch (err) {
        return next(err);
    }
});

// DELETE job => {message: "Job Deleted"}
router.delete('/:id', ensureAdmin, async function(req, res, next) {
    try {
        const job = await Job.remove(req.params.id);
        return res.json({ message: "Job Deleted" });
    } catch (err) {
        return next(err);
    }
});

module.exports = router;
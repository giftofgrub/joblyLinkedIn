const express = require('express');
const ExpressError = require('../helpers/ExpressError');
const Company = require('../models/company');
const Job = require('../models/job');
const { validate } = require('jsonschema');
const companyNewSchema = require('../schemas/companyNew.json');
const companyUpdateSchema = require('../schemas/companyUpdate.json');
const { authRequired, ensureAdmin } = require('../middleware/middleware');

const router = new express.Router();

// GET companies => {companies: [company, company,...]}

router.get('/', authRequired, async function(req, res, next) {
    try {
        const companies = await Company.findAll(req.query);
        return res.json({ companies });
    } catch (err) {
        return next(err);
    }
});

// GET company => {company: companyData}

router.get('/:handle', authRequired, async function(req, res, next) {
    try {
        const company = await Company.findOne(req.params.handle);
        const companyJobs = await Job.findCompany(req.params.handle);
        return res.json({ company, jobs: companyJobs });
    } catch (err) {
        return next(err);
    }
});

// POST company => {company: companyData}

router.post('/', ensureAdmin, async function(req, res, next) {
    try {
        const validation = validate(req.body, companyNewSchema);
        if (!validation.valid) {
            throw new ExpressError(validation.errors.map(e=> e.stack), 400)
        }

        const company = await Company.create(req.body);
        return res.status(201).json({ company });
    } catch (err) {
        return next(err);
    }
});

// PATCH company => {company: companyData}

router.patch('/:handle', ensureAdmin, async function(req, res, next) {
    try {
        const validation = validate(req.body, companyUpdateSchema);
        if (!validation.valid) {
            throw new ExpressError(validation.errors.map(e=> e.stack), 400)
        }

        if ('handle' in req.body) {
            throw new ExpressError("Updating the handle is not allowed",400)
        }

        if(req.body.constructor === Object && Object.keys(req.body).length === 0) {
            throw new ExpressError(`You did not specify what to update`,400)
          }
        
        const company = await Company.update(req.params.handle, req.body);
        return res.json({company})
    } catch (err) {
        return next(err);
    }
});

// DELETE company => {message: "Company Deleted"}
router.delete('/:handle', ensureAdmin, async function(req, res, next) {
    try {
        const company = await Company.remove(req.params.handle);
        return res.json({ message: "Company Deleted" });
    } catch (err) {
        return next(err);
    }
});

module.exports = router;
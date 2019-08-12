const db = require("../db");
const ExpressError = require("../helpers/ExpressError");
const sqlForPartialUpdate = require("../helpers/partialUpdate");

class Job {
    static async findAll(data) {
        let baseQuery = 'SELECT * FROM jobs';
        let whereStatements = [];
        let queryValues = [];

        if (data.min_salary) {
            queryValues.push(+data.min_salary);
            whereStatements.push(`salary >= $${queryValues.length}`);
        }

        if (data.min_equity) {
            queryValues.push(+data.min_equity);
            whereStatements.push(`equity >= $${queryValues.length}`);
        }

        if (data.search) {
            queryValues.push(`%${data.search}%`);
            whereStatements.push(`(title ILIKE $${queryValues.length} OR company_handle ILIKE $${queryValues.length})`);
        }

        if (whereStatements.length > 0) {
            baseQuery += ' WHERE '
        }

        let finalQuery = baseQuery + whereStatements.join(" AND ")

        const jobsRes = await db.query(finalQuery, queryValues);
        return jobsRes.rows;
    }

    static async findCompany(handle) {
        let query = 'SELECT * FROM jobs WHERE company_handle = $1';
        const jobsRes = await db.query(query, [handle]);
        return jobsRes.rows
    }

    static async findOne(id) {
        const result = await db.query(
            `SELECT * FROM jobs 
            WHERE id = $1`,
            [id]);
        const job = result.rows[0];

        if (!job) {
            throw new ExpressError('Cannot find job', 404);
        }

        return job
    }

    static async create(data) {
        const checkCompany = await db.query(
            `SELECT handle FROM companies 
            WHERE handle = $1`,
            [data.company_handle]
        );
        
        if (!checkCompany.rows[0]) {
            throw new ExpressError(`Cannot create job. Company does not exist.`, 400);
        }

        const result = await db.query(
            `INSERT INTO jobs 
                (title, salary, equity, company_handle)
                VALUES ($1, $2, $3, $4) 
                RETURNING *`,
            [
              data.title,
              data.salary,
              data.equity,
              data.company_handle
            ]
        );
      
        return result.rows[0];
    }

    static async update(id, data) {
        let {query, values} = sqlForPartialUpdate("jobs", data, "id", id);

        const result = await db.query(query, values);
        const job = result.rows[0];

        if (!job) {
            throw new ExpressError('Job does not exist', 404);
        }

        return job;
    }

    static async remove(id) {
        const result = await db.query(
            `DELETE FROM jobs 
            WHERE id = $1
            RETURNING id`,
            [id]);

        if (result.rows.length === 0) {
            throw new ExpressError(`That job posting does not exist`, 404);
        }
    }
}

module.exports = Job;
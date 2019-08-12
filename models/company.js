const db = require("../db");
const ExpressError = require("../helpers/ExpressError");
const sqlForPartialUpdate = require("../helpers/partialUpdate");

class Company { 
    static async findAll(data){
        let baseQuery = 'SELECT handle, name FROM companies';
        let whereStatements = [];
        let queryValues = [];
        
        if (+data.min_employees >= +data.max_employees) {
            throw new ExpressError("Minimum Employees should be less than Maximum Employees", 400)
        }

        if (data.min_employees) {
            queryValues.push(+data.min_employees);
            whereStatements.push(`num_employees >= $${queryValues.length}`);
        }

        if (data.max_employees) {
            queryValues.push(+data.max_employees);
            whereStatements.push(`num_employees <= $${queryValues.length}`);
        }

        if (data.search) {
            queryValues.push(`%${data.search}%`);
            whereStatements.push(`name ILIKE $${queryValues.length}`);
        }

        if (whereStatements.length > 0) {
            baseQuery += ' WHERE '
        }

        let finalQuery = baseQuery + whereStatements.join(" AND ")

        const companiesRes = await db.query(finalQuery, queryValues);
        return companiesRes.rows;
    }

    static async create(data) {
        const checkCompany = await db.query(
            `SELECT handle FROM companies 
            WHERE handle = $1`,
            [data.handle]);
        
        if (checkCompany.rows[0]) {
            throw new ExpressError('Cannot create company. Company already exists', 400);
        }

        const result = await db.query(
            `INSERT INTO companies 
                (handle, name, num_employees, description, logo_url)
                VALUES ($1, $2, $3, $4, $5) 
                RETURNING handle, name, num_employees, description, logo_url`,
            [
              data.handle,
              data.name,
              data.num_employees,
              data.description,
              data.logo_url
            ]
          );
      
        return result.rows[0];
    }

    static async findOne(handle) {
        const result = await db.query(
            `SELECT * FROM companies 
            WHERE handle = $1`,
            [handle]);
        const company = result.rows[0];

        if (!company) {
            throw new ExpressError('Cannot find company', 404);
        }

        return company
    }

    static async update(handle, data) {
        let {query, values} = sqlForPartialUpdate("companies", data, "handle", handle);

        const result = await db.query(query, values);
        const company = result.rows[0];

        if (!company) {
            throw new ExpressError('Company does not exist', 404);
        }

        return company;
    }

    static async remove(handle) {
        const result = await db.query(
            `DELETE FROM companies 
            WHERE handle = $1
            RETURNING handle`,
            [handle]);

        if (result.rows.length === 0) {
            throw new ExpressError(`There is no company ${handle}`, 404);
        }
    }
}

module.exports = Company;
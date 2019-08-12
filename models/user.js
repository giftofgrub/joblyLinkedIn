const db = require("../db");
const bcrypt = require('bcrypt');
const ExpressError = require("../helpers/ExpressError");
const sqlForPartialUpdate = require("../helpers/partialUpdate");

const BCRYPT_FACTOR = 10;

class User {
    
    static async register(data) {
        const checkUser = await db.query(
            `SELECT username FROM users 
            WHERE username = $1`,
            [data.username]);
        
        if (checkUser.rows[0]) {
            throw new ExpressError('Cannot create user. User already exists', 400);
        }

        const hashedPassword = await bcrypt.hash(data.password, BCRYPT_FACTOR);

        const result = await db.query(
            
            
            `INSERT INTO users 
                (username, password, first_name, last_name, email, photo_url)
                VALUES ($1, $2, $3, $4, $5, $6) 
                RETURNING username, first_name, last_name, email`,
            [
              data.username,
              hashedPassword,
              data.first_name,
              data.last_name,
              data.email,
              data.photo_url
            ]
          );
      
        return result.rows[0];
    }

    static async authenticate(data) {
        const query = `SELECT username,
                password,
                first_name,
                last_name,
                email,
                photo_url,
                is_admin 
                FROM users WHERE username = $1`;
        const result = await db.query( query, [data.username] );
        const user = result.rows[0];

        if (user) {
            const authenticated = await bcrypt.compare(data.password, user.password);
            if (authenticated) {
                return user;
            }
        }

        throw new ExpressError('Invalid Password', 401)
    }

    static async findAll(data) {
        let query = 'SELECT username, first_name, last_name, email, photo_url FROM users';
        let userRes = await db.query(query);
        return userRes.rows;
    }

    static async findOne(username) {
        const result = await db.query(
            `SELECT username, first_name, last_name, email, photo_url FROM users 
            WHERE username = $1`,
            [username]);
        const user = result.rows[0];

        if (!user) {
            throw new ExpressError('Cannot find user', 404);
        }

        return user
    }

    static async update(username, data) {
        let {query, values} = sqlForPartialUpdate("users", data, "username", username);

        const result = await db.query(query, values);
        const user = result.rows[0];

        if (!user) {
            throw new ExpressError('User does not exist', 404);
        }

        delete user.password;
        delete user.is_admin;

        return user;
    }

    static async remove(username) {
        const result = await db.query(
            `DELETE FROM users
            WHERE username = $1
            RETURNING username`,
            [username]);

        if (result.rows.length === 0) {
            throw new ExpressError(`There is no user ${username}`, 404);
        }
    }
}

module.exports = User;
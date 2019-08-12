/* middleware to handle auth cases in different routes */

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const ExpressError = require("../helpers/ExpressError");

function authRequired (req, res, next) {
    try {
        const tokenProvided = req.body._token || req.query._token;
        let token = jwt.verify(tokenProvided, SECRET_KEY);
        res.locals.username = token.username;
        return next()
    } catch (e) {
        throw new ExpressError("You need to authenticate", 401)
    }
}

function ensureSameUser (req, res, next) {
    try {
        const tokenProvided = req.body._token;
        let token = jwt.verify(tokenProvided, SECRET_KEY);
        res.locals.username = token.username;

        if (token.username === req.params.username) {
            return next()
        } else {
            // throw error to pass onto 'catch' statement
            throw new Error()
        }
        
    } catch (e) {
        throw next( new ExpressError(`You are not authorized to do that`, 401) )
    }
}

function ensureAdmin (req, res, next) {
    try {
        const tokenProvided = req.body._token;
        let token = jwt.verify(tokenProvided, SECRET_KEY);
        res.locals.username = token.username;

        if (token.is_admin) {
            return next()
        } else {
            // throw error to pass onto 'catch' statement
            throw new Error()
        }
    } catch(e) {
        throw next( new ExpressError('You need to be an admin', 401) )
    }
}


module.exports = {
    authRequired,
    ensureSameUser,
    ensureAdmin
}
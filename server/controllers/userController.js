const ApiError = require('../error/ApiError');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {User, Cart} = require('../models/models');

const generateJwt = (id, email, role) => {
    return jwt.sign(
        {id, email, role},
        process.env.SECRET_KEY,
        {expiresIn: '24h'}
    );
};

class UserController {
    async signin(req, res, next) {
        const {email, password, role} = req.body;

        if(!email || !password) {
            return next(ApiError.badRequest('Email or Password not defined'));
        }

        const candidate = await User.findOne({where: {email}});

        if (candidate) {
            return next(ApiError.badRequest('The user exists'));
        }

        const hashPassword = await bcrypt.hash(password, 5);
        const user = await User.create({email, role, password: hashPassword});
        const cart = await Cart.create({userId: user.id});
        const token = generateJwt(user.id, user.email, user.role);

        return res.json({token});
    }

    async login(req, res, next) {
        const {email, password} = req.body;

        const user = await User.findOne({where: {email}});

        if (!user) {
            return next(ApiError.badRequest('User does bot exist'));
        }

        let comparePassword = bcrypt.compareSync(password, user.password);

        if (!comparePassword) {
            return next(ApiError.badRequest('Wrong password'));
        }

        const token = generateJwt(user.id, user.email, user.role);

        return  res.json({token});
    }

    async checkAuth(req, res) {
        const {id, email, role} = req.user;

        const token = generateJwt(id, email, role);

        return res.json({token});
    }
}

module.exports = new UserController();
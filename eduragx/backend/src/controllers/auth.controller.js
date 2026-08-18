const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma');

const generateToken = (userId) => {

  if (!process.env.JWT_SECRET) {
    throw new Error(
      'JWT_SECRET is not configured'
    );
  }

  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    {
      expiresIn:
        process.env.JWT_EXPIRES_IN || '7d',
    }
  );
};


const login = async (req, res) => {

  try {

    const email =
      typeof req.body.email === 'string'
        ? req.body.email
            .trim()
            .toLowerCase()
        : '';

    const password =
      typeof req.body.password === 'string'
        ? req.body.password
        : '';


    if (!email || !password) {

      return res.status(400).json({
        error:
          'Email and password are required',
      });

    }


    const user =
      await prisma.user.findUnique({
        where: { email },
      });


    if (!user) {

      return res.status(401).json({
        error: 'Invalid credentials',
      });

    }


    const isPasswordValid =
      await bcrypt.compare(
        password,
        user.password
      );


    if (!isPasswordValid) {

      return res.status(401).json({
        error: 'Invalid credentials',
      });

    }


    const token =
      generateToken(user.id);


    return res.json({

      token,

      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },

    });

  } catch (err) {

    console.error(
      'Login error:',
      err
    );

    return res.status(500).json({
      error: 'Login failed',
    });

  }
};


const getMe = async (req, res) => {

  return res.json({
    user: req.user,
  });

};


module.exports = {
  login,
  getMe,
};
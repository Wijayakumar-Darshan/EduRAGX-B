const jwt = require('jsonwebtoken');
const prisma = require('../prisma');


const authenticate = async (
  req,
  res,
  next
) => {

  try {

    if (!process.env.JWT_SECRET) {

      console.error(
        '❌ JWT_SECRET is not configured'
      );

      return res.status(500).json({
        error:
          'Authentication is not configured',
      });

    }


    const authHeader =
      req.headers.authorization;


    if (
      typeof authHeader !== 'string' ||
      !authHeader.startsWith('Bearer ')
    ) {

      return res.status(401).json({
        error: 'No token provided',
      });

    }


    const token =
      authHeader
        .slice(7)
        .trim();


    if (!token) {

      return res.status(401).json({
        error: 'No token provided',
      });

    }


    const decoded =
      jwt.verify(
        token,
        process.env.JWT_SECRET
      );


    if (!decoded?.userId) {

      return res.status(401).json({
        error:
          'Invalid token payload',
      });

    }


    const user =
      await prisma.user.findUnique({

        where: {
          id: decoded.userId,
        },

        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },

      });


    if (!user) {

      return res.status(401).json({
        error: 'User not found',
      });

    }


    req.user = user;

    next();

  } catch (err) {

    console.error(
      'Authentication error:',
      err.message
    );

    return res.status(401).json({
      error:
        'Invalid or expired token',
    });

  }

};


const authorize = (...roles) => {

  return (req, res, next) => {

    if (
      !req.user ||
      !roles.includes(req.user.role)
    ) {

      return res.status(403).json({
        error: 'Access denied',
      });

    }

    next();

  };

};


module.exports = {
  authenticate,
  authorize,
};
const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' } // 7 days
  );
};

// Generate refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '30d' } // 30 days
  );
};

// Verify JWT token middleware
const verifyToken = (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user info to request
    req.user = { id: decoded.userId };
    next();
    
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    console.error('Token verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during token verification'
    });
  }
};

// Optional token verification (doesn't fail if no token)
const optionalToken = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { id: decoded.userId };
    }
    
    next();
  } catch (error) {
    // Continue without user info if token is invalid
    next();
  }
};

// Verify refresh token
const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    return { valid: true, userId: decoded.userId };
  } catch (error) {
    return { valid: false, error: error.message };
  }
};

// Generate both access and refresh tokens
const generateTokenPair = (userId) => {
  return {
    accessToken: generateToken(userId),
    refreshToken: generateRefreshToken(userId)
  };
};

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken,
  optionalToken,
  verifyRefreshToken,
  generateTokenPair
};

const nodemailer = require('nodemailer');

// Create transporter (you'll need to configure this with your email service)
const createTransporter = () => {
  // For development/testing, you can use Gmail or other services
  // For production, use services like SendGrid, AWS SES, etc.
  
  if (process.env.NODE_ENV === 'production') {
    // Production email service (SendGrid, AWS SES, etc.)
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  } else {
    // Development - use Gmail or create a test account
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASSWORD || 'your-app-password'
      }
    });
  }
};

// Send verification email
const sendVerificationEmail = async (email, token) => {
  try {
    const transporter = createTransporter();
    
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@numbermindnumbers.com',
      to: email,
      subject: 'Verify Your Email - NumberMind',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎯 NumberMind</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Verify Your Email Address</p>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-bottom: 20px;">Welcome to NumberMind!</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
              Thank you for registering! To complete your account setup and start playing, 
              please verify your email address by clicking the button below.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 25px; 
                        display: inline-block; 
                        font-weight: bold;
                        font-size: 16px;">
                ✅ Verify Email Address
              </a>
            </div>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              If the button doesn't work, you can copy and paste this link into your browser:
            </p>
            
            <p style="color: #667eea; word-break: break-all; margin-bottom: 25px;">
              ${verificationUrl}
            </p>
            
            <div style="background: #e9ecef; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <h3 style="color: #495057; margin-top: 0;">🎮 What's Next?</h3>
              <ul style="color: #666; line-height: 1.6; margin: 0; padding-left: 20px;">
                <li>Verify your email to activate your account</li>
                <li>Complete your profile and customize settings</li>
                <li>Start playing and climb the leaderboards!</li>
                <li>Invite friends and challenge them</li>
              </ul>
            </div>
            
            <p style="color: #999; font-size: 14px; text-align: center; margin-top: 30px;">
              This link will expire in 24 hours. If you didn't create this account, 
              you can safely ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
            <p>© 2024 NumberMind. All rights reserved.</p>
            <p>If you have any questions, contact us at support@numbermindnumbers.com</p>
          </div>
        </div>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Verification email sent:', info.messageId);
    return true;
    
  } catch (error) {
    console.error('❌ Failed to send verification email:', error);
    throw error;
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, token) => {
  try {
    const transporter = createTransporter();
    
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@numbermindnumbers.com',
      to: email,
      subject: 'Reset Your Password - NumberMind',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🔐 NumberMind</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Password Reset Request</p>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-bottom: 20px;">Reset Your Password</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
              We received a request to reset your password. If you didn't make this request, 
              you can safely ignore this email. Otherwise, click the button below to reset your password.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 25px; 
                        display: inline-block; 
                        font-weight: bold;
                        font-size: 16px;">
                🔑 Reset Password
              </a>
            </div>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              If the button doesn't work, you can copy and paste this link into your browser:
            </p>
            
            <p style="color: #ff6b6b; word-break: break-all; margin-bottom: 25px;">
              ${resetUrl}
            </p>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <h3 style="color: #856404; margin-top: 0;">⚠️ Important Security Notice</h3>
              <ul style="color: #856404; line-height: 1.6; margin: 0; padding-left: 20px;">
                <li>This link will expire in 1 hour</li>
                <li>Never share this link with anyone</li>
                <li>Choose a strong, unique password</li>
                <li>Enable two-factor authentication if available</li>
              </ul>
            </div>
            
            <p style="color: #999; font-size: 14px; text-align: center; margin-top: 30px;">
              If you didn't request this password reset, please contact our support team immediately.
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
            <p>© 2024 NumberMind. All rights reserved.</p>
            <p>For security support: security@numbermindnumbers.com</p>
          </div>
        </div>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent:', info.messageId);
    return true;
    
  } catch (error) {
    console.error('❌ Failed to send password reset email:', error);
    throw error;
  }
};

// Send game invitation email
const sendGameInvitationEmail = async (email, inviterUsername, gameId) => {
  try {
    const transporter = createTransporter();
    
    const gameUrl = `${process.env.CLIENT_URL}/game/${gameId}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@numbermindnumbers.com',
      to: email,
      subject: `${inviterUsername} invited you to play NumberMind!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #00b894 0%, #00a085 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎮 NumberMind</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Game Invitation</p>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-bottom: 20px;">You've been invited to play!</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
              <strong>${inviterUsername}</strong> has invited you to play a game of NumberMind! 
              Are you ready to test your logic and deduction skills?
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${gameUrl}" 
                 style="background: linear-gradient(135deg, #00b894 0%, #00a085 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 25px; 
                        display: inline-block; 
                        font-weight: bold;
                        font-size: 16px;">
                🎯 Accept Challenge
              </a>
            </div>
            
            <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <h3 style="color: #2d5a2d; margin-top: 0;">🎲 How to Play</h3>
              <ul style="color: #2d5a2d; line-height: 1.6; margin: 0; padding-left: 20px;">
                <li>Guess your opponent's 5-digit secret number</li>
                <li>Get feedback on correct digits and positions</li>
                <li>Use logic to deduce the secret number</li>
                <li>First to guess correctly wins!</li>
              </ul>
            </div>
            
            <p style="color: #999; font-size: 14px; text-align: center; margin-top: 30px;">
              Click the button above to join the game and start playing!
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
            <p>© 2024 NumberMind. All rights reserved.</p>
            <p>Game on! 🚀</p>
          </div>
        </div>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Game invitation email sent:', info.messageId);
    return true;
    
  } catch (error) {
    console.error('❌ Failed to send game invitation email:', error);
    throw error;
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendGameInvitationEmail
};

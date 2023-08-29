const express = require('express');
const router = express.Router();


app.post('/delivery/login', async (req, res) => {
    const { email, password } = req.body;
  
    // Check if email and password are provided
    if (!email || !password) {
      return res.status(400).json({status:false, status_code: 202, message : 'Email and password are required'})
    }
  
    // Find the user with the provided email
    try {
      const user = await User.findOne({ email });
  
      if (!user) {
        return res.status(400).json({ status:false, status_code: 202, message : 'User not Found'})
      }
  
      // Verify the provided password with the stored password hash
      const isPasswordMatch = await user.comparePassword(password);
  
  
      if (!isPasswordMatch) {
        return res.status(401).json({ status: false, status_code:401,  message: 'Invalid password' });
      }
  
      // Password matches, login successful
      res.status(200).json({ status: true, status_code: 200, message: 'Login successful', data: user });
    } catch (error) {
      console.error('Error during login:', error);
      res.status(500).json({ status: false, status_code: 500, message: 'Internal server error' });
    }
  });  
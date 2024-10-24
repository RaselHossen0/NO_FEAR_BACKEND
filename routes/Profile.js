const express = require('express');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/authmiddleware'); // Adjust the path as necessary
const User = require('../models/User'); // Adjust the path as necessary
const multer = require('multer');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { sendOTP } = require('../config/emailService'); // Adjust the path as necessary

const router = express.Router();




// Endpoint to get all users
router.get('/users', authMiddleware, async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password'] } // Exclude the password field
        });
        res.json(users);
    } catch (error) {
        res.status(500).send('An error occurred while fetching users');
    }
});

// Endpoint to update user profile
const upload = multer({ dest: 'uploads/' }); // Configure multer to save files to the 'uploads' directory


router.put('/update/:userId', authMiddleware, upload.single('image'), async (req, res) => {
    const userId = req.params.userId;
    const updatedInfo = req.body;

    try {
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).send('User not found');
        }

        // Check if an image is being updated
        if (req.file) {
            updatedInfo.image = req.file.path; // Multer saves the file and adds the path to req.file
        }

        await user.update(updatedInfo);
        await user.reload(); // Reload the user instance to get the updated data
        res.json({
            message: 'User profile updated successfully',
            user: user
        });
    } catch (error) {
        res.status(500).send('An error occurred while updating the user profile');
    }
});

// Endpoint to send OTP
router.post('/send-otp', async (req, res) => {
    const { email } = req.body;
    const otp = crypto.randomInt(100000, 999999).toString();

    try {
       
        //find user and save otp
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).send('User not found');
        }
         await sendOTP(email, otp);
        await user.update({ otp: otp });
        // Save OTP to the user's record or a temporary store
        // For simplicity, we'll assume a temporary store here
        // req.session.otp = otp;
        res.json({ message: 'OTP sent successfully', otp: otp });
    } catch (error) {
        console.error('Error sending OTP:', error); // Log the error for debugging
        res.status(500).send('An error occurred while sending OTP');
    }
});

// Endpoint to change password
router.post('/change-password', authMiddleware, async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user;

    try {
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).send('User not found');
        }

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).send('Old password is incorrect');
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await user.update({ password: hashedPassword });
        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).send('An error occurred while changing the password');
    }
});

// Endpoint to reset password
router.post('/reset-password', async (req, res) => {
    const { email, otp, newPassword } = req.body;

    try {
        // Verify OTP
        

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).send('User not found');
        }

        if (otp !== user.otp) {
            return res.status(400).send('Invalid OTP');
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await user.update({ password: hashedPassword });
        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        res.status(500).send('An error occurred while resetting the password');
    }
});
/**
 * @swagger
 * /send-otp:
 *   post:
 *     summary: Send OTP to user's email
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 otp:
 *                   type: string
 *       404:
 *         description: User not found
 *       500:
 *         description: An error occurred while sending OTP
 */

/**
 * @swagger
 * /change-password:
 *   post:
 *     summary: Change user password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Old password is incorrect
 *       404:
 *         description: User not found
 *       500:
 *         description: An error occurred while changing the password
 */

/**
 * @swagger
 * /reset-password:
 *   post:
 *     summary: Reset user password
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid OTP
 *       404:
 *         description: User not found
 *       500:
 *         description: An error occurred while resetting the password
 */


module.exports = router;
/**
 * @swagger
 * /users:
 *   get:
 *     summary: Retrieve a list of users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   username:
 *                     type: string
 *                   email:
 *                     type: string
 *                   image:
 *                     type: string
 *       500:
 *         description: An error occurred while fetching users
 */

/**
 * @swagger
 * /update/{userId}:
 *   put:
 *     summary: Update a user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The user ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: User profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                     image:
 *                       type: string
 *       404:
 *         description: User not found
 *       500:
 *         description: An error occurred while updating the user profile
 */
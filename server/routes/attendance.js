const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Attendance = require('../models/Attendance');
const User = require('../models/User');

// @route   POST api/attendance/checkin
// @desc    Check in for the day
// @access  Private (Employee)
router.post('/checkin', auth, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        // Check if already checked in
        let attendance = await Attendance.findOne({
            userId: req.user.id,
            date: today
        });

        if (attendance) {
            return res.status(400).json({ msg: 'Already checked in for today' });
        }

        const now = new Date();
        // Simple logic: Late if after 10:00 AM (adjust as needed)
        let status = 'present';
        if (now.getHours() >= 10) {
            status = 'late';
        }

        attendance = new Attendance({
            userId: req.user.id,
            date: today,
            checkInTime: now,
            status: status
        });

        await attendance.save();
        res.json(attendance);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST api/attendance/checkout
// @desc    Check out for the day
// @access  Private (Employee)
router.post('/checkout', auth, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        let attendance = await Attendance.findOne({
            userId: req.user.id,
            date: today
        });

        if (!attendance) {
            return res.status(400).json({ msg: 'Have not checked in today' });
        }

        if (attendance.checkOutTime) {
            return res.status(400).json({ msg: 'Already checked out' });
        }

        attendance.checkOutTime = new Date();

        // Calculate total hours
        const duration = attendance.checkOutTime - attendance.checkInTime; // in ms
        const hours = duration / (1000 * 60 * 60);
        attendance.totalHours = hours.toFixed(2);

        await attendance.save();
        res.json(attendance);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/attendance/my-history
// @desc    Get my attendance history
// @access  Private
router.get('/my-history', auth, async (req, res) => {
    try {
        const history = await Attendance.find({ userId: req.user.id }).sort({ date: -1 });
        res.json(history);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/attendance/today
// @desc    Get today's status
// @access  Private
router.get('/today', auth, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const attendance = await Attendance.findOne({
            userId: req.user.id,
            date: today
        });
        res.json(attendance);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// --- Manager Routes ---

// @route   GET api/attendance/all
// @desc    Get all attendance records
// @access  Private (Manager)
router.get('/all', auth, async (req, res) => {
    if (req.user.role !== 'manager') {
        return res.status(403).json({ msg: 'Access denied' });
    }
    try {
        const attendance = await Attendance.find().populate('userId', ['name', 'email', 'department']);
        res.json(attendance);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;

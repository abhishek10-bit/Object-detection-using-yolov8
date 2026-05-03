const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Attendance = require('../models/Attendance');
const User = require('../models/User');

// @route   GET api/dashboard/employee
// @desc    Get employee dashboard stats
// @access  Private
router.get('/employee', auth, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        // Today's status
        const todayAttendance = await Attendance.findOne({
            userId: req.user.id,
            date: today
        });

        // Monthly stats
        const monthlyAttendance = await Attendance.find({
            userId: req.user.id,
            date: { $regex: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}` }
        });

        let present = 0;
        let absent = 0; // This needs logic to count days not in DB as absent if they are past days
        let late = 0;
        let totalHours = 0;

        monthlyAttendance.forEach(record => {
            if (record.status === 'present' || record.status === 'late' || record.status === 'half-day') {
                present++;
            }
            if (record.status === 'late') {
                late++;
            }
            totalHours += record.totalHours || 0;
        });

        // Recent attendance (last 7 days)
        const recent = await Attendance.find({ userId: req.user.id })
            .sort({ date: -1 })
            .limit(7);

        res.json({
            today: todayAttendance ? todayAttendance.status : 'Not Checked In',
            monthStats: {
                present,
                late,
                totalHours: totalHours.toFixed(2)
            },
            recent
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/dashboard/manager
// @desc    Get manager dashboard stats
// @access  Private (Manager)
router.get('/manager', auth, async (req, res) => {
    if (req.user.role !== 'manager') {
        return res.status(403).json({ msg: 'Access denied' });
    }

    try {
        const today = new Date().toISOString().split('T')[0];

        // Total employees
        const totalEmployees = await User.countDocuments({ role: 'employee' });

        // Today's attendance
        const todayAttendance = await Attendance.find({ date: today });

        let presentCount = 0;
        let lateCount = 0;
        const presentIds = [];

        todayAttendance.forEach(record => {
            if (record.status === 'present' || record.status === 'late' || record.status === 'half-day') {
                presentCount++;
                presentIds.push(record.userId.toString());
            }
            if (record.status === 'late') {
                lateCount++;
            }
        });

        const absentCount = totalEmployees - presentCount;

        // List of absent employees
        // Find users whose ID is NOT in presentIds
        const absentEmployees = await User.find({
            role: 'employee',
            _id: { $nin: presentIds }
        }).select('name email department');

        // Department-wise attendance (Simplified)
        // Group today's attendance by user's department
        // This requires a join or aggregation. Let's do a simple aggregation.
        // Actually, Attendance doesn't have department. User does.
        // We can iterate over todayAttendance and populate user.

        const populatedAttendance = await Attendance.find({ date: today }).populate('userId', 'department');
        const departmentStats = {};

        populatedAttendance.forEach(record => {
            const dept = record.userId.department;
            if (!departmentStats[dept]) {
                departmentStats[dept] = 0;
            }
            departmentStats[dept]++;
        });

        res.json({
            totalEmployees,
            today: {
                present: presentCount,
                absent: absentCount,
                late: lateCount
            },
            absentEmployees,
            departmentStats
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;

import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout, reset } from '../features/authSlice';
import axios from 'axios';

function EmployeeDashboard() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            navigate('/login');
        } else {
            fetchStats();
        }

        return () => {
            dispatch(reset());
        };
    }, [user, navigate, dispatch]);

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: {
                    'x-auth-token': token
                }
            };
            const response = await axios.get('http://localhost:5000/api/dashboard/employee', config);
            setStats(response.data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const onLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    const handleCheckIn = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: {
                    'x-auth-token': token
                }
            };
            await axios.post('http://localhost:5000/api/attendance/checkin', {}, config);
            fetchStats();
            alert('Checked In Successfully');
        } catch (error) {
            alert(error.response.data.msg);
        }
    };

    const handleCheckOut = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: {
                    'x-auth-token': token
                }
            };
            await axios.post('http://localhost:5000/api/attendance/checkout', {}, config);
            fetchStats();
            alert('Checked Out Successfully');
        } catch (error) {
            alert(error.response.data.msg);
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Welcome, {user && user.name}</h1>
                <button
                    onClick={onLogout}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                    Logout
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded shadow">
                    <h3 className="text-xl font-bold mb-2">Today's Status</h3>
                    <p className="text-2xl text-blue-600 capitalize">{stats?.today}</p>
                    <div className="mt-4 flex space-x-4">
                        <button
                            onClick={handleCheckIn}
                            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                            disabled={stats?.today !== 'Not Checked In'}
                        >
                            Check In
                        </button>
                        <button
                            onClick={handleCheckOut}
                            className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-700 disabled:opacity-50"
                            disabled={stats?.today === 'Not Checked In' || stats?.today === 'Checked Out'} // Logic might need refinement based on status strings
                        >
                            Check Out
                        </button>
                    </div>
                </div>

                <div className="bg-white p-6 rounded shadow">
                    <h3 className="text-xl font-bold mb-2">This Month</h3>
                    <p>Present: {stats?.monthStats?.present}</p>
                    <p>Late: {stats?.monthStats?.late}</p>
                    <p>Total Hours: {stats?.monthStats?.totalHours}</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded shadow">
                <h3 className="text-xl font-bold mb-4">Recent Attendance</h3>
                <table className="min-w-full table-auto">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="px-4 py-2">Date</th>
                            <th className="px-4 py-2">Status</th>
                            <th className="px-4 py-2">Check In</th>
                            <th className="px-4 py-2">Check Out</th>
                            <th className="px-4 py-2">Hours</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stats?.recent?.map((record) => (
                            <tr key={record._id} className="border-b">
                                <td className="px-4 py-2">{record.date}</td>
                                <td className="px-4 py-2 capitalize">{record.status}</td>
                                <td className="px-4 py-2">{record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString() : '-'}</td>
                                <td className="px-4 py-2">{record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString() : '-'}</td>
                                <td className="px-4 py-2">{record.totalHours ? record.totalHours.toFixed(2) : '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default EmployeeDashboard;

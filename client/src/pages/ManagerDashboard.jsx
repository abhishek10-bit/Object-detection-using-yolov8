import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout, reset } from '../features/authSlice';
import axios from 'axios';

function ManagerDashboard() {
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
            const response = await axios.get('http://localhost:5000/api/dashboard/manager', config);
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

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Manager Dashboard</h1>
                <button
                    onClick={onLogout}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                    Logout
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded shadow">
                    <h3 className="text-xl font-bold mb-2">Total Employees</h3>
                    <p className="text-3xl text-blue-600">{stats?.totalEmployees}</p>
                </div>
                <div className="bg-white p-6 rounded shadow">
                    <h3 className="text-xl font-bold mb-2">Present Today</h3>
                    <p className="text-3xl text-green-600">{stats?.today?.present}</p>
                </div>
                <div className="bg-white p-6 rounded shadow">
                    <h3 className="text-xl font-bold mb-2">Absent Today</h3>
                    <p className="text-3xl text-red-600">{stats?.today?.absent}</p>
                </div>
                <div className="bg-white p-6 rounded shadow">
                    <h3 className="text-xl font-bold mb-2">Late Today</h3>
                    <p className="text-3xl text-yellow-600">{stats?.today?.late}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded shadow">
                    <h3 className="text-xl font-bold mb-4">Absent Employees</h3>
                    <ul>
                        {stats?.absentEmployees?.map((emp) => (
                            <li key={emp._id} className="border-b py-2">
                                <span className="font-bold">{emp.name}</span> ({emp.department})
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="bg-white p-6 rounded shadow">
                    <h3 className="text-xl font-bold mb-4">Department Stats</h3>
                    <ul>
                        {stats?.departmentStats && Object.entries(stats.departmentStats).map(([dept, count]) => (
                            <li key={dept} className="border-b py-2 flex justify-between">
                                <span>{dept}</span>
                                <span className="font-bold">{count} Present</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default ManagerDashboard;

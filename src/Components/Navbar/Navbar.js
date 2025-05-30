import React, { useState } from 'react';
import Button from '@mui/material/Button';
import { Link, useNavigate } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
import { useAuth } from '../../Context/AuthContext';

const Navbar = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const auth = getAuth();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            console.log('User signed out');
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    const handleLoginRedirect = () => {
        navigate('/signIn'); // Redirect to the Sign In route
    }

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    }

    return (
        <nav className="bg-red-100 p-5">
            <div className="container mx-auto flex justify-between items-center">
                <Link to="/" className="text-xl text-black">
                    Gaba Bike Service Admin
                </Link>
                <div className="hidden md:flex space-x-4">
                    <Link to="/addNewCustomer">
                        <Button variant="contained">Add New Customer</Button>
                    </Link>
                    <Link to="/">
                        <Button variant="contained">Check Customer</Button>
                    </Link>
                    <Link to="/viewAllCustomer">
                        <Button variant="contained">View All Customer</Button>
                    </Link>
                    {user ? (
                        <Button variant="contained" onClick={handleLogout}>
                            Logout
                        </Button>
                    ) : (
                        <Button variant="contained" onClick={handleLoginRedirect}>
                            ADMIN Login
                        </Button>
                    )}
                </div>
                <div className="md:hidden">
                    <button onClick={toggleMobileMenu} className="text-black focus:outline-none">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
                        </svg>
                    </button>
                </div>
            </div>
            {isMobileMenuOpen && (
                <div className="md:hidden mt-4 space-y-2">
                    <Link to="/addNewCustomer">
                        <Button variant="contained" fullWidth>
                            Add New Customer
                        </Button>
                    </Link>
                    <Link to="/">
                        <Button variant="contained" fullWidth>
                            Check Customer
                        </Button>
                    </Link>
                    <Link to="/viewAllCustomer">
                        <Button variant="contained" fullWidth>
                            View All Customer
                        </Button>
                    </Link>
                    {user ? (
                        <Button variant="contained" fullWidth onClick={handleLogout}>
                            Logout
                        </Button>
                    ) : (
                        <Button variant="contained" fullWidth onClick={handleLoginRedirect}>
                            ADMIN Login
                        </Button>
                    )}
                </div>
            )}
        </nav>
    )
}

export default Navbar
import React, { useState } from 'react';
import { signInWithEmailAndPassword } from '../../firebase';
import { auth, firestore } from '../../firebase';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Sign in the user
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Log the user's UID
      console.log('User UID:', userCredential.user.uid);
      
      // Get user role from Firestore
      const userDoc = await getDoc(doc(firestore, 'users', userCredential.user.uid));
      
      if (!userDoc.exists()) {
        throw new Error('User data not found');
      }

      const userData = userDoc.data();
      if (!userData.role || (userData.role !== 'superadmin' && userData.role !== 'subadmin')) {
        throw new Error('Invalid user role');
      }

      console.log(`${userData.role} logged in successfully`);
      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message === 'Invalid user role' 
        ? 'You do not have admin privileges' 
        : 'Failed to log in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='flex flex-col items-center justify-center h-screen bg-gray-100'>
      <h1 className='text-3xl font-bold mb-6'>Admin Login</h1>
      <form className='bg-white p-6 rounded shadow-md w-96' onSubmit={handleSubmit}>
        <input
          className='border-2 border-gray-300 rounded-md p-2 mb-4 w-full'
          type="email"
          placeholder="Admin Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />
        <input
          className='border-2 border-gray-300 rounded-md p-2 mb-4 w-full'
          type="password"
          placeholder="Admin Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />
        {error && <p className='text-red-500 mb-4'>{error}</p>}
        <button
          className={`w-full p-2 rounded-md text-white ${
            loading 
              ? 'bg-blue-300 cursor-not-allowed' 
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
          type="submit"
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default AdminLogin;
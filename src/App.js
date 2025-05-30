import logo from './logo.svg';
import './App.css';
import SearchVehicle from './Pages/FindVehicle/FindVehicle';
import AddNewCustomer from './Pages/AddNewCustomer/AddNewCustomer';
import {
  Routes,
  Route,
  BrowserRouter
} from "react-router-dom";
import AdminLogin from './Pages/SignIn/SignIn';
import { SuperAdminRoute, AdminRoute } from './ProtectedRoute/RoleBasedRoute';
import { AuthProvider } from './Context/AuthContext';
import ViewAllCustomer from './Pages/ViewAllCustomer/ViewAllCustomer';
import React from 'react';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
            <p className="text-gray-600">Please refresh the page or try again later.</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <div className="App">
      <ErrorBoundary>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route
                path="/"
                element={
                  <AdminRoute>
                    <SearchVehicle />
                  </AdminRoute>
                }
              />
              <Route
                path="/addNewCustomer"
                element={
                  <SuperAdminRoute>
                    <AddNewCustomer />
                  </SuperAdminRoute>
                }
              />
              <Route
                path="/signIn"
                element={<AdminLogin />}
              />
              <Route
                path="/viewAllCustomer"
                element={
                  <AdminRoute>
                    <ViewAllCustomer />
                  </AdminRoute>
                }
              />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </div>
  );
}

export default App;

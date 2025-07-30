import React, { useState, useEffect } from 'react';
import { firestore } from '../../firebase.js';
import Navbar from '../../Components/Navbar/Navbar.js';
import { collection, query, where, getDocs, updateDoc, doc, addDoc, deleteDoc } from 'firebase/firestore';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import MopedIcon from '@mui/icons-material/Moped';
import { 
    TextField, 
    Button, 
    Radio, 
    RadioGroup, 
    FormControlLabel, 
    FormControl, 
    FormLabel,
    Card,
    CardContent,
    Typography,
    Box,
    Grid,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Alert,
    Snackbar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Divider,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    Search as SearchIcon,
    DirectionsCar as CarIcon,
    TwoWheeler as BikeIcon,
    Phone as PhoneIcon,
    Person as PersonIcon,
    Engineering as EngineeringIcon,
    Add as AddIcon,
    CheckCircle as CheckCircleIcon,
    Payment as PaymentIcon
} from '@mui/icons-material';
import { useAuth } from '../../Context/AuthContext';

const SearchVehicle = () => {
    const { isSuperAdmin } = useAuth(); // Add this line to get the auth context
    const [vehicleNumber, setVehicleNumber] = useState('');
    const [vehicleData, setVehicleData] = useState(null);
    const [newServiceData, setNewServiceData] = useState({
        serviceType: '',
        totalKM: '',
        totalAmount: '',
        totalRecieve: '',
        serviceDate: new Date().toISOString().split('T')[0], // current date in YYYY-MM-DD format
        serviceNote: '' // Add this new field
    });
    const [showModal, setShowModal] = useState(false); // Modal visibility state
    const [alertMessage, setAlertMessage] = useState(null); // For success/error messages
    const [vehicleId, setVehicleId] = useState(null)
    const [pendingAmounts, setPendingAmounts] = useState({}); // Track pending amounts for each service
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });
    const [isLoading, setIsLoading] = useState(false);
    const [searchAnimation, setSearchAnimation] = useState(false);
    const [vehicleFound, setVehicleFound] = useState(false);
    // Search vehicle by vehicle number
    // Search vehicle by vehicle number
    const handleSearch = async () => {
        if (!vehicleNumber.trim()) {
            showSnackbar("Please enter a vehicle number", "warning");
            return;
        }

        setIsLoading(true);
        setSearchAnimation(true);
        setVehicleFound(false);

        try {
            const q = query(collection(firestore, 'vehicles'), where('vehicleNumber', '==', vehicleNumber));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const doc = querySnapshot.docs[0]; // Get the first matching document
                setVehicleData(doc.data()); // Set vehicle data
                setVehicleId(doc.id); // Save the document ID for updates
                setPendingAmounts({}); // Clear pending amounts for new vehicle
                setVehicleFound(true);
                showSnackbar("Vehicle found successfully!", "success");
            } else {
                showSnackbar("Vehicle not found!", "error");
                setVehicleData(null);
                setVehicleId(null); // Clear vehicleId if no data is found
                setPendingAmounts({}); // Clear pending amounts
            }
        } catch (error) {
            console.error('Error searching vehicle:', error);
            showSnackbar("Error searching vehicle.", "error");
        } finally {
            setIsLoading(false);
            setTimeout(() => setSearchAnimation(false), 1000);
        }
    };


    // Handle adding a new service
    const handleAddNewService = async () => {
        if (!newServiceData.serviceType || !newServiceData.totalKM) {
            showSnackbar("Please fill in all service details.", "warning");
            return;
        }

        try {
            if (!vehicleId) {
                showSnackbar("No vehicle found to update.", "error");
                return;
            }

            // Check for active follow-ups
            const followUpsRef = collection(firestore, 'followUps');
            const followUpQuery = query(followUpsRef, 
                where('vehicleId', '==', vehicleId),
                where('status', 'in', ['pending', 'callback_requested', 'scheduled'])
            );
            const followUpSnapshot = await getDocs(followUpQuery);

            // Delete any active follow-ups
            if (!followUpSnapshot.empty) {
                const followUpDoc = followUpSnapshot.docs[0];
                await deleteDoc(doc(firestore, 'followUps', followUpDoc.id));
            }

            const vehicleRef = doc(firestore, 'vehicles', vehicleId);
            console.log("Vehicle Ref: ", vehicleRef);

            // Ensure serviceHistory is initialized as an empty array if undefined
            const updatedServiceHistory = vehicleData.serviceHistory || [];

            // Adding the new service to the serviceHistory array
            updatedServiceHistory.push({
                serviceType: newServiceData.serviceType,
                totalKM: newServiceData.totalKM,
                serviceDate: newServiceData.serviceDate,
                totalAmount: newServiceData.totalAmount,
                totalRecieve: newServiceData.totalRecieve,
                serviceNote: newServiceData.serviceNote
            });

            // Update the vehicle document with the new service history
            await updateDoc(vehicleRef, { serviceHistory: updatedServiceHistory });

            showSnackbar("Service added successfully and follow-up removed!", "success");
            setVehicleData({ ...vehicleData, serviceHistory: updatedServiceHistory });
            setNewServiceData({ 
                serviceType: '', 
                totalKM: '', 
                serviceDate: new Date().toISOString().split('T')[0],
                totalAmount: '',
                totalRecieve: '',
                serviceNote: ''
            });
            setShowModal(false);
        } catch (error) {
            console.error('Error adding service:', error);
            showSnackbar("Error adding service.", "error");
        }
    };

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({
            open: true,
            message,
            severity
        });
    };

    return (
        <div style={{ 
            backgroundColor: '#f5f5f5', 
            minHeight: '100vh',
            backgroundImage: `
                radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(255, 119, 48, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 40% 40%, rgba(120, 119, 198, 0.1) 0%, transparent 50%)
            `
        }}>
            <Navbar />
            
            <Box sx={{ p: 3 }}>
                {/* Animated Background Elements */}
                <Box sx={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    pointerEvents: 'none',
                    zIndex: 0,
                    overflow: 'hidden'
                }}>
                    {/* Floating Tools Animation */}
                    <Box sx={{
                        position: 'absolute',
                        top: '10%',
                        right: '5%',
                        animation: 'float 6s ease-in-out infinite',
                        '@keyframes float': {
                            '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
                            '50%': { transform: 'translateY(-20px) rotate(5deg)' }
                        }
                    }}>
                        <EngineeringIcon sx={{ fontSize: 60, color: 'rgba(25, 118, 210, 0.1)' }} />
                    </Box>
                    <Box sx={{
                        position: 'absolute',
                        top: '30%',
                        left: '5%',
                        animation: 'float 8s ease-in-out infinite 1s',
                        '@keyframes float': {
                            '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
                            '50%': { transform: 'translateY(-15px) rotate(-3deg)' }
                        }
                    }}>
                        <BikeIcon sx={{ fontSize: 50, color: 'rgba(76, 175, 80, 0.1)' }} />
                    </Box>
                    <Box sx={{
                        position: 'absolute',
                        bottom: '20%',
                        right: '15%',
                        animation: 'float 7s ease-in-out infinite 2s',
                        '@keyframes float': {
                            '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
                            '50%': { transform: 'translateY(-25px) rotate(2deg)' }
                        }
                    }}>
                        <CarIcon sx={{ fontSize: 70, color: 'rgba(255, 152, 0, 0.1)' }} />
                    </Box>
                </Box>
                {/* Header */}
                <Box sx={{ mb: 4, position: 'relative', zIndex: 1 }}>
                    <Typography variant="h4" sx={{ 
                        fontWeight: 'bold', 
                        color: '#1a237e',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        animation: vehicleFound ? 'slideInDown 0.8s ease-out' : 'none',
                        '@keyframes slideInDown': {
                            '0%': { transform: 'translateY(-50px)', opacity: 0 },
                            '100%': { transform: 'translateY(0)', opacity: 1 }
                        }
                    }}>
                        <SearchIcon sx={{ 
                            fontSize: 32,
                            animation: searchAnimation ? 'pulse 1s infinite' : 'none',
                            '@keyframes pulse': {
                                '0%': { transform: 'scale(1)' },
                                '50%': { transform: 'scale(1.1)' },
                                '100%': { transform: 'scale(1)' }
                            }
                        }} />
                        Vehicle Search & Management
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ 
                        mt: 1,
                        animation: vehicleFound ? 'fadeIn 1s ease-out 0.2s both' : 'none',
                        '@keyframes fadeIn': {
                            '0%': { opacity: 0, transform: 'translateX(-20px)' },
                            '100%': { opacity: 1, transform: 'translateX(0)' }
                        }
                    }}>
                        Search for vehicles and manage their service history
                    </Typography>
                </Box>

                {/* Search Section */}
                <Card sx={{ 
                    mb: 4, 
                    boxShadow: 3,
                    position: 'relative',
                    zIndex: 1,
                    animation: vehicleFound ? 'slideInUp 0.8s ease-out 0.3s both' : 'none',
                    '@keyframes slideInUp': {
                        '0%': { transform: 'translateY(50px)', opacity: 0 },
                        '100%': { transform: 'translateY(0)', opacity: 1 }
                    },
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                    border: '1px solid rgba(25, 118, 210, 0.1)'
                }}>
                    <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ 
                            mb: 3, 
                            color: '#1a237e',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                        }}>
                            <SearchIcon sx={{ 
                                animation: searchAnimation ? 'spin 2s linear infinite' : 'none',
                                '@keyframes spin': {
                                    '0%': { transform: 'rotate(0deg)' },
                                    '100%': { transform: 'rotate(360deg)' }
                                }
                            }} />
                            Search Vehicle
                        </Typography>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} md={8}>
                                <TextField
                                    fullWidth
                                    label="Enter Vehicle Number"
                                    variant="outlined"
                                    value={vehicleNumber}
                                    onChange={(e) => setVehicleNumber(e.target.value)}
                                    placeholder="e.g., MH12AB1234"
                                    InputProps={{
                                        startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            fontSize: '16px',
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                                transform: 'translateY(-2px)',
                                                boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                                            },
                                            '&.Mui-focused': {
                                                transform: 'translateY(-2px)',
                                                boxShadow: '0 6px 12px rgba(25, 118, 210, 0.2)'
                                            }
                                        }
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    onClick={handleSearch}
                                    disabled={isLoading}
                                    startIcon={isLoading ? (
                                        <Box sx={{
                                            width: 20,
                                            height: 20,
                                            border: '2px solid #ffffff',
                                            borderTop: '2px solid transparent',
                                            borderRadius: '50%',
                                            animation: 'spin 1s linear infinite'
                                        }} />
                                    ) : <SearchIcon />}
                                    sx={{
                                        background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                                        '&:hover': {
                                            background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)',
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 6px 12px rgba(25, 118, 210, 0.3)'
                                        },
                                        '&:disabled': {
                                            background: 'linear-gradient(45deg, #9e9e9e 30%, #bdbdbd 90%)'
                                        },
                                        py: 1.5,
                                        fontSize: '16px',
                                        transition: 'all 0.3s ease',
                                        boxShadow: '0 4px 8px rgba(25, 118, 210, 0.2)'
                                    }}
                                >
                                    {isLoading ? 'Searching...' : 'Search Vehicle'}
                                </Button>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                {/* Vehicle Details and Service History */}
                {vehicleData && (
                    <>
                        {/* Vehicle Information Card */}
                        <Card sx={{ 
                            mb: 4, 
                            boxShadow: 3,
                            animation: 'slideInLeft 0.8s ease-out 0.5s both',
                            '@keyframes slideInLeft': {
                                '0%': { transform: 'translateX(-100px)', opacity: 0 },
                                '100%': { transform: 'translateX(0)', opacity: 1 }
                            },
                            background: 'linear-gradient(135deg, #ffffff 0%, #f0f8ff 100%)',
                            border: '1px solid rgba(76, 175, 80, 0.1)'
                        }}>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="h6" sx={{ mb: 3, color: '#1a237e', display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CarIcon />
                                    Vehicle Information
                                </Typography>
                                
                                <Grid container spacing={3}>
                                    <Grid item xs={12} md={6}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                            <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                            <Typography variant="body1">
                                                <strong>Customer Name:</strong> {vehicleData.name}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                            <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                            <Typography variant="body1">
                                                <strong>Phone:</strong> {vehicleData.mobileNo}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                            {vehicleData.vehicleType === "Bike" ? <BikeIcon sx={{ mr: 1, color: 'text.secondary' }} /> : <CarIcon sx={{ mr: 1, color: 'text.secondary' }} />}
                                            <Typography variant="body1">
                                                <strong>Vehicle Type:</strong> {vehicleData.vehicleType}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                            <EngineeringIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                            <Typography variant="body1">
                                                <strong>Engine No:</strong> {vehicleData.engineNumber}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                            <EngineeringIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                            <Typography variant="body1">
                                                <strong>Chassis No:</strong> {vehicleData.chesiNumber}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>

                        {/* Service History Card */}
                        <Card sx={{ 
                            mb: 4, 
                            boxShadow: 3,
                            animation: 'slideInRight 0.8s ease-out 0.7s both',
                            '@keyframes slideInRight': {
                                '0%': { transform: 'translateX(100px)', opacity: 0 },
                                '100%': { transform: 'translateX(0)', opacity: 1 }
                            },
                            background: 'linear-gradient(135deg, #ffffff 0%, #fff8e1 100%)',
                            border: '1px solid rgba(255, 152, 0, 0.1)'
                        }}>
                            <CardContent sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                    <Typography variant="h6" sx={{ color: '#1a237e', display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <EngineeringIcon />
                                        Service History
                                    </Typography>
                                    
                                    {/* Only show Add Service button for superadmin */}
                                    {isSuperAdmin() && (
                                        <Button
                                            onClick={() => setShowModal(true)}
                                            variant="contained"
                                            startIcon={<AddIcon />}
                                            sx={{
                                                background: 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)',
                                                '&:hover': {
                                                    background: 'linear-gradient(45deg, #45a049 30%, #4caf50 90%)',
                                                    transform: 'translateY(-2px)',
                                                    boxShadow: '0 6px 12px rgba(76, 175, 80, 0.3)'
                                                },
                                                transition: 'all 0.3s ease',
                                                boxShadow: '0 4px 8px rgba(76, 175, 80, 0.2)',
                                                animation: 'bounce 2s infinite',
                                                '@keyframes bounce': {
                                                    '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' },
                                                    '40%': { transform: 'translateY(-5px)' },
                                                    '60%': { transform: 'translateY(-3px)' }
                                                }
                                            }}
                                        >
                                            Add New Service
                                        </Button>
                                    )}
                                </Box>

                                <TableContainer component={Paper} sx={{ 
                                    boxShadow: 2,
                                    borderRadius: 2,
                                    overflow: 'hidden',
                                    '& .MuiTableRow-root:hover': {
                                        backgroundColor: 'rgba(25, 118, 210, 0.04)',
                                        transform: 'scale(1.01)',
                                        transition: 'all 0.2s ease'
                                    }
                                }}>
                                    <Table>
                                        <TableHead>
                                            <TableRow sx={{ 
                                                backgroundColor: 'linear-gradient(45deg, #1a237e 30%, #3949ab 90%)',
                                                '& .MuiTableCell-head': {
                                                    color: 'white',
                                                    fontWeight: 'bold',
                                                    fontSize: '14px'
                                                }
                                            }}>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Service Type</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Service Date</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Total KM</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Total Amount</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Total Received</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Pending Amount</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Payment Actions</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Service Notes</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {vehicleData.serviceHistory.length > 0 ? (
                                                vehicleData.serviceHistory.map((service, index) => (
                                                    <TableRow key={index} sx={{ 
                                                        '&:hover': { 
                                                            backgroundColor: 'rgba(25, 118, 210, 0.04)',
                                                            transform: 'scale(1.01)',
                                                            transition: 'all 0.2s ease'
                                                        },
                                                        animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`,
                                                        '@keyframes fadeInUp': {
                                                            '0%': { opacity: 0, transform: 'translateY(20px)' },
                                                            '100%': { opacity: 1, transform: 'translateY(0)' }
                                                        }
                                                    }}>
                                                        <TableCell>
                                                            <Chip 
                                                                label={service.serviceType} 
                                                                color="primary" 
                                                                variant="outlined"
                                                                size="small"
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            {new Date(service.serviceDate).toLocaleDateString()}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2">
                                                                {service.totalKM} km
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                                ₹{service.totalAmount}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2" color="success.main">
                                                                ₹{service.totalRecieve}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2" color="error.main" sx={{ fontWeight: 'bold' }}>
                                                                ₹{Number(service.totalAmount) - Number(service.totalRecieve)}
                                                            </Typography>
                                                        </TableCell>
                                                                                            <TableCell>
                                                            {Number(service.totalAmount) === Number(service.totalRecieve) ? (
                                                                                                                            <Chip 
                                                                icon={<CheckCircleIcon />}
                                                                label="Completed" 
                                                                color="success" 
                                                                size="small"
                                                                sx={{
                                                                    animation: 'pulse 2s infinite',
                                                                    '@keyframes pulse': {
                                                                        '0%': { transform: 'scale(1)' },
                                                                        '50%': { transform: 'scale(1.05)' },
                                                                        '100%': { transform: 'scale(1)' }
                                                                    }
                                                                }}
                                                            />
                                                            ) : (
                                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center' }}>
                                                                    <TextField
                                                                        size="small"
                                                                        type="number"
                                                                        placeholder="Amount"
                                                                        value={pendingAmounts[index] || ''}
                                                                        sx={{ width: '100px' }}
                                                                        inputProps={{
                                                                            min: 0,
                                                                            max: Number(service.totalAmount) - Number(service.totalRecieve)
                                                                        }}
                                                                        onChange={(e) => {
                                                                            const amount = e.target.value;
                                                                            setPendingAmounts(prev => ({
                                                                                ...prev,
                                                                                [index]: amount
                                                                            }));
                                                                        }}
                                                                        disabled={!isSuperAdmin()}
                                                                    />
                                                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                                        <Button
                                                                            variant="contained"
                                                                            size="small"
                                                                            startIcon={<PaymentIcon />}
                                                                            sx={{
                                                                                background: 'linear-gradient(45deg, #4CAF50 30%, #66bb6a 90%)',
                                                                                '&:hover': { 
                                                                                    background: 'linear-gradient(45deg, #45a049 30%, #4CAF50 90%)',
                                                                                    transform: 'translateY(-1px)',
                                                                                    boxShadow: '0 4px 8px rgba(76, 175, 80, 0.3)'
                                                                                },
                                                                                fontSize: '10px',
                                                                                py: 0.5,
                                                                                px: 1,
                                                                                transition: 'all 0.2s ease',
                                                                                boxShadow: '0 2px 4px rgba(76, 175, 80, 0.2)'
                                                                            }}
                                                                            disabled={!isSuperAdmin()}
                                                                            onClick={async () => {
                                                                                if (!isSuperAdmin()) return;
                                                                                if (vehicleId && vehicleData.serviceHistory) {
                                                                                    try {
                                                                                        const amountToAdd = Number(pendingAmounts[index]) || 0;
                                                                                        if (amountToAdd <= 0) {
                                                                                            showSnackbar("Please enter a valid amount.", "warning");
                                                                                            return;
                                                                                        }

                                                                                        const currentReceived = Number(service.totalRecieve) || 0;
                                                                                        const newTotalReceived = currentReceived + amountToAdd;
                                                                                        
                                                                                        if (newTotalReceived > Number(service.totalAmount)) {
                                                                                            showSnackbar("Amount exceeds pending balance.", "error");
                                                                                            return;
                                                                                        }

                                                                                        // Update the specific service in serviceHistory
                                                                                        const updatedServiceHistory = vehicleData.serviceHistory.map((s, i) => {
                                                                                            if (i === index) {
                                                                                                return {
                                                                                                    ...s,
                                                                                                    totalRecieve: newTotalReceived.toString(),
                                                                                                };
                                                                                            }
                                                                                            return s;
                                                                                        });

                                                                                        // Update Firestore with the updated serviceHistory
                                                                                        const vehicleRef = doc(firestore, 'vehicles', vehicleId);
                                                                                        await updateDoc(vehicleRef, { serviceHistory: updatedServiceHistory });

                                                                                        // Update local state
                                                                                        setVehicleData({ ...vehicleData, serviceHistory: updatedServiceHistory });
                                                                                        
                                                                                        // Clear the input for this service
                                                                                        setPendingAmounts(prev => {
                                                                                            const newState = { ...prev };
                                                                                            delete newState[index];
                                                                                            return newState;
                                                                                        });
                                                                                        
                                                                                        showSnackbar("Payment updated successfully!", "success");
                                                                                    } catch (error) {
                                                                                        console.error("Error updating payment:", error);
                                                                                        showSnackbar("Error updating payment.", "error");
                                                                                    }
                                                                                }
                                                                            }}
                                                                        >
                                                                            Update
                                                                        </Button>
                                                                        <Button
                                                                            variant="contained"
                                                                            size="small"
                                                                            startIcon={<CheckCircleIcon />}
                                                                            sx={{
                                                                                background: 'linear-gradient(45deg, #2196F3 30%, #42a5f5 90%)',
                                                                                '&:hover': { 
                                                                                    background: 'linear-gradient(45deg, #1976d2 30%, #2196F3 90%)',
                                                                                    transform: 'translateY(-1px)',
                                                                                    boxShadow: '0 4px 8px rgba(33, 150, 243, 0.3)'
                                                                                },
                                                                                fontSize: '10px',
                                                                                py: 0.5,
                                                                                px: 1,
                                                                                transition: 'all 0.2s ease',
                                                                                boxShadow: '0 2px 4px rgba(33, 150, 243, 0.2)'
                                                                            }}
                                                                            disabled={!isSuperAdmin()}
                                                                            onClick={async () => {
                                                                                if (!isSuperAdmin()) return;
                                                                                if (vehicleId && vehicleData.serviceHistory) {
                                                                                    try {
                                                                                        // Complete all pending amount
                                                                                        const updatedServiceHistory = vehicleData.serviceHistory.map((s, i) => {
                                                                                            if (i === index) {
                                                                                                return {
                                                                                                    ...s,
                                                                                                    totalRecieve: s.totalAmount,
                                                                                                };
                                                                                            }
                                                                                            return s;
                                                                                        });

                                                                                        // Update Firestore with the updated serviceHistory
                                                                                        const vehicleRef = doc(firestore, 'vehicles', vehicleId);
                                                                                        await updateDoc(vehicleRef, { serviceHistory: updatedServiceHistory });

                                                                                        // Update local state
                                                                                        setVehicleData({ ...vehicleData, serviceHistory: updatedServiceHistory });
                                                                                        
                                                                                        // Clear the input for this service
                                                                                        setPendingAmounts(prev => {
                                                                                            const newState = { ...prev };
                                                                                            delete newState[index];
                                                                                            return newState;
                                                                                        });
                                                                                        
                                                                                        showSnackbar("All pending amount cleared successfully!", "success");
                                                                                    } catch (error) {
                                                                                        console.error("Error clearing pending:", error);
                                                                                        showSnackbar("Error clearing pending.", "error");
                                                                                    }
                                                                                }
                                                                            }}
                                                                        >
                                                                            Complete All
                                                                        </Button>
                                                                    </Box>
                                                                </Box>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2" color="text.secondary">
                                                                {service.serviceNote || 'No notes'}
                                                            </Typography>
                                                        </TableCell>
                                                    </TableRow>
                            ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={8} align="center">
                                                        <Typography variant="body1" color="text.secondary" sx={{ py: 4 }}>
                                                            No services recorded yet.
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </CardContent>
                        </Card>
                    </>
                )}

                {/* Snackbar for notifications */}
                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={6000}
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                >
                    <Alert 
                        onClose={() => setSnackbar({ ...snackbar, open: false })} 
                        severity={snackbar.severity}
                        sx={{ width: '100%' }}
                    >
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Box>

            {/* Modal for Adding a New Service - Only shown to superadmin */}
            {showModal && isSuperAdmin() && (
                <Dialog 
                    open={showModal} 
                    onClose={() => setShowModal(false)}
                    maxWidth="sm"
                    fullWidth
                    sx={{
                        '& .MuiDialog-paper': {
                            animation: 'zoomIn 0.3s ease-out',
                            '@keyframes zoomIn': {
                                '0%': { transform: 'scale(0.8)', opacity: 0 },
                                '100%': { transform: 'scale(1)', opacity: 1 }
                            }
                        }
                    }}
                >
                    <DialogTitle sx={{ 
                        backgroundColor: '#1a237e', 
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                    }}>
                        <AddIcon />
                        Add New Service
                    </DialogTitle>
                    <DialogContent sx={{ pt: 3 }}>
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <FormControl component="fieldset" fullWidth>
                                    <FormLabel component="legend" sx={{ mb: 2, fontWeight: 'bold' }}>
                                        Service Type
                                    </FormLabel>
                                    <RadioGroup
                                        name="serviceType"
                                        value={newServiceData.serviceType}
                                        onChange={(e) => setNewServiceData({ ...newServiceData, serviceType: e.target.value })}
                                    >
                                        <FormControlLabel 
                                            value="Paid Regular Service" 
                                            control={<Radio />} 
                                            label="Paid Regular Service" 
                                        />
                                        <FormControlLabel 
                                            value="General Repair" 
                                            control={<Radio />} 
                                            label="General Repair" 
                                        />
                                    </RadioGroup>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    label="Total KM"
                                    variant="outlined"
                                    type="number"
                                    value={newServiceData.totalKM}
                                    onChange={(e) => setNewServiceData({ ...newServiceData, totalKM: e.target.value })}
                                    fullWidth
                                    InputProps={{
                                        endAdornment: <Typography variant="caption">km</Typography>
                                    }}
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    label="Service Date"
                                    variant="outlined"
                                    value={newServiceData.serviceDate}
                                    disabled
                                    fullWidth
                                />
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <TextField
                                    label="Total Amount"
                                    variant="outlined"
                                    type="number"
                                    value={newServiceData.totalAmount}
                                    onChange={(e) => setNewServiceData({ ...newServiceData, totalAmount: e.target.value })}
                                    fullWidth
                                    InputProps={{
                                        startAdornment: <Typography variant="caption">₹</Typography>
                                    }}
                                />
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <TextField
                                    label="Amount Received"
                                    variant="outlined"
                                    type="number"
                                    value={newServiceData.totalRecieve}
                                    onChange={(e) => setNewServiceData({ ...newServiceData, totalRecieve: e.target.value })}
                                    fullWidth
                                    InputProps={{
                                        startAdornment: <Typography variant="caption">₹</Typography>
                                    }}
                                />
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <Box sx={{ 
                                    p: 2, 
                                    border: '1px solid #e0e0e0', 
                                    borderRadius: 1,
                                    backgroundColor: '#f5f5f5'
                                }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Pending Amount
                                    </Typography>
                                    <Typography variant="h6" color="error.main">
                                        ₹{Math.max(0, (Number(newServiceData.totalAmount) || 0) - (Number(newServiceData.totalRecieve) || 0))}
                                    </Typography>
                                </Box>
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    label="Service Description"
                                    variant="outlined"
                                    multiline
                                    rows={4}
                                    value={newServiceData.serviceNote}
                                    onChange={(e) => setNewServiceData({ ...newServiceData, serviceNote: e.target.value })}
                                    fullWidth
                                    placeholder="Enter service details, parts replaced, or any other notes..."
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{ p: 3 }}>
                        <Button
                            onClick={() => setShowModal(false)}
                            variant="outlined"
                            color="inherit"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddNewService}
                            variant="contained"
                            startIcon={<AddIcon />}
                            sx={{
                                backgroundColor: '#4caf50',
                                '&:hover': {
                                    backgroundColor: '#45a049'
                                }
                            }}
                        >
                            Add Service
                        </Button>
                    </DialogActions>
                </Dialog>
            )}
        </div>
    );
};

export default SearchVehicle;

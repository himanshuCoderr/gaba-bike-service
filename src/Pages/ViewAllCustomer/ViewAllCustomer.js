import React, { useState, useEffect } from 'react';
import { firestore, collection } from '../../firebase';
import { getDocs, query, collection as firestoreCollection } from 'firebase/firestore';
import Navbar from '../../Components/Navbar/Navbar';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow, 
    Paper, 
    Button,
    TextField,
    IconButton,
    Collapse,
    Box,
    Typography,
    Chip,
    CircularProgress
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import MopedIcon from '@mui/icons-material/Moped';
import SearchIcon from '@mui/icons-material/Search';

// Row component for expandable details
const Row = ({ vehicle }) => {
    const [open, setOpen] = useState(false);
    
    // Calculate total pending amount
    const totalPending = vehicle.serviceHistory?.reduce((acc, service) => {
        return acc + (Number(service.totalAmount) - Number(service.totalRecieve));
    }, 0) || 0;

    // Get the last service date
    const lastServiceDate = vehicle.serviceHistory?.length > 0 
        ? new Date(vehicle.serviceHistory[vehicle.serviceHistory.length - 1].serviceDate).toLocaleDateString()
        : 'No service record';

    return (
        <>
            <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
                <TableCell>
                    <IconButton
                        aria-label="expand row"
                        size="small"
                        onClick={() => setOpen(!open)}
                    >
                        {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                </TableCell>
                <TableCell component="th" scope="row">{vehicle.name}</TableCell>
                <TableCell>{vehicle.mobileNo}</TableCell>
                <TableCell>
                    {vehicle.vehicleNumber}
                    {vehicle.vehicleType === 'Bike' ? <TwoWheelerIcon sx={{ ml: 1 }} /> : <MopedIcon sx={{ ml: 1 }} />}
                </TableCell>
                <TableCell>{lastServiceDate}</TableCell>
                <TableCell>
                    <Chip 
                        label={`₹${totalPending}`}
                        color={totalPending > 0 ? "error" : "success"}
                    />
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 1 }}>
                            <Typography variant="h6" gutterBottom component="div">
                                Service History
                            </Typography>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Service Date</TableCell>
                                        <TableCell>Service Type</TableCell>
                                        <TableCell>Total KM</TableCell>
                                        <TableCell>Amount</TableCell>
                                        <TableCell>Received</TableCell>
                                        <TableCell>Pending</TableCell>
                                        <TableCell>Service Notes</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {vehicle.serviceHistory?.map((service, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{new Date(service.serviceDate).toLocaleDateString()}</TableCell>
                                            <TableCell>{service.serviceType}</TableCell>
                                            <TableCell>{service.totalKM}</TableCell>
                                            <TableCell>₹{service.totalAmount}</TableCell>
                                            <TableCell>₹{service.totalRecieve}</TableCell>
                                            <TableCell>
                                                <Chip 
                                                    label={`₹${Number(service.totalAmount) - Number(service.totalRecieve)}`}
                                                    color={(Number(service.totalAmount) - Number(service.totalRecieve)) > 0 ? "error" : "success"}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>{service.serviceNote || '-'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Vehicle Details
                                </Typography>
                                <Typography variant="body2">
                                    Engine Number: {vehicle.engineNumber || 'N/A'}<br />
                                    Chassis Number: {vehicle.chesiNumber || 'N/A'}<br />
                                    Vehicle Type: {vehicle.vehicleType}<br />
                                    Total Services: {vehicle.serviceHistory?.length || 0}
                                </Typography>
                            </Box>
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </>
    );
};

const ViewAllCustomer = () => {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredVehicles, setFilteredVehicles] = useState([]);

    useEffect(() => {
        const fetchVehicles = async () => {
            try {
                const vehiclesCollection = firestoreCollection(firestore, 'vehicles');
                const vehiclesSnapshot = await getDocs(vehiclesCollection);
                const vehiclesList = vehiclesSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setVehicles(vehiclesList);
                setFilteredVehicles(vehiclesList);
            } catch (err) {
                console.error('Error fetching vehicles:', err);
                setError('Failed to load vehicle data');
            } finally {
                setLoading(false);
            }
        };

        fetchVehicles();
    }, []);

    useEffect(() => {
        const filtered = vehicles.filter(vehicle => 
            vehicle.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            vehicle.vehicleNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            vehicle.mobileNo?.includes(searchTerm)
        );
        setFilteredVehicles(filtered);
    }, [searchTerm, vehicles]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <CircularProgress />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Typography color="error">{error}</Typography>
            </div>
        );
    }

    return (
        <div>
            <Navbar />
            <div className="container mx-auto px-4 py-8">
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4" component="h1">
                        Customer Service Records
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <SearchIcon sx={{ mr: 1 }} />
                        <TextField
                            variant="outlined"
                            size="small"
                            placeholder="Search by name, vehicle number, or phone"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </Box>
                </Box>

                <TableContainer component={Paper}>
                    <Table aria-label="collapsible table">
                        <TableHead>
                            <TableRow>
                                <TableCell />
                                <TableCell>Customer Name</TableCell>
                                <TableCell>Mobile</TableCell>
                                <TableCell>Vehicle Number</TableCell>
                                <TableCell>Last Service</TableCell>
                                <TableCell>Total Pending</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredVehicles.map((vehicle) => (
                                <Row key={vehicle.id} vehicle={vehicle} />
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </div>
        </div>
    );
};

export default ViewAllCustomer; 
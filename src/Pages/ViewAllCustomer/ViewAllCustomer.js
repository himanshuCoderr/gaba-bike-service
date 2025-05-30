import React, { useState, useEffect, useMemo } from 'react';
import { firestore, collection } from '../../firebase';
import { getDocs, query, collection as firestoreCollection, where, doc, updateDoc, deleteDoc } from 'firebase/firestore';
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
    CircularProgress,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Grid,
    Card,
    CardContent,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Tooltip,
    Badge,
    TableSortLabel,
    Menu,
    Divider,
    ToggleButton,
    ToggleButtonGroup,
    Stack,
    ListItemIcon,
    Alert,
    FormLabel,
    RadioGroup,
    FormControlLabel,
    Radio
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import MopedIcon from '@mui/icons-material/Moped';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import CallIcon from '@mui/icons-material/Call';
import NotificationsIcon from '@mui/icons-material/Notifications';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import PhoneCallback from '@mui/icons-material/PhoneCallback';
import GetApp from '@mui/icons-material/GetApp';
import Print from '@mui/icons-material/Print';
import History from '@mui/icons-material/History';
import Timeline from '@mui/icons-material/Timeline';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { createFollowUpFromService } from '../../firebase/followUpOperations';

// Add this utility function at the top of the file
const calculateServiceDue = (vehicle) => {
    if (!vehicle.serviceHistory?.length) return { isDue: false, reason: 'No service history' };

    const lastService = vehicle.serviceHistory[vehicle.serviceHistory.length - 1];
    const lastServiceDate = new Date(lastService.serviceDate);
    const today = new Date();
    const daysSinceLastService = Math.floor((today - lastServiceDate) / (1000 * 60 * 60 * 24));

    // Service intervals based on vehicle type
    const serviceIntervals = {
        Bike: {
            days: 60,  // 2 months for bikes
            km: 2000   // 2000 km for bikes
        },
        Scooty: {
            days: 60,  // 2 months for scooters
            km: 2000   // 2000 km for scooters
        }
    };

    const interval = serviceIntervals[vehicle.vehicleType] || { days: 60, km: 2000 }; // Default to 60 days

    // Check if service is due based on time
    const isDueByTime = daysSinceLastService > interval.days;

    // Check if service is due based on KM (if we have the current KM reading)
    const lastKM = Number(lastService.totalKM);
    const kmThreshold = lastKM + interval.km;
    const isDueByKM = vehicle.currentKM && Number(vehicle.currentKM) > kmThreshold;

    // Determine service due status and reason
    if (isDueByTime && isDueByKM) {
        return {
            isDue: true,
            reason: `Due by both time (${daysSinceLastService} days) and KM`,
            daysOverdue: daysSinceLastService - interval.days,
            kmOverdue: vehicle.currentKM ? Number(vehicle.currentKM) - kmThreshold : null
        };
    } else if (isDueByTime) {
        return {
            isDue: true,
            reason: `Due by time (${daysSinceLastService} days)`,
            daysOverdue: daysSinceLastService - interval.days
        };
    } else if (isDueByKM) {
        return {
            isDue: true,
            reason: 'Due by KM',
            kmOverdue: Number(vehicle.currentKM) - kmThreshold
        };
    }

    return {
        isDue: false,
        reason: 'Service not due',
        nextDue: new Date(lastServiceDate.getTime() + interval.days * 24 * 60 * 60 * 1000)
    };
};

// Add this utility function for date calculations
const calculateEarnings = (vehicles, timeRange) => {
    const now = new Date();
    const getStartDate = () => {
        const date = new Date();
        switch (timeRange) {
            case 'today':
                date.setHours(0, 0, 0, 0);
                return date;
            case 'week':
                date.setDate(date.getDate() - 7);
                return date;
            case 'month':
                date.setMonth(date.getMonth() - 1);
                return date;
            case '3months':
                date.setMonth(date.getMonth() - 3);
                return date;
            case '6months':
                date.setMonth(date.getMonth() - 6);
                return date;
            case '12months':
                date.setMonth(date.getMonth() - 12);
                return date;
            default:
                return new Date(0); // Beginning of time
        }
    };

    const startDate = getStartDate();
    
    return vehicles.reduce((acc, vehicle) => {
        const servicesInRange = vehicle.serviceHistory?.filter(service => {
            const serviceDate = new Date(service.serviceDate);
            return serviceDate >= startDate && serviceDate <= now;
        }) || [];

        const earnings = servicesInRange.reduce((sum, service) => {
            return sum + Number(service.totalRecieve || 0);
        }, 0);

        const pending = servicesInRange.reduce((sum, service) => {
            return sum + (Number(service.totalAmount || 0) - Number(service.totalRecieve || 0));
        }, 0);

        const totalBilled = servicesInRange.reduce((sum, service) => {
            return sum + Number(service.totalAmount || 0);
        }, 0);

        const serviceCount = servicesInRange.length;

        return {
            received: acc.received + earnings,
            pending: acc.pending + pending,
            total: acc.total + totalBilled,
            serviceCount: acc.serviceCount + serviceCount
        };
    }, { received: 0, pending: 0, total: 0, serviceCount: 0 });
};

// Add new follow-up status types at the top
const FOLLOW_UP_STATUS = {
    PENDING: 'pending',
    CALLED: 'called',
    SCHEDULED: 'scheduled',
    NOT_INTERESTED: 'not_interested',
    NO_RESPONSE: 'no_response',
    CALLBACK_REQUESTED: 'callback_requested'
};

// Add the FollowUpDialog component
const FollowUpDialog = ({ open, onClose, vehicle, onSave }) => {
    const [followUpData, setFollowUpData] = useState({
        status: FOLLOW_UP_STATUS.CALLED,
        customerResponse: '',
        notes: '',
        nextFollowUpDate: null,
        scheduleDate: null
    });

    const handleSave = async () => {
        try {
            const timestamp = new Date();
            const callRecord = {
                status: followUpData.status,
                customerResponse: followUpData.customerResponse,
                notes: followUpData.notes,
                timestamp: timestamp,
                nextFollowUpDate: followUpData.status === 'scheduled' 
                    ? followUpData.scheduleDate 
                    : followUpData.nextFollowUpDate
            };

            const followUpRecord = {
                customerId: vehicle.id,
                customerName: vehicle.name,
                phone: vehicle.mobileNo,
                vehicleId: vehicle.id,
                vehicleNumber: vehicle.vehicleNumber,
                vehicleType: vehicle.vehicleType,
                lastServiceDate: vehicle.serviceHistory?.[vehicle.serviceHistory.length - 1]?.serviceDate || null,
                status: followUpData.status,
                customerResponse: followUpData.customerResponse,
                notes: followUpData.notes,
                nextFollowUpDate: callRecord.nextFollowUpDate,
                callHistory: [callRecord],
                createdAt: timestamp,
                updatedAt: timestamp,
                lastCallTimestamp: timestamp,
                serviceDueData: calculateServiceDue(vehicle)
            };

            await createFollowUpFromService(followUpRecord, followUpData.status);
            onClose();
            // Optional: Show success message or refresh data
        } catch (error) {
            console.error('Error saving follow-up:', error);
            // Optional: Show error message
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                Customer Follow-up: {vehicle?.name}
                <Typography variant="subtitle2" color="textSecondary">
                    Vehicle: {vehicle?.vehicleNumber}
                </Typography>
            </DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ mt: 2 }}>
                    <FormControl fullWidth>
                        <InputLabel>Follow-up Status</InputLabel>
                        <Select
                            value={followUpData.status}
                            onChange={(e) => setFollowUpData({ ...followUpData, status: e.target.value })}
                            label="Follow-up Status"
                        >
                            <MenuItem value={FOLLOW_UP_STATUS.CALLED}>Called</MenuItem>
                            <MenuItem value={FOLLOW_UP_STATUS.SCHEDULED}>Service Scheduled</MenuItem>
                            <MenuItem value={FOLLOW_UP_STATUS.NOT_INTERESTED}>Not Interested</MenuItem>
                            <MenuItem value={FOLLOW_UP_STATUS.NO_RESPONSE}>No Response</MenuItem>
                            <MenuItem value={FOLLOW_UP_STATUS.CALLBACK_REQUESTED}>Callback Requested</MenuItem>
                        </Select>
                    </FormControl>

                    <TextField
                        fullWidth
                        multiline
                        rows={2}
                        label="Customer Response"
                        value={followUpData.customerResponse}
                        onChange={(e) => setFollowUpData({ 
                            ...followUpData, 
                            customerResponse: e.target.value 
                        })}
                        placeholder="Enter customer's response..."
                    />

                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Call Notes"
                        value={followUpData.notes}
                        onChange={(e) => setFollowUpData({ 
                            ...followUpData, 
                            notes: e.target.value 
                        })}
                        placeholder="Add detailed notes about the call..."
                    />

                    {followUpData.status === FOLLOW_UP_STATUS.CALLBACK_REQUESTED && (
                        <TextField
                            fullWidth
                            type="datetime-local"
                            label="Next Follow-up Date"
                            value={followUpData.nextFollowUpDate || ''}
                            onChange={(e) => setFollowUpData({
                                ...followUpData,
                                nextFollowUpDate: e.target.value
                            })}
                            InputLabelProps={{ shrink: true }}
                        />
                    )}

                    {followUpData.status === FOLLOW_UP_STATUS.SCHEDULED && (
                        <TextField
                            fullWidth
                            type="date"
                            label="Service Schedule Date"
                            value={followUpData.scheduleDate || ''}
                            onChange={(e) => setFollowUpData({
                                ...followUpData,
                                scheduleDate: e.target.value
                            })}
                            InputLabelProps={{ shrink: true }}
                        />
                    )}
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave} variant="contained" color="primary">
                    Save Follow-up
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// Add EditCustomerDialog component before the Row component
const EditCustomerDialog = ({ open, onClose, vehicle, onSave }) => {
    const [customerData, setCustomerData] = useState({
        name: vehicle?.name || '',
        mobileNo: vehicle?.mobileNo || '',
        vehicleNumber: vehicle?.vehicleNumber || '',
        engineNumber: vehicle?.engineNumber || '',
        chesiNumber: vehicle?.chesiNumber || '',
        vehicleType: vehicle?.vehicleType || 'Bike'
    });

    const handleSave = async () => {
        try {
            const vehicleRef = doc(firestore, 'vehicles', vehicle.id);
            await updateDoc(vehicleRef, {
                ...customerData,
                updatedAt: new Date().toISOString()
            });
            onSave(customerData);
            onClose();
        } catch (error) {
            console.error('Error updating customer:', error);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Edit Customer Details</DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ mt: 2 }}>
                    <TextField
                        fullWidth
                        label="Customer Name"
                        value={customerData.name}
                        onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                    />
                    <TextField
                        fullWidth
                        label="Mobile Number"
                        value={customerData.mobileNo}
                        onChange={(e) => setCustomerData({ ...customerData, mobileNo: e.target.value })}
                    />
                    <TextField
                        fullWidth
                        label="Vehicle Number"
                        value={customerData.vehicleNumber}
                        onChange={(e) => setCustomerData({ ...customerData, vehicleNumber: e.target.value })}
                    />
                    <TextField
                        fullWidth
                        label="Engine Number"
                        value={customerData.engineNumber}
                        onChange={(e) => setCustomerData({ ...customerData, engineNumber: e.target.value })}
                    />
                    <TextField
                        fullWidth
                        label="Chassis Number"
                        value={customerData.chesiNumber}
                        onChange={(e) => setCustomerData({ ...customerData, chesiNumber: e.target.value })}
                    />
                    <FormControl fullWidth>
                        <InputLabel>Vehicle Type</InputLabel>
                        <Select
                            value={customerData.vehicleType}
                            onChange={(e) => setCustomerData({ ...customerData, vehicleType: e.target.value })}
                            label="Vehicle Type"
                        >
                            <MenuItem value="Bike">Bike</MenuItem>
                            <MenuItem value="Scooty">Scooty</MenuItem>
                        </Select>
                    </FormControl>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave} variant="contained" color="primary">
                    Save Changes
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// Add EditServiceDialog component before the Row component
const EditServiceDialog = ({ open, onClose, service, onSave }) => {
    const [serviceData, setServiceData] = useState({
        serviceType: service?.serviceType || '',
        totalKM: service?.totalKM || '',
        serviceDate: service?.serviceDate || new Date().toISOString().split('T')[0],
        totalAmount: service?.totalAmount || '',
        totalRecieve: service?.totalRecieve || '',
        serviceNote: service?.serviceNote || ''
    });

    const handleSave = () => {
        onSave(serviceData);
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Edit Service Details</DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ mt: 2 }}>
                    <FormControl component="fieldset">
                        <FormLabel component="legend">Service Type</FormLabel>
                        <RadioGroup
                            name="serviceType"
                            value={serviceData.serviceType}
                            onChange={(e) => setServiceData({ ...serviceData, serviceType: e.target.value })}
                        >
                            <FormControlLabel value="Paid Regular Service" control={<Radio />} label="Paid Regular Service" />
                            <FormControlLabel value="General Repair" control={<Radio />} label="General Repair" />
                        </RadioGroup>
                    </FormControl>

                    <TextField
                        fullWidth
                        label="Total KM"
                        type="number"
                        value={serviceData.totalKM}
                        onChange={(e) => setServiceData({ ...serviceData, totalKM: e.target.value })}
                    />

                    <TextField
                        fullWidth
                        label="Service Date"
                        type="date"
                        value={serviceData.serviceDate}
                        onChange={(e) => setServiceData({ ...serviceData, serviceDate: e.target.value })}
                        InputLabelProps={{ shrink: true }}
                    />

                    <TextField
                        fullWidth
                        label="Total Amount"
                        type="number"
                        value={serviceData.totalAmount}
                        onChange={(e) => setServiceData({ ...serviceData, totalAmount: e.target.value })}
                    />

                    <TextField
                        fullWidth
                        label="Amount Received"
                        type="number"
                        value={serviceData.totalRecieve}
                        onChange={(e) => setServiceData({ ...serviceData, totalRecieve: e.target.value })}
                    />

                    <TextField
                        fullWidth
                        label="Service Notes"
                        multiline
                        rows={4}
                        value={serviceData.serviceNote}
                        onChange={(e) => setServiceData({ ...serviceData, serviceNote: e.target.value })}
                    />
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave} variant="contained" color="primary">
                    Save Changes
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// Add DeleteConfirmationDialog component before EditServiceDialog
const DeleteConfirmationDialog = ({ open, onClose, onConfirm, serviceDate }) => {
    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogContent>
                <Typography>
                    Are you sure you want to delete the service record from {new Date(serviceDate).toLocaleDateString()}?
                    This action cannot be undone.
                </Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={onConfirm} color="error" variant="contained">
                    Delete
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// Add DeleteCustomerDialog component before the Row component
const DeleteCustomerDialog = ({ open, onClose, onConfirm, customerName, vehicleNumber }) => {
    const [confirmText, setConfirmText] = useState('');
    const expectedText = 'DELETE';

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Delete Customer Record</DialogTitle>
            <DialogContent>
                <Stack spacing={2}>
                    <Alert severity="warning">
                        This action will permanently delete:
                        <ul>
                            <li>Customer details</li>
                            <li>All service history records</li>
                            <li>Associated follow-ups</li>
                        </ul>
                        This action cannot be undone.
                    </Alert>
                    <Typography>
                        Customer: <strong>{customerName}</strong><br />
                        Vehicle Number: <strong>{vehicleNumber}</strong>
                    </Typography>
                    <Typography variant="body2" color="error">
                        To confirm deletion, type "DELETE" in the field below:
                    </Typography>
                    <TextField
                        fullWidth
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder="Type DELETE to confirm"
                    />
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button 
                    onClick={onConfirm}
                    color="error" 
                    variant="contained"
                    disabled={confirmText !== expectedText}
                >
                    Delete Customer Record
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// Statistics Component
const Statistics = ({ vehicles }) => {
    const [earningsTimeRange, setEarningsTimeRange] = useState('month');
    const earnings = calculateEarnings(vehicles, earningsTimeRange);

    // Calculate service due statistics using the calculateServiceDue function
    const dueServiceStats = vehicles.reduce((acc, vehicle) => {
        const serviceStatus = calculateServiceDue(vehicle);
        if (serviceStatus.isDue) {
            acc.total += 1;
            if (vehicle.vehicleType === 'Bike') {
                acc.bikes += 1;
            } else if (vehicle.vehicleType === 'Scooty') {
                acc.scooters += 1;
            }
            
            // Add overdue days categorization
            if (serviceStatus.daysOverdue > 30) {
                acc.criticalOverdue += 1;
            } else if (serviceStatus.daysOverdue > 15) {
                acc.highOverdue += 1;
            }
        }
        return acc;
    }, { total: 0, bikes: 0, scooters: 0, criticalOverdue: 0, highOverdue: 0 });

    const stats = {
        totalCustomers: vehicles.length,
        totalPending: vehicles.reduce((acc, vehicle) => {
            const pending = vehicle.serviceHistory?.reduce((sum, service) => 
                sum + (Number(service.totalAmount) - Number(service.totalRecieve)), 0) || 0;
            return acc + pending;
        }, 0),
        totalServices: vehicles.reduce((acc, vehicle) => 
            acc + (vehicle.serviceHistory?.length || 0), 0),
        upcomingServices: dueServiceStats.total,
        servicesDueByType: {
            Bike: dueServiceStats.bikes,
            Scooty: dueServiceStats.scooters
        },
        overdueCategories: {
            critical: dueServiceStats.criticalOverdue,
            high: dueServiceStats.highOverdue
        }
    };

    return (
        <>
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6" color="textSecondary">
                                    <MonetizationOnIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                                    Earnings Overview
                                </Typography>
                                <ToggleButtonGroup
                                    value={earningsTimeRange}
                                    exclusive
                                    onChange={(e, newValue) => newValue && setEarningsTimeRange(newValue)}
                                    size="small"
                                >
                                    <ToggleButton value="today">Today</ToggleButton>
                                    <ToggleButton value="week">Week</ToggleButton>
                                    <ToggleButton value="month">Month</ToggleButton>
                                    <ToggleButton value="3months">3 Months</ToggleButton>
                                    <ToggleButton value="6months">6 Months</ToggleButton>
                                    <ToggleButton value="12months">Year</ToggleButton>
                                </ToggleButtonGroup>
                            </Box>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={3}>
                                    <Typography color="textSecondary">Total Billed</Typography>
                                    <Typography variant="h4">₹{earnings.total}</Typography>
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    <Typography color="textSecondary">Received</Typography>
                                    <Typography variant="h4" color="success.main">₹{earnings.received}</Typography>
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    <Typography color="textSecondary">Pending</Typography>
                                    <Typography variant="h4" color="error.main">₹{earnings.pending}</Typography>
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    <Typography color="textSecondary">Services Done</Typography>
                                    <Typography variant="h4">{earnings.serviceCount}</Typography>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>Total Customers</Typography>
                            <Typography variant="h4">{stats.totalCustomers}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>Total Pending Amount</Typography>
                            <Typography variant="h4">₹{stats.totalPending}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>Total Services</Typography>
                            <Typography variant="h4">{stats.totalServices}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>Due for Service</Typography>
                            <Typography variant="h4">{stats.upcomingServices}</Typography>
                            <Typography variant="body2" color="textSecondary">
                                Bikes: {stats.servicesDueByType.Bike}<br />
                                Scooters: {stats.servicesDueByType.Scooty}
                            </Typography>
                            {(stats.overdueCategories.critical > 0 || stats.overdueCategories.high > 0) && (
                                <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                                    {stats.overdueCategories.critical > 0 && 
                                        `Critical (>30 days): ${stats.overdueCategories.critical}`}<br />
                                    {stats.overdueCategories.high > 0 && 
                                        `High (>15 days): ${stats.overdueCategories.high}`}
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </>
    );
};

// Add FilterStatistics component before the ViewAllCustomer component
const FilterStatistics = ({ vehicles, currentFilters }) => {
    const stats = useMemo(() => {
        let filteredVehicles = [...vehicles];
        
        // Apply current filters
        if (currentFilters.vehicleType !== 'all') {
            filteredVehicles = filteredVehicles.filter(v => v.vehicleType === currentFilters.vehicleType);
        }

        if (currentFilters.serviceType !== 'all') {
            filteredVehicles = filteredVehicles.filter(v => {
                const lastService = v.serviceHistory?.[v.serviceHistory.length - 1];
                return lastService?.serviceType === currentFilters.serviceType;
            });
        }

        if (currentFilters.serviceStatus !== 'all') {
            filteredVehicles = filteredVehicles.filter(v => {
                const serviceStatus = calculateServiceDue(v);
                if (currentFilters.serviceStatus === 'due') {
                    return serviceStatus.isDue;
                } else if (currentFilters.serviceStatus === 'upcoming') {
                    return !serviceStatus.isDue && serviceStatus.nextDue && 
                        (new Date(serviceStatus.nextDue) - new Date()) / (1000 * 60 * 60 * 24) <= 15;
                }
                return true;
            });
        }

        if (currentFilters.paymentStatus !== 'all') {
            filteredVehicles = filteredVehicles.filter(v => {
                const totalPending = v.serviceHistory?.reduce((acc, service) => 
                    acc + (Number(service.totalAmount) - Number(service.totalRecieve)), 0) || 0;
                return currentFilters.paymentStatus === 'pending' ? totalPending > 0 : totalPending === 0;
            });
        }

        // Calculate statistics
        const totalEarnings = filteredVehicles.reduce((acc, v) => {
            return acc + (v.serviceHistory?.reduce((sum, service) => 
                sum + Number(service.totalRecieve || 0), 0) || 0);
        }, 0);

        const totalPending = filteredVehicles.reduce((acc, v) => {
            return acc + (v.serviceHistory?.reduce((sum, service) => 
                sum + (Number(service.totalAmount || 0) - Number(service.totalRecieve || 0)), 0) || 0);
        }, 0);

        const totalServices = filteredVehicles.reduce((acc, v) => 
            acc + (v.serviceHistory?.length || 0), 0);

        const servicesDue = filteredVehicles.filter(v => 
            calculateServiceDue(v).isDue).length;

        return {
            customerCount: filteredVehicles.length,
            totalEarnings,
            totalPending,
            totalServices,
            servicesDue,
            averageServiceValue: totalServices ? (totalEarnings / totalServices).toFixed(2) : 0
        };
    }, [vehicles, currentFilters]);

    return (
        <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>
                Filter Summary
            </Typography>
            <Grid container spacing={2}>
                <Grid item xs={6}>
                    <Card variant="outlined">
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Customers
                            </Typography>
                            <Typography variant="h5">
                                {stats.customerCount}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={6}>
                    <Card variant="outlined">
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Total Services
                            </Typography>
                            <Typography variant="h5">
                                {stats.totalServices}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={6}>
                    <Card variant="outlined">
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Total Earnings
                            </Typography>
                            <Typography variant="h5" color="success.main">
                                ₹{stats.totalEarnings}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={6}>
                    <Card variant="outlined">
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Total Pending
                            </Typography>
                            <Typography variant="h5" color="error.main">
                                ₹{stats.totalPending}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={6}>
                    <Card variant="outlined">
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Services Due
                            </Typography>
                            <Typography variant="h5" color="warning.main">
                                {stats.servicesDue}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={6}>
                    <Card variant="outlined">
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Avg. Service Value
                            </Typography>
                            <Typography variant="h5">
                                ₹{stats.averageServiceValue}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

// Row component for expandable details
const Row = ({ vehicle, onServiceReminder, onCustomerUpdate, serialNumber }) => {
    const [open, setOpen] = useState(false);
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [serviceHistorySort, setServiceHistorySort] = useState({
        field: 'serviceDate',
        direction: 'desc'
    });
    const [followUpStatus, setFollowUpStatus] = useState(null);
    const [alertMessage, setAlertMessage] = useState(null);
    const [followUpDialogOpen, setFollowUpDialogOpen] = useState(false);
    const [followUpFormData, setFollowUpFormData] = useState({
        status: FOLLOW_UP_STATUS.CALLED,
        customerResponse: '',
        notes: '',
        nextFollowUpDate: null,
        scheduleDate: null
    });
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editServiceDialogOpen, setEditServiceDialogOpen] = useState(false);
    const [selectedService, setSelectedService] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [serviceToDelete, setServiceToDelete] = useState(null);
    const [deleteCustomerDialogOpen, setDeleteCustomerDialogOpen] = useState(false);
    
    const totalPending = vehicle.serviceHistory?.reduce((acc, service) => {
        return acc + (Number(service.totalAmount) - Number(service.totalRecieve));
    }, 0) || 0;

    const serviceDueStatus = calculateServiceDue(vehicle);

    // Add status indicator component
    const ServiceDueIndicator = () => {
        if (!serviceDueStatus.isDue) return null;

        let color = 'warning';
        let label = 'Due';
        let icon = <NotificationsIcon fontSize="small" />;

        if (serviceDueStatus.daysOverdue > 30) {
            color = 'error';
            label = 'Critical';
        } else if (serviceDueStatus.daysOverdue > 15) {
            color = 'warning';
            label = 'High';
        }

        return (
            <Tooltip title={`${label}: ${serviceDueStatus.daysOverdue} days overdue - ${serviceDueStatus.reason}`}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <Chip
                        icon={icon}
                        label={label}
                        color={color}
                        size="small"
                        sx={{ minWidth: 85 }}
                    />
                    {serviceDueStatus.kmOverdue && (
                        <Typography variant="caption" color="text.secondary">
                            ({serviceDueStatus.kmOverdue}km over)
                        </Typography>
                    )}
                </Stack>
            </Tooltip>
        );
    };

    const lastServiceDate = vehicle.serviceHistory?.length > 0 
        ? new Date(vehicle.serviceHistory[vehicle.serviceHistory.length - 1].serviceDate)
        : null;

    const handleWhatsApp = () => {
        const message = `Dear ${vehicle.name}, your vehicle (${vehicle.vehicleNumber}) is due for service. Please visit our service center soon.`;
        window.open(`https://wa.me/${vehicle.mobileNo}?text=${encodeURIComponent(message)}`);
    };

    const handleCall = () => {
        window.location.href = `tel:${vehicle.mobileNo}`;
    };

    const handleServiceHistorySort = (field) => {
        setServiceHistorySort(prev => ({
            field,
            direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    // Sort service history based on current sort config
    const sortedServiceHistory = [...(vehicle.serviceHistory || [])].sort((a, b) => {
        let aValue, bValue;
        
        switch (serviceHistorySort.field) {
            case 'serviceDate':
                aValue = new Date(a.serviceDate).getTime();
                bValue = new Date(b.serviceDate).getTime();
                break;
            case 'totalKM':
                aValue = Number(a.totalKM) || 0;
                bValue = Number(b.totalKM) || 0;
                break;
            case 'totalAmount':
                aValue = Number(a.totalAmount) || 0;
                bValue = Number(b.totalAmount) || 0;
                break;
            case 'pending':
                aValue = Number(a.totalAmount || 0) - Number(a.totalRecieve || 0);
                bValue = Number(b.totalAmount || 0) - Number(b.totalRecieve || 0);
                break;
            default:
                aValue = a[serviceHistorySort.field];
                bValue = b[serviceHistorySort.field];
        }

        if (serviceHistorySort.direction === 'asc') {
            return aValue > bValue ? 1 : -1;
        } else {
            return aValue < bValue ? 1 : -1;
        }
    });

    const handleFollowUpClick = () => {
        if (followUpStatus) {
            // Show info message that follow-up already exists
            setAlertMessage({
                type: 'info',
                text: 'This customer already has an active follow-up. Please manage it from the Follow-up Dashboard.'
            });
        } else {
            setFollowUpDialogOpen(true);
        }
        setMenuAnchor(null);
    };

    const handleFollowUpSubmit = async (e) => {
        e.preventDefault();
        try {
            const serviceData = {
                customerId: vehicle.id,
                customerName: vehicle.name,
                mobileNo: vehicle.mobileNo,
                vehicleId: vehicle.id,
                vehicleNumber: vehicle.vehicleNumber,
                vehicleType: vehicle.vehicleType,
                serviceDate: new Date().toISOString(),
                serviceDueData: serviceDueStatus
            };

            await createFollowUpFromService(serviceData, followUpFormData.status);
            // Show success message or update UI
        } catch (error) {
            console.error('Error saving follow-up:', error);
            // Show error message
        }
    };

    const handleEditSave = (updatedData) => {
        onCustomerUpdate(vehicle.id, updatedData);
    };

    const handleEditService = async (updatedService) => {
        try {
            const vehicleRef = doc(firestore, 'vehicles', vehicle.id);
            const updatedServiceHistory = vehicle.serviceHistory.map((service, idx) => 
                idx === selectedService.index ? updatedService : service
            );

            await updateDoc(vehicleRef, {
                serviceHistory: updatedServiceHistory
            });

            // Update local state
            const updatedVehicle = {
                ...vehicle,
                serviceHistory: updatedServiceHistory
            };
            onCustomerUpdate(vehicle.id, updatedVehicle);
            setAlertMessage("Service history updated successfully!");
        } catch (error) {
            console.error('Error updating service history:', error);
            setAlertMessage("Error updating service history.");
        }
    };

    const handleDeleteService = async () => {
        try {
            const vehicleRef = doc(firestore, 'vehicles', vehicle.id);
            const updatedServiceHistory = vehicle.serviceHistory.filter((_, idx) => 
                idx !== serviceToDelete.index
            );

            await updateDoc(vehicleRef, {
                serviceHistory: updatedServiceHistory
            });

            // Update local state
            const updatedVehicle = {
                ...vehicle,
                serviceHistory: updatedServiceHistory
            };
            onCustomerUpdate(vehicle.id, updatedVehicle);
            setAlertMessage("Service history entry deleted successfully!");
            setDeleteDialogOpen(false);
            setServiceToDelete(null);
        } catch (error) {
            console.error('Error deleting service history:', error);
            setAlertMessage("Error deleting service history entry.");
        }
    };

    const handleDeleteCustomer = async () => {
        try {
            // Delete the customer document
            await deleteDoc(doc(firestore, 'vehicles', vehicle.id));

            // Delete any associated follow-ups
            const followUpsRef = collection(firestore, 'followUps');
            const followUpQuery = query(followUpsRef, where('vehicleId', '==', vehicle.id));
            const followUpSnapshot = await getDocs(followUpQuery);
            
            const deletePromises = followUpSnapshot.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(deletePromises);

            // Update UI through parent component
            onCustomerUpdate(vehicle.id, null); // null indicates deletion
            setAlertMessage("Customer record deleted successfully!");
            setDeleteCustomerDialogOpen(false);
        } catch (error) {
            console.error('Error deleting customer:', error);
            setAlertMessage("Error deleting customer record.");
        }
    };

    // Add useEffect to fetch follow-up status
    useEffect(() => {
        const fetchFollowUpStatus = async () => {
            try {
                const followUpsRef = collection(firestore, 'followUps');
                const q = query(followUpsRef, 
                    where('vehicleId', '==', vehicle.id),
                    where('status', 'in', ['pending', 'callback_requested', 'scheduled'])
                );
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    const followUp = querySnapshot.docs[0].data();
                    setFollowUpStatus(followUp.status);
                }
            } catch (error) {
                console.error('Error fetching follow-up status:', error);
            }
        };

        fetchFollowUpStatus();
    }, [vehicle.id]);

    const getFollowUpStatusColor = (status) => {
        switch (status) {
            case 'pending':
                return 'warning';
            case 'callback_requested':
                return 'info';
            case 'scheduled':
                return 'success';
            default:
                return 'default';
        }
    };

    const getFollowUpStatusLabel = (status) => {
        switch (status) {
            case 'pending':
                return 'Follow-up Pending';
            case 'callback_requested':
                return 'Callback Required';
            case 'scheduled':
                return 'Service Scheduled';
            default:
                return '';
        }
    };

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
                <TableCell>{serialNumber}</TableCell>
                <TableCell component="th" scope="row">
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Typography>{vehicle.name}</Typography>
                        {serviceDueStatus.isDue && <ServiceDueIndicator />}
                        {followUpStatus && (
                            <Tooltip title={getFollowUpStatusLabel(followUpStatus)}>
                                <Chip
                                    size="small"
                                    label={getFollowUpStatusLabel(followUpStatus)}
                                    color={getFollowUpStatusColor(followUpStatus)}
                                    sx={{ ml: 1 }}
                                />
                            </Tooltip>
                        )}
                    </Stack>
                </TableCell>
                <TableCell>
                    {vehicle.mobileNo}
                    <IconButton size="small" onClick={handleWhatsApp}>
                        <WhatsAppIcon color="success" />
                    </IconButton>
                    <IconButton size="small" onClick={handleCall}>
                        <CallIcon color="primary" />
                    </IconButton>
                </TableCell>
                <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                        {vehicle.vehicleNumber}
                        {vehicle.vehicleType === 'Bike' ? <TwoWheelerIcon sx={{ ml: 1 }} /> : <MopedIcon sx={{ ml: 1 }} />}
                    </Stack>
                </TableCell>
                <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                        {lastServiceDate ? lastServiceDate.toLocaleDateString() : 'No service record'}
                        {serviceDueStatus.isDue && (
                            <Tooltip title={`Send service reminder - ${serviceDueStatus.reason}`}>
                                <IconButton size="small" onClick={() => onServiceReminder(vehicle, serviceDueStatus)}>
                                    <NotificationsIcon color={serviceDueStatus.daysOverdue > 30 ? "error" : "warning"} />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Stack>
                </TableCell>
                <TableCell>
                    <Chip 
                        label={`₹${totalPending}`}
                        color={totalPending > 0 ? "error" : "success"}
                    />
                </TableCell>
                <TableCell>
                    <IconButton
                        onClick={(e) => setMenuAnchor(e.currentTarget)}
                        size="small"
                    >
                        <MoreVertIcon />
                    </IconButton>
                    <Menu
                        anchorEl={menuAnchor}
                        open={Boolean(menuAnchor)}
                        onClose={() => setMenuAnchor(null)}
                    >
                        <MenuItem onClick={() => {
                            setEditDialogOpen(true);
                            setMenuAnchor(null);
                        }}>
                            <ListItemIcon>
                                <EditIcon fontSize="small" />
                            </ListItemIcon>
                            Edit Customer Details
                        </MenuItem>
                        <Divider />
                        <MenuItem 
                            onClick={handleFollowUpClick}
                            disabled={followUpStatus !== null}
                        >
                            <ListItemIcon>
                                <PhoneCallback fontSize="small" />
                            </ListItemIcon>
                            {followUpStatus ? 'Follow-up Active' : 'Create Follow-up'}
                        </MenuItem>
                        {followUpStatus && (
                            <MenuItem 
                                onClick={() => {
                                    window.location.href = '/follow-up';
                                    setMenuAnchor(null);
                                }}
                            >
                                <ListItemIcon>
                                    <Timeline fontSize="small" />
                                </ListItemIcon>
                                Manage Follow-up
                            </MenuItem>
                        )}
                        <MenuItem onClick={() => {/* TODO: Export service history */}}>
                            <ListItemIcon>
                                <GetApp fontSize="small" />
                            </ListItemIcon>
                            Export Service History
                        </MenuItem>
                        <MenuItem onClick={() => {/* TODO: Print invoice */}}>
                            <ListItemIcon>
                                <Print fontSize="small" />
                            </ListItemIcon>
                            Print Latest Invoice
                        </MenuItem>
                        <Divider />
                        <MenuItem 
                            onClick={() => {
                                setDeleteCustomerDialogOpen(true);
                                setMenuAnchor(null);
                            }}
                            sx={{ color: 'error.main' }}
                        >
                            <ListItemIcon>
                                <DeleteIcon fontSize="small" color="error" />
                            </ListItemIcon>
                            Delete Customer Record
                        </MenuItem>
                    </Menu>
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 1 }}>
                            {alertMessage && (
                                <Alert 
                                    severity={alertMessage.includes("successfully") ? "success" : "error"}
                                    sx={{ mb: 2 }}
                                    onClose={() => setAlertMessage(null)}
                                >
                                    {alertMessage}
                                </Alert>
                            )}
                            <Typography variant="h6" gutterBottom component="div">
                                Service History
                            </Typography>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Sr. No.</TableCell>
                                        <TableCell>Service Date</TableCell>
                                        <TableCell>Service Type</TableCell>
                                        <TableCell>Total KM</TableCell>
                                        <TableCell>Amount</TableCell>
                                        <TableCell>Received</TableCell>
                                        <TableCell>Pending</TableCell>
                                        <TableCell>Service Notes</TableCell>
                                        <TableCell>Next Service Due</TableCell>
                                        <TableCell>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {sortedServiceHistory.map((service, index) => {
                                        const serviceDate = new Date(service.serviceDate);
                                        const nextServiceDue = new Date(serviceDate);
                                        nextServiceDue.setMonth(nextServiceDue.getMonth() + 3);
                                        
                                        return (
                                            <TableRow key={index}>
                                                <TableCell>{index + 1}</TableCell>
                                                <TableCell>{serviceDate.toLocaleDateString()}</TableCell>
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
                                                <TableCell>
                                                    <Tooltip title={nextServiceDue.toLocaleDateString()}>
                                                        <CalendarTodayIcon 
                                                            color={new Date() > nextServiceDue ? "error" : "success"}
                                                            fontSize="small"
                                                        />
                                                    </Tooltip>
                                                </TableCell>
                                                <TableCell>
                                                    <Stack direction="row" spacing={1}>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => {
                                                                setSelectedService({ ...service, index });
                                                                setEditServiceDialogOpen(true);
                                                            }}
                                                        >
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={() => {
                                                                setServiceToDelete({ ...service, index });
                                                                setDeleteDialogOpen(true);
                                                            }}
                                                        >
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </Stack>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
            <FollowUpDialog
                open={followUpDialogOpen}
                onClose={() => setFollowUpDialogOpen(false)}
                vehicle={vehicle}
                onSave={handleFollowUpSubmit}
            />
            <EditCustomerDialog
                open={editDialogOpen}
                onClose={() => setEditDialogOpen(false)}
                vehicle={vehicle}
                onSave={handleEditSave}
            />
            {selectedService && (
                <EditServiceDialog
                    open={editServiceDialogOpen}
                    onClose={() => {
                        setEditServiceDialogOpen(false);
                        setSelectedService(null);
                    }}
                    service={selectedService}
                    onSave={handleEditService}
                />
            )}
            {serviceToDelete && (
                <DeleteConfirmationDialog
                    open={deleteDialogOpen}
                    onClose={() => {
                        setDeleteDialogOpen(false);
                        setServiceToDelete(null);
                    }}
                    onConfirm={handleDeleteService}
                    serviceDate={serviceToDelete.serviceDate}
                />
            )}
            <DeleteCustomerDialog
                open={deleteCustomerDialogOpen}
                onClose={() => setDeleteCustomerDialogOpen(false)}
                onConfirm={handleDeleteCustomer}
                customerName={vehicle.name}
                vehicleNumber={vehicle.vehicleNumber}
            />
        </>
    );
};

const ViewAllCustomer = () => {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredVehicles, setFilteredVehicles] = useState([]);
    const [filterAnchor, setFilterAnchor] = useState(null);
    const [filters, setFilters] = useState({
        vehicleType: 'all',
        serviceStatus: 'all',
        paymentStatus: 'all',
        followUpStatus: 'all',
        dateRange: 'all',
        serviceType: 'all'
    });
    const [sortConfig, setSortConfig] = useState({
        field: 'name',
        direction: 'asc'
    });
    const [reminderDialog, setReminderDialog] = useState({
        open: false,
        vehicle: null
    });

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
        let filtered = [...vehicles];

        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(vehicle => 
                vehicle.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                vehicle.vehicleNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                vehicle.mobileNo?.includes(searchTerm)
            );
        }

        // Apply vehicle type filter
        if (filters.vehicleType !== 'all') {
            filtered = filtered.filter(vehicle => vehicle.vehicleType === filters.vehicleType);
        }

        // Apply service type filter
        if (filters.serviceType !== 'all') {
            filtered = filtered.filter(vehicle => {
                const lastService = vehicle.serviceHistory?.[vehicle.serviceHistory.length - 1];
                return lastService?.serviceType === filters.serviceType;
            });
        }

        // Apply service status filter
        if (filters.serviceStatus !== 'all') {
            filtered = filtered.filter(vehicle => {
                const serviceStatus = calculateServiceDue(vehicle);
                if (filters.serviceStatus === 'due') {
                    return serviceStatus.isDue;
                } else if (filters.serviceStatus === 'upcoming') {
                    return !serviceStatus.isDue && serviceStatus.nextDue && 
                        (new Date(serviceStatus.nextDue) - new Date()) / (1000 * 60 * 60 * 24) <= 15;
                }
                return true;
            });
        }

        // Apply payment status filter
        if (filters.paymentStatus !== 'all') {
            filtered = filtered.filter(vehicle => {
                const totalPending = vehicle.serviceHistory?.reduce((acc, service) => 
                    acc + (Number(service.totalAmount) - Number(service.totalRecieve)), 0) || 0;
                return filters.paymentStatus === 'pending' ? totalPending > 0 : totalPending === 0;
            });
        }

        // Apply sorting
        filtered.sort((a, b) => {
            let aValue, bValue;
            
            switch (sortConfig.field) {
                case 'name':
                    aValue = a.name || '';
                    bValue = b.name || '';
                    break;
                case 'lastService':
                    aValue = a.serviceHistory?.slice(-1)[0]?.serviceDate || '0';
                    bValue = b.serviceHistory?.slice(-1)[0]?.serviceDate || '0';
                    break;
                case 'pendingAmount':
                    aValue = a.serviceHistory?.reduce((acc, service) => 
                        acc + (Number(service.totalAmount) - Number(service.totalRecieve)), 0) || 0;
                    bValue = b.serviceHistory?.reduce((acc, service) => 
                        acc + (Number(service.totalAmount) - Number(service.totalRecieve)), 0) || 0;
                    break;
                default:
                    aValue = a[sortConfig.field] || '';
                    bValue = b[sortConfig.field] || '';
            }

            if (sortConfig.direction === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        setFilteredVehicles(filtered);
    }, [searchTerm, filters, vehicles, sortConfig]);

    const handleSort = (field) => {
        setSortConfig(prev => ({
            field,
            direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handleServiceReminder = (vehicle) => {
        setReminderDialog({
            open: true,
            vehicle
        });
    };

    const handleCustomerUpdate = (vehicleId, updatedData) => {
        if (updatedData === null) {
            // Handle deletion
            setVehicles(vehicles.filter(v => v.id !== vehicleId));
            setFilteredVehicles(filteredVehicles.filter(v => v.id !== vehicleId));
        } else {
            // Handle update
            const updatedVehicles = vehicles.map(vehicle => 
                vehicle.id === vehicleId ? { ...vehicle, ...updatedData } : vehicle
            );
            setVehicles(updatedVehicles);
            setFilteredVehicles(updatedVehicles);
        }
    };

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
                {/* Statistics Dashboard */}
                <Statistics vehicles={vehicles} />

                {/* Search and Filters */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4" component="h1">
                        Customer Service Records
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
                        <Button
                            startIcon={<FilterListIcon />}
                            onClick={(e) => setFilterAnchor(e.currentTarget)}
                        >
                            Filters
                        </Button>
                    </Box>
                </Box>

                {/* Filter Menu */}
                <Menu
                    anchorEl={filterAnchor}
                    open={Boolean(filterAnchor)}
                    onClose={() => setFilterAnchor(null)}
                    PaperProps={{
                        sx: { width: '400px' }
                    }}
                >
                    <Box sx={{ p: 2 }}>
                        <Stack spacing={2}>
                            <Typography variant="h6">Filters</Typography>
                            
                            <FormControl fullWidth>
                                <InputLabel>Vehicle Type</InputLabel>
                                <Select
                                    value={filters.vehicleType}
                                    onChange={(e) => setFilters({ ...filters, vehicleType: e.target.value })}
                                >
                                    <MenuItem value="all">All Types</MenuItem>
                                    <MenuItem value="Bike">Bike</MenuItem>
                                    <MenuItem value="Scooty">Scooty</MenuItem>
                                </Select>
                            </FormControl>

                            <FormControl fullWidth>
                                <InputLabel>Service Type</InputLabel>
                                <Select
                                    value={filters.serviceType}
                                    onChange={(e) => setFilters({ ...filters, serviceType: e.target.value })}
                                >
                                    <MenuItem value="all">All Service Types</MenuItem>
                                    <MenuItem value="Paid Regular Service">Regular Service</MenuItem>
                                    <MenuItem value="General Repair">General Repair</MenuItem>
                                </Select>
                            </FormControl>

                            <FormControl fullWidth>
                                <InputLabel>Service Status</InputLabel>
                                <Select
                                    value={filters.serviceStatus}
                                    onChange={(e) => setFilters({ ...filters, serviceStatus: e.target.value })}
                                >
                                    <MenuItem value="all">All Status</MenuItem>
                                    <MenuItem value="due">Service Due</MenuItem>
                                    <MenuItem value="upcoming">Upcoming Service</MenuItem>
                                </Select>
                            </FormControl>

                            <FormControl fullWidth>
                                <InputLabel>Payment Status</InputLabel>
                                <Select
                                    value={filters.paymentStatus}
                                    onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value })}
                                >
                                    <MenuItem value="all">All Payments</MenuItem>
                                    <MenuItem value="pending">Pending Payments</MenuItem>
                                    <MenuItem value="completed">Completed Payments</MenuItem>
                                </Select>
                            </FormControl>

                            <FormControl fullWidth>
                                <InputLabel>Follow-up Status</InputLabel>
                                <Select
                                    value={filters.followUpStatus}
                                    onChange={(e) => setFilters({ ...filters, followUpStatus: e.target.value })}
                                >
                                    <MenuItem value="all">All Status</MenuItem>
                                    <MenuItem value="pending">Pending Follow-up</MenuItem>
                                    <MenuItem value="called">Called</MenuItem>
                                    <MenuItem value="scheduled">Service Scheduled</MenuItem>
                                    <MenuItem value="callback">Callback Required</MenuItem>
                                </Select>
                            </FormControl>

                            <Divider />
                            
                            <FilterStatistics 
                                vehicles={vehicles} 
                                currentFilters={filters}
                            />

                            <Button 
                                fullWidth 
                                variant="outlined" 
                                onClick={() => {
                                    setFilters({
                                        vehicleType: 'all',
                                        serviceStatus: 'all',
                                        paymentStatus: 'all',
                                        followUpStatus: 'all',
                                        dateRange: 'all',
                                        serviceType: 'all'
                                    });
                                    setFilterAnchor(null);
                                }}
                            >
                                Clear All Filters
                            </Button>
                        </Stack>
                    </Box>
                </Menu>

                {/* Main Table */}
                <TableContainer component={Paper}>
                    <Table aria-label="collapsible table">
                        <TableHead>
                            <TableRow>
                                <TableCell />
                                <TableCell>Sr. No.</TableCell>
                                <TableCell>
                                    <TableSortLabel
                                        active={sortConfig.field === 'name'}
                                        direction={sortConfig.field === 'name' ? sortConfig.direction : 'asc'}
                                        onClick={() => handleSort('name')}
                                    >
                                        Customer Name
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell>Mobile</TableCell>
                                <TableCell>Vehicle Number</TableCell>
                                <TableCell>
                                    <TableSortLabel
                                        active={sortConfig.field === 'lastService'}
                                        direction={sortConfig.field === 'lastService' ? sortConfig.direction : 'asc'}
                                        onClick={() => handleSort('lastService')}
                                    >
                                        Last Service
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell>
                                    <TableSortLabel
                                        active={sortConfig.field === 'pendingAmount'}
                                        direction={sortConfig.field === 'pendingAmount' ? sortConfig.direction : 'asc'}
                                        onClick={() => handleSort('pendingAmount')}
                                    >
                                        Total Pending
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredVehicles.map((vehicle, index) => (
                                <Row 
                                    key={vehicle.id} 
                                    vehicle={vehicle}
                                    onServiceReminder={handleServiceReminder}
                                    onCustomerUpdate={handleCustomerUpdate}
                                    serialNumber={index + 1}
                                />
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Service Reminder Dialog */}
                <Dialog
                    open={reminderDialog.open}
                    onClose={() => setReminderDialog({ open: false, vehicle: null })}
                >
                    <DialogTitle>Send Service Reminder</DialogTitle>
                    <DialogContent>
                        <Typography>
                            Send a service reminder to {reminderDialog.vehicle?.name} for vehicle {reminderDialog.vehicle?.vehicleNumber}?
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                            <Button
                                startIcon={<WhatsAppIcon />}
                                variant="contained"
                                color="success"
                                onClick={() => {
                                    const message = `Dear ${reminderDialog.vehicle?.name}, your vehicle (${reminderDialog.vehicle?.vehicleNumber}) is due for service. Please visit our service center soon.`;
                                    window.open(`https://wa.me/${reminderDialog.vehicle?.mobileNo}?text=${encodeURIComponent(message)}`);
                                    setReminderDialog({ open: false, vehicle: null });
                                }}
                            >
                                Send WhatsApp
                            </Button>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setReminderDialog({ open: false, vehicle: null })}>
                            Cancel
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>
        </div>
    );
};

export default ViewAllCustomer; 
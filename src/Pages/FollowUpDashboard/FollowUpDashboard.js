import React, { useState, useEffect } from 'react';
import { firestore } from '../../firebase';
import { recordFollowUpCall } from '../../firebase/followUpOperations';
import { 
    collection, 
    query, 
    getDocs, 
    where, 
    orderBy, 
    addDoc, 
    Timestamp,
    startOfDay,
    endOfDay,
    deleteDoc,
    doc
} from 'firebase/firestore';
import Navbar from '../../Components/Navbar/Navbar';
import {
    Grid,
    Card,
    CardContent,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    IconButton,
    Box,
    Tab,
    Tabs,
    CircularProgress,
    Button,
    Stack,
    TextField,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Collapse,
    Alert,
    Snackbar
} from '@mui/material';
import {
    Phone as PhoneIcon,
    WhatsApp as WhatsAppIcon,
    Schedule as ScheduleIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    Refresh as RefreshIcon,
    DateRange as DateRangeIcon,
    Assessment as AssessmentIcon,
    Timeline as TimelineIcon,
    KeyboardArrowDown as KeyboardArrowDownIcon,
    KeyboardArrowUp as KeyboardArrowUpIcon,
    Delete as DeleteIcon,
    Search as SearchIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

const FollowUpRow = ({ followUp, onRecordFollowUp, onDeleteFollowUp, index }) => {
    const [open, setOpen] = useState(false);

    const getStatusColor = (status) => {
        const colors = {
            pending: 'warning',
            called: 'info',
            scheduled: 'success',
            not_interested: 'error',
            callback_requested: 'secondary',
            no_response: 'default'
        };
        return colors[status] || 'default';
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
                <TableCell component="th" scope="row">
                    {index + 1}
                </TableCell>
                <TableCell component="th" scope="row">
                    {followUp.customerName}
                </TableCell>
                <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                        {followUp.vehicleNumber}
                        <Chip 
                            label={followUp.vehicleType} 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                        />
                    </Stack>
                </TableCell>
                <TableCell>
                    {followUp.phone}
                    <IconButton size="small" onClick={() => window.open(`tel:${followUp.phone}`)}>
                        <PhoneIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => window.open(`https://wa.me/${followUp.phone}`)}>
                        <WhatsAppIcon fontSize="small" color="success" />
                    </IconButton>
                </TableCell>
                <TableCell>
                    <Chip
                        label={followUp.status}
                        color={getStatusColor(followUp.status)}
                        size="small"
                    />
                </TableCell>
                <TableCell>
                    {followUp.nextFollowUpDate ? new Date(followUp.nextFollowUpDate).toLocaleDateString() : '-'}
                </TableCell>
                <TableCell>
                    <Stack direction="row" spacing={1}>
                        <Tooltip title="Record Follow-up">
                            <IconButton
                                size="small"
                                onClick={onRecordFollowUp}
                                color="primary"
                            >
                                <RefreshIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Follow-up">
                            <IconButton
                                size="small"
                                onClick={() => onDeleteFollowUp(followUp)}
                                color="error"
                            >
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 2 }}>
                            <Typography variant="h6" gutterBottom component="div">
                                Follow-up History
                            </Typography>
                            <Table size="small" aria-label="follow-up history">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Date</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell>Customer Response</TableCell>
                                        <TableCell>Notes</TableCell>
                                        <TableCell>Next Action</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {followUp.callHistory && followUp.callHistory.length > 0 ? (
                                        followUp.callHistory.map((call, index) => (
                                            <TableRow key={index}>
                                                <TableCell>
                                                    {call.timestamp instanceof Date 
                                                        ? formatDistanceToNow(call.timestamp, { addSuffix: true })
                                                        : formatDistanceToNow(new Date(call.timestamp), { addSuffix: true })}
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={call.status}
                                                        color={getStatusColor(call.status)}
                                                        size="small"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2">
                                                        {call.customerResponse || '-'}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2">
                                                        {call.notes || '-'}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    {call.nextFollowUpDate 
                                                        ? new Date(call.nextFollowUpDate).toLocaleDateString() 
                                                        : '-'}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center">
                                                <Typography variant="body2" color="textSecondary">
                                                    No follow-up history available
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                            
                            {/* Service Due Information */}
                            {followUp.serviceDueData && (
                                <Box sx={{ mt: 3 }}>
                                    <Typography variant="subtitle1" gutterBottom>
                                        Service Information
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} md={6}>
                                            <Paper sx={{ p: 2 }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Last Service: {followUp.lastServiceDate 
                                                        ? new Date(followUp.lastServiceDate).toLocaleDateString()
                                                        : 'No record'}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Service Due Status: {followUp.serviceDueData.isDue 
                                                        ? <Chip 
                                                            label={followUp.serviceDueData.reason} 
                                                            color="error" 
                                                            size="small"
                                                          />
                                                        : <Chip 
                                                            label="Not Due" 
                                                            color="success" 
                                                            size="small"
                                                          />
                                                    }
                                                </Typography>
                                            </Paper>
                                        </Grid>
                                    </Grid>
                                </Box>
                            )}
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </>
    );
};

const FollowUpDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [tabValue, setTabValue] = useState(0);
    const [followUps, setFollowUps] = useState([]);
    const [filteredFollowUps, setFilteredFollowUps] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        called: 0,
        scheduled: 0,
        notInterested: 0,
        callbackRequired: 0,
        todayFollowUps: 0,
        conversionRate: 0
    });
    const [dateFilter, setDateFilter] = useState('all_time');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [selectedFollowUp, setSelectedFollowUp] = useState(null);
    const [followUpDialogOpen, setFollowUpDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [followUpToDelete, setFollowUpToDelete] = useState(null);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });
    const [followUpFormData, setFollowUpFormData] = useState({
        status: 'pending',
        notes: '',
        customerResponse: '',
        nextFollowUpDate: '',
        scheduleDate: ''
    });

    useEffect(() => {
        fetchFollowUps();
    }, [dateFilter, customStartDate, customEndDate, tabValue]);

    useEffect(() => {
        filterFollowUps();
    }, [followUps, searchQuery, dateFilter, customStartDate, customEndDate, tabValue]);

    const filterFollowUps = () => {
        let filtered = [...followUps];

        // Apply date filtering
        if (dateFilter !== 'all_time') {
            const { start, end } = getDateRange();
            
            if (dateFilter === 'custom') {
                // For custom range, only filter if both dates are set
                if (customStartDate && customEndDate) {
                    filtered = filtered.filter(followUp => {
                        const followUpDate = followUp.createdAt;
                        return followUpDate >= start && followUpDate <= end;
                    });
                }
            } else {
                // For other date filters (today, week, month)
                filtered = filtered.filter(followUp => {
                    const followUpDate = followUp.createdAt;
                    return followUpDate >= start && followUpDate <= end;
                });
            }
        }

        // Apply status filtering based on selected tab
        if (tabValue === 1) { // Pending
            filtered = filtered.filter(followUp => followUp.status === 'pending');
        } else if (tabValue === 2) { // Scheduled
            filtered = filtered.filter(followUp => followUp.status === 'scheduled');
        } else if (tabValue === 3) { // Callbacks
            filtered = filtered.filter(followUp => followUp.status === 'callback_requested');
        }

        // Apply search filtering
        if (searchQuery.trim()) {
            filtered = filtered.filter(followUp => 
                followUp.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                followUp.vehicleNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                followUp.phone?.includes(searchQuery) ||
                followUp.status?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setFilteredFollowUps(filtered);
        calculateStats(filtered); // Calculate stats based on filtered data
    };

    const getDateRange = () => {
        const now = new Date();
        let start = new Date();
        let end = new Date();

        switch (dateFilter) {
            case 'today':
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                break;
            case 'week':
                start.setDate(now.getDate() - 7);
                break;
            case 'month':
                start.setMonth(now.getMonth() - 1);
                break;
            case 'custom':
                if (customStartDate && customEndDate) {
                    start = new Date(customStartDate);
                    end = new Date(customEndDate);
                    end.setHours(23, 59, 59, 999);
                } else {
                    // If custom dates are not set, default to today
                    start.setHours(0, 0, 0, 0);
                    end.setHours(23, 59, 59, 999);
                }
                break;
            default:
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
        }
        return { start, end };
    };

    const fetchFollowUps = async () => {
        try {
            setLoading(true);
            const followUpsRef = collection(firestore, 'followUps');
            
            // Fetch all follow-ups without any filters
            const q = query(followUpsRef, orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const followUpsData = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt?.toDate(),
                    lastCallTimestamp: data.lastCallTimestamp?.toDate(),
                    nextFollowUpDate: data.nextFollowUpDate?.toDate(),
                    callHistory: (data.callHistory || []).map(call => ({
                        ...call,
                        timestamp: call.timestamp?.toDate()
                    }))
                };
            });

            console.log('Fetched all follow-ups:', followUpsData.length); // Debug log
            setFollowUps(followUpsData);
        } catch (error) {
            console.error('Error fetching follow-ups:', error);
            showSnackbar('Error fetching follow-ups', 'error');
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (data) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const stats = {
            total: data.length,
            pending: data.filter(f => f.status === 'pending').length,
            called: data.filter(f => f.status === 'called').length,
            scheduled: data.filter(f => f.status === 'scheduled').length,
            notInterested: data.filter(f => f.status === 'not_interested').length,
            callbackRequired: data.filter(f => f.status === 'callback_requested').length,
            todayFollowUps: data.filter(f => {
                // Check if follow-up is due today or was created today
                const followUpDate = f.nextFollowUpDate || f.createdAt;
                if (!followUpDate) return false;
                const date = new Date(followUpDate);
                return date >= today;
            }).length,
            conversionRate: calculateConversionRate(data)
        };
        setStats(stats);
    };

    const isToday = (date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    const calculateConversionRate = (data) => {
        const scheduled = data.filter(f => f.status === 'scheduled').length;
        return data.length > 0 ? (scheduled / data.length) * 100 : 0;
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: 'warning',
            called: 'info',
            scheduled: 'success',
            not_interested: 'error',
            callback_requested: 'secondary',
            no_response: 'default'
        };
        return colors[status] || 'default';
    };

    const handleRecordFollowUp = (followUp) => {
        console.log('Selected follow-up for recording:', followUp); // Debug log
        setSelectedFollowUp(followUp);
        setFollowUpFormData({
            status: followUp.status || 'pending',
            notes: '',
            customerResponse: '',
            nextFollowUpDate: '',
            scheduleDate: ''
        });
        setFollowUpDialogOpen(true);
    };

    const handleDeleteFollowUp = (followUp) => {
        setFollowUpToDelete(followUp);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        try {
            if (followUpToDelete) {
                await deleteDoc(doc(firestore, 'followUps', followUpToDelete.id));
                showSnackbar('Follow-up deleted successfully', 'success');
                setDeleteDialogOpen(false);
                setFollowUpToDelete(null);
                await fetchFollowUps(); // Refresh the data
            }
        } catch (error) {
            console.error('Error deleting follow-up:', error);
            showSnackbar('Error deleting follow-up', 'error');
        }
    };

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({
            open: true,
            message,
            severity
        });
    };

    const handleFollowUpSubmit = async () => {
        try {
            const timestamp = new Date();
            const callRecord = {
                status: followUpFormData.status,
                notes: followUpFormData.notes,
                customerResponse: followUpFormData.customerResponse,
                timestamp: timestamp,
                nextFollowUpDate: followUpFormData.status === 'scheduled' 
                    ? followUpFormData.scheduleDate 
                    : followUpFormData.nextFollowUpDate
            };

            const updatedCallHistory = [
                ...(selectedFollowUp.callHistory || []),
                callRecord
            ];

            console.log('Submitting follow-up data:', {
                status: followUpFormData.status,
                notes: followUpFormData.notes,
                customerResponse: followUpFormData.customerResponse,
                nextFollowUpDate: callRecord.nextFollowUpDate,
                callHistory: updatedCallHistory,
                lastCallTimestamp: timestamp
            }); // Debug log

            await recordFollowUpCall(selectedFollowUp.id, {
                status: followUpFormData.status,
                notes: followUpFormData.notes,
                customerResponse: followUpFormData.customerResponse,
                nextFollowUpDate: callRecord.nextFollowUpDate,
                callHistory: updatedCallHistory,
                lastCallTimestamp: timestamp
            });
            
            setFollowUpDialogOpen(false);
            showSnackbar('Follow-up recorded successfully', 'success');
            await fetchFollowUps(); // Refresh the data
        } catch (error) {
            console.error('Error recording follow-up:', error);
            showSnackbar('Error recording follow-up', 'error');
        }
    };

    return (
        <div>
            <Navbar />
            <Box sx={{ p: 3 }}>
                <Typography variant="h4" gutterBottom>
                    Follow-up Dashboard
                </Typography>
                
                {/* Show total vs filtered count */}
                {followUps.length !== filteredFollowUps.length && (
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                        Showing {filteredFollowUps.length} of {followUps.length} follow-ups
                    </Typography>
                )}

                {/* Stats Cards */}
                <Grid container spacing={2} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>
                                    Today's Follow-ups
                                </Typography>
                                <Typography variant="h4">
                                    {stats.todayFollowUps}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    <DateRangeIcon sx={{ verticalAlign: 'bottom' }} /> Today's Activity
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>
                                    Pending Follow-ups
                                </Typography>
                                <Typography variant="h4">
                                    {stats.pending}
                                </Typography>
                                <Typography variant="body2" color="error">
                                    Requires Attention
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>
                                    Scheduled Services
                                </Typography>
                                <Typography variant="h4">
                                    {stats.scheduled}
                                </Typography>
                                <Typography variant="body2" color="success.main">
                                    Confirmed Bookings
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>
                                    Conversion Rate
                                </Typography>
                                <Typography variant="h4">
                                    {stats.conversionRate.toFixed(1)}%
                                </Typography>
                                <Typography variant="body2" color="primary">
                                    <AssessmentIcon sx={{ verticalAlign: 'bottom' }} /> Success Rate
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Filters and Search */}
                <Paper sx={{ p: 2, mb: 3 }}>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                        <FormControl sx={{ minWidth: 200 }}>
                            <InputLabel>Time Period</InputLabel>
                            <Select
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                label="Time Period"
                            >
                                <MenuItem value="all_time">All Time</MenuItem>
                                <MenuItem value="today">Today</MenuItem>
                                <MenuItem value="week">This Week</MenuItem>
                                <MenuItem value="month">This Month</MenuItem>
                                <MenuItem value="custom">Custom Range</MenuItem>
                            </Select>
                        </FormControl>

                        {dateFilter === 'custom' && (
                            <Stack direction="row" spacing={2}>
                                <TextField
                                    type="date"
                                    label="Start Date"
                                    value={customStartDate}
                                    onChange={(e) => setCustomStartDate(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                />
                                <TextField
                                    type="date"
                                    label="End Date"
                                    value={customEndDate}
                                    onChange={(e) => setCustomEndDate(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Stack>
                        )}
                        
                        {dateFilter === 'custom' && customStartDate && customEndDate && (
                            <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                                ✓ Custom range: {new Date(customStartDate).toLocaleDateString()} to {new Date(customEndDate).toLocaleDateString()}
                            </Typography>
                        )}

                        <Button
                            variant="outlined"
                            startIcon={<RefreshIcon />}
                            onClick={fetchFollowUps}
                        >
                            Refresh
                        </Button>
                    </Stack>

                    {/* Search Box */}
                    <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="Search by customer name, vehicle number, phone, or status..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                        }}
                        sx={{ mt: 1 }}
                    />
                </Paper>

                {/* Tabs and Table */}
                <Paper sx={{ width: '100%', mb: 2 }}>
                    <Tabs
                        value={tabValue}
                        onChange={(e, newValue) => setTabValue(newValue)}
                        sx={{ borderBottom: 1, borderColor: 'divider' }}
                    >
                        <Tab label="All Follow-ups" />
                        <Tab label="Pending" />
                        <Tab label="Scheduled" />
                        <Tab label="Callbacks" />
                    </Tabs>

                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell />
                                    <TableCell>Sr. No.</TableCell>
                                    <TableCell>Customer</TableCell>
                                    <TableCell>Vehicle</TableCell>
                                    <TableCell>Contact</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Next Follow-up</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={8} align="center">
                                            <CircularProgress />
                                        </TableCell>
                                    </TableRow>
                                ) : filteredFollowUps.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} align="center">
                                            <Typography>
                                                {searchQuery ? 'No follow-ups found matching your search' : 'No follow-ups found'}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredFollowUps.map((followUp, index) => (
                                        <FollowUpRow 
                                            key={followUp.id} 
                                            followUp={followUp}
                                            index={index}
                                            onRecordFollowUp={() => handleRecordFollowUp(followUp)}
                                            onDeleteFollowUp={() => handleDeleteFollowUp(followUp)}
                                        />
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>

                {/* Follow-up Dialog */}
                <Dialog 
                    open={followUpDialogOpen} 
                    onClose={() => setFollowUpDialogOpen(false)}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle>
                        Record Follow-up Call
                        {selectedFollowUp && (
                            <Typography variant="subtitle2" color="textSecondary">
                                {selectedFollowUp.customerName} - {selectedFollowUp.vehicleNumber}
                            </Typography>
                        )}
                    </DialogTitle>
                    <DialogContent>
                        <Stack spacing={2} sx={{ mt: 2 }}>
                            <FormControl fullWidth>
                                <InputLabel>Status</InputLabel>
                                <Select
                                    value={followUpFormData.status}
                                    onChange={(e) => setFollowUpFormData({
                                        ...followUpFormData,
                                        status: e.target.value
                                    })}
                                    label="Status"
                                >
                                    <MenuItem value="pending">Pending</MenuItem>
                                    <MenuItem value="called">Called</MenuItem>
                                    <MenuItem value="scheduled">Service Scheduled</MenuItem>
                                    <MenuItem value="not_interested">Not Interested</MenuItem>
                                    <MenuItem value="callback_requested">Callback Requested</MenuItem>
                                    <MenuItem value="no_response">No Response</MenuItem>
                                </Select>
                            </FormControl>

                            <TextField
                                fullWidth
                                multiline
                                rows={2}
                                label="Customer Response"
                                value={followUpFormData.customerResponse}
                                onChange={(e) => setFollowUpFormData({
                                    ...followUpFormData,
                                    customerResponse: e.target.value
                                })}
                                placeholder="Enter customer's response..."
                            />

                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                label="Call Notes"
                                value={followUpFormData.notes}
                                onChange={(e) => setFollowUpFormData({
                                    ...followUpFormData,
                                    notes: e.target.value
                                })}
                                placeholder="Add detailed notes about the call..."
                            />

                            {followUpFormData.status === 'callback_requested' && (
                                <TextField
                                    fullWidth
                                    type="datetime-local"
                                    label="Next Follow-up Date"
                                    value={followUpFormData.nextFollowUpDate}
                                    onChange={(e) => setFollowUpFormData({
                                        ...followUpFormData,
                                        nextFollowUpDate: e.target.value
                                    })}
                                    InputLabelProps={{ shrink: true }}
                                />
                            )}

                            {followUpFormData.status === 'scheduled' && (
                                <TextField
                                    fullWidth
                                    type="date"
                                    label="Service Schedule Date"
                                    value={followUpFormData.scheduleDate}
                                    onChange={(e) => setFollowUpFormData({
                                        ...followUpFormData,
                                        scheduleDate: e.target.value
                                    })}
                                    InputLabelProps={{ shrink: true }}
                                />
                            )}
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setFollowUpDialogOpen(false)}>Cancel</Button>
                        <Button 
                            onClick={handleFollowUpSubmit} 
                            variant="contained" 
                            color="primary"
                        >
                            Save Follow-up
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog
                    open={deleteDialogOpen}
                    onClose={() => setDeleteDialogOpen(false)}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle>Confirm Delete</DialogTitle>
                    <DialogContent>
                        <Typography>
                            Are you sure you want to delete the follow-up for{' '}
                            <strong>{followUpToDelete?.customerName}</strong> ({followUpToDelete?.vehicleNumber})?
                        </Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                            This action cannot be undone.
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                        <Button 
                            onClick={confirmDelete} 
                            variant="contained" 
                            color="error"
                        >
                            Delete
                        </Button>
                    </DialogActions>
                </Dialog>

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
        </div>
    );
};

export default FollowUpDashboard; 
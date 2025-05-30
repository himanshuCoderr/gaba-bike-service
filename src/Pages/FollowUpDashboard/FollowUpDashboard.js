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
    endOfDay 
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
    Collapse
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
    KeyboardArrowUp as KeyboardArrowUpIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

const FollowUpRow = ({ followUp, onRecordFollowUp }) => {
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
                    <IconButton
                        size="small"
                        onClick={onRecordFollowUp}
                    >
                        <RefreshIcon fontSize="small" />
                    </IconButton>
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
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
    const [dateFilter, setDateFilter] = useState('today');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [selectedFollowUp, setSelectedFollowUp] = useState(null);
    const [followUpDialogOpen, setFollowUpDialogOpen] = useState(false);
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
            const { start, end } = getDateRange();

            let q = query(followUpsRef);

            // Add date range filter if not 'all'
            if (dateFilter !== 'all') {
                q = query(followUpsRef,
                    where('createdAt', '>=', Timestamp.fromDate(start)),
                    where('createdAt', '<=', Timestamp.fromDate(end))
                );
            }

            // Add status filter based on selected tab
            if (tabValue === 1) { // Pending
                q = query(q, where('status', '==', 'pending'));
            } else if (tabValue === 2) { // Scheduled
                q = query(q, where('status', '==', 'scheduled'));
            } else if (tabValue === 3) { // Callbacks
                q = query(q, where('status', '==', 'callback_requested'));
            }

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

            console.log('Fetched follow-ups:', followUpsData); // Debug log
            setFollowUps(followUpsData);
            calculateStats(followUpsData);
        } catch (error) {
            console.error('Error fetching follow-ups:', error);
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
                const followUpDate = new Date(f.timestamp);
                return followUpDate >= today;
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
            await fetchFollowUps(); // Refresh the data
        } catch (error) {
            console.error('Error recording follow-up:', error);
        }
    };

    return (
        <div>
            <Navbar />
            <Box sx={{ p: 3 }}>
                <Typography variant="h4" gutterBottom>
                    Follow-up Dashboard
                </Typography>

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

                {/* Filters */}
                <Paper sx={{ p: 2, mb: 3 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <FormControl sx={{ minWidth: 200 }}>
                            <InputLabel>Time Period</InputLabel>
                            <Select
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                label="Time Period"
                            >
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

                        <Button
                            variant="outlined"
                            startIcon={<RefreshIcon />}
                            onClick={fetchFollowUps}
                        >
                            Refresh
                        </Button>
                    </Stack>
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
                                        <TableCell colSpan={7} align="center">
                                            <CircularProgress />
                                        </TableCell>
                                    </TableRow>
                                ) : followUps.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center">
                                            <Typography>No follow-ups found</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    followUps.map((followUp) => (
                                        <FollowUpRow 
                                            key={followUp.id} 
                                            followUp={followUp}
                                            onRecordFollowUp={() => handleRecordFollowUp(followUp)}
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
            </Box>
        </div>
    );
};

export default FollowUpDashboard; 
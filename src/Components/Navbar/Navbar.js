import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    AppBar,
    Box,
    Toolbar,
    IconButton,
    Typography,
    Menu,
    Container,
    Avatar,
    Button,
    Tooltip,
    MenuItem,
    Badge
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PhoneCallback from '@mui/icons-material/PhoneCallback';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PeopleIcon from '@mui/icons-material/People';
import BuildIcon from '@mui/icons-material/Build';
import BarChartIcon from '@mui/icons-material/BarChart';

const Navbar = () => {
    const navigate = useNavigate();
    const [anchorElNav, setAnchorElNav] = useState(null);
    const [anchorElUser, setAnchorElUser] = useState(null);

    const handleOpenNavMenu = (event) => {
        setAnchorElNav(event.currentTarget);
    };
    const handleOpenUserMenu = (event) => {
        setAnchorElUser(event.currentTarget);
    };

    const handleCloseNavMenu = () => {
        setAnchorElNav(null);
    };

    const handleCloseUserMenu = () => {
        setAnchorElUser(null);
    };

    const handleLogout = () => {
        // TODO: Implement logout functionality
        navigate('/signIn');
    };

    const pages = [
        { name: 'Dashboard', path: '/', icon: <DashboardIcon /> },
        { name: 'Add Customer', path: '/add-customer', icon: <PersonAddIcon /> },
        { name: 'View Customers', path: '/view-all-customer', icon: <PeopleIcon /> },
        { name: 'Add Service', path: '/add-service', icon: <BuildIcon /> },
        { name: 'Follow-up Dashboard', path: '/follow-up', icon: <PhoneCallback />, badge: 5 },
        { name: 'Reports', path: '/reports', icon: <BarChartIcon /> }
    ];

    const settings = [
        { name: 'Profile', action: () => navigate('/profile') },
        { name: 'Account Settings', action: () => navigate('/settings') },
        { name: 'Dashboard', action: () => navigate('/') },
        { name: 'Logout', action: handleLogout }
    ];

    return (
        <AppBar position="static">
            <Container maxWidth="xl">
                <Toolbar disableGutters>
                    <BuildIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }} />
                    <Typography
                        variant="h6"
                        noWrap
                        component="div"
                        onClick={() => navigate('/')}
                        sx={{
                            mr: 2,
                            display: { xs: 'none', md: 'flex' },
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            letterSpacing: '.3rem',
                            color: 'inherit',
                            textDecoration: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        GABA BIKE SERVICE
                    </Typography>

                    <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
                        <IconButton
                            size="large"
                            aria-label="account of current user"
                            aria-controls="menu-appbar"
                            aria-haspopup="true"
                            onClick={handleOpenNavMenu}
                            color="inherit"
                        >
                            <MenuIcon />
                        </IconButton>
                        <Menu
                            id="menu-appbar"
                            anchorEl={anchorElNav}
                            anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'left',
                            }}
                            keepMounted
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'left',
                            }}
                            open={Boolean(anchorElNav)}
                            onClose={handleCloseNavMenu}
                            sx={{
                                display: { xs: 'block', md: 'none' },
                            }}
                        >
                            {pages.map((page) => (
                                <MenuItem key={page.name} onClick={() => {
                                    handleCloseNavMenu();
                                    navigate(page.path);
                                }}>
                                    {page.icon}
                                    <Typography sx={{ ml: 1 }}>{page.name}</Typography>
                                    {page.badge && (
                                        <Badge badgeContent={page.badge} color="error" sx={{ ml: 1 }} />
                                    )}
                                </MenuItem>
                            ))}
                        </Menu>
                    </Box>

                    <BuildIcon sx={{ display: { xs: 'flex', md: 'none' }, mr: 1 }} />
                    <Typography
                        variant="h5"
                        noWrap
                        component="div"
                        onClick={() => navigate('/')}
                        sx={{
                            mr: 2,
                            display: { xs: 'flex', md: 'none' },
                            flexGrow: 1,
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            letterSpacing: '.3rem',
                            color: 'inherit',
                            textDecoration: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        GABA
                    </Typography>
                    <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
                        {pages.map((page) => (
                            <Button
                                key={page.name}
                                onClick={() => {
                                    handleCloseNavMenu();
                                    navigate(page.path);
                                }}
                                sx={{ my: 2, color: 'white', display: 'flex', alignItems: 'center' }}
                            >
                                {page.icon}
                                <Typography sx={{ ml: 1 }}>{page.name}</Typography>
                                {page.badge && (
                                    <Badge badgeContent={page.badge} color="error" sx={{ ml: 1 }} />
                                )}
                            </Button>
                        ))}
                    </Box>

                    <Box sx={{ flexGrow: 0, display: 'flex', alignItems: 'center' }}>
                        <Tooltip title="Notifications">
                            <IconButton sx={{ mr: 2 }} color="inherit">
                                <Badge badgeContent={4} color="error">
                                    <NotificationsIcon />
                                </Badge>
                            </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Open settings">
                            <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                                <Avatar alt="User" src="/static/images/avatar/2.jpg" />
                            </IconButton>
                        </Tooltip>
                        <Menu
                            sx={{ mt: '45px' }}
                            id="menu-appbar"
                            anchorEl={anchorElUser}
                            anchorOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                            keepMounted
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                            open={Boolean(anchorElUser)}
                            onClose={handleCloseUserMenu}
                        >
                            {settings.map((setting) => (
                                <MenuItem 
                                    key={setting.name} 
                                    onClick={() => {
                                        setting.action();
                                        handleCloseUserMenu();
                                    }}
                                >
                                    <Typography textAlign="center">{setting.name}</Typography>
                                </MenuItem>
                            ))}
                        </Menu>
                    </Box>
                </Toolbar>
            </Container>
        </AppBar>
    );
};

export default Navbar;
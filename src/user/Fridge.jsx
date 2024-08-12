import React, { useState, useEffect, useContext } from 'react';
import Navbar, { UserNavbar } from "../components/Navbar";
import { NavLink, useNavigate } from 'react-router-dom';
import { UserFooter, DonatorFooter } from '../components/Footer';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Paper, Box,
    Checkbox, Button, Alert, CircularProgress, FormControl, InputLabel, Select, MenuItem, TableSortLabel, TablePagination, Snackbar, IconButton
} from '@mui/material';
import "./Fridge.css"
import ReactOdometer from 'react-odometerjs';
import { TokenContext } from '../utils/TokenContext';
import { backendRoute } from '../utils/BackendUrl';
import { styled } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';


const StyledSnackbar = styled(Snackbar)(({ theme }) => ({
    '& .MuiSnackbarContent-root': {
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        flexWrap: 'nowrap',
    },
}));

const CompactFormControl = styled(FormControl)(({ theme }) => ({
    minWidth: 120,
    '& .MuiInputBase-root': {
        height: 40,
    },
    '& .MuiInputLabel-root': {
        transform: 'translate(14px, -8px) scale(0.75)',
        background: '#f5f5f5',
        padding: '0 13px',
    },
}));

const CompactSelect = styled(Select)(({ theme }) => ({
    '& .MuiSelect-select': {
        paddingTop: 10,
        paddingBottom: 10,
    },
}));

const AnimatedCounter = ({ value }) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        let start = displayValue;
        const end = value;
        const duration = 3000;  // 3s duration for animation
        let timer;

        const step = () => {
            const time = Math.min(1, (Date.now() - startTime) / duration);
            const currentValue = Math.floor(start + time * (end - start));
            setDisplayValue(currentValue);

            if (time < 1) {
                requestAnimationFrame(step);
            } else {
                setDisplayValue(end);
            }
        };

        const startTime = Date.now();
        timer = requestAnimationFrame(step);

        return () => cancelAnimationFrame(timer);
    }, [value]);

    return (
        <span className="animated-counter">
            {displayValue.toLocaleString()}
        </span>
    );
};

export default function Fridge() {
    const { token } = useContext(TokenContext);
    const [donations, setDonations] = useState([]);
    // const [sortBy, setSortBy] = useState('expiryDate');
    const [selectedItems, setSelectedItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [order, setOrder] = useState('asc');
    const [orderBy, setOrderBy] = useState('name');
    const [fridgesCount, setFridgesCount] = useState(0);
    const [foodDonated, setFoodDonated] = useState(0);
    const [familiesSupported, setFamiliesSupported] = useState(0);
    const [cartItems, setCartItems] = useState([]);
    const [filterLocation, setFilterLocation] = useState('all');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterType, setFilterType] = useState('all');
    const [filterAvailability, setFilterAvailability] = useState('all');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const navigate = useNavigate();


    useEffect(() => {  // Fetch donations from backend
        const fetchDonations = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`${backendRoute}/donations`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
                if (!response.ok) throw new Error('Failed to fetch donations');
                const data = await response.json();
                console.log(data)
                setDonations(data.donations);
            } catch (error) {
                console.error('Error fetching donations:', error);
                setError('Failed to load donations. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchDonations();
    }, [token]);

    useEffect(() => {
        const handleStorageChange = () => {
            const storedCartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
            setCartItems(storedCartItems);
        };

        window.addEventListener('storage', handleStorageChange);
        handleStorageChange(); // Initial load

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);


    useEffect(() => {  // Load selected items from localstorage (so selected items dont disappear)
        const storedCartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
        setCartItems(storedCartItems);
    }, []);

    useEffect(() => {
        // Set intitial value after short delay
        const timeoutId = setTimeout(() => {
            setFridgesCount(43);
            setFoodDonated(58978);
            setFamiliesSupported(15673);
        }, 100);

        return () => clearTimeout(timeoutId);
    }, []);

    useEffect(() => {
        const intervalId = setInterval(() => {
            const foodIncrement = Math.floor(Math.random() * 7) + 4;  // Random value (4-10)
            const familiesIncrement = Math.floor(Math.random() * 3) + 1;  // Random value (1-3)

            setFoodDonated(prevValue => prevValue + foodIncrement);
            setFamiliesSupported(prevValue => prevValue + familiesIncrement);
        }, 5000);  // 5000ms

        return () => clearInterval(intervalId);
    }, []);


    // const handleSortChange = (event) => {
    //     setSortBy(event.target.value);
    // }

    const handleItemSelect = (donation) => {
        if (!cartItems.some(item => item.id === donation.id)) {
            setSelectedItems(prev => {
                if (prev.some(item => item.id === donation.id)) {
                    return prev.filter(item => item.id !== donation.id);
                } else if (prev.length < 5) {
                    return [...prev, donation];
                } else {
                    alert("You can only select up to 5 items.");
                    return prev;
                }
            });
        }
    };

    const handleAddToCart = () => {
        const newCartItems = [...cartItems, ...selectedItems];
        localStorage.setItem('cartItems', JSON.stringify(newCartItems));
        setCartItems(newCartItems);
        setSelectedItems([]);
        setSnackbarOpen(true);
    };

    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbarOpen(false);
    };

    const handleViewCart = () => {
        navigate('/user/cart')
    }

    const handleRequestSort = (property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const handleFilterChange = (event, filterType) => {
        switch (filterType) {
            case 'location':
                setFilterLocation(event.target.value);
                break;
            case 'category':
                setFilterCategory(event.target.value);
                break;
            case 'type':
                setFilterType(event.target.value);
                break;
            case 'availability':
                setFilterAvailability(event.target.value);
                break;
            default:
                break;
        }
    };

    const filteredAndSortedDonations = donations
        .filter(donation =>
            (filterLocation === 'all' || donation.location === filterLocation) &&
            (filterCategory === 'all' || donation.category === filterCategory) &&
            (filterType === 'all' || donation.foods.some(food => food.type === filterType)) &&
            (filterAvailability === 'all' || donation.availability === filterAvailability)
        )
        .sort((a, b) => {
            const isAsc = order === 'asc';
            switch (orderBy) {
                case 'name':
                    return isAsc ? a.foods[0].name.localeCompare(b.foods[0].name) : b.foods[0].name.localeCompare(a.foods[0].name);
                case 'quantity':
                    return isAsc ? a.foods[0].quantity - b.foods[0].quantity : b.foods[0].quantity - a.foods[0].quantity;
                case 'expiryDate':
                    return isAsc ? new Date(a.foods[0].expiryDate) - new Date(b.foods[0].expiryDate) : new Date(b.foods[0].expiryDate) - new Date(a.foods[0].expiryDate);
                default:
                    return 0;
            }
        });

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    }


    // if (loading) return <Typography>Loading...</Typography>;
    // if (error) return <Typography color="error">{error}</Typography>;


    return (
        <>
            <UserNavbar />
            <div className="fridge-container">
                <div className="fridge-header">
                    <h1>Reducing Waste and Fostering Community</h1>
                    <br />
                    <p>Welcome to the Community Fridge! Choose the food items you need and take them home!
                        Our fridge is stocked with fresh donations, ensuring that everyone has access to nutritious meals</p>
                </div>

                <div className="fridge-stats">
                    <div className="fridge-stat-item">
                        <ReactOdometer value={fridgesCount} />
                        <p>Self-Collect Fridges</p>
                    </div>
                    <div className="fridge-stat-item">
                        <ReactOdometer value={foodDonated} />
                        <p>Fresh Food Donated</p>
                    </div>
                    <div className="fridge-stat-item">
                        <ReactOdometer value={familiesSupported} />
                        <p>Families Supported</p>
                    </div>
                </div>

                <h2>Fridge</h2>
                <Box className="filter-container">
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, gap: 2, padding: '0 20px' }}>
                        <CompactFormControl sx={{ minWidth: 120 }}>
                            <InputLabel>Location</InputLabel>
                            <CompactSelect value={filterLocation} onChange={(e) => handleFilterChange(e, 'location')}>
                                <MenuItem value="all">All</MenuItem>
                                <MenuItem value="Ang Mo Kio">Ang Mo Kio</MenuItem>
                                <MenuItem value="Sengkang">Sengkang</MenuItem>
                            </CompactSelect>
                        </CompactFormControl>
                        <CompactFormControl sx={{ minWidth: 120 }}>
                            <InputLabel>Category</InputLabel>
                            <CompactSelect value={filterCategory} onChange={(e) => handleFilterChange(e, 'category')}>
                                <MenuItem value="all">All</MenuItem>
                                <MenuItem value="perishable">Perishable</MenuItem>
                                <MenuItem value="non-perishable">Non-perishable</MenuItem>
                                <MenuItem value="canned">Canned</MenuItem>
                                <MenuItem value="frozen">Frozen</MenuItem>
                            </CompactSelect>
                        </CompactFormControl>
                        <CompactFormControl sx={{ minWidth: 120 }}>
                            <InputLabel>Type</InputLabel>
                            <CompactSelect value={filterType} onChange={(e) => handleFilterChange(e, 'type')}>
                                <MenuItem value="all">All</MenuItem>
                                <MenuItem value="meat">Meat</MenuItem>
                                <MenuItem value="vegetable">Vegetable</MenuItem>
                                {/* Add more food types as needed */}
                            </CompactSelect>
                        </CompactFormControl>
                        <CompactFormControl sx={{ minWidth: 120 }}>
                            <InputLabel>Availability</InputLabel>
                            <CompactSelect value={filterAvailability} onChange={(e) => handleFilterChange(e, 'availability')}>
                                <MenuItem value="all">All</MenuItem>
                                <MenuItem value="Available">Available</MenuItem>
                                <MenuItem value="Unavailable">Unavailable</MenuItem>
                            </CompactSelect>
                        </CompactFormControl>
                    </Box>
                </Box>
                {/* Display fridge table */}
                <>
                    <div className="table-container">
                        <TableContainer component={Paper} sx={{ margin: '0 20px', marginBottom: '20px' }}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Select</TableCell>
                                        <TableCell>Image</TableCell>
                                        <TableCell>
                                            <TableSortLabel
                                                active={orderBy === 'name'}
                                                direction={orderBy === 'name' ? order : 'asc'}
                                                onClick={() => handleRequestSort('name')}
                                            >
                                                Food
                                            </TableSortLabel>
                                        </TableCell>
                                        <TableCell>Type</TableCell>
                                        <TableCell>
                                            <TableSortLabel
                                                active={orderBy === 'quantity'}
                                                direction={orderBy === 'quantity' ? order : 'asc'}
                                                onClick={() => handleRequestSort('quantity')}
                                            >
                                                Quantity (g)
                                            </TableSortLabel>
                                        </TableCell>
                                        <TableCell>Category</TableCell>
                                        <TableCell>
                                            <TableSortLabel
                                                active={orderBy === 'expiryDate'}
                                                direction={orderBy === 'expiryDate' ? order : 'asc'}
                                                onClick={() => handleRequestSort('expiryDate')}
                                            >
                                                Expiry Date
                                            </TableSortLabel>
                                        </TableCell>
                                        <TableCell>Remarks</TableCell>
                                        <TableCell>Delivery Date</TableCell>
                                        <TableCell>Location</TableCell>
                                        <TableCell>Donator</TableCell>
                                        <TableCell>Availability</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredAndSortedDonations.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={11} align="center">
                                                No donations available at the moment.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredAndSortedDonations
                                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                            .map((donation) => (
                                                donation.foods.map((food) => (
                                                    <TableRow key={`${donation.id}-${food.id}`}>
                                                        <TableCell>
                                                            <Checkbox
                                                                checked={selectedItems.some(item => item.id === donation.id)}
                                                                onChange={() => handleItemSelect(donation)}
                                                                disabled={cartItems.some(item => item.id === donation.id) || donation.availability !== "Available"}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            {donation.image && (
                                                                <img
                                                                    src={donation.image}
                                                                    alt="nothing"
                                                                    style={{ width: 60, height: 60, objectFit: 'cover' }}
                                                                />
                                                            )}
                                                        </TableCell>
                                                        <TableCell>{food.name}</TableCell>
                                                        <TableCell>{food.type}</TableCell>
                                                        <TableCell>{food.quantity}</TableCell>
                                                        <TableCell>{donation.category}</TableCell>
                                                        <TableCell>{new Date(food.expiryDate).toLocaleDateString('en-GB')}</TableCell>
                                                        <TableCell>{donation.remarks}</TableCell>
                                                        <TableCell>{new Date(donation.deliveryDate).toLocaleDateString('en-GB')}</TableCell>
                                                        <TableCell>{donation.location}</TableCell>
                                                        <TableCell>{donation.donator.person.name}</TableCell>
                                                        <TableCell>
                                                            <span style={{
                                                                color: cartItems.some(item => item.id === donation.id)
                                                                    ? "orange"
                                                                    : donation.availability === "Available"
                                                                        ? "green"
                                                                        : inherit
                                                            }}>
                                                                {cartItems.some(item => item.id === donation.id)
                                                                    ? <b>Pending</b>
                                                                    : donation.availability === "Available"
                                                                        ? <b>Available</b>
                                                                        : donation.availability}
                                                            </span>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <TablePagination
                            rowsPerPageOptions={[5, 10, 25]}
                            component="div"
                            count={filteredAndSortedDonations.length}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                        />
                    </div>
                    <Box className="buttons-container">
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2, padding: '0 20px 20px' }}>
                            <Button variant="contained" onClick={handleAddToCart} disabled={selectedItems.length === 0}>
                                Add to Cart
                            </Button>
                            <Button variant="outlined" onClick={handleViewCart}>
                                View Cart
                            </Button>
                        </Box>
                    </Box>

                    <StyledSnackbar
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'center',
                        }}
                        open={snackbarOpen}
                        autoHideDuration={2500}
                        onClose={handleCloseSnackbar}
                        message={
                            <span style={{ display: 'flex', alignItems: 'center' }}>
                                <ShoppingCartIcon style={{ marginRight: '8px' }} />
                                Items added to cart successfully!
                            </span>
                        }
                        action={
                            <IconButton
                                size="small"
                                aria-label="close"
                                color="inherit"
                                onClick={handleCloseSnackbar}
                            >
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        }
                    />
                </>
            </div>
            <UserFooter />
        </>
    )
}
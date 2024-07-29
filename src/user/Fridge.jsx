// TO-DO:
//  - Handle view cart button logic
//  - Display fridge table by fetching donations
//  - Implement buttons (redirect to Cart)
//  - Make sure that select function works, selected table is displayed at Cart Page



import React, { useState, useEffect } from 'react';
import { UserNavbar } from "../components/Navbar";
import "./Fridge.css"
import ReactOdometer from 'react-odometerjs';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, TablePagination, TableSortLabel, Checkbox, Button, Select, MenuItem
} from '@mui/material';
import { backendRoute } from '../utils/BackendUrl';

// Top Counter
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
    const [fridgesCount, setFridgesCount] = useState(0);
    const [foodDonated, setFoodDonated] = useState(0);
    const [familiesSupported, setFamiliesSupported] = useState(0);
    const [donations, setDonations] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [orderBy, setOrderBy] = useState('expiryDate');
    const [order, setOrder] = useState('asc');
    const [selected, setSelected] = useState([]);
    const [sortBy, setSortBy] = useState('Recently Added');
    // For error handling - loading states
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);


    // Init counters
    useEffect(() => {
        // Set intitial value after short delay
        const timeoutId = setTimeout(() => {
            setFridgesCount(43);
            setFoodDonated(58978);
            setFamiliesSupported(15673);
        }, 100);

        return () => clearTimeout(timeoutId);
    }, []);

    // Update counters
    useEffect(() => {
        const intervalId = setInterval(() => {
            const foodIncrement = Math.floor(Math.random() * 7) + 4;  // Random value (4-10)
            const familiesIncrement = Math.floor(Math.random() * 3) + 1;  // Random value (1-3)

            setFoodDonated(prevValue => prevValue + foodIncrement);
            setFamiliesSupported(prevValue => prevValue + familiesIncrement);
        }, 5000);  // 5000ms

        return () => clearInterval(intervalId);
    }, []);

    // Fetch Donations
    useEffect(() => {
        const fetchDonations = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`${backendRoute}/donations?page=${page + 1}&limit=${rowsPerPage}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch donations');
                }
                const data = await response.json();
                setDonations(data.donations);
            } catch (error) {
                console.error('Error fetching donations:', error);
                setError('Failed to load donations. Please try again later.')
            } finally {
                setLoading(false);
            }
        };

        fetchDonations();
    }, [page, rowsPerPage]);

    const handleRequestSort = (property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const handleSelectAllClick = (event) => {
        if (event.target.checked) {
            const newSelected = donations.map((n) => n.id);
            setSelected(newSelected);
            return;
        }
        setSelected([]);
    };

    const handleClick = (event, id) => {
        const selectedIndex = selected.indexOf(id);
        let newSelected = [];

        if (selectedIndex === -1) {
            newSelected = newSelected.concat(selected, id);
        } else if (selectedIndex === 0) {
            newSelected = newSelected.concat(selected.slice(1));
        } else if (selectedIndex === selected.length - 1) {
            newSelected = newSelected.concat(selected.slice(0, -1));
        } else if (selectedIndex > 0) {
            newSelected = newSelected.concat(
                selected.slice(0, selectedIndex),
                selected.slice(selectedIndex + 1),
            );
        }

        setSelected(newSelected);
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const isSelected = (id) => selected.indexOf(id) !== -1;

    // const handleSelectItem = (id) => {
    //     setSelectedItems(prev =>
    //         prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    //     );
    // };

    const handleAddToCart = () => {
        if (selected.length > 5) {
            alert("You can only add 5 items to your cart at a time.");
        } else {
            // Reserved items 
            console.log('Selected items:', selected);
        }
    }

    const handleSortChange = (event) => {
        setSortBy(event.target.value);
        // Sorting Logic Not Done Yet
    }

    const sortedDonations = React.useMemo(() => {
        if (!donations) return [];

        return [...donations].sort((a, b) => {
            if (orderBy === 'expiryDate') {
                return order === 'asc'
                    ? new Date(a.food.expiryDate) - new Date(b.food.expiryDate)
                    : new Date(a.food.expiryDate) - new Date(b.food.expiryDate);
            }
            if (orderBy === 'category') {
                return order === 'asc'
                    ? a.food.type.localeCompare(b.food.type)
                    : b.food.type.localeCompare(a.food.type);
            }

            return 0;
        });
    }, [donations, orderBy, order]);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <>
            <UserNavbar />

            <div className="fridge-container">
                <div className="fridge-header">
                    <h1>Reducing Waste and Fostering Community</h1> <br></br>
                    <p>Welcome to the Community Fridge! Choose the food items you need and take them home!
                        Our fridge is stocked with fresh donations, ensuring that everyone has access to nuritious meals</p>
                </div>
                {donations.length > 0 ? (
                    <ul>
                        {donations.map(donation => (
                            <li key={donation.id}>{donation.food}</li>
                        ))}
                    </ul>
                ) : (
                    <p>No donations available.</p>
                )}

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
                <p>// TODO: Display fridge table w sorting function + Add to cart button + set alert to only allow up to 5 reservations</p>

                {/* SORT BY DROPDOWN */}
                <div className="sort-container">
                    <span>Sort by:</span>
                    <Select
                        value={sortBy}
                        onChange={(e) => {
                            setSortBy(e.target.value);
                            setOrderBy(e.target.value === 'Expiry Date' ? 'expiryDate' : 'category');
                            setOrder('asc');
                        }}
                        displayEmpty
                        inputProps={{ 'aria-label': 'Without label' }}
                    >
                        <MenuItem value="Recently Added">Recently Added</MenuItem>
                        <MenuItem value="Expiry Date">Expiry Date</MenuItem>
                        <MenuItem value="Category">Category</MenuItem>
                    </Select>
                </div>
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell padding="checkbox">
                                    <Checkbox
                                        indeterminate={selected.length > 0 && selected.length < sortedDonations.length}
                                        checked={sortedDonations.length > 0 && selected.length === sortedDonations.length}
                                        onChange={handleSelectAllClick}
                                    />
                                </TableCell>
                                <TableCell>Food</TableCell>
                                <TableCell>Quantity</TableCell>
                                <TableCell>
                                    <TableSortLabel
                                        active={orderBy === 'category'}
                                        direction={orderBy === 'category' ? order : 'asc'}
                                        onClick={() => handleRequestSort('category')}
                                    >
                                        Category
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell>
                                    <TableSortLabel
                                        active={orderBy === 'expiryDate'}
                                        direction={orderBy === 'expiryDate' ? order : 'asc'}
                                        onClick={() => handleRequestSort('expiryDate')}
                                    >
                                        Expiry Date
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell>Donator</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {sortedDonations.map((donation) => {
                                const isItemSelected = isSelected(donation.id);
                                return (
                                    <TableRow
                                        hover
                                        onClick={(event) => handleClick(event, donation.id)}
                                        role="checkbox"
                                        aria-checked={isItemSelected}
                                        tabIndex={-1}
                                        key={donation.id}
                                        selected={isItemSelected}
                                    >
                                        <TableCell padding="checkbox">
                                            <Checkbox checked={isItemSelected} />
                                        </TableCell>
                                        <TableCell>
                                            <img src={donation.imageUrl} alt={donation.food.name} style={{ width: '50px', height: '50px', marginRight: '10px' }} />
                                            {donation.food.name}
                                        </TableCell>
                                        <TableCell>{donation.food.quantity}</TableCell>
                                        <TableCell>{donation.food.type}</TableCell>
                                        <TableCell>{new Date(donation.food.expiryDate).toLocaleDateString()}</TableCell>
                                        <TableCell>{donation.donator.person.name}</TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={donations.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
                <div className="button-container">
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleAddToCart}
                        disabled={selected.length === 0 || selected.length > 5}
                    >
                        Add To Cart
                    </Button>
                    <Button
                        variant="contained"
                        color="secondary"
                        onClick={() => {/* View cart logic */ }}
                    >
                        View Cart
                    </Button>
                </div>
            </div>
        </>
    );
};
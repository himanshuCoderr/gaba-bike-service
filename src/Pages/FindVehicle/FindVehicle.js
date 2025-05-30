import React, { useState } from 'react';
import { firestore } from '../../firebase.js';
import Navbar from '../../Components/Navbar/Navbar.js';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
// Bike Scccooty Icon

import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import MopedIcon from '@mui/icons-material/Moped';
import { TextField, Button, Radio, RadioGroup, FormControlLabel, FormControl, FormLabel } from '@mui/material';

const SearchVehicle = () => {
    const [vehicleNumber, setVehicleNumber] = useState('');
    const [vehicleData, setVehicleData] = useState(null);
    const [newServiceData, setNewServiceData] = useState({
        serviceType: '',
        totalKM: '',
        totalAmount: '',
        totalRecieve: '',
        serviceDate: new Date().toISOString().split('T')[0], // current date in YYYY-MM-DD format
    });
    const [showModal, setShowModal] = useState(false); // Modal visibility state
    const [alertMessage, setAlertMessage] = useState(null); // For success/error messages
    const [vehicleId, setVehicleId] = useState(null)
    // Search vehicle by vehicle number
    // Search vehicle by vehicle number
    const handleSearch = async () => {
        try {
            const q = query(collection(firestore, 'vehicles'), where('vehicleNumber', '==', vehicleNumber));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const doc = querySnapshot.docs[0]; // Get the first matching document
                setVehicleData(doc.data()); // Set vehicle data
                setVehicleId(doc.id); // Save the document ID for updates
            } else {
                setAlertMessage("Vehicle not found!");
                setVehicleData(null);
                setVehicleId(null); // Clear vehicleId if no data is found
            }
        } catch (error) {
            console.error('Error searching vehicle:', error);
            setAlertMessage("Error searching vehicle.");
        }
    };


    // Handle adding a new service
    // Handle adding a new service
    const handleAddNewService = async () => {
        if (!newServiceData.serviceType || !newServiceData.totalKM) {
            setAlertMessage("Please fill in all service details.");
            return;
        }

        try {
            if (!vehicleId) {
                setAlertMessage("No vehicle found to update.");
                return;
            }

            const vehicleRef = doc(firestore, 'vehicles', vehicleId); // Reference to the vehicle document using document ID
            console.log("Vehicle Ref: ", vehicleRef);

            // Ensure serviceHistory is initialized as an empty array if undefined
            const updatedServiceHistory = vehicleData.serviceHistory || [];

            // Adding the new service to the serviceHistory array
            updatedServiceHistory.push({
                serviceType: newServiceData.serviceType,
                totalKM: newServiceData.totalKM,
                serviceDate: newServiceData.serviceDate, // Use current date
                totalAmount: newServiceData.totalAmount,
                totalRecieve: newServiceData.totalRecieve
            });

            // Update the vehicle document with the new service history
            await updateDoc(vehicleRef, { serviceHistory: updatedServiceHistory });

            setAlertMessage("Service added successfully!");
            setVehicleData({ ...vehicleData, serviceHistory: updatedServiceHistory }); // Update local state
            setNewServiceData({ serviceType: '', totalKM: '', serviceDate: new Date().toISOString().split('T')[0] }); // Reset form
            setShowModal(false); // Close modal after submitting
        } catch (error) {
            console.error('Error adding service:', error);
            setAlertMessage("Error adding service.");
        }
    };


    return (
        <div>
            <Navbar />
            <div className='mb-5 h-[2px] bg-black' ></div>

            <h2 className="text-3xl mb-5 ml-2 mt-2 ">Search Vehicle</h2>
            <div className='mb-5 h-[2px] bg-black' ></div>
            {/* Vehicle Number Search Field */}
            <div className='flex items-center w-[22vw] justify-between ml-5' >

                <TextField
                    label="Vehicle Number"
                    variant="outlined"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    className="mb-5 mr-2 "
                    style={{
                        width: '100%',
                        marginRight: '20px'
                    }}
                    InputProps={{
                        style: {
                            fontSize: '50px', // Input text size
                        },
                    }}
                    InputLabelProps={{
                        style: {
                            fontSize: '20px', // Label font size
                        },
                    }}
                    inputProps={{
                        style: {
                            fontSize: '18px', // Placeholder font size
                        },
                    }}

                />

                <Button
                    onClick={handleSearch}
                    variant="contained"
                    className="ml-3 bg-blue-500 text-white"
                >
                    Search
                </Button>
            </div>


            {/* Alert for success/error */}
            {alertMessage && (
                <div className={`alert ${alertMessage.includes("successfully") ? "text-green-600" : "text-red-600"}`}>
                    {alertMessage}
                </div>
            )}

            {/* Vehicle Details and Service History */}
            {vehicleData && (
                <div className="mt-5">
                    <h3 className="text-2xl">Vehicle Details</h3>
                    <p><strong>Name:</strong> {vehicleData.name}</p>
                    <p><strong>Phone Number:</strong> {vehicleData.mobileNo}</p>
                    <p><strong>Vehicle Type:</strong> {vehicleData.vehicleType} {vehicleData.vehicleType == "Bike" ? <TwoWheelerIcon /> : ""}  </p>
                    <p><strong>Engine Number :</strong> {vehicleData.engineNumber}</p>
                    <p><strong>Chessi Number :</strong> {vehicleData.chesiNumber}</p>

                    <h4 className="text-xl mt-3">Service History</h4>
                    <table style={{ border: "1px solid grey", borderCollapse: "collapse", width: "60vw" }} >
                        <tr style={{ border: "1px solid grey", borderCollapse: "collapse" }}  >
                            <th style={{ border: "1px solid grey", borderCollapse: "collapse" }}>Service Type</th>
                            <th style={{ border: "1px solid grey", borderCollapse: "collapse" }}>Service Date</th>
                            <th style={{ border: "1px solid grey", borderCollapse: "collapse" }}>Total KM</th>
                            <th style={{ border: "1px solid grey", borderCollapse: "collapse" }}>Total Amount</th>
                            <th style={{ border: "1px solid grey", borderCollapse: "collapse" }}>Total Recieve</th>
                            <th style={{ border: "1px solid grey", borderCollapse: "collapse" }}>Total Pending</th>
                            <th style={{ border: "1px solid grey", borderCollapse: "collapse" }}>Complete Pending</th>
                            <th style={{ border: "1px solid grey", borderCollapse: "collapse" }}>Service Note</th>
                        </tr>
                        {vehicleData.serviceHistory.length > 0 ? (
                            vehicleData.serviceHistory.map((service, index) => (
                                <tr key={index} className="mb-3" style={{ border: "1px solid grey", borderCollapse: "collapse" }} >
                                    <td style={{ border: "1px solid grey", borderCollapse: "collapse" }} > {service.serviceType}</td>
                                    <td style={{ border: "1px solid grey", borderCollapse: "collapse" }} >{new Date(service.serviceDate).toLocaleDateString()}</td>
                                    <td style={{ border: "1px solid grey", borderCollapse: "collapse" }} >{service.totalKM}</td>
                                    <td style={{ border: "1px solid grey", borderCollapse: "collapse" }} >{service.totalAmount}</td>
                                    <td style={{ border: "1px solid grey", borderCollapse: "collapse" }} >{service.totalRecieve}</td>
                                    <td style={{ border: "1px solid grey", borderCollapse: "collapse" }} >{Number(service.totalAmount) - Number(service.totalRecieve)}</td>
                                    <td style={{ border: "1px solid grey", borderCollapse: "collapse", textAlign: "center" }}>
                                        <input
                                            type="checkbox"
                                            checked={Number(service.totalAmount) === Number(service.totalRecieve)} // Checkbox is checked if no pending amount
                                            onChange={async () => {
                                                if (vehicleId && vehicleData.serviceHistory) {
                                                    try {
                                                        // Update the specific service in serviceHistory
                                                        const updatedServiceHistory = vehicleData.serviceHistory.map((s, i) => {
                                                            if (i === index) {
                                                                return {
                                                                    ...s,
                                                                    totalRecieve: s.totalAmount, // Set totalRecieve equal to totalAmount
                                                                };
                                                            }
                                                            return s;
                                                        });

                                                        // Update Firestore with the updated serviceHistory
                                                        const vehicleRef = doc(firestore, 'vehicles', vehicleId);
                                                        await updateDoc(vehicleRef, { serviceHistory: updatedServiceHistory });

                                                        // Update local state
                                                        setVehicleData({ ...vehicleData, serviceHistory: updatedServiceHistory });
                                                        setAlertMessage("Pending cleared successfully!");
                                                    } catch (error) {
                                                        console.error("Error updating pending status:", error);
                                                        setAlertMessage("Error clearing pending.");
                                                    }
                                                } else {
                                                    setAlertMessage("No vehicle or service data found.");
                                                }
                                            }}
                                        />
                                    </td>
                                    <td  >{service.serviceNote}</td>            
                                </tr>
                            ))
                        ) : (
                            <p>No services recorded yet.</p>
                        )}
                    </table>

                    {/* Button to trigger Add Service Modal */}
                    <Button
                        onClick={() => setShowModal(true)}
                        variant="contained"
                        className="bg-green-500 text-white mt-5"
                    >
                        Add Next Service Info
                    </Button>
                </div>
            )}

            {/* Modal for Adding a New Service */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center">
                    <div className="bg-white p-8 rounded-md w-96">
                        <h3 className="text-xl mb-5">Add New Service</h3>

                        <div className="mb-5">
                            <FormControl component="fieldset">
                                <FormLabel component="legend">Service Type</FormLabel>
                                <RadioGroup
                                    name="serviceType"
                                    value={newServiceData.serviceType}
                                    onChange={(e) => setNewServiceData({ ...newServiceData, serviceType: e.target.value })}
                                >
                                    <FormControlLabel value="Paid Regular Service" control={<Radio />} label="Paid Regular Service" />
                                    <FormControlLabel value="General Repair" control={<Radio />} label="General Repair" />
                                </RadioGroup>
                            </FormControl>
                        </div>

                        <div className="mb-5">
                            <TextField
                                label="Total KM"
                                variant="outlined"
                                type="number"
                                value={newServiceData.totalKM}
                                onChange={(e) => setNewServiceData({ ...newServiceData, totalKM: e.target.value })}
                                fullWidth
                            />
                            <TextField
                                label="Total Amount"
                                variant="outlined"
                                type="number"
                                value={newServiceData.totalAmount}
                                onChange={(e) => setNewServiceData({ ...newServiceData, totalAmount: e.target.value })}
                                fullWidth
                            />
                            <TextField
                                label="Total Recieve"
                                variant="outlined"
                                type="number"
                                value={newServiceData.totalRecieve}
                                onChange={(e) => setNewServiceData({ ...newServiceData, totalRecieve: e.target.value })}
                                fullWidth
                            />
                        </div>

                        <div className="mb-5">
                            <TextField
                                label="Service Date"
                                variant="outlined"
                                value={newServiceData.serviceDate}
                                disabled
                                fullWidth
                            />
                        </div>

                        <div className="flex justify-end space-x-4">
                            <Button
                                onClick={() => setShowModal(false)}
                                variant="outlined"
                                className="bg-gray-500 text-white"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleAddNewService}
                                variant="contained"
                                className="bg-green-500 text-white"
                            >
                                Add Service
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchVehicle;

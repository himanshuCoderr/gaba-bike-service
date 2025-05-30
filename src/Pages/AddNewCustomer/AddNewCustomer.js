import React, { useState } from 'react';
import Navbar from '../../Components/Navbar/Navbar';
import { TextField, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, Button, Alert } from '@mui/material';
import { firestore } from '../../firebase.js';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import MopedIcon from '@mui/icons-material/Moped';
import { collection, addDoc, query, where, getDocs, updateDoc, doc } from 'firebase/firestore'; // Firestore methods

const AddNewCustomer = () => {
    const [formData, setFormData] = useState({
        name: '',
        mobileNo: '',
        vehicleNumber: '',
        engineNumber: '',
        chesiNumber: '',
        totalRunKM: '',
        vehicleType: '',
        serviceType: '',
        totalAmount: '',
        totalRecieve: '',
        serviceNote: ''
    });

    const [errors, setErrors] = useState({});
    const [alertMessage, setAlertMessage] = useState(null); // Alert for duplicate or success messages

    // Handle input changes
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    // Form validation
    const validate = () => {
        let tempErrors = {};
        if (!formData.name) tempErrors.name = "Name is required";
        if (!formData.mobileNo) tempErrors.mobileNo = "Mobile Number is required";
        if (!formData.vehicleNumber) tempErrors.vehicleNumber = "Vehicle Number is required";
        if (!formData.totalRunKM) tempErrors.totalRunKM = "Total Run KM is required";
        if (!formData.vehicleType) tempErrors.vehicleType = "Vehicle Type is required";
        if (!formData.serviceType) tempErrors.serviceType = "Service Type is required";
        setErrors(tempErrors);
        return Object.keys(tempErrors).length === 0;
    };

    // Check if vehicle exists in the database
    const checkIfVehicleExists = async () => {
        try {
            const q = query(collection(firestore, 'vehicles'), where('vehicleNumber', '==', formData.vehicleNumber));
            const querySnapshot = await getDocs(q);
            return querySnapshot.empty; // True if no vehicle found, false if exists
        } catch (error) {
            console.error('Error checking vehicle existence:', error);
            return false;
        }
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (validate()) {
            const isVehicleExists = await checkIfVehicleExists();
            if (!isVehicleExists) {
                setAlertMessage("Vehicle already registered with this number.");
                return;
            }

            try {
                // Adding customer to Firestore (with first service)
                const vehicleRef = collection(firestore, 'vehicles');
                const serviceData = [{
                    serviceType: formData.serviceType,
                    totalAmount: formData.totalAmount,
                    totalRecieve: formData.totalRecieve,
                    totalKM: formData.totalRunKM,
                    serviceNote: formData.serviceNote,
                    serviceDate: new Date().toISOString(), // Record today's service date
                }];
                const newCustomerData = {
                    name: formData.name,
                    mobileNo: formData.mobileNo,
                    vehicleNumber: formData.vehicleNumber,
                    engineNumber: formData.engineNumber,
                    chesiNumber: formData.chesiNumber,
                    totalRunKM: formData.totalRunKM,
                    vehicleType: formData.vehicleType,
                    serviceHistory: serviceData,

                };

                // Add to Firestore
                await addDoc(vehicleRef, newCustomerData);
                console.log("Customer added to Firestore with first service!");
                setAlertMessage("Customer added successfully!");
                setFormData({}); // Reset form after submission
            } catch (error) {
                console.error("Error adding customer:", error);
                setAlertMessage("Failed to add customer.");
            }
        }
    };

    return (
        <div>
            <Navbar />
            <h1 className='text-3xl m-5 text-black'>Add New Customer</h1>

            {alertMessage && (
                <Alert severity={alertMessage.includes("successfully") ? "success" : "error"} sx={{ marginBottom: '20px' }}>
                    {alertMessage}
                </Alert>
            )}

            <form className='m-5' onSubmit={handleSubmit}>
                {/* Customer Basic Details */}
                <div className='border-black border-2 p-4 rounded-md'>
                    <label className='mb-2 text-xl'>Customer Basic Details</label>
                    <div className='mt-5'>
                        <TextField
                            name="name"
                            label="Name"
                            variant="outlined"
                            sx={{ marginRight: '20px' }}
                            onChange={handleChange}
                            error={!!errors.name}
                            helperText={errors.name}
                        />
                        <TextField
                            name="mobileNo"
                            label="Mobile No"
                            variant="outlined"
                            sx={{ marginRight: '20px' }}
                            onChange={handleChange}
                            error={!!errors.mobileNo}
                            helperText={errors.mobileNo}
                        />
                    </div>
                </div>

                {/* Vehicle Information */}
                <div className='border-black border-2 p-4 rounded-md mt-5'>
                    <label className='mb-2 text-xl'>Customer Vehicle Information</label>
                    <div className='mt-5'>
                        <TextField
                            name="vehicleNumber"
                            label="Vehicle Number"
                            variant="outlined"
                            sx={{ marginRight: '20px' }}
                            onChange={handleChange}
                            error={!!errors.vehicleNumber}
                            helperText={errors.vehicleNumber}
                        />

                        <TextField
                            name="totalRunKM"
                            label="Total Run KM"
                            variant="outlined"
                            sx={{ marginRight: '20px' }}
                            onChange={handleChange}
                            error={!!errors.totalRunKM}
                            helperText={errors.totalRunKM}
                        />
                        <TextField
                            name="engineNumber"
                            label="Engine Number"
                            variant="outlined"
                            sx={{ marginRight: '20px' }}
                            onChange={handleChange}
                        />
                        <TextField
                            name="chesiNumber"
                            label="Chesi Number"
                            variant="outlined"
                            sx={{ marginRight: '20px' }}
                            onChange={handleChange}
                        />


                    </div>
                </div>

                {/* Service Info */}
                <div className='border-black border-2 p-4 rounded-md mt-5'>
                    <label className='mb-2 text-xl'>Today Service Info</label>
                    <div className='mt-5'>
                        <FormControl component="fieldset">
                            <FormLabel component="legend">Vehicle Type</FormLabel>
                            <RadioGroup name="vehicleType" onChange={handleChange} style={{marginRight:"20px"}} >
                                <div style={{ display: "flex", justifyItems: "center", alignItems: "center" }} >
                                    <FormControlLabel value="Bike" control={<Radio />} label="Bike" /> <TwoWheelerIcon />
                                </div>
                                <div style={{ display: "flex", justifyItems: "center", alignItems: "center" }}>
                                    <FormControlLabel value="Scooty" control={<Radio />} label="Scooty" />
                                    <MopedIcon />       
                                </div>
                            </RadioGroup>
                            {errors.vehicleType && <p style={{ color: 'red' }}>{errors.vehicleType}</p>}
                        </FormControl>

                        <FormControl component="fieldset" className='mt-5'>
                            <FormLabel component="legend">Service Type</FormLabel>
                            <RadioGroup name="serviceType" onChange={handleChange}>
                                <FormControlLabel value="Paid Regular Service" control={<Radio />} label="Paid Regular Service" />
                                <FormControlLabel value="General Repair" control={<Radio />} label="General Repair" />
                            </RadioGroup>
                            {errors.serviceType && <p style={{ color: 'red' }}>{errors.serviceType}</p>}
                        </FormControl>
                    </div>

                    <div className='mt-5'>
                        <label>Total Amount</label>
                        <br />
                        <TextField
                            name="totalAmount"
                            type="number"
                            className='border-black border-2 mt-5 p-1 rounded-md'
                            onChange={handleChange}
                        />
                        <br style={{ marginBottom: "10px" }} />
                        <label>Total Recieve</label>
                        <br />
                        <TextField
                            name="totalRecieve"
                            type="number"
                            className='border-black border-2 mt-5 p-1 rounded-md'
                            onChange={handleChange}
                        />
                        <br />
                        <label >Add Note</label>
                        <br></br>
                        <textarea rows={5} cols={40} className='' style={{ border: "1px solid green" }} onChange={handleChange} name='serviceNote' >

                        </textarea>
                    </div>
                </div>
                <Button type="submit" className='bg-red-500 m-5 px-4 py-3 text-xl rounded-md text-white' >
                    Submit
                </Button>
            </form>
        </div>
    );
};

export default AddNewCustomer;

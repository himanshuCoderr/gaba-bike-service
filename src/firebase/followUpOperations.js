import { 
    collection, 
    addDoc, 
    updateDoc, 
    doc, 
    Timestamp,
    serverTimestamp
} from 'firebase/firestore';
import { firestore } from '../firebase';

export const addFollowUp = async (followUpData) => {
    try {
        const followUpsRef = collection(firestore, 'followUps');
        const newFollowUp = {
            ...followUpData,
            timestamp: serverTimestamp(),
            createdAt: serverTimestamp()
        };

        const docRef = await addDoc(followUpsRef, newFollowUp);
        return { id: docRef.id, ...newFollowUp };
    } catch (error) {
        console.error('Error adding follow-up:', error);
        throw error;
    }
};

export const updateFollowUp = async (followUpId, updateData) => {
    try {
        const followUpRef = doc(firestore, 'followUps', followUpId);
        await updateDoc(followUpRef, {
            ...updateData,
            updatedAt: serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error('Error updating follow-up:', error);
        throw error;
    }
};

export const createFollowUpFromService = async (followUpData) => {
    try {
        // Convert dates to Firestore Timestamps
        const createdAt = Timestamp.fromDate(followUpData.createdAt || new Date());
        const updatedAt = Timestamp.fromDate(followUpData.updatedAt || new Date());
        const lastCallTimestamp = followUpData.lastCallTimestamp ? 
            Timestamp.fromDate(followUpData.lastCallTimestamp) : null;
        const nextFollowUpDate = followUpData.nextFollowUpDate ? 
            Timestamp.fromDate(new Date(followUpData.nextFollowUpDate)) : null;
        const lastServiceDate = followUpData.lastServiceDate ? 
            Timestamp.fromDate(new Date(followUpData.lastServiceDate)) : null;

        // Convert call history timestamps
        const callHistory = (followUpData.callHistory || []).map(call => ({
            ...call,
            timestamp: call.timestamp instanceof Date ? 
                Timestamp.fromDate(call.timestamp) : 
                Timestamp.fromDate(new Date(call.timestamp))
        }));

        // Prepare the data for Firestore
        const firestoreData = {
            customerId: followUpData.customerId,
            customerName: followUpData.customerName,
            phone: followUpData.phone,
            vehicleId: followUpData.vehicleId,
            vehicleNumber: followUpData.vehicleNumber,
            vehicleType: followUpData.vehicleType,
            lastServiceDate,
            status: followUpData.status,
            serviceDueData: followUpData.serviceDueData || null,
            notes: followUpData.notes || '',
            customerResponse: followUpData.customerResponse || '',
            nextFollowUpDate,
            callHistory,
            createdAt,
            updatedAt,
            lastCallTimestamp
        };

        console.log('Creating follow-up with data:', firestoreData); // Debug log

        const docRef = await addDoc(collection(firestore, 'followUps'), firestoreData);
        return { id: docRef.id, ...firestoreData };
    } catch (error) {
        console.error('Error creating follow-up:', error);
        throw error;
    }
};

export const recordFollowUpCall = async (followUpId, callData) => {
    try {
        const followUpRef = doc(firestore, 'followUps', followUpId);
        
        // Ensure callHistory is an array and convert all timestamps
        const callHistory = Array.isArray(callData.callHistory) ? callData.callHistory.map(call => ({
            ...call,
            timestamp: call.timestamp instanceof Date ? 
                Timestamp.fromDate(call.timestamp) : 
                call.timestamp
        })) : [];

        // Convert dates to Firestore Timestamps
        const nextFollowUpDate = callData.nextFollowUpDate ? 
            (callData.nextFollowUpDate instanceof Date ? 
                Timestamp.fromDate(callData.nextFollowUpDate) : 
                Timestamp.fromDate(new Date(callData.nextFollowUpDate))) : 
            null;

        const lastCallTimestamp = callData.lastCallTimestamp instanceof Date ?
            Timestamp.fromDate(callData.lastCallTimestamp) :
            Timestamp.fromDate(new Date());

        // Create the update data
        const updateData = {
            status: callData.status,
            lastCallTimestamp,
            nextFollowUpDate,
            notes: callData.notes || '',
            customerResponse: callData.customerResponse || '',
            callHistory,
            updatedAt: serverTimestamp()
        };

        console.log('Updating follow-up with data:', updateData); // Debug log

        await updateDoc(followUpRef, updateData);
        return true;
    } catch (error) {
        console.error('Error recording follow-up call:', error);
        throw error;
    }
}; 
import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, getDocsFromServer, updateDoc, deleteDoc, doc, query, where, orderBy, Timestamp, setDoc } from 'firebase/firestore';

const COLLECTION_NAME = 'items';

// Simple In-Memory Cache so we don't hit Firestore on every render/view switch
// and to support instant sync between ItemModal and Calendar
let _itemsCache = null;

const snapshotToData = (snapshot) => {
    return snapshot.docs.map(doc => {
        const data = doc.data();
        if (data.date && data.date.toDate) {
            data.date = data.date.toDate();
        }
        if (data.createdAt && data.createdAt.toDate) {
            data.createdAt = data.createdAt.toDate();
        }
        return { id: doc.id, ...data };
    });
};

export const itemService = {
    // Generate new ID
    getNewId: () => {
        return doc(collection(db, COLLECTION_NAME)).id;
    },

    // Add Item
    addItem: async (userId, itemData, customId = null) => {
        // 1. Prepare Data
        const dataToSave = {
            userId,
            createdAt: new Date(),
            ...itemData
        };

        // 2. Update Local Cache IMMEDIATELY
        if (_itemsCache) {
            const newItem = { id: customId || Date.now().toString(), ...dataToSave };
            // Check if exists (dedup logic if needed, but for add it's new)
            _itemsCache = [newItem, ..._itemsCache];
        }

        try {
            if (customId) {
                await setDoc(doc(db, COLLECTION_NAME, customId), dataToSave);
                return { id: customId, ...dataToSave };
            } else {
                const docRef = await addDoc(collection(db, COLLECTION_NAME), dataToSave);
                // If we didn't have customID, we update the cache item with real ID?
                // For simplified Optimistic UI, we usually use custom ID. 
                // If not, we might have a mismatch. 
                // But in our current app flow, we are moving to getNewId() usage.
                return { id: docRef.id, ...dataToSave };
            }
        } catch (error) {
            console.error("Error adding item: ", error);
            // If failed, remove from cache?
            // simplified: we keep it or rely on app reload. 
            return { id: customId || Date.now().toString(), ...itemData };
        }
    },

    // Get All Items (with Caching)
    getAllItems: async (userId) => {
        // Return Cache if available
        // Return Cache if available -- DISABLED to force Server Fetch for Data Consistency
        // if (_itemsCache) {
        //    return _itemsCache;
        // }

        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                where("userId", "==", userId)
                // orderBy("createdAt", "desc") // Removed to allow index deletion
            );
            const snapshot = await getDocsFromServer(q);
            const data = snapshotToData(snapshot);

            // Client-side Sort (Desc)
            data.sort((a, b) => {
                const dateA = a.createdAt?.getTime ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
                const dateB = b.createdAt?.getTime ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
                return dateB - dateA;
            });

            _itemsCache = data; // Set Cache
            return data;
        } catch (error) {
            console.error("Error fetching items: ", error);
            // Fallback empty
            return [];
        }
    },

    // Get Items by Category (Use Cache)
    getItemsByCategory: async (userId, categoryId) => {
        const allItems = await itemService.getAllItems(userId);
        return allItems.filter(item => item.categoryId === categoryId);
    },

    // Get Items by Date Range - REFACTORED to use Client-Side Filtering
    getItemsByDateRange: async (userId, startDate, endDate) => {
        const allItems = await itemService.getAllItems(userId);
        return allItems.filter(item => {
            if (!item.date) return false;
            const d = item.date;
            return d >= startDate && d <= endDate;
        });
    },

    // Update Item
    updateItem: async (itemId, data) => {
        // Update Cache Immediately
        if (_itemsCache) {
            _itemsCache = _itemsCache.map(cacheItem =>
                cacheItem.id === itemId ? { ...cacheItem, ...data } : cacheItem
            );
        }

        try {
            const itemRef = doc(db, COLLECTION_NAME, itemId);
            await updateDoc(itemRef, data);
            return true;
        } catch (error) {
            console.error("Error updating item: ", error);
            return false;
        }
    },

    // Delete Item
    deleteItem: async (itemId) => {
        // Update Cache Immediately
        if (_itemsCache) {
            _itemsCache = _itemsCache.filter(item => item.id !== itemId);
        }

        try {
            await deleteDoc(doc(db, COLLECTION_NAME, itemId));
            return true;
        } catch (error) {
            console.error("Error deleting item: ", error);
            return false;
        }
    }
};

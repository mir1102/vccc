import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, getDocsFromServer, updateDoc, deleteDoc, doc, query, where, orderBy, setDoc } from 'firebase/firestore';

const COLLECTION_NAME = 'categories';

// Helper to convert Firestore snapshot to array
const snapshotToData = (snapshot) => {
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const categoryService = {
    // Generate a new ID for optimistic UI
    getNewId: () => {
        return doc(collection(db, COLLECTION_NAME)).id;
    },

    // Add a new category
    // Now supports passing a pre-generated ID
    addCategory: async (userId, categoryData, customId = null) => {
        try {
            const dataToSave = {
                userId,
                createdAt: new Date(),
                ...categoryData
            };

            if (customId) {
                // For manual creation with ID
                await setDoc(doc(db, COLLECTION_NAME, customId), dataToSave);
                return { id: customId, ...dataToSave };
            } else {
                const docRef = await addDoc(collection(db, COLLECTION_NAME), dataToSave);
                return { id: docRef.id, ...dataToSave };
            }
        } catch (error) {
            console.error("Error adding category: ", error);
            // Fallback for demo without real auth/db
            return { id: customId || Date.now().toString(), ...dataToSave };
        }
    },

    // Get all categories for a user
    getCategories: async (userId) => {
        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                where("userId", "==", userId)
            );
            const snapshot = await getDocsFromServer(q);
            const data = snapshotToData(snapshot);
            console.log("Categories from Firestore:", data); // DEBUG

            // Sort logic: Primary = order (asc), Secondary = createdAt (desc)
            return data.sort((a, b) => {
                const orderA = a.order ?? 0;
                const orderB = b.order ?? 0;
                if (orderA !== orderB) return orderA - orderB;

                const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
                return dateB - dateA;
            });
        } catch (error) {
            console.error("Error fetching categories: ", error);
            return [];
        }
    },

    // Update a category
    updateCategory: async (categoryId, data) => {
        try {
            const catRef = doc(db, COLLECTION_NAME, categoryId);
            await updateDoc(catRef, data);
            return true;
        } catch (error) {
            console.error("Error updating category: ", error);
            return false;
        }
    },

    // Delete a category
    deleteCategory: async (categoryId) => {
        try {
            await deleteDoc(doc(db, COLLECTION_NAME, categoryId));
            return true;
        } catch (error) {
            console.error("Error deleting category: ", error);
            return false;
        }
    }
};

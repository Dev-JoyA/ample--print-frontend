import { api } from "@/lib/api";

export const adminService = {
    // Create admin
    createAdmin: async (data) => {
        console.log("👤 Creating admin with data:", data);
        try {
            const response = await api.post("/auth/admin-sign-up", {
                firstName: data.firstName,
                lastName: data.lastName,
                userName: data.userName,
                email: data.email,
                password: data.password,
                phoneNumber: data.phoneNumber,
                address: data.address,
            });
            console.log("✅ Admin created successfully:", response);
            return response;
        } catch (error) {
            console.error("❌ Failed to create admin:", error);
            throw error;
        }
    },

    // Deactivate admin
    deactivateAdmin: async (email) => {
        console.log("🔴 Deactivating admin:", email);
        try {
            const response = await api.post("/auth/deactivate-admin", { email });
            console.log("✅ Admin deactivated:", response);
            return response;
        } catch (error) {
            console.error("❌ Failed to deactivate admin:", error);
            throw error;
        }
    },

    // Reactivate admin
    reactivateAdmin: async (email) => {
        console.log("🟢 Reactivating admin:", email);
        try {
            const response = await api.post("/auth/reactivate-admin", { email });
            console.log("✅ Admin reactivated:", response);
            return response;
        } catch (error) {
            console.error("❌ Failed to reactivate admin:", error);
            throw error;
        }
    },

    // Get all admins - SIMPLIFIED because /users already returns profile data
    getAllAdmins: async () => {
        console.log("📋 Fetching all admins");
        try {
            const response = await api.get("/users");
            console.log("✅ Users response:", response);
            
            // Extract users array from response
            let users = [];
            if (response?.users && Array.isArray(response.users)) {
                users = response.users;
            } else if (Array.isArray(response)) {
                users = response;
            }
            
            console.log("📊 Found", users.length, "total users");
            
            // Filter for admin and superadmin roles
            const adminUsers = users.filter(user => 
                user.role === 'Admin' || user.role === 'SuperAdmin'
            );
            
            console.log("👥 Admin users:", adminUsers);
            
            // Return the users directly - they already have all profile fields!
            return adminUsers;
            
        } catch (error) {
            console.error("❌ Failed to fetch admins:", error);
            throw error;
        }
    }
};
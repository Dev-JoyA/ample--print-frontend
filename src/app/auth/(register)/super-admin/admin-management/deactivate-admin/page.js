'use client';

import { useState } from 'react';

const Page = () => {
    const [email, setEmail] = useState("");

    const handleClick = async () => {
        const confirmation = confirm("Are you sure you want to deactivate this admin?");
        if (confirmation) {
            try {
                const response = await fetch("http://localhost:4001/auth/deactivate-admin", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ email })
                });
                const data = await response.json();
                console.log("Admin deactivated", data);
            } catch (error) {
                console.error("Error deactivating admin:", error);
            }
        }
    };

    return (
        <div>
            <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter admin email"
                className="px-4 py-2 border border-gray-300 rounded mb-4 mr-4"
            />
            <button onClick={handleClick} className="bg-red-500 text-white px-4 py-2 rounded">
                Deactivate Admin
            </button>
        </div>
    );
};

export default Page;
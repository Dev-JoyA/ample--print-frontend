"use client";

import { useState } from "react";
import { authService } from "@/services/authService";

const Page = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    const confirmation = confirm("Are you sure you want to activate this admin?");
    if (!confirmation) return;
    setLoading(true);
    setMessage("");
    try {
      await authService.reactivateAdmin({ email });
      setMessage("Admin reactivated successfully");
    } catch (err) {
      setMessage(err?.data?.error ?? err?.message ?? "Failed to reactivate");
    } finally {
      setLoading(false);
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
      <button onClick={handleClick} className="bg-green-500 text-white px-4 py-2 rounded" disabled={loading}>
        {loading ? "Activating…" : "Activate Admin"}
      </button>
      {message && <p className="mt-2 text-sm">{message}</p>}
    </div>
  );
};

export default Page;
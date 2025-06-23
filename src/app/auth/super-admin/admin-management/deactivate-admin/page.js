"use client";


const page = () => {
    const handleClick = () => {
        const [email, setEmail] = useState("");
        const confirmation = confirm("Are you sure you want to deactivate this admin?");
        if (confirmation) {
            deactivateAdmin();
        }
        const response = fetch("http://localhost:4001/auth/deactivate-admin", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email }) // Replace with actual admin ID
        });
        // Logic to deactivate admin
        console.log("Admin deactivated");
    }
  return (
    <div>
        <button onClick={handleClick} className="bg-red-500 text-white px-4 py-2 rounded">Deactivate Admin</button>
    </div>
  )
}

export default page
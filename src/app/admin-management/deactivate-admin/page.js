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
    <div>Deactivate Admin Page</div>
  )
}

export default page
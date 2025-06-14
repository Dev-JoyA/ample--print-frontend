import React from 'react'

const handleClick = () => { 
  const confirmation = confirm("Are you sure you want to activate this admin?");
  if (confirmation) {
    // Logic to activate admin
    console.log("Admin activated");
  }
}

const page = () => {
  return (
    <div>
      <button onClick={handleClick} className="bg-green-500 text-white px-4 py-2 rounded">Activate Admin</button>
    </div>
  )
}

export default page
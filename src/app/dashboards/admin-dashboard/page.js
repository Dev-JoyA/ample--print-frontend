import React from 'react'

const page = () => {
  return (
    <div>
       <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Collection Actions */}
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Create Collection</h2>
            <p className="text-gray-600 mb-4">Add a new collection to organize your products.</p>
            <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
              Create Now
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Edit Collection</h2>
            <p className="text-gray-600 mb-4">Modify existing collections.</p>
            <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
              Edit Now
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Delete Collection</h2>
            <p className="text-gray-600 mb-4">Remove a collection from the system.</p>
            <button className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors">
              Delete Now
            </button>
          </div>

          {/* Product Actions */}
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Create Product</h2>
            <p className="text-gray-600 mb-4">Add a new product to your inventory.</p>
            <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
              Create Now
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Edit Product</h2>
            <p className="text-gray-600 mb-4">Update product details and information.</p>
            <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
              Edit Now
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Delete Product</h2>
            <p className="text-gray-600 mb-4">Remove a product from the inventory.</p>
            <button className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors">
              Delete Now
            </button>
          </div>
        </div>
      </main>
    </div>
    </div>
  )
}

export default page
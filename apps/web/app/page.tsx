import Image from "next/image";

export default function Home() {
  const roles = [
    {
      name: 'Site Supervisor',
      description: 'Manage site operations, inventory, and daily usage',
      color: 'bg-blue-500',
      features: ['Site Inventory', 'Daily Usage', 'Delivery Management', 'Order Requests']
    },
    {
      name: 'Procurement',
      description: 'Handle supplier management and purchasing',
      color: 'bg-green-500',
      features: ['Market Survey', 'Supplier Registry', 'Purchasing Plans', 'Quote Management']
    },
    {
      name: 'Supplier',
      description: 'Submit quotes and manage deliveries',
      color: 'bg-purple-500',
      features: ['Quote Submission', 'Sample Approvals', 'Delivery Tracking', 'Document Management']
    },
    {
      name: 'Chairman',
      description: 'Oversee approvals and project status',
      color: 'bg-red-500',
      features: ['Project Overview', 'Approval Workflows', 'Financial Reports', 'Strategic Decisions']
    },
    {
      name: 'Chairman\'s PA',
      description: 'Office document management and routing',
      color: 'bg-orange-500',
      features: ['Document Filing', 'Approval Routing', 'Office Inventory', 'Communication']
    }
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Tender Management System
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Streamline your construction project management with comprehensive tender handling, 
          supplier management, and inventory tracking.
        </p>
      </div>

      {/* Role Selection */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
          Select Your Role
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((role, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
            >
              <div className={`w-12 h-12 ${role.color} rounded-lg mb-4 flex items-center justify-center`}>
                <span className="text-white font-bold text-lg">
                  {role.name.charAt(0)}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {role.name}
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                {role.description}
              </p>
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Key Features:</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  {role.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
            Create New Project
          </button>
          <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
            Add Supplier
          </button>
          <button className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors">
            View Reports
          </button>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">5</div>
            <div className="text-sm text-gray-600">Active Projects</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">12</div>
            <div className="text-sm text-gray-600">Suppliers</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">8</div>
            <div className="text-sm text-gray-600">Pending Approvals</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">24</div>
            <div className="text-sm text-gray-600">Active Orders</div>
          </div>
        </div>
      </div>
    </div>
  );
}

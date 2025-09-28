'use client';

import { useState, useEffect, useCallback } from 'react';
import { getApiUrl } from '../../lib/config';

// Office Document Interface
interface OfficeDocument {
  id: string;
  name: string;
  description?: string;
  category: 'CONTRACTS' | 'REPORTS' | 'POLICIES' | 'PROCEDURES' | 'TEMPLATES' | 'OTHER';
  type: 'pdf' | 'doc' | 'docx' | 'jpg' | 'jpeg' | 'png';
  size: number;
  url: string;
  filePath: string;
  uploadedBy: string;
  uploadedAt: string;
  tags?: string[];
}

// Tools and Equipment Interface
interface ToolEquipment {
  id: string;
  name: string;
  description?: string;
  category: 'COMPUTERS' | 'PRINTERS' | 'FURNITURE' | 'OFFICE_SUPPLIES' | 'MAINTENANCE' | 'OTHER';
  serialNumber?: string;
  model?: string;
  brand?: string;
  status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'RETIRED';
  location: string;
  assignedTo?: string;
  purchaseDate?: string;
  lastMaintenance?: string;
  nextMaintenance?: string;
  notes?: string;
}

// Order and Receipt Interface
interface OrderReceipt {
  id: string;
  type: 'ORDER' | 'RECEIPT' | 'INVOICE' | 'QUOTE';
  title: string;
  description?: string;
  supplier?: string;
  amount?: number;
  currency: string;
  orderNumber?: string;
  invoiceNumber?: string;
  date: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  documents: OrderDocument[];
  uploadedBy: string;
  uploadedAt: string;
}

interface OrderDocument {
  id: string;
  name: string;
  type: 'pdf' | 'doc' | 'docx' | 'jpg' | 'jpeg' | 'png';
  size: number;
  url: string;
  filePath: string;
  uploadedAt: string;
}

// API Types for orders derived from project order templates
interface OrderTemplateItemAPI {
  amount?: number | string;
}

interface OrderTemplateAPI {
  id: string;
  title: string;
  equipmentInstallationWorks?: string;
  billNumber?: string;
  createdAt: string;
  createdByUser?: { name?: string } | null;
  items?: OrderTemplateItemAPI[];
}

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<'documents' | 'equipment' | 'orders'>('documents');
  const [ordersSubTab, setOrdersSubTab] = useState<'orders' | 'receipts'>('orders');
  const [user, setUser] = useState<{ id: string; name: string; email: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Office Documents State
  const [officeDocuments, setOfficeDocuments] = useState<OfficeDocument[]>([]);
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [newDocument, setNewDocument] = useState({
    name: '',
    description: '',
    category: 'OTHER' as OfficeDocument['category'],
    tags: [] as string[]
  });
  
  // Tools and Equipment State
  const [toolsEquipment, setToolsEquipment] = useState<ToolEquipment[]>([]);
  const [showEquipmentForm, setShowEquipmentForm] = useState(false);
  const [newEquipment, setNewEquipment] = useState({
    name: '',
    description: '',
    category: 'OTHER' as ToolEquipment['category'],
    serialNumber: '',
    model: '',
    brand: '',
    location: '',
    assignedTo: '',
    purchaseDate: '',
    notes: ''
  });
  
  // Orders and Receipts State
  const [ordersReceipts, setOrdersReceipts] = useState<OrderReceipt[]>([]);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [newOrder, setNewOrder] = useState({
    type: 'ORDER' as OrderReceipt['type'],
    title: '',
    description: '',
    supplier: '',
    amount: 0,
    currency: 'KES',
    orderNumber: '',
    invoiceNumber: '',
    date: new Date().toISOString().split('T')[0]
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadingFiles, setUploadingFiles] = useState(false);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch inventory data from the actual API
      const token = typeof window !== 'undefined' ? localStorage.getItem('tms_token') : null;
      if (token) {
        // Fetch current user to apply role-based restrictions
        const meRes = await fetch(getApiUrl('/api/auth/me'), { headers: { Authorization: `Bearer ${token}` } });
        if (meRes.ok) {
          const me = await meRes.json();
          setUser(me.user || me);
        }

        const response = await fetch(getApiUrl('/api/inventory'), {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const inventoryData = await response.json();
          // Convert inventory data to the expected format
          const convertedEquipment = inventoryData.map((item: { id: string; name: string; description?: string; category: string; status: string; location: string; assignedTo?: string; lastMaintenance?: string; nextMaintenance?: string; purchaseDate?: string; warrantyExpiry?: string; cost?: number; supplier?: string; notes?: string; serialNumber?: string; model?: string; brand?: string; createdAt: string; updatedAt: string }) => ({
            id: item.id,
            name: item.name,
            description: item.description || '',
            category: item.category || 'OTHER',
            serialNumber: item.serialNumber || '',
            model: item.model || '',
            brand: item.brand || '',
            status: 'AVAILABLE' as const,
            location: item.location || '',
            assignedTo: item.assignedTo || '',
            purchaseDate: item.purchaseDate || '',
            lastMaintenance: item.lastMaintenance || '',
            nextMaintenance: item.nextMaintenance || '',
            notes: item.notes || ''
          }));
          setToolsEquipment(convertedEquipment);
        } else {
          console.error('Failed to fetch inventory data:', response.status);
          // Use mock data as fallback
          fetchToolsEquipment();
        }
      } else {
        console.log('No authentication token found, using mock data');
        // Use mock data when not authenticated
        fetchToolsEquipment();
      }
      
      // Fetch other data (mock for now)
      await Promise.all([
        fetchOfficeDocuments(),
        fetchOrdersReceipts()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      // Use mock data as fallback
      fetchToolsEquipment();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initialize tab from query string if present
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'orders') setActiveTab('orders');
      const sub = params.get('sub');
      if (sub === 'receipts') setOrdersSubTab('receipts');
    }
    fetchAllData();
  }, [fetchAllData]);

  const fetchOfficeDocuments = async () => {
    try {
      const response = await fetch(getApiUrl('/api/upload/office-documents'));
      if (response.ok) {
        const documents: OfficeDocument[] = await response.json();
        setOfficeDocuments(documents);
      } else {
        console.error('Failed to fetch office documents:', response.status);
        setOfficeDocuments([]);
      }
    } catch (error) {
      console.error('Error fetching office documents:', error);
      setOfficeDocuments([]);
    }
  };

  const fetchToolsEquipment = async () => {
    // Mock data - replace with actual API call
    const mockEquipment: ToolEquipment[] = [
      {
        id: '1',
        name: 'Dell Laptop - Inspiron 15',
        description: 'Office laptop for general use',
        category: 'COMPUTERS',
        serialNumber: 'DL123456789',
        model: 'Inspiron 15 3000',
        brand: 'Dell',
        status: 'IN_USE',
        location: 'Office - Desk 3',
        assignedTo: 'John Doe',
        purchaseDate: '2023-06-15',
        lastMaintenance: '2024-01-10',
        nextMaintenance: '2024-04-10',
        notes: 'Battery needs replacement soon'
      },
      {
        id: '2',
        name: 'HP LaserJet Pro Printer',
        description: 'Office printer for documents',
        category: 'PRINTERS',
        serialNumber: 'HP987654321',
        model: 'LaserJet Pro 400',
        brand: 'HP',
        status: 'AVAILABLE',
        location: 'Office - Printer Room',
        purchaseDate: '2023-08-20',
        lastMaintenance: '2024-01-05',
        nextMaintenance: '2024-04-05'
      }
    ];
    setToolsEquipment(mockEquipment);
  };

  const fetchOrdersReceipts = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('tms_token') : null;
      if (!token) {
        setOrdersReceipts([]);
        return;
      }

      const headers = { Authorization: `Bearer ${token}` } as const;

      // Get projects list (RBAC on API ensures supervisors get only their assigned project)
      const projectsRes = await fetch(getApiUrl('/api/projects'), { headers });
      if (!projectsRes.ok) {
        setOrdersReceipts([]);
        return;
      }
      const projects: Array<{ id: string; title: string }> = await projectsRes.json();

      // Fetch order templates per project and flatten
      const perProject = await Promise.all(
        projects.map(async (p) => {
          const res = await fetch(getApiUrl(`/api/projects/${p.id}/order-templates`), { headers });
          if (!res.ok) return [] as OrderReceipt[];
          const templates: OrderTemplateAPI[] = await res.json();
          return templates.map((t) => {
            const items = Array.isArray(t.items) ? t.items : [];
            const total = items.reduce((sum: number, it: OrderTemplateItemAPI) => sum + Number(it.amount || 0), 0);
            const createdBy = t.createdByUser?.name || 'Unknown';
            const order: OrderReceipt = {
              id: t.id,
              type: 'ORDER',
              title: t.title,
              description: t.equipmentInstallationWorks || '',
              supplier: undefined,
              amount: total,
              currency: 'KES',
              orderNumber: t.billNumber || '',
              invoiceNumber: undefined,
              date: t.createdAt,
              status: 'PENDING',
              documents: [],
              uploadedBy: createdBy,
              uploadedAt: t.createdAt
            };
            return order;
          });
        })
      );

      const orders = perProject.flat();
      setOrdersReceipts(orders);
    } catch (err) {
      console.error('Failed to fetch orders/receipts:', err);
      setOrdersReceipts([]);
    }
  };

  // Office Documents Functions
  const handleDocumentUpload = async (files: FileList) => {
    console.log('📤 handleDocumentUpload called with', files.length, 'files');
    console.log('📤 Files:', Array.from(files).map(f => ({ name: f.name, size: f.size, type: f.type })));
    
    setUploadingFiles(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('tms_token') : null;
      console.log('📤 Token exists:', !!token);
      if (!token) {
        alert('Please log in to upload documents');
        return;
      }

      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('documents', file);
      });
      formData.append('category', newDocument.category);
      formData.append('name', newDocument.name);
      formData.append('description', newDocument.description);
      formData.append('tags', JSON.stringify(newDocument.tags));

      console.log('📤 FormData prepared');
      console.log('📤 Category:', newDocument.category);
      console.log('📤 Name:', newDocument.name);
      console.log('📤 Description:', newDocument.description);
      console.log('📤 Tags:', newDocument.tags);

      const apiUrl = getApiUrl('/api/upload/office-documents');
      console.log('📤 API URL:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      console.log('📤 Response status:', response.status);
      console.log('📤 Response ok:', response.ok);

      if (response.ok) {
        const responseData = await response.json();
        console.log('📤 Response data:', responseData);
        
        // Handle both array and single object responses
        const uploadedDocs = Array.isArray(responseData) ? responseData : [responseData];
        
        // Only update state if we have actual document data (not just success message)
        if (uploadedDocs.length > 0 && uploadedDocs[0].id) {
          setOfficeDocuments(prev => [...uploadedDocs, ...prev]);
          setNewDocument({ name: '', description: '', category: 'OTHER', tags: [] });
          setShowDocumentUpload(false);
          alert('Documents uploaded successfully!');
        } else {
          // This is our simplified test response
          alert('Upload endpoint working! Files received: ' + (responseData.files || 0));
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to upload documents');
      }
    } catch (error) {
      console.error('Error uploading documents:', error);
      alert(`Error uploading documents: ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setUploadingFiles(false);
    }
  };

  const openForView = (doc: OfficeDocument) => {
    if (doc.filePath) {
      // Use the view endpoint for browser viewing
      const viewUrl = getApiUrl(`/api/upload/view?filePath=${encodeURIComponent(doc.filePath)}`);
      window.open(viewUrl, '_blank', 'noopener');
    } else {
      alert('File preview not available');
    }
  }

  const handleDocumentDelete = async (doc: OfficeDocument) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('tms_token') : null;
      if (!token) {
        alert('Please log in to delete documents');
        return;
      }

      if (confirm('Are you sure you want to delete this document?')) {
        const response = await fetch(getApiUrl('/api/upload/file'), {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ filePath: doc.filePath }),
        });

        if (response.ok) {
          setOfficeDocuments(prev => prev.filter(d => d.id !== doc.id));
          alert('Document deleted successfully!');
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to delete document');
        }
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      alert(`Error deleting document: ${error instanceof Error ? error.message : 'Please try again.'}`);
    }
  };

  // Tools and Equipment Functions
  const handleAddEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    const equipment: ToolEquipment = {
      id: Date.now().toString(),
      ...newEquipment,
      status: 'AVAILABLE'
    };
    
    setToolsEquipment([equipment, ...toolsEquipment]);
    setNewEquipment({
      name: '',
      description: '',
      category: 'OTHER',
      serialNumber: '',
      model: '',
      brand: '',
      location: '',
      assignedTo: '',
      purchaseDate: '',
      notes: ''
    });
    setShowEquipmentForm(false);
  };

  // Orders and Receipts Functions
  const handleAddOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const order: OrderReceipt = {
      id: Date.now().toString(),
      ...newOrder,
      status: 'PENDING',
      documents: [],
      uploadedBy: 'Current User', // This should come from auth
      uploadedAt: new Date().toISOString()
    };
    
    setOrdersReceipts([order, ...ordersReceipts]);
    setNewOrder({
      type: 'ORDER',
      title: '',
      description: '',
      supplier: '',
      amount: 0,
      currency: 'KES',
      orderNumber: '',
      invoiceNumber: '',
      date: new Date().toISOString().split('T')[0]
    });
    setShowOrderForm(false);
  };


  // Utility Functions
  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf': return '📄';
      case 'doc':
      case 'docx': return '📝';
      case 'jpg':
      case 'jpeg':
      case 'png': return '🖼️';
      default: return '📎';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-green-100 text-green-800';
      case 'IN_USE': return 'bg-blue-100 text-blue-800';
      case 'MAINTENANCE': return 'bg-yellow-100 text-yellow-800';
      case 'RETIRED': return 'bg-red-100 text-red-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter functions for each section
  const filteredDocuments = officeDocuments.filter(doc =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredEquipment = toolsEquipment.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredOrders = ordersReceipts.filter(order =>
    order.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.supplier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Split orders vs receipts
  const onlyOrders = filteredOrders.filter(o => o.type === 'ORDER');
  const onlyReceipts = filteredOrders.filter(o => o.type !== 'ORDER');

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading inventory...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {user?.role !== 'SITE_SUPERVISOR' && (
          <button
            onClick={() => setActiveTab('documents')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'documents'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📄 Office Documents
          </button>
          )}
          {user?.role !== 'SITE_SUPERVISOR' && (
          <button
            onClick={() => setActiveTab('equipment')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'equipment'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            🛠️ Tools & Equipment
          </button>
          )}
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'orders'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📋 Orders{user?.role !== 'SITE_SUPERVISOR' ? ' & Receipts' : ''}
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          {/* Office Documents Section */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Office Documents</h2>
            <button
              onClick={() => setShowDocumentUpload(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Upload Document
            </button>
          </div>

          {/* Search */}
          <div className="max-w-md">
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Documents Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {filteredDocuments.map((doc) => (
              <div key={doc.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow min-h-0 overflow-hidden flex flex-col">
                <div className="flex items-start justify-between mb-4 min-h-0">
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    <span className="text-2xl flex-shrink-0">{getFileIcon(doc.type)}</span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-gray-900 truncate">{doc.name}</h3>
                      <p className="text-sm text-gray-500 truncate">{doc.category}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDocumentDelete(doc)}
                    className="text-red-500 hover:text-red-700"
                  >
                    🗑️
                  </button>
                </div>
                
                {doc.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2 overflow-hidden">{doc.description}</p>
                )}
                
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>{formatFileSize(doc.size)}</span>
                  <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                </div>
                
                <div className="flex space-x-2 mt-auto">
                  <button
                    // onClick={() => window.open(doc.url, '_blank')}
                    onClick={() => openForView(doc)}
                    className="flex-1 bg-blue-100 text-blue-700 px-3 py-2 rounded text-sm hover:bg-blue-200 transition-colors whitespace-nowrap"
                  >
                    View
                  </button>
                  <button
                    onClick={() => {
                      if (doc.filePath) {
                        const link = document.createElement('a');
                        link.href = getApiUrl(`/api/upload/download?filePath=${encodeURIComponent(doc.filePath)}`);
                        link.download = doc.name;
                        link.click();
                      } else {
                        alert('Download not available');
                      }
                    }}
                    className="flex-1 bg-green-100 text-green-700 px-3 py-2 rounded text-sm hover:bg-green-200 transition-colors whitespace-nowrap"
                  >
                    Download
                  </button>
                </div>
                
                {doc.tags && doc.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1 max-h-16 overflow-hidden">
                    {doc.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded truncate">
                        {tag}
                      </span>
                    ))}
                    {doc.tags.length > 3 && (
                      <span className="px-2 py-1 bg-gray-200 text-gray-500 text-xs rounded">
                        +{doc.tags.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'equipment' && (
        <div className="space-y-6">
          {/* Tools & Equipment Section */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Tools & Equipment</h2>
            <button
              onClick={() => setShowEquipmentForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Add Equipment
            </button>
          </div>

          {/* Search */}
          <div className="max-w-md">
            <input
              type="text"
              placeholder="Search equipment..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-gray-900 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Equipment Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEquipment.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-500">{item.brand} {item.model}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.serialNumber || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                        {item.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.location}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.assignedTo || 'Unassigned'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                      <button className="text-red-600 hover:text-red-900">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="space-y-6">
          {/* Orders Section Header with Sub-Tabs */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{user?.role === 'SITE_SUPERVISOR' ? 'Orders' : 'Orders & Receipts'}</h2>
              <div className="mt-2 flex space-x-4">
                <button
                  onClick={() => setOrdersSubTab('orders')}
                  className={`text-sm pb-1 border-b-2 ${ordersSubTab === 'orders' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                  Orders
                </button>
                {user?.role !== 'SITE_SUPERVISOR' && (
                  <button
                    onClick={() => setOrdersSubTab('receipts')}
                    className={`text-sm pb-1 border-b-2 ${ordersSubTab === 'receipts' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                  >
                    Receipts
                  </button>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowOrderForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              {user?.role === 'SITE_SUPERVISOR' ? 'Add Order' : 'Add Order/Receipt'}
            </button>
          </div>

          {/* Search */}
          <div className="max-w-md">
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-gray-900 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Orders/Receipts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(ordersSubTab === 'orders' ? onlyOrders : onlyReceipts).map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-medium text-gray-900">{order.title}</h3>
                    <p className="text-sm text-gray-500">{order.type}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
                
                {order.description && (
                  <p className="text-sm text-gray-600 mb-3">{order.description}</p>
                )}
                
                <div className="space-y-2 text-sm text-gray-500 mb-4">
                  {order.supplier && <p><strong>Supplier:</strong> {order.supplier}</p>}
                  {order.amount && <p><strong>Amount:</strong> {formatCurrency(order.amount, order.currency)}</p>}
                  {order.orderNumber && <p><strong>Order #:</strong> {order.orderNumber}</p>}
                  {order.invoiceNumber && <p><strong>Invoice #:</strong> {order.invoiceNumber}</p>}
                  <p><strong>Date:</strong> {new Date(order.date).toLocaleDateString()}</p>
                </div>
                
                {order.documents && order.documents.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Documents:</p>
                    <div className="space-y-1">
                      {order.documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between text-sm">
                          <span className="flex items-center">
                            <span className="mr-2">{getFileIcon(doc.type)}</span>
                            {doc.name}
                          </span>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                const filePath = doc.filePath || doc.url;
                                const viewUrl = `${getApiUrl('')}/api/upload/view?filePath=${encodeURIComponent(filePath)}`;
                                window.open(viewUrl, '_blank');
                              }}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              View
                            </button>
                            <button
                              onClick={() => {
                                const filePath = doc.filePath || doc.url;
                                const downloadUrl = `${getApiUrl('')}/api/upload/download?filePath=${encodeURIComponent(filePath)}`;
                                const link = document.createElement('a');
                                link.href = downloadUrl;
                                link.download = doc.name;
                                link.click();
                              }}
                              className="text-green-600 hover:text-green-800"
                            >
                              Download
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex space-x-2">
                  <button className="flex-1 bg-blue-100 text-blue-700 px-3 py-2 rounded text-sm hover:bg-blue-200 transition-colors">
                    Edit
                  </button>
                  <button className="flex-1 bg-green-100 text-green-700 px-3 py-2 rounded text-sm hover:bg-green-200 transition-colors">
                    Upload Docs
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Equipment Form */}
      {showEquipmentForm && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Equipment</h2>
          <form onSubmit={handleAddEquipment} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={newEquipment.name}
                  onChange={(e) => setNewEquipment({ ...newEquipment, name: e.target.value })}
                  className="w-full text-gray-900 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Dell Laptop"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  required
                  value={newEquipment.category}
                  onChange={(e) => setNewEquipment({ ...newEquipment, category: e.target.value as ToolEquipment['category'] })}
                  className="w-full text-gray-900 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="COMPUTERS">Computers</option>
                  <option value="PRINTERS">Printers</option>
                  <option value="FURNITURE">Furniture</option>
                  <option value="OFFICE_SUPPLIES">Office Supplies</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brand
                </label>
                <input
                  type="text"
                  value={newEquipment.brand}
                  onChange={(e) => setNewEquipment({ ...newEquipment, brand: e.target.value })}
                  className="w-full text-gray-900 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Dell"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Model
                </label>
                <input
                  type="text"
                  value={newEquipment.model}
                  onChange={(e) => setNewEquipment({ ...newEquipment, model: e.target.value })}
                  className="w-full text-gray-900 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Inspiron 15 3000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Serial Number
                </label>
                <input
                  type="text"
                  value={newEquipment.serialNumber}
                  onChange={(e) => setNewEquipment({ ...newEquipment, serialNumber: e.target.value })}
                  className="w-full text-gray-900 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., DL123456789"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location *
                </label>
                <input
                  type="text"
                  required
                  value={newEquipment.location}
                  onChange={(e) => setNewEquipment({ ...newEquipment, location: e.target.value })}
                  className="w-full text-gray-900 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Office - Desk 3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned To
                </label>
                <input
                  type="text"
                  value={newEquipment.assignedTo}
                  onChange={(e) => setNewEquipment({ ...newEquipment, assignedTo: e.target.value })}
                  className="w-full text-gray-900 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purchase Date
                </label>
                <input
                  type="date"
                  value={newEquipment.purchaseDate}
                  onChange={(e) => setNewEquipment({ ...newEquipment, purchaseDate: e.target.value })}
                  className="w-full text-gray-900 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newEquipment.description}
                  onChange={(e) => setNewEquipment({ ...newEquipment, description: e.target.value })}
                  className="w-full text-gray-900 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Equipment description..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={newEquipment.notes}
                  onChange={(e) => setNewEquipment({ ...newEquipment, notes: e.target.value })}
                  className="w-full text-gray-900 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Additional notes..."
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowEquipmentForm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Add Equipment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Order Form */}
      {showOrderForm && (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{user?.role === 'SITE_SUPERVISOR' ? 'Add Order' : 'Add Order/Receipt'}</h2>
          <form onSubmit={handleAddOrder} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {user?.role !== 'SITE_SUPERVISOR' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type *
                  </label>
                  <select
                    value={newOrder.type}
                    onChange={(e) => setNewOrder({...newOrder, type: e.target.value as OrderReceipt['type']})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="ORDER">Order</option>
                    <option value="RECEIPT">Receipt</option>
                    <option value="INVOICE">Invoice</option>
                    <option value="QUOTE">Quote</option>
                  </select>
                </div>
              ) : (
                <input type="hidden" value={newOrder.type} />
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={newOrder.title}
                  onChange={(e) => setNewOrder({...newOrder, title: e.target.value})}
                  className="w-full text-gray-900 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier
                </label>
                <input
                  type="text"
                  value={newOrder.supplier}
                  onChange={(e) => setNewOrder({...newOrder, supplier: e.target.value})}
                  className="w-full text-gray-900 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newOrder.amount}
                  onChange={(e) => setNewOrder({...newOrder, amount: Number(e.target.value)})}
                  className="w-full text-gray-900 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency
                </label>
                <select
                  value={newOrder.currency}
                  onChange={(e) => setNewOrder({...newOrder, currency: e.target.value})}
                  className="w-full text-gray-900 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="KES">KES</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  value={newOrder.date}
                  onChange={(e) => setNewOrder({...newOrder, date: e.target.value})}
                  className="w-full text-gray-900 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order Number
                </label>
                <input
                  type="text"
                  value={newOrder.orderNumber}
                  onChange={(e) => setNewOrder({...newOrder, orderNumber: e.target.value})}
                  className="w-full text-gray-900 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Invoice Number
                </label>
                <input
                  type="text"
                  value={newOrder.invoiceNumber}
                  onChange={(e) => setNewOrder({...newOrder, invoiceNumber: e.target.value})}
                  className="w-full text-gray-900 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newOrder.description}
                  onChange={(e) => setNewOrder({...newOrder, description: e.target.value})}
                  className="w-full text-gray-900 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowOrderForm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Add Order/Receipt
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Document Upload Modal */}
      {showDocumentUpload && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Office Document</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                console.log('📤 Form submitted');
                console.log('📤 Document name:', newDocument.name);
                console.log('📤 Document category:', newDocument.category);
                
                const fileInput = document.getElementById('document-files') as HTMLInputElement;
                console.log('📤 File input:', fileInput);
                console.log('📤 Files:', fileInput?.files);
                console.log('📤 Files length:', fileInput?.files?.length);
                
                if (fileInput?.files && fileInput.files.length > 0) {
                  console.log('📤 Calling handleDocumentUpload with', fileInput.files.length, 'files');
                  handleDocumentUpload(fileInput.files);
                } else {
                  console.log('❌ No files selected');
                  alert('Please select at least one file to upload');
                }
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Document Name *
                  </label>
                  <input
                    type="text"
                    value={newDocument.name}
                    onChange={(e) => setNewDocument({...newDocument, name: e.target.value})}
                    className="w-full text-gray-900 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={newDocument.category}
                    onChange={(e) => setNewDocument({...newDocument, category: e.target.value as OfficeDocument['category']})}
                    className="w-full text-gray-900 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="CONTRACTS">Contracts</option>
                    <option value="REPORTS">Reports</option>
                    <option value="POLICIES">Policies</option>
                    <option value="PROCEDURES">Procedures</option>
                    <option value="TEMPLATES">Templates</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newDocument.description}
                    onChange={(e) => setNewDocument({...newDocument, description: e.target.value})}
                    className="w-full text-gray-900 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Files *
                  </label>
                  <input
                    id="document-files"
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    className="w-full text-gray-900 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowDocumentUpload(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploadingFiles}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {uploadingFiles ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

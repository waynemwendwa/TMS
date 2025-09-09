'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ReportData {
  id: string;
  title: string;
  type: 'PROJECT' | 'SUPPLIER' | 'INVENTORY' | 'FINANCIAL' | 'PROCUREMENT';
  description: string;
  generatedAt: string;
  status: 'READY' | 'GENERATING' | 'ERROR';
  fileUrl?: string;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReportType, setSelectedReportType] = useState<string>('');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockReports: ReportData[] = [
        {
          id: '1',
          title: 'Project Status Report',
          type: 'PROJECT',
          description: 'Overview of all active projects and their current status',
          generatedAt: '2024-01-15T10:30:00Z',
          status: 'READY',
          fileUrl: '/reports/project-status-2024-01-15.pdf'
        },
        {
          id: '2',
          title: 'Supplier Performance Analysis',
          type: 'SUPPLIER',
          description: 'Detailed analysis of supplier performance and ratings',
          generatedAt: '2024-01-14T14:20:00Z',
          status: 'READY',
          fileUrl: '/reports/supplier-performance-2024-01-14.pdf'
        },
        {
          id: '3',
          title: 'Inventory Valuation Report',
          type: 'INVENTORY',
          description: 'Current inventory valuation and stock levels',
          generatedAt: '2024-01-13T09:15:00Z',
          status: 'READY',
          fileUrl: '/reports/inventory-valuation-2024-01-13.pdf'
        },
        {
          id: '4',
          title: 'Monthly Financial Summary',
          type: 'FINANCIAL',
          description: 'Monthly financial summary and budget analysis',
          generatedAt: '2024-01-12T16:45:00Z',
          status: 'GENERATING'
        },
        {
          id: '5',
          title: 'Procurement Activity Report',
          type: 'PROCUREMENT',
          description: 'Summary of all procurement activities and purchases',
          generatedAt: '2024-01-11T11:30:00Z',
          status: 'ERROR'
        }
      ];
      setReports(mockReports);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedReportType) {
      alert('Please select a report type');
      return;
    }

    try {
      // Mock report generation - replace with actual API call
      const newReport: ReportData = {
        id: Date.now().toString(),
        title: `${selectedReportType} Report`,
        type: selectedReportType as any,
        description: `Generated report for ${selectedReportType.toLowerCase()}`,
        generatedAt: new Date().toISOString(),
        status: 'GENERATING'
      };

      setReports([newReport, ...reports]);

      // Simulate report generation delay
      setTimeout(() => {
        setReports(prev => prev.map(r => 
          r.id === newReport.id 
            ? { ...r, status: 'READY' as const, fileUrl: `/reports/${selectedReportType.toLowerCase()}-${Date.now()}.pdf` }
            : r
        ));
      }, 3000);

    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'READY': return 'bg-green-100 text-green-800';
      case 'GENERATING': return 'bg-yellow-100 text-yellow-800';
      case 'ERROR': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'PROJECT': return 'bg-blue-100 text-blue-800';
      case 'SUPPLIER': return 'bg-green-100 text-green-800';
      case 'INVENTORY': return 'bg-purple-100 text-purple-800';
      case 'FINANCIAL': return 'bg-yellow-100 text-yellow-800';
      case 'PROCUREMENT': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading reports...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
        <button 
          onClick={() => document.getElementById('generateModal')?.classList.remove('hidden')}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Generate Report
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-2xl font-bold text-blue-600">{reports.length}</div>
          <div className="text-sm text-gray-600">Total Reports</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-2xl font-bold text-green-600">
            {reports.filter(r => r.status === 'READY').length}
          </div>
          <div className="text-sm text-gray-600">Ready</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-2xl font-bold text-yellow-600">
            {reports.filter(r => r.status === 'GENERATING').length}
          </div>
          <div className="text-sm text-gray-600">Generating</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-2xl font-bold text-red-600">
            {reports.filter(r => r.status === 'ERROR').length}
          </div>
          <div className="text-sm text-gray-600">Errors</div>
        </div>
      </div>

      {/* Generate Report Modal */}
      <div id="generateModal" className="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div className="mt-3">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Generate New Report</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Report Type
                </label>
                <select
                  value={selectedReportType}
                  onChange={(e) => setSelectedReportType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select report type</option>
                  <option value="PROJECT">Project Status Report</option>
                  <option value="SUPPLIER">Supplier Performance Analysis</option>
                  <option value="INVENTORY">Inventory Valuation Report</option>
                  <option value="FINANCIAL">Financial Summary</option>
                  <option value="PROCUREMENT">Procurement Activity Report</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => document.getElementById('generateModal')?.classList.add('hidden')}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateReport}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Generate
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Generated Reports</h2>
        </div>
        {reports.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            No reports generated yet. Create your first report to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Report
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Generated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{report.title}</div>
                        <div className="text-sm text-gray-500">{report.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(report.type)}`}>
                        {report.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(report.status)}`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(report.generatedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {report.status === 'READY' && report.fileUrl && (
                          <a
                            href={report.fileUrl}
                            download
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Download
                          </a>
                        )}
                        {report.status === 'GENERATING' && (
                          <span className="text-yellow-600">Generating...</span>
                        )}
                        {report.status === 'ERROR' && (
                          <button className="text-red-600 hover:text-red-900">
                            Retry
                          </button>
                        )}
                        <button className="text-gray-600 hover:text-gray-900">
                          View Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Report Templates */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Report Templates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <h4 className="font-medium text-gray-900 mb-2">Project Dashboard</h4>
            <p className="text-sm text-gray-600 mb-3">Overview of all projects with status and progress</p>
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              Generate Now
            </button>
          </div>
          <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <h4 className="font-medium text-gray-900 mb-2">Supplier Comparison</h4>
            <p className="text-sm text-gray-600 mb-3">Compare suppliers based on performance metrics</p>
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              Generate Now
            </button>
          </div>
          <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <h4 className="font-medium text-gray-900 mb-2">Inventory Summary</h4>
            <p className="text-sm text-gray-600 mb-3">Current inventory levels and valuation</p>
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              Generate Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

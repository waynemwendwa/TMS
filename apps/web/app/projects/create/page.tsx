'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getApiUrl } from '../../../lib/config';

interface ContactInfo {
  poBox: string;
  address: string;
  phone: string;
  location: string;
  email: string;
}

export default function CreateProjectPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [pricedBoqFile, setPricedBoqFile] = useState<File | null>(null);
  const [unpricedBoqFile, setUnpricedBoqFile] = useState<File | null>(null);
  const [projectData, setProjectData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    // Bio data
    mainContractor: '',
    client: '',
    architect: '',
    engineer: '',
    quantitySurveyor: '',
    structuralEngineer: '',
    subcontractors: '',
    lawFirm: '',
    // Contact information
    contractorContact: { poBox: '', address: '', phone: '', location: '', email: '' },
    clientContact: { poBox: '', address: '', phone: '', location: '', email: '' },
    architectContact: { poBox: '', address: '', phone: '', location: '', email: '' },
    engineerContact: { poBox: '', address: '', phone: '', location: '', email: '' },
    qsContact: { poBox: '', address: '', phone: '', location: '', email: '' },
    structuralContact: { poBox: '', address: '', phone: '', location: '', email: '' },
    subcontractorContact: { poBox: '', address: '', phone: '', location: '', email: '' },
    lawFirmContact: { poBox: '', address: '', phone: '', location: '', email: '' }
  });

  const handleInputChange = (field: string, value: string) => {
    setProjectData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleContactChange = (contactType: string, field: string, value: string) => {
    setProjectData(prev => ({
      ...prev,
      [contactType]: {
        ...prev[contactType as keyof typeof prev] as ContactInfo,
        [field]: value
      }
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Get the current user's token
      const token = localStorage.getItem('tms_token');
      if (!token) {
        alert('Please log in to create a project');
        return;
      }

      const response = await fetch(getApiUrl('/api/projects'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(projectData),
      });

      if (response.ok) {
        const project = await response.json();

        const uploadPromises: Promise<Response>[] = [];

        if (pricedBoqFile) {
          const fd = new FormData();
          fd.append('boqFiles', pricedBoqFile);
          fd.append('projectId', project.id);
          fd.append('boqType', 'priced');
          uploadPromises.push(fetch(getApiUrl('/api/upload/boq'), { method: 'POST', body: fd }));
        }

        if (unpricedBoqFile) {
          const fd = new FormData();
          fd.append('boqFiles', unpricedBoqFile);
          fd.append('projectId', project.id);
          fd.append('boqType', 'unpriced');
          uploadPromises.push(fetch(getApiUrl('/api/upload/boq'), { method: 'POST', body: fd }));
        }

        if (uploadPromises.length > 0) {
          try {
            await Promise.all(uploadPromises);
          } catch (e) {
            console.error('One or more BOQ uploads failed', e);
          }
        }

        router.push(`/projects`);
      } else {
        console.error('Failed to create project');
      }
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900">Project Basic Information</h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Project Title *
        </label>
        <input
          type="text"
          value={projectData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          placeholder="Enter project title"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={projectData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          rows={4}
          placeholder="Enter project description"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Start Date
          </label>
          <input
            type="date"
            value={projectData.startDate}
            onChange={(e) => handleInputChange('startDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            End Date
          </label>
          <input
            type="date"
            value={projectData.endDate}
            onChange={(e) => handleInputChange('endDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900">Project Bio Data</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Main Contractor
          </label>
          <input
            type="text"
            value={projectData.mainContractor}
            onChange={(e) => handleInputChange('mainContractor', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            placeholder="Enter main contractor name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Client
          </label>
          <input
            type="text"
            value={projectData.client}
            onChange={(e) => handleInputChange('client', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            placeholder="Enter client name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Architect
          </label>
          <input
            type="text"
            value={projectData.architect}
            onChange={(e) => handleInputChange('architect', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            placeholder="Enter architect name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Engineer
          </label>
          <input
            type="text"
            value={projectData.engineer}
            onChange={(e) => handleInputChange('engineer', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            placeholder="Enter engineer name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quantity Surveyor
          </label>
          <input
            type="text"
            value={projectData.quantitySurveyor}
            onChange={(e) => handleInputChange('quantitySurveyor', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            placeholder="Enter quantity surveyor name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Structural Engineer
          </label>
          <input
            type="text"
            value={projectData.structuralEngineer}
            onChange={(e) => handleInputChange('structuralEngineer', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            placeholder="Enter structural engineer name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subcontractors
          </label>
          <input
            type="text"
            value={projectData.subcontractors}
            onChange={(e) => handleInputChange('subcontractors', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            placeholder="Enter subcontractors (comma-separated)"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Law Firm
          </label>
          <input
            type="text"
            value={projectData.lawFirm}
            onChange={(e) => handleInputChange('lawFirm', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            placeholder="Enter law firm name"
          />
        </div>
      </div>
    </div>
  );

  const renderContactForm = (title: string, contactType: string, contactData: ContactInfo, nameField: string) => (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Name/Company</label>
          <input
            type="text"
            value={projectData[nameField as keyof typeof projectData] as string}
            onChange={(e) => handleInputChange(nameField, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            placeholder="Enter name or company"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">P.O. Box</label>
          <input
            type="text"
            value={contactData.poBox}
            onChange={(e) => handleContactChange(contactType, 'poBox', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            placeholder="Enter P.O. Box"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
          <input
            type="text"
            value={contactData.address}
            onChange={(e) => handleContactChange(contactType, 'address', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            placeholder="Enter address"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
          <input
            type="tel"
            value={contactData.phone}
            onChange={(e) => handleContactChange(contactType, 'phone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            placeholder="Enter phone number"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
          <input
            type="text"
            value={contactData.location}
            onChange={(e) => handleContactChange(contactType, 'location', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            placeholder="Enter location"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input
            type="email"
            value={contactData.email}
            onChange={(e) => handleContactChange(contactType, 'email', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            placeholder="Enter email address"
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900">Contact Information</h2>
      
      {projectData.mainContractor && renderContactForm('Main Contractor Contact', 'contractorContact', projectData.contractorContact, 'mainContractor')}
      {projectData.client && renderContactForm('Client Contact', 'clientContact', projectData.clientContact, 'client')}
      {projectData.architect && renderContactForm('Architect Contact', 'architectContact', projectData.architectContact, 'architect')}
      {projectData.engineer && renderContactForm('Engineer Contact', 'engineerContact', projectData.engineerContact, 'engineer')}
      {projectData.quantitySurveyor && renderContactForm('Quantity Surveyor Contact', 'qsContact', projectData.qsContact, 'quantitySurveyor')}
      {projectData.structuralEngineer && renderContactForm('Structural Engineer Contact', 'structuralContact', projectData.structuralContact, 'structuralEngineer')}
      {projectData.subcontractors && renderContactForm('Subcontractor Contact', 'subcontractorContact', projectData.subcontractorContact, 'subcontractors')}
      {projectData.lawFirm && renderContactForm('Law Firm Contact', 'lawFirmContact', projectData.lawFirmContact, 'lawFirm')}
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900">Bill of Quantities</h2>
      
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-blue-900 mb-2">Upload BOQ Documents</h3>
        <p className="text-blue-700 mb-4">Upload both priced and unpriced Bill of Quantities documents.</p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priced BOQ Document
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) => setPricedBoqFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Unpriced BOQ Document
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) => setUnpricedBoqFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900">Review & Create</h2>
      
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Project Summary</h3>
        <div className="space-y-2 text-gray-900">
          <p><span className="font-medium">Title:</span> {projectData.title}</p>
          <p><span className="font-medium">Description:</span> {projectData.description || 'No description provided'}</p>
          <p><span className="font-medium">Start Date:</span> {projectData.startDate || 'Not set'}</p>
          <p><span className="font-medium">End Date:</span> {projectData.endDate || 'Not set'}</p>
          <p><span className="font-medium">Main Contractor:</span> {projectData.mainContractor || 'Not specified'}</p>
          <p><span className="font-medium">Client:</span> {projectData.client || 'Not specified'}</p>
        </div>
      </div>
    </div>
  );

  const steps = [
    { number: 1, title: 'Basic Info', component: renderStep1 },
    { number: 2, title: 'Bio Data', component: renderStep2 },
    { number: 3, title: 'Contacts', component: renderStep3 },
    { number: 4, title: 'BOQ Upload', component: renderStep4 },
    { number: 5, title: 'Review', component: renderStep5 }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Project</h1>
        <p className="text-gray-600">Set up a new project with comprehensive information</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                currentStep >= step.number 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {step.number}
              </div>
              <span className={`ml-2 text-sm font-medium ${
                currentStep >= step.number ? 'text-blue-600' : 'text-gray-500'
              }`}>
                {step.title}
              </span>
              {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-4 ${
                  currentStep > step.number ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        {steps[currentStep - 1].component()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
          className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        
        {currentStep < steps.length ? (
          <button
            onClick={() => setCurrentStep(Math.min(steps.length, currentStep + 1))}
            disabled={currentStep === 1 && !projectData.title}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading || !projectData.title}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Project'}
          </button>
        )}
      </div>
    </div>
  );
}

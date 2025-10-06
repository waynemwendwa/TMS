"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getApiUrl } from "../../../lib/config";

type Project = {
  id: string;
  title: string;
  description?: string;
  status: "TO_START" | "ONGOING" | "COMPLETED";
  estimatedDuration?: number;
  createdByUser: { id: string; name: string; email: string };
};

type ProjectDocument = {
  id: string;
  name: string;
  description?: string;
  category:
    | "LETTER_OF_AWARD"
    | "ACCEPTANCE_OF_AWARD"
    | "PERFORMANCE_BOND"
    | "CONTRACT_SIGNING"
    | "BOQ_DOCUMENT"
    | "SAMPLE_APPROVAL"
    | "DESIGN_DRAWING"
    | "WORKING_DRAWING"
    | "AS_INSTALLED_DRAWING"
    | "INTERIM_PAYMENT"
    | "FINAL_ACCOUNT"
    | "OTHER";
  type: string;
  size: number;
  url: string;
  filePath: string;
  uploadedAt: string;
  documentType: string; // "preliminary" | "boq" | "payment" | "drawing"
};

type ProcurementStatus = "PENDING" | "QUOTED" | "APPROVED" | "ORDERED" | "DELIVERED";
type ProcurementItem = {
  id: string;
  projectId: string;
  itemName: string;
  description?: string;
  quantity: number;
  unit: string;
  estimatedCost?: string | number | null;
  supplierId?: string | null;
  actualCost?: string | number | null;
  status: ProcurementStatus;
  createdAt?: string;
  updatedAt?: string;
};

type BoqTemplateItem = {
  id?: string;
  item: string;
  description?: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
};

type BoqTemplate = {
  id: string;
  projectId: string;
  title: string;
  equipmentInstallationWorks: string;
  billNumber: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  items: BoqTemplateItem[];
  createdByUser: {
    id: string;
    name: string;
    email: string;
  };
};

type OrderTemplateItem = {
  id?: string;
  item: string;
  description?: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
};

type OrderTemplate = {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  items: OrderTemplateItem[];
  createdByUser: { id: string; name: string; email: string };
};

type PhaseStatus = "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "DELAYED";
type ProjectPhase = {
  id: string;
  projectId: string;
  phaseName: string;
  description?: string;
  startDate?: string | null;
  endDate?: string | null;
  status: PhaseStatus;
  weekNumber: number;
  tasks: string[];
  materials: string[];
};

export default function ProjectDetailsPage() {
  const params = useParams();
  const projectId = useMemo(() => String(params?.id || ""), [params]);

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: string; name: string; email: string; role: string } | null>(null);

  const [prelimDocs, setPrelimDocs] = useState<ProjectDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<FileList | null>(null);
  const [category, setCategory] = useState<ProjectDocument["category"]>("OTHER");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [prelimError, setPrelimError] = useState<string | null>(null);
  const [prelimSuccess, setPrelimSuccess] = useState<string | null>(null);

  // Stakeholders state
  const [stakeholders, setStakeholders] = useState<{
    id: string;
    name: string;
    email?: string;
    phone?: string;
    location?: string;
    role: string;
  }[]>([]);
  const [newStakeholder, setNewStakeholder] = useState({ name: "", email: "", phone: "", location: "", role: "CLIENT" });
  const [selectedStakeholder, setSelectedStakeholder] = useState<{
    id: string;
    name: string;
    email?: string;
    phone?: string;
    location?: string;
    role: string;
  } | null>(null);
  const [showStakeholderModal, setShowStakeholderModal] = useState(false);
  const [deletingStakeholderId, setDeletingStakeholderId] = useState<string | null>(null);

  // BOQ docs state
  const [boqDocs, setBoqDocs] = useState<ProjectDocument[]>([]);
  const [boqFiles, setBoqFiles] = useState<FileList | null>(null);
  const [boqUploading, setBoqUploading] = useState(false);
  const [boqError, setBoqError] = useState<string | null>(null);
  const [boqSuccess, setBoqSuccess] = useState<string | null>(null);

  // BOQ template state
  const [boqTemplates, setBoqTemplates] = useState<BoqTemplate[]>([]);
  const [showBoqTemplateForm, setShowBoqTemplateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<BoqTemplate | null>(null);
  const [boqTemplateForm, setBoqTemplateForm] = useState({
    title: "",
    equipmentInstallationWorks: "",
    billNumber: "",
    items: [] as BoqTemplateItem[]
  });
  const [boqTemplateError, setBoqTemplateError] = useState<string | null>(null);
  const [boqTemplateSuccess, setBoqTemplateSuccess] = useState<string | null>(null);
  const [boqTemplateLoading, setBoqTemplateLoading] = useState(false);

  // Order template state
  const [orderTemplates, setOrderTemplates] = useState<OrderTemplate[]>([]);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderForm, setOrderForm] = useState<{ title: string; description: string; items: OrderTemplateItem[] }>({ title: "", description: "", items: [] });
  const [orderTemplateError, setOrderTemplateError] = useState<string | null>(null);
  const [orderTemplateSuccess, setOrderTemplateSuccess] = useState<string | null>(null);
  const [orderTemplateLoading, setOrderTemplateLoading] = useState(false);
  const [orderFiles, setOrderFiles] = useState<FileList | null>(null);
  const [orderUploading, setOrderUploading] = useState(false);


  // Comparison state
  const [compareTemplateId, setCompareTemplateId] = useState<string | null>(null);
  const [comparisonRows, setComparisonRows] = useState<Array<{ item: string; orderQty: number; boqQty: number; alert: boolean }>>([]);

  // Procurement state
  const [procurements, setProcurements] = useState<ProcurementItem[]>([]);
  const [newProc, setNewProc] = useState({ itemName: "", description: "", quantity: 1, unit: "units", estimatedCost: "" });
  const [updatingProcId, setUpdatingProcId] = useState<string | null>(null);
  const [procStatusFilter, setProcStatusFilter] = useState<'ALL' | ProcurementStatus>('ALL');
  const supplierSummary = useMemo(() => {
    const map: Record<string, { supplier: string; items: number; estTotal: number; actTotal: number }>= {};
    for (const p of procurements) {
      const key = p.supplierId || 'Unassigned';
      if (!map[key]) map[key] = { supplier: key, items: 0, estTotal: 0, actTotal: 0 };
      map[key].items += 1;
      const est = Number(p.estimatedCost ?? 0);
      const act = Number(p.actualCost ?? 0);
      if (!Number.isNaN(est)) map[key].estTotal += est;
      if (!Number.isNaN(act)) map[key].actTotal += act;
    }
    return Object.values(map).sort((a,b) => a.estTotal - b.estTotal);
  }, [procurements]);

  // Phases state
  const [phases, setPhases] = useState<ProjectPhase[]>([]);
  const [newPhase, setNewPhase] = useState({ phaseName: "", description: "", weekNumber: 1, status: "PLANNED", startDate: "", endDate: "", tasks: "", materials: "" });
  const [stakeholderError, setStakeholderError] = useState<string | null>(null);
  const [procError, setProcError] = useState<string | null>(null);
  const [phaseError, setPhaseError] = useState<string | null>(null);
  const [phaseStatusFilter, setPhaseStatusFilter] = useState<'ALL' | PhaseStatus>('ALL');
  const [updatingPhaseId, setUpdatingPhaseId] = useState<string | null>(null);

  // Helper function to format category names for display
  const formatCategoryName = (category: string) => {
    const categoryMap: Record<string, string> = {
      'LETTER_OF_AWARD': 'Letter of Award',
      'ACCEPTANCE_OF_AWARD': 'Acceptance of Award',
      'PERFORMANCE_BOND': 'Performance Bond',
      'CONTRACT_SIGNING': 'Contract Signing',
      'BOQ_DOCUMENT': 'BOQ Document',
      'SAMPLE_APPROVAL': 'Sample Approval',
      'DESIGN_DRAWING': 'Design Drawing',
      'WORKING_DRAWING': 'Working Drawing',
      'AS_INSTALLED_DRAWING': 'As Installed Drawing',
      'INTERIM_PAYMENT': 'Interim Payment',
      'FINAL_ACCOUNT': 'Final Account',
      'OTHER': 'Other'
    };
    return categoryMap[category] || category;
  };

  // Payment Documents state
  const [paymentDocs, setPaymentDocs] = useState<ProjectDocument[]>([]);
  const [paymentFiles, setPaymentFiles] = useState<FileList | null>(null);
  const [paymentUploading, setPaymentUploading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);
  const [paymentName, setPaymentName] = useState("");
  const [paymentDescription, setPaymentDescription] = useState("");
  const [paymentCategory, setPaymentCategory] = useState<"INTERIM_PAYMENT" | "FINAL_ACCOUNT">("INTERIM_PAYMENT");

  // Drawings Documents state
  const [drawingDocs, setDrawingDocs] = useState<ProjectDocument[]>([]);
  const [drawingFiles, setDrawingFiles] = useState<FileList | null>(null);
  const [drawingUploading, setDrawingUploading] = useState(false);
  const [drawingError, setDrawingError] = useState<string | null>(null);
  const [drawingSuccess, setDrawingSuccess] = useState<string | null>(null);
  const [drawingName, setDrawingName] = useState("");
  const [drawingDescription, setDrawingDescription] = useState("");
  const [drawingCategory, setDrawingCategory] = useState<"DESIGN_DRAWING" | "WORKING_DRAWING" | "AS_INSTALLED_DRAWING">("DESIGN_DRAWING");

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("tms_token") : null;
    if (!projectId || !token) return;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const tokenHeader = { headers: { Authorization: `Bearer ${token}` } } as const;
        
        // Fetch all data including documents
        const [projRes, docsRes, boqRes, procsRes, phasesRes, boqTemplatesRes, orderTemplatesRes, userRes, paymentRes, drawingRes] = await Promise.all([
          fetch(getApiUrl(`/api/projects/${projectId}`), {
            ...tokenHeader
          }),
          fetch(getApiUrl(`/api/projects/${projectId}/documents?documentType=preliminary`), {
            ...tokenHeader
          }),
          fetch(getApiUrl(`/api/projects/${projectId}/documents?documentType=boq`), {
            ...tokenHeader
          }),
          fetch(getApiUrl(`/api/projects/${projectId}/procurements`), {
            ...tokenHeader
          }),
          fetch(getApiUrl(`/api/projects/${projectId}/phases`), {
            ...tokenHeader
          }),
          fetch(getApiUrl(`/api/projects/${projectId}/boq-templates`), {
            ...tokenHeader
          }),
          fetch(getApiUrl(`/api/projects/${projectId}/order-templates`), {
            ...tokenHeader
          }),
          fetch(getApiUrl(`/api/auth/me`), {
            ...tokenHeader
          }),
          fetch(getApiUrl(`/api/projects/${projectId}/documents?documentType=payment`), {
            ...tokenHeader
          }),
          fetch(getApiUrl(`/api/projects/${projectId}/documents?documentType=drawing`), {
            ...tokenHeader
          })
        ]);
        
        // Handle all responses
        if (projRes.ok) {
          const p = await projRes.json();
          setProject(p);
          setStakeholders(p.stakeholders || []);
        }
        if (docsRes.ok) {
          const d = await docsRes.json();
          setPrelimDocs(d);
        }
        if (boqRes.ok) {
          const d = await boqRes.json();
          setBoqDocs(d);
        }
        if (procsRes.ok) {
          setProcurements(await procsRes.json());
        }
        if (phasesRes.ok) {
          setPhases(await phasesRes.json());
        }
        if (boqTemplatesRes.ok) {
          setBoqTemplates(await boqTemplatesRes.json());
        }
        if (orderTemplatesRes.ok) {
          setOrderTemplates(await orderTemplatesRes.json());
        }
        if (userRes.ok) {
          setUser(await userRes.json());
        }
        if (paymentRes.ok) {
          setPaymentDocs(await paymentRes.json());
        }
        if (drawingRes.ok) {
          setDrawingDocs(await drawingRes.json());
        }
      } catch (err) {
        console.error("Error loading project:", err);
        setError("Failed to load project");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [projectId]);

  const onUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setPrelimError(null);
    setPrelimSuccess(null);
    if (!files || files.length === 0) {
      setPrelimError('Please choose at least one file.');
      return;
    }
    // Client-side file validation
    const allowed = ['pdf','doc','docx','jpg','jpeg','png','xls','xlsx'];
    for (const f of Array.from(files)) {
      const ext = f.name.split('.').pop()?.toLowerCase();
      if (!ext || !allowed.includes(ext)) {
        setPrelimError('Only PDF, DOC, DOCX, JPG, JPEG, PNG, XLS, and XLSX files are allowed.');
        return;
      }
      if (f.size > 20 * 1024 * 1024) {
        setPrelimError('Each file must be 20MB or less.');
        return;
      }
    }
    const token = typeof window !== "undefined" ? localStorage.getItem("tms_token") : null;
    if (!token) return;

    try {
      setUploading(true);
      const form = new FormData();
      Array.from(files).forEach((f) => form.append("documents", f));
      form.append("documentType", "preliminary");
      form.append("category", category);
      if (name) form.append("name", name);
      if (description) form.append("description", description);

      const res = await fetch(getApiUrl(`/api/projects/${projectId}/documents`), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form
      });
      if (res.ok) {
        const uploaded = (await res.json()) as ProjectDocument[];
        console.log('📤 Preliminary documents uploaded:', uploaded.length);
        setPrelimDocs((prev) => [...uploaded, ...prev]);
        setFiles(null);
        setName("");
        setDescription("");
        setPrelimSuccess('Documents uploaded successfully.');
      } else {
        const msg = await res.text();
        setPrelimError(msg || 'Upload failed.');
      }
    } catch {
      setPrelimError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const onUploadBOQ = async (e: React.FormEvent) => {
    e.preventDefault();
    setBoqError(null);
    setBoqSuccess(null);
    if (!boqFiles || boqFiles.length === 0) {
      setBoqError('Please choose at least one file.');
      return;
    }
    const allowed = ['pdf','doc','docx','jpg','jpeg','png','xls','xlsx'];
    for (const f of Array.from(boqFiles)) {
      const ext = f.name.split('.').pop()?.toLowerCase();
      if (!ext || !allowed.includes(ext)) {
        setBoqError('Only PDF, DOC, DOCX, JPG, JPEG, PNG, XLS, and XLSX files are allowed.');
        return;
      }
      if (f.size > 20 * 1024 * 1024) {
        setBoqError('Each file must be 20MB or less.');
        return;
      }
    }
    const token = typeof window !== "undefined" ? localStorage.getItem("tms_token") : null;
    if (!token) return;

    try {
      setBoqUploading(true);
      const form = new FormData();
      Array.from(boqFiles).forEach((f) => form.append("documents", f));
      form.append("documentType", "boq");
      form.append("category", "BOQ_DOCUMENT");

      const res = await fetch(getApiUrl(`/api/projects/${projectId}/documents`), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form
      });
      if (res.ok) {
        const uploaded = (await res.json()) as ProjectDocument[];
        console.log('📤 BOQ documents uploaded:', uploaded.length);
        setBoqDocs((prev) => [...uploaded, ...prev]);
        setBoqFiles(null);
        setBoqSuccess('BOQ uploaded successfully.');
      }
    } catch {
      setBoqError('Upload failed. Please try again.');
    } finally {
      setBoqUploading(false);
    }
  };

  // Refresh document lists to sync with database
  const refreshDocumentLists = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('tms_token') : null;
      if (!token) return;

      console.log('🔄 Refreshing document lists...');

      // Refresh preliminary documents
      const prelimResponse = await fetch(getApiUrl(`/api/projects/${projectId}/documents?documentType=preliminary`), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (prelimResponse.ok) {
        const prelimData = await prelimResponse.json();
        setPrelimDocs(prelimData);
      }

      // Refresh BOQ documents
      const boqResponse = await fetch(getApiUrl(`/api/projects/${projectId}/documents?documentType=boq`), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (boqResponse.ok) {
        const boqData = await boqResponse.json();
        setBoqDocs(boqData);
      }

      // Refresh payment documents
      const paymentResponse = await fetch(getApiUrl(`/api/projects/${projectId}/documents?documentType=payment`), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (paymentResponse.ok) {
        const paymentData = await paymentResponse.json();
        setPaymentDocs(paymentData);
      }

      // Refresh drawing documents
      const drawingResponse = await fetch(getApiUrl(`/api/projects/${projectId}/documents?documentType=drawing`), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (drawingResponse.ok) {
        const drawingData = await drawingResponse.json();
        setDrawingDocs(drawingData);
      }

      // Show success message
      setPrelimSuccess('Document lists refreshed successfully!');
      setBoqSuccess('Document lists refreshed successfully!');
      setPaymentSuccess('Document lists refreshed successfully!');
      setDrawingSuccess('Document lists refreshed successfully!');
    } catch (error) {
      console.error('Error refreshing document lists:', error);
    }
  };

  // Delete functions
  const handleDeletePrelimDocument = async (doc: ProjectDocument) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('tms_token') : null;
      if (!token) {
        alert('Please log in to delete documents');
        return;
      }

      if (confirm('Are you sure you want to delete this document?')) {
        console.log('🗑️ Deleting document:', doc.id, doc.name);
        
        // Optimistically remove from frontend state
        setPrelimDocs(prev => prev.filter(d => d.id !== doc.id));
        setPrelimError(null);
        setPrelimSuccess(null);
        
        try {
          const response = await fetch(getApiUrl(`/api/projects/${projectId}/documents/${doc.id}`), {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            setPrelimSuccess('Document deleted successfully!');
          } else {
            const errorData = await response.json().catch(() => ({}));
            // Add the document back to frontend if deletion failed
            setPrelimDocs(prev => [...prev, doc]);
            setPrelimError(errorData.error || 'Failed to delete document');
          }
        } catch (error) {
          // Add the document back to frontend if request failed
          setPrelimDocs(prev => [...prev, doc]);
          setPrelimError('Failed to delete document. Please try again.');
          console.error('Error deleting document:', error);
        }
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      setPrelimError(`Error deleting document: ${error instanceof Error ? error.message : 'Please try again.'}`);
    }
  };

  const handleDeleteBoqDocument = async (doc: ProjectDocument) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('tms_token') : null;
      if (!token) {
        alert('Please log in to delete documents');
        return;
      }

      if (confirm('Are you sure you want to delete this BOQ document?')) {
        console.log('🗑️ Deleting BOQ document:', doc.id, doc.name);
        
        // Optimistically remove from frontend state
        setBoqDocs(prev => prev.filter(d => d.id !== doc.id));
        setBoqError(null);
        setBoqSuccess(null);
        
        try {
          const response = await fetch(getApiUrl(`/api/projects/${projectId}/documents/${doc.id}`), {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            setBoqSuccess('BOQ document deleted successfully!');
          } else {
            const errorData = await response.json().catch(() => ({}));
            // Add the document back to frontend if deletion failed
            setBoqDocs(prev => [...prev, doc]);
            setBoqError(errorData.error || 'Failed to delete document');
          }
        } catch (error) {
          // Add the document back to frontend if request failed
          setBoqDocs(prev => [...prev, doc]);
          setBoqError('Failed to delete document. Please try again.');
          console.error('Error deleting BOQ document:', error);
        }
      }
    } catch (error) {
      console.error('Error deleting BOQ document:', error);
      setBoqError(`Error deleting document: ${error instanceof Error ? error.message : 'Please try again.'}`);
    }
  };

  const handleDeletePaymentDocument = async (doc: ProjectDocument) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('tms_token') : null;
      if (!token) {
        alert('Please log in to delete documents');
        return;
      }

      if (confirm('Are you sure you want to delete this payment document?')) {
        console.log('🗑️ Deleting payment document:', doc.id, doc.name);
        
        // Optimistically remove from frontend state
        setPaymentDocs(prev => prev.filter(d => d.id !== doc.id));
        setPaymentError(null);
        setPaymentSuccess(null);
        
        try {
          const response = await fetch(getApiUrl(`/api/projects/${projectId}/documents/${doc.id}`), {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            setPaymentSuccess('Payment document deleted successfully!');
          } else {
            const errorData = await response.json().catch(() => ({}));
            // Add the document back to frontend if deletion failed
            setPaymentDocs(prev => [...prev, doc]);
            setPaymentError(errorData.error || 'Failed to delete document');
          }
        } catch (error) {
          // Add the document back to frontend if request failed
          setPaymentDocs(prev => [...prev, doc]);
          setPaymentError('Failed to delete document. Please try again.');
          console.error('Error deleting payment document:', error);
        }
      }
    } catch (error) {
      console.error('Error deleting payment document:', error);
      setPaymentError(`Error deleting document: ${error instanceof Error ? error.message : 'Please try again.'}`);
    }
  };

  const handleDeleteDrawingDocument = async (doc: ProjectDocument) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('tms_token') : null;
      if (!token) {
        alert('Please log in to delete documents');
        return;
      }

      if (confirm('Are you sure you want to delete this drawing document?')) {
        console.log('🗑️ Deleting drawing document:', doc.id, doc.name);
        
        // Optimistically remove from frontend state
        setDrawingDocs(prev => prev.filter(d => d.id !== doc.id));
        setDrawingError(null);
        setDrawingSuccess(null);
        
        try {
          const response = await fetch(getApiUrl(`/api/projects/${projectId}/documents/${doc.id}`), {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            setDrawingSuccess('Drawing document deleted successfully!');
          } else {
            const errorData = await response.json().catch(() => ({}));
            // Add the document back to frontend if deletion failed
            setDrawingDocs(prev => [...prev, doc]);
            setDrawingError(errorData.error || 'Failed to delete document');
          }
        } catch (error) {
          // Add the document back to frontend if request failed
          setDrawingDocs(prev => [...prev, doc]);
          setDrawingError('Failed to delete document. Please try again.');
          console.error('Error deleting drawing document:', error);
        }
      }
    } catch (error) {
      console.error('Error deleting drawing document:', error);
      setDrawingError(`Error deleting document: ${error instanceof Error ? error.message : 'Please try again.'}`);
    }
  };

  // Excel export functions removed - not currently used

  // BOQ Template handlers
  const addBoqTemplateItem = () => {
    setBoqTemplateForm(prev => ({
      ...prev,
      items: [...prev.items, { item: "", description: "", quantity: 1, unit: "units", rate: 0, amount: 0 }]
    }));
  };

  const removeBoqTemplateItem = (index: number) => {
    setBoqTemplateForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateBoqTemplateItem = (index: number, field: keyof BoqTemplateItem, value: string | number) => {
    setBoqTemplateForm(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      
      // Auto-calculate amount when quantity or rate changes
      if (field === 'quantity' || field === 'rate') {
        const quantity = field === 'quantity' ? Number(value) : newItems[index].quantity;
        const rate = field === 'rate' ? Number(value) : newItems[index].rate;
        newItems[index].amount = quantity * rate;
      }
      
      return { ...prev, items: newItems };
    });
  };

  const resetBoqTemplateForm = () => {
    setBoqTemplateForm({
      title: "",
      equipmentInstallationWorks: "",
      billNumber: "",
      items: []
    });
    setEditingTemplate(null);
    setShowBoqTemplateForm(false);
  };

  const onSubmitBoqTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setBoqTemplateError(null);
    setBoqTemplateSuccess(null);

    if (!boqTemplateForm.title || !boqTemplateForm.equipmentInstallationWorks || !boqTemplateForm.billNumber) {
      setBoqTemplateError('Please fill in all required fields.');
      return;
    }

    if (boqTemplateForm.items.length === 0) {
      setBoqTemplateError('Please add at least one item.');
      return;
    }

    const token = typeof window !== "undefined" ? localStorage.getItem("tms_token") : null;
    if (!token) return;

    try {
      setBoqTemplateLoading(true);
      const url = editingTemplate 
        ? getApiUrl(`/api/projects/boq-templates/${editingTemplate.id}`)
        : getApiUrl(`/api/projects/${projectId}/boq-templates`);
      
      const method = editingTemplate ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(boqTemplateForm)
      });

      if (res.ok) {
        const template = await res.json();
        if (editingTemplate) {
          setBoqTemplates(prev => prev.map(t => t.id === template.id ? template : t));
          setBoqTemplateSuccess('BOQ template updated successfully.');
        } else {
          setBoqTemplates(prev => [template, ...prev]);
          setBoqTemplateSuccess('BOQ template created successfully.');
        }
        resetBoqTemplateForm();
      } else {
        const error = await res.json();
        setBoqTemplateError(error.error || 'Failed to save BOQ template.');
      }
    } catch {
      setBoqTemplateError('Failed to save BOQ template. Please try again.');
    } finally {
      setBoqTemplateLoading(false);
    }
  };

  const editBoqTemplate = (template: BoqTemplate) => {
    setEditingTemplate(template);
    setBoqTemplateForm({
      title: template.title,
      equipmentInstallationWorks: template.equipmentInstallationWorks,
      billNumber: template.billNumber,
      items: template.items
    });
    setShowBoqTemplateForm(true);
  };

  const deleteBoqTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this BOQ template?')) return;
    
    const token = typeof window !== "undefined" ? localStorage.getItem("tms_token") : null;
    if (!token) return;

    try {
      const res = await fetch(getApiUrl(`/api/projects/boq-templates/${templateId}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setBoqTemplates(prev => prev.filter(t => t.id !== templateId));
        setBoqTemplateSuccess('BOQ template deleted successfully.');
      } else {
        setBoqTemplateError('Failed to delete BOQ template.');
      }
    } catch {
      setBoqTemplateError('Failed to delete BOQ template.');
    }
  };

  const exportBoqTemplate = (template: BoqTemplate, format: 'pdf' | 'excel') => {
    if (format === 'pdf') {
      exportBoqToPDF(template);
    } else {
      exportBoqToExcel(template);
    }
  };

  const exportBoqToPDF = (template: BoqTemplate) => {
    // Create a new window for PDF generation
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const totalAmount = template.items.reduce((sum, item) => sum + Number(item.amount), 0);
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>BOQ - ${template.title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .subtitle { font-size: 16px; color: #666; margin-bottom: 5px; }
          .bill-number { font-size: 14px; color: #888; }
          .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .table th { background-color: #f5f5f5; font-weight: bold; }
          .table .number { text-align: right; }
          .total { font-weight: bold; font-size: 16px; margin-top: 20px; text-align: right; }
          .footer { margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${template.title}</div>
          <div class="subtitle">${template.equipmentInstallationWorks}</div>
          <div class="bill-number">Bill Number: ${template.billNumber}</div>
        </div>
        
        <table class="table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Description</th>
              <th>Qty</th>
              <th>Unit</th>
              <th>Rate (KSH)</th>
              <th>Amount (KSH)</th>
            </tr>
          </thead>
          <tbody>
            ${template.items.map(item => `
              <tr>
                <td>${item.item}</td>
                <td>${item.description || ''}</td>
                <td class="number">${item.quantity}</td>
                <td>${item.unit}</td>
                <td class="number">${Number(item.rate).toFixed(2)}</td>
                <td class="number">${Number(item.amount).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="total">
          Total Amount: KSH ${totalAmount.toFixed(2)}
        </div>
        
        <div class="footer">
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
          <p>Created by: ${template.createdByUser.name}</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  };

  const exportBoqToExcel = (template: BoqTemplate) => {
    const totalAmount = template.items.reduce((sum, item) => sum + Number(item.amount), 0);
    
    // Create CSV content
    const csvContent = [
      ['BOQ Template Export'],
      ['Title:', template.title],
      ['Equipment Installation Works:', template.equipmentInstallationWorks],
      ['Bill Number:', template.billNumber],
      ['Generated on:', new Date().toLocaleDateString()],
      ['Created by:', template.createdByUser.name],
      [''],
      ['Item', 'Description', 'Quantity', 'Unit', 'Rate (KSH)', 'Amount (KSH)'],
      ...template.items.map(item => [
        item.item,
        item.description || '',
        item.quantity,
        item.unit,
        Number(item.rate).toFixed(2),
        Number(item.amount).toFixed(2)
      ]),
      ['', '', '', '', 'TOTAL:', totalAmount.toFixed(2)]
    ];

    // Convert to CSV string
    const csvString = csvContent.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    // Create and download file
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `BOQ_${template.billNumber}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Order Template handlers
  const addOrderItem = () => {
    setOrderForm((p) => ({ ...p, items: [...p.items, { item: '', description: '', quantity: 1, unit: 'units', rate: 0, amount: 0 }] }));
  };
  const removeOrderItem = (index: number) => {
    setOrderForm((p) => ({ ...p, items: p.items.filter((_, i) => i !== index) }));
  };
  const updateOrderItem = (index: number, field: keyof OrderTemplateItem, value: string | number) => {
    setOrderForm((prev) => {
      const items = [...prev.items];
      const next = { ...items[index], [field]: value } as OrderTemplateItem;
      if (field === 'quantity' || field === 'rate') {
        const qty = field === 'quantity' ? Number(value) : Number(next.quantity);
        const rate = field === 'rate' ? Number(value) : Number(next.rate);
        next.amount = qty * rate;
      }
      items[index] = next;
      return { ...prev, items };
    });
  };
  const resetOrderForm = () => {
    setOrderForm({ title: '', description: '', items: [] });
    setShowOrderForm(false);
  };
  const submitOrderTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrderTemplateError(null);
    setOrderTemplateSuccess(null);
    if (!orderForm.title || orderForm.items.length === 0) {
      setOrderTemplateError('Please provide title and at least one item.');
      return;
    }
    const token = typeof window !== 'undefined' ? localStorage.getItem('tms_token') : null;
    if (!token) return;
    try {
      setOrderTemplateLoading(true);
      const res = await fetch(getApiUrl(`/api/projects/${projectId}/order-templates`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(orderForm)
      });
      if (res.ok) {
        const created = await res.json();
        setOrderTemplates((prev) => [created, ...prev]);
        setOrderTemplateSuccess('Order template created successfully.');
        resetOrderForm();
      } else {
        const err = await res.json().catch(() => ({}));
        setOrderTemplateError(err.error || 'Failed to create order template.');
      }
    } finally {
      setOrderTemplateLoading(false);
    }
  };
  const deleteOrderTemplate = async (templateId: string) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('tms_token') : null;
    if (!token) return;
    if (!confirm('Delete this order template?')) return;
    const res = await fetch(getApiUrl(`/api/projects/order-templates/${templateId}`), { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setOrderTemplates((prev) => prev.filter((t) => t.id !== templateId));
  };

  const onUploadOrderDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrderTemplateError(null);
    setOrderTemplateSuccess(null);
    if (!orderFiles || orderFiles.length === 0) {
      setOrderTemplateError('Please choose at least one file.');
      return;
    }
    const allowed = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'];
    for (const f of Array.from(orderFiles)) {
      const ext = f.name.split('.').pop()?.toLowerCase();
      if (!ext || !allowed.includes(ext)) {
        setOrderTemplateError('Only PDF, DOC, DOCX, JPG, JPEG, and PNG files are allowed.');
        return;
      }
      if (f.size > 20 * 1024 * 1024) {
        setOrderTemplateError('Each file must be 20MB or less.');
        return;
      }
    }
    const token = typeof window !== 'undefined' ? localStorage.getItem('tms_token') : null;
    if (!token) return;
    try {
      setOrderUploading(true);
      const form = new FormData();
      Array.from(orderFiles).forEach((f) => form.append('documents', f));
      form.append('documentType', 'order');
      form.append('category', 'OTHER');
      const res = await fetch(getApiUrl(`/api/projects/${projectId}/documents`), { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form });
      if (res.ok) {
        setOrderFiles(null);
        setOrderTemplateSuccess('Order document uploaded successfully.');
      } else {
        setOrderTemplateError('Failed to upload order document.');
      }
    } finally {
      setOrderUploading(false);
    }
  };

  const onUploadPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError(null);
    setPaymentSuccess(null);
    if (!paymentFiles || paymentFiles.length === 0) {
      setPaymentError('Please choose at least one file.');
      return;
    }
    // Client-side file validation
    const allowed = ['pdf','doc','docx','jpg','jpeg','png','xls','xlsx'];
    for (const f of Array.from(paymentFiles)) {
      const ext = f.name.split('.').pop()?.toLowerCase();
      if (!ext || !allowed.includes(ext)) {
        setPaymentError('Only PDF, DOC, DOCX, JPG, JPEG, PNG, XLS, and XLSX files are allowed.');
        return;
      }
      if (f.size > 20 * 1024 * 1024) {
        setPaymentError('Each file must be 20MB or less.');
        return;
      }
    }
    const token = typeof window !== "undefined" ? localStorage.getItem("tms_token") : null;
    if (!token) return;

    try {
      setPaymentUploading(true);
      const form = new FormData();
      Array.from(paymentFiles).forEach((f) => form.append("documents", f));
      form.append("documentType", "payment");
      form.append("category", paymentCategory);
      if (paymentName) form.append("name", paymentName);
      if (paymentDescription) form.append("description", paymentDescription);

      const res = await fetch(getApiUrl(`/api/projects/${projectId}/documents`), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form
      });
      if (res.ok) {
        const uploaded = (await res.json()) as ProjectDocument[];
        console.log('📤 Payment documents uploaded:', uploaded.length);
        setPaymentDocs((prev) => [...uploaded, ...prev]);
        setPaymentFiles(null);
        setPaymentName("");
        setPaymentDescription("");
        setPaymentCategory("INTERIM_PAYMENT");
        setPaymentSuccess('Payment documents uploaded successfully.');
      } else {
        const msg = await res.text();
        setPaymentError(msg || 'Upload failed.');
      }
    } catch {
      setPaymentError('Upload failed. Please try again.');
    } finally {
      setPaymentUploading(false);
    }
  };

  const onUploadDrawing = async (e: React.FormEvent) => {
    e.preventDefault();
    setDrawingError(null);
    setDrawingSuccess(null);
    if (!drawingFiles || drawingFiles.length === 0) {
      setDrawingError('Please choose at least one file.');
      return;
    }
    // Client-side file validation
    const allowed = ['pdf','doc','docx','jpg','jpeg','png','xls','xlsx'];
    for (const f of Array.from(drawingFiles)) {
      const ext = f.name.split('.').pop()?.toLowerCase();
      if (!ext || !allowed.includes(ext)) {
        setDrawingError('Only PDF, DOC, DOCX, JPG, JPEG, PNG, XLS, and XLSX files are allowed.');
        return;
      }
      if (f.size > 20 * 1024 * 1024) {
        setDrawingError('Each file must be 20MB or less.');
        return;
      }
    }
    const token = typeof window !== "undefined" ? localStorage.getItem("tms_token") : null;
    if (!token) return;

    try {
      setDrawingUploading(true);
      const form = new FormData();
      Array.from(drawingFiles).forEach((f) => form.append("documents", f));
      form.append("documentType", "drawing");
      form.append("category", drawingCategory);
      if (drawingName) form.append("name", drawingName);
      if (drawingDescription) form.append("description", drawingDescription);

      const res = await fetch(getApiUrl(`/api/projects/${projectId}/documents`), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form
      });
      if (res.ok) {
        const uploaded = (await res.json()) as ProjectDocument[];
        console.log('📤 Drawing documents uploaded:', uploaded.length);
        setDrawingDocs((prev) => [...uploaded, ...prev]);
        setDrawingFiles(null);
        setDrawingName("");
        setDrawingDescription("");
        setDrawingCategory("DESIGN_DRAWING");
        setDrawingSuccess('Drawing documents uploaded successfully.');
      } else {
        const msg = await res.text();
        setDrawingError(msg || 'Upload failed.');
      }
    } catch {
      setDrawingError('Upload failed. Please try again.');
    } finally {
      setDrawingUploading(false);
    }
  };

  const runComparison = (templateId: string) => {
    setCompareTemplateId(templateId);
    const order = orderTemplates.find((t) => t.id === templateId);
    if (!order) return;
    // Compare by exact item name against the latest BOQ template (or first if no latest)
    const boq = boqTemplates[0];
    const boqMap: Record<string, number> = {};
    if (boq) {
      for (const b of boq.items) {
        boqMap[b.item.toLowerCase()] = Number(b.quantity);
      }
    }
    const rows = order.items.map((it) => {
      const oq = Number(it.quantity);
      const bq = boqMap[it.item.toLowerCase()] ?? 0;
      return { item: it.item, orderQty: oq, boqQty: bq, alert: oq > bq };
    });
    setComparisonRows(rows);
  };

  const addStakeholder = async (e: React.FormEvent) => {
    e.preventDefault();
    setStakeholderError(null);
    if (!newStakeholder.name.trim()) {
      setStakeholderError('Name is required.');
      return;
    }
    // If email provided, basic format check
    if (newStakeholder.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newStakeholder.email)) {
      setStakeholderError('Please provide a valid email.');
      return;
    }
    const token = typeof window !== "undefined" ? localStorage.getItem("tms_token") : null;
    if (!token || !newStakeholder.name) return;
    const res = await fetch(getApiUrl(`/api/projects/${projectId}/stakeholders`), {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(newStakeholder)
    });
    if (res.ok) {
      const created = await res.json();
      setStakeholders((prev) => [created, ...prev]);
      setNewStakeholder({ name: "", email: "", phone: "", location: "", role: "CLIENT" });
    }
  };

  const deleteStakeholder = async (stakeholderId: string) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("tms_token") : null;
    if (!token) return;
    if (!confirm('Delete this stakeholder?')) return;
    try {
      setDeletingStakeholderId(stakeholderId);
      const res = await fetch(getApiUrl(`/api/projects/stakeholders/${stakeholderId}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setStakeholders((prev) => prev.filter((s) => s.id !== stakeholderId));
        if (selectedStakeholder?.id === stakeholderId) {
          setShowStakeholderModal(false);
          setSelectedStakeholder(null);
        }
      } else {
        const err = await res.json().catch(() => ({}));
        setStakeholderError(err.error || 'Failed to delete stakeholder');
      }
    } catch {
      setStakeholderError('Failed to delete stakeholder');
    } finally {
      setDeletingStakeholderId(null);
    }
  };

  const addProcurement = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcError(null);
    if (!newProc.itemName.trim()) {
      setProcError('Item name is required.');
      return;
    }
    if (newProc.quantity <= 0) {
      setProcError('Quantity must be greater than zero.');
      return;
    }
    const token = typeof window !== "undefined" ? localStorage.getItem("tms_token") : null;
    if (!token || !newProc.itemName) return;
    const res = await fetch(getApiUrl(`/api/projects/${projectId}/procurements`), {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(newProc)
    });
    if (res.ok) {
      const created = await res.json();
      setProcurements((prev) => [created, ...prev]);
      setNewProc({ itemName: "", description: "", quantity: 1, unit: "units", estimatedCost: "" });
    }
  };

  const updateProcurement = async (
    id: string,
    patch: Partial<Pick<ProcurementItem, 'supplierId' | 'estimatedCost' | 'actualCost' | 'status'>>
  ) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("tms_token") : null;
    if (!token) return;
    try {
      setUpdatingProcId(id);
      const res = await fetch(getApiUrl(`/api/projects/procurements/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(patch)
      });
      if (res.ok) {
        const updated = await res.json();
        setProcurements((prev) => prev.map((p) => (p.id === id ? updated : p)));
      }
    } finally {
      setUpdatingProcId(null);
    }
  };

  const exportProcurementCSV = () => {
    const headers = ['Item Name','Quantity','Unit','Estimated Cost','Actual Cost','Status','Supplier'];
    const rows = procurements.map((p) => [
      p.itemName,
      p.quantity,
      p.unit,
      p.estimatedCost ?? '',
      p.actualCost ?? '',
      p.status,
      p.supplierId ?? ''
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project?.title || 'project'}-procurement-summary.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const addPhase = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhaseError(null);
    if (!newPhase.phaseName.trim()) {
      setPhaseError('Phase name is required.');
      return;
    }
    if (newPhase.weekNumber <= 0) {
      setPhaseError('Week number must be 1 or greater.');
      return;
    }
    const token = typeof window !== "undefined" ? localStorage.getItem("tms_token") : null;
    if (!token || !newPhase.phaseName) return;
    const payload = { ...newPhase } as {
      phaseName: string;
      description?: string;
      weekNumber: number;
      status: PhaseStatus;
      startDate?: string;
      endDate?: string;
      tasks?: string;
      materials?: string;
    };
    if (payload.tasks) payload.tasks = String(payload.tasks);
    if (payload.materials) payload.materials = String(payload.materials);
    const res = await fetch(getApiUrl(`/api/projects/${projectId}/phases`), {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const created = await res.json();
      setPhases((prev) => [...prev, created]);
      setNewPhase({ phaseName: "", description: "", weekNumber: 1, status: "PLANNED", startDate: "", endDate: "", tasks: "", materials: "" });
    }
  };

  const updatePhase = async (
    id: string,
    patch: Partial<ProjectPhase> | { startDate?: string; endDate?: string; tasks?: string; materials?: string; status?: PhaseStatus }
  ) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("tms_token") : null;
    if (!token) return;
    try {
      setUpdatingPhaseId(id);
      const res = await fetch(getApiUrl(`/api/projects/phases/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(patch)
      });
      if (res.ok) {
        const updated = await res.json();
        setPhases((prev)=> prev.map((ph)=> ph.id === id ? updated : ph));
      }
    } finally {
      setUpdatingPhaseId(null);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (error || !project) return <div className="p-6 text-red-600">{error || "Project not found"}</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">{project.title}</h1>
        <Link href="/projects" className="text-blue-600 hover:text-blue-800 text-sm">← Back to Projects</Link>
      </div>

      {project.description && (
        <p className="text-gray-600">{project.description}</p>
      )}

      {/* Preliminary Planning Documents - Hidden for Site Supervisors */}
      {user?.role !== 'SITE_SUPERVISOR' && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Preliminary Planning Upload */}
        <div className="bg-white rounded-lg shadow p-5 lg:col-span-1">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Preliminary Planning Documents</h2>
          <form onSubmit={onUpload} className="space-y-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Category</label>
              <select
                className="w-full text-gray-900 border rounded-md px-3 py-2"
                value={category}
                onChange={(e) => setCategory(e.target.value as ProjectDocument["category"])}
              >
                <option value="LETTER_OF_AWARD">Letter of Award</option>
                <option value="ACCEPTANCE_OF_AWARD">Acceptance of Award</option>
                <option value="PERFORMANCE_BOND">Performance Bond</option>
                <option value="CONTRACT_SIGNING">Contract Signing</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Name (optional)</label>
              <input className="w-full text-gray-900 border rounded-md px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Description (optional)</label>
              <textarea className="w-full text-gray-900 border rounded-md px-3 py-2" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Files</label>
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx"
                onChange={(e) => setFiles(e.target.files)}
                className="w-full bg-gray-50 text-gray-900 border border-gray-300 rounded px-3 py-2"
              />
            </div>
            <button
              type="submit"
              disabled={uploading || !files || files.length === 0}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              {uploading ? "Uploading..." : "Upload Documents"}
            </button>
          </form>
        </div>

        {/* Documents List */}
        <div className="bg-white rounded-lg shadow p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Uploaded Preliminary Documents</h2>
            <button
              onClick={refreshDocumentLists}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              🔄 Refresh
            </button>
          </div>
          {prelimError && <div className="mb-3 text-sm text-red-600">{prelimError}</div>}
          {prelimSuccess && <div className="mb-3 text-sm text-green-700">{prelimSuccess}</div>}
          {prelimDocs.length === 0 ? (
            <div className="text-sm text-gray-500">No documents uploaded yet.</div>
          ) : (
            <div className="space-y-3">
              {prelimDocs.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div>
                    <div className="font-medium text-gray-900">{doc.name}</div>
                    <div className="text-xs text-gray-500">{doc.category} • {new Date(doc.uploadedAt).toLocaleString()}</div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <a
                      href={`${getApiUrl('/api/upload/view')}?filePath=${encodeURIComponent(doc.filePath || doc.url)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View
                    </a>
                    <button
                      onClick={() => handleDeletePrelimDocument(doc)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      )}

      {/* BOQ Upload and List - Visible to all users */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">BOQ Documents</h2>
          <form onSubmit={onUploadBOQ} className="space-y-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Files</label>
              <input type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={(e) => setBoqFiles(e.target.files)} className="w-full bg-gray-50 text-gray-900 border border-gray-300 rounded px-3 py-2"/>
            </div>
            {boqError && <div className="text-sm text-red-600">{boqError}</div>}
            {boqSuccess && <div className="text-sm text-green-700">{boqSuccess}</div>}
            <button type="submit" disabled={boqUploading || !boqFiles || boqFiles.length === 0} className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors disabled:opacity-60" aria-busy={boqUploading}>
              {boqUploading ? 'Uploading...' : 'Upload BOQ'}
            </button>
          </form>
        </div>
        <div className="bg-white rounded-lg shadow p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Uploaded BOQ Documents</h2>
            <button
              onClick={refreshDocumentLists}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              🔄 Refresh
            </button>
          </div>
          {boqDocs.length === 0 ? (
            <div className="text-sm text-gray-500">No BOQ documents uploaded.</div>
          ) : (
            <div className="space-y-3">
              {boqDocs.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div>
                    <div className="font-medium text-gray-900">{doc.name}</div>
                    <div className="text-xs text-gray-500">{doc.category} • {new Date(doc.uploadedAt).toLocaleString()}</div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <a href={`${getApiUrl('/api/upload/view')}?filePath=${encodeURIComponent(doc.filePath || doc.url)}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 text-sm">View</a>
                    <button
                      onClick={() => handleDeleteBoqDocument(doc)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* BOQ Templates - Visible to all users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-gray-900">BOQ Templates</h2>
            <button
              onClick={() => setShowBoqTemplateForm(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm"
            >
              Create Template
            </button>
    </div>
          
          {boqTemplateError && <div className="text-sm text-red-600 mb-3">{boqTemplateError}</div>}
          {boqTemplateSuccess && <div className="text-sm text-green-700 mb-3">{boqTemplateSuccess}</div>}
          
          {boqTemplates.length === 0 ? (
            <div className="text-sm text-gray-500">No BOQ templates created yet.</div>
          ) : (
            <div className="space-y-3">
              {boqTemplates.map((template) => (
                <div key={template.id} className="p-3 border rounded-md">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{template.title}</div>
                      <div className="text-sm text-gray-600">{template.equipmentInstallationWorks}</div>
                      <div className="text-xs text-gray-500">
                        Bill #{template.billNumber} • {template.items.length} items • 
                        Created by {template.createdByUser.name} • {new Date(template.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-3">
                      <button
                        onClick={() => editBoqTemplate(template)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Edit
                      </button>
                      <div className="relative group">
                        <button className="text-green-600 hover:text-green-800 text-sm">
                          Export ▼
                        </button>
                        <div className="absolute right-0 mt-1 w-32 bg-white border rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          <button
                            onClick={() => exportBoqTemplate(template, 'pdf')}
                            className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Export PDF
                          </button>
                          <button
                            onClick={() => exportBoqTemplate(template, 'excel')}
                            className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Export Excel
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteBoqTemplate(template.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">BOQ Template Form</h2>
          {showBoqTemplateForm ? (
            <form onSubmit={onSubmitBoqTemplate} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Project Title with Phase *</label>
                <input
                  type="text"
                  value={boqTemplateForm.title}
                  onChange={(e) => setBoqTemplateForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full border text-gray-900 rounded-md px-3 py-2"
                  placeholder="e.g., Office Building Construction - Phase 1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Equipment Installation Works *</label>
                <input
                  type="text"
                  value={boqTemplateForm.equipmentInstallationWorks}
                  onChange={(e) => setBoqTemplateForm(prev => ({ ...prev, equipmentInstallationWorks: e.target.value }))}
                  className="w-full border text-gray-900 rounded-md px-3 py-2"
                  placeholder="e.g., Electrical installation, plumbing, HVAC systems"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Bill Number *</label>
                <input
                  type="text"
                  value={boqTemplateForm.billNumber}
                  onChange={(e) => setBoqTemplateForm(prev => ({ ...prev, billNumber: e.target.value }))}
                  className="w-full border text-gray-900 rounded-md px-3 py-2"
                  placeholder="e.g., BOQ-001-2024"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm text-gray-700">Items</label>
                  <button
                    type="button"
                    onClick={addBoqTemplateItem}
                    className="text-green-600 hover:text-green-800 text-sm"
                  >
                    + Add Item
                  </button>
                </div>
                
                {boqTemplateForm.items.length === 0 ? (
                  <div className="text-sm text-gray-500 text-center py-4 border-2 border-dashed border-gray-300 rounded-md">
                    No items added yet. Click &quot;Add Item&quot; to start.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {boqTemplateForm.items.map((item, index) => (
                      <div key={index} className="grid grid-cols-6 gap-2 p-2 border rounded-md">
                        <input
                          type="text"
                          value={item.item}
                          onChange={(e) => updateBoqTemplateItem(index, 'item', e.target.value)}
                          placeholder="Item"
                          className="text-gray-900 rounded px-2 py-1 text-sm"
                        />
                        <input
                          type="text"
                          value={item.description || ''}
                          onChange={(e) => updateBoqTemplateItem(index, 'description', e.target.value)}
                          placeholder="Description"
                          className="text-gray-900 rounded px-2 py-1 text-sm"
                        />
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateBoqTemplateItem(index, 'quantity', Number(e.target.value))}
                          placeholder="Qty"
                          className="text-gray-900 rounded px-2 py-1 text-sm"
                          min="0"
                        />
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => updateBoqTemplateItem(index, 'unit', e.target.value)}
                          placeholder="Unit"
                          className="text-gray-900 rounded px-2 py-1 text-sm"
                        />
                        <input
                          type="number"
                          value={item.rate}
                          onChange={(e) => updateBoqTemplateItem(index, 'rate', Number(e.target.value))}
                          placeholder="Rate"
                          className="text-gray-900 rounded px-2 py-1 text-sm"
                          min="0"
                          step="0.01"
                        />
                        <div className="flex items-center space-x-1">
                          <span className="text-sm text-gray-600">{item.amount.toFixed(2)}</span>
                          <button
                            type="button"
                            onClick={() => removeBoqTemplateItem(index)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={boqTemplateLoading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-60"
                >
                  {boqTemplateLoading ? 'Saving...' : (editingTemplate ? 'Update Template' : 'Create Template')}
                </button>
                <button
                  type="button"
                  onClick={resetBoqTemplateForm}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="text-sm text-gray-500 text-center py-8">
              Click &quot;Create Template&quot; to start creating a BOQ template.
            </div>
          )}
        </div>
      </div>

      {/* Order Templates & Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Order Templates</h2>
            <button
              onClick={() => setShowOrderForm(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm"
            >
              New Order
            </button>
          </div>
          {orderTemplateError && <div className="text-sm text-red-600 mb-3">{orderTemplateError}</div>}
          {orderTemplateSuccess && <div className="text-sm text-green-700 mb-3">{orderTemplateSuccess}</div>}
          {orderTemplates.length === 0 ? (
            <div className="text-sm text-gray-500">No order templates yet.</div>
          ) : (
            <div className="space-y-3">
              {orderTemplates.map((t) => (
                <div key={t.id} className="p-3 border rounded-md flex items-center justify-between">
                  <div className="mr-3">
                    <div className="font-medium text-gray-900">{t.title}</div>
                    <div className="text-xs text-gray-500">{t.items.length} items • by {t.createdByUser.name}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="text-blue-600 hover:text-blue-800 text-sm" onClick={() => runComparison(t.id)}>Compare to BOQ</button>
                    <button className="text-red-600 hover:text-red-800 text-sm" onClick={() => deleteOrderTemplate(t.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Upload Order Document</h2>
          <form onSubmit={onUploadOrderDoc} className="space-y-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Files</label>
              <input type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={(e) => setOrderFiles(e.target.files)} className="w-full bg-gray-50 text-gray-900 border border-gray-300 rounded px-3 py-2"/>
            </div>
            <button type="submit" disabled={orderUploading || !orderFiles || orderFiles.length === 0} className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors disabled:opacity-60" aria-busy={orderUploading}>
              {orderUploading ? 'Uploading...' : 'Upload Order'}
            </button>
          </form>
        </div>
      </div>

      {showOrderForm && (
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">New Order Template</h2>
          <form onSubmit={submitOrderTemplate} className="space-y-4">
            <input className="border text-gray-900 rounded-md px-3 py-2 w-full" placeholder="Title" value={orderForm.title} onChange={(e) => setOrderForm((p) => ({ ...p, title: e.target.value }))} />
            <input className="border text-gray-900 rounded-md px-3 py-2 w-full" placeholder="Description (optional)" value={orderForm.description} onChange={(e) => setOrderForm((p) => ({ ...p, description: e.target.value }))} />

            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm text-gray-700">Items</label>
              <button type="button" onClick={addOrderItem} className="text-green-600 hover:text-green-800 text-sm">+ Add Item</button>
            </div>
            {orderForm.items.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-4 border-2 border-dashed border-gray-300 rounded-md">No items. Click + Add Item.</div>
            ) : (
              <div className="space-y-2">
                {orderForm.items.map((it, idx) => (
                  <div key={idx} className="grid grid-cols-6 gap-2 p-2 border rounded-md">
                    <input type="text" value={it.item} onChange={(e) => updateOrderItem(idx, 'item', e.target.value)} placeholder="Item" className="text-gray-900 rounded px-2 py-1 text-sm"/>
                    <input type="text" value={it.description || ''} onChange={(e) => updateOrderItem(idx, 'description', e.target.value)} placeholder="Description" className="text-gray-900 rounded px-2 py-1 text-sm"/>
                    <input type="number" value={it.quantity} onChange={(e) => updateOrderItem(idx, 'quantity', Number(e.target.value))} placeholder="Qty" className="text-gray-900 rounded px-2 py-1 text-sm" min="0"/>
                    <input type="text" value={it.unit} onChange={(e) => updateOrderItem(idx, 'unit', e.target.value)} placeholder="Unit" className="text-gray-900 rounded px-2 py-1 text-sm"/>
                    <input type="number" value={it.rate} onChange={(e) => updateOrderItem(idx, 'rate', Number(e.target.value))} placeholder="Rate" className="text-gray-900 rounded px-2 py-1 text-sm" min="0" step="0.01"/>
                    <div className="flex items-center space-x-1">
                      <span className="text-sm text-gray-600">{it.amount.toFixed(2)}</span>
                      <button type="button" onClick={() => removeOrderItem(idx)} className="text-red-600 hover:text-red-800 text-sm">×</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex space-x-3">
              <button type="submit" disabled={orderTemplateLoading} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-60">
                {orderTemplateLoading ? 'Saving...' : 'Create Order'}
              </button>
              <button type="button" onClick={resetOrderForm} className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors">Cancel</button>
            </div>
          </form>
        </div>
      )}


      {/* Comparison Table */}
      {compareTemplateId && (
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Order vs BOQ Comparison</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left text-sm font-semibold text-gray-700 px-3 py-2 border">Item</th>
                  <th className="text-right text-sm font-semibold text-gray-700 px-3 py-2 border">Order Qty</th>
                  <th className="text-right text-sm font-semibold text-gray-700 px-3 py-2 border">BOQ Qty</th>
                  <th className="text-left text-sm font-semibold text-gray-700 px-3 py-2 border">Alert</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((r, i) => (
                  <tr key={i} className={r.alert ? 'bg-red-50' : ''}>
                    <td className="px-3 py-2 border text-gray-900">{r.item}</td>
                    <td className="px-3 py-2 border text-right text-gray-900">{r.orderQty}</td>
                    <td className="px-3 py-2 border text-right text-gray-900">{r.boqQty}</td>
                    <td className="px-3 py-2 border">{r.alert ? <span className="text-red-700 text-sm font-medium">Exceeds BOQ</span> : <span className="text-green-700 text-sm">OK</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stakeholders - Hidden for Site Supervisors */}
      {user?.role !== 'SITE_SUPERVISOR' && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Add Stakeholder</h2>
          <form onSubmit={addStakeholder} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input className="border text-gray-900 rounded-md px-3 py-2" placeholder="Name" value={newStakeholder.name} onChange={(e) => setNewStakeholder({ ...newStakeholder, name: e.target.value })} />
            <select className="border text-gray-900 rounded-md px-3 py-2" value={newStakeholder.role} onChange={(e) => setNewStakeholder({ ...newStakeholder, role: e.target.value })}>
              <option>MAIN_CONTRACTOR</option>
              <option>CLIENT</option>
              <option>CONSULTANT</option>
              <option>STRUCTURAL_ENGINEER</option>
              <option>ARCHITECT</option>
              <option>QUANTITY_SURVEYOR</option>
              <option>SUB_CONTRACTOR</option>
              <option>LAW_FIRM</option>
            </select>
            <input className="border text-gray-900 rounded-md px-3 py-2" placeholder="Email" value={newStakeholder.email} onChange={(e) => setNewStakeholder({ ...newStakeholder, email: e.target.value })} />
            <input className="border text-gray-900 rounded-md px-3 py-2" placeholder="Phone" value={newStakeholder.phone} onChange={(e) => setNewStakeholder({ ...newStakeholder, phone: e.target.value })} />
            <input className="border text-gray-900 rounded-md px-3 py-2 md:col-span-2" placeholder="Location" value={newStakeholder.location} onChange={(e) => setNewStakeholder({ ...newStakeholder, location: e.target.value })} />
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors md:col-span-2">Add Stakeholder</button>
          </form>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Stakeholders</h2>
          {stakeholderError && <div className="mb-3 text-sm text-red-600">{stakeholderError}</div>}
          {stakeholders.length === 0 ? (
            <div className="text-sm text-gray-500">No stakeholders yet.</div>
          ) : (
            <div className="space-y-2">
              {stakeholders.map((s) => (
                <div
                  key={s.id}
                  className="p-3 border rounded-md cursor-pointer hover:bg-gray-50"
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setSelectedStakeholder(s);
                    setShowStakeholderModal(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setSelectedStakeholder(s);
                      setShowStakeholderModal(true);
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium text-gray-900">{s.name} <span className="text-xs text-gray-500">({s.role})</span></div>
                      <div className="text-xs text-gray-500">{s.name ? `${s.email || '-' } • ${s.phone || '-' } • ${s.location || '-'}` : '-'}</div>
                    </div>
                    <button
                      className="shrink-0 text-red-600 hover:text-red-800 text-xs px-2 py-1 rounded"
                      aria-label="Delete stakeholder"
                      title="Delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteStakeholder(s.id);
                      }}
                      disabled={deletingStakeholderId === s.id}
                    >
                      {deletingStakeholderId === s.id ? 'Deleting…' : '🗑️'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      )}

      {/* Procurement & Phases - Hidden for Site Supervisors */}
      {user?.role !== 'SITE_SUPERVISOR' && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Procurement Items</h2>
          {procError && <div className="mb-3 text-sm text-red-600">{procError}</div>}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">Filter:</span>
              <select className="border text-gray-900 rounded px-2 py-1" value={procStatusFilter} onChange={(e)=>setProcStatusFilter(e.target.value as 'ALL' | ProcurementStatus)}>
                <option value="ALL">All</option>
                <option value="PENDING">Pending</option>
                <option value="QUOTED">Quoted</option>
                <option value="APPROVED">Approved</option>
                <option value="ORDERED">Ordered</option>
                <option value="DELIVERED">Delivered</option>
              </select>
            </div>
            <button onClick={exportProcurementCSV} className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded">Export CSV</button>
          </div>
          <form onSubmit={addProcurement} className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <input className="border text-gray-900 rounded-md px-3 py-2" placeholder="Item name" value={newProc.itemName} onChange={(e) => setNewProc({ ...newProc, itemName: e.target.value })} />
            <input className="border text-gray-900 rounded-md px-3 py-2" placeholder="Quantity" type="number" min={1} value={newProc.quantity} onChange={(e) => setNewProc({ ...newProc, quantity: Number(e.target.value) })} />
            <input className="border text-gray-900 rounded-md px-3 py-2" placeholder="Unit" value={newProc.unit} onChange={(e) => setNewProc({ ...newProc, unit: e.target.value })} />
            <input className="border text-gray-900 rounded-md px-3 py-2" placeholder="Estimated Cost" value={newProc.estimatedCost} onChange={(e) => setNewProc({ ...newProc, estimatedCost: e.target.value })} />
            <input className="border text-gray-900 rounded-md px-3 py-2 md:col-span-2" placeholder="Description (optional)" value={newProc.description} onChange={(e) => setNewProc({ ...newProc, description: e.target.value })} />
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors md:col-span-2">Add Item</button>
          </form>
          <div className="text-sm text-gray-600 mb-2">Assess recommended suppliers and costs below. You can export a CSV for the chairman.</div>
          {procurements.length === 0 ? (
            <div className="text-sm text-gray-500">No procurement items yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600">
                    <th className="p-2">Item</th>
                    <th className="p-2">Qty</th>
                    <th className="p-2">Unit</th>
                    <th className="p-2">Supplier</th>
                    <th className="p-2">Estimated</th>
                    <th className="p-2">Actual</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {procurements
                    .filter((p)=> procStatusFilter==='ALL' ? true : p.status === procStatusFilter)
                    .map((p) => (
                    <tr key={p.id} className="border-t">
                      <td className="p-2">
                        <div className="font-medium text-gray-900">{p.itemName}</div>
                        <div className="text-xs text-gray-500">{p.description || '-'}</div>
                      </td>
                      <td className="p-2">{p.quantity}</td>
                      <td className="p-2">{p.unit}</td>
                      <td className="p-2">
                        <input className="border rounded px-2 py-1 w-36" placeholder="Supplier"
                          defaultValue={p.supplierId || ''}
                          onBlur={(e) => updateProcurement(p.id, { supplierId: e.target.value })}
                          disabled={updatingProcId === p.id}
                        />
                      </td>
                      <td className="p-2">
                        <input className="border rounded px-2 py-1 w-28" placeholder="0.00"
                          defaultValue={p.estimatedCost || ''}
                          onBlur={(e) => updateProcurement(p.id, { estimatedCost: e.target.value })}
                          disabled={updatingProcId === p.id}
                        />
                      </td>
                      <td className="p-2">
                        <input className="border rounded px-2 py-1 w-28" placeholder="0.00"
                          defaultValue={p.actualCost || ''}
                          onBlur={(e) => updateProcurement(p.id, { actualCost: e.target.value })}
                          disabled={updatingProcId === p.id}
                        />
                      </td>
                      <td className="p-2">
                        <select className="border rounded px-2 py-1"
                          defaultValue={p.status}
                          onChange={(e) => updateProcurement(p.id, { status: e.target.value as ProcurementStatus })}
                          disabled={updatingProcId === p.id}
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="QUOTED">QUOTED</option>
                          <option value="APPROVED">APPROVED</option>
                          <option value="ORDERED">ORDERED</option>
                          <option value="DELIVERED">DELIVERED</option>
                        </select>
                      </td>
                      <td className="p-2 text-right">
                        <button className="text-xs text-gray-600 hover:text-gray-800" onClick={() => updateProcurement(p.id, { status: 'APPROVED' })} disabled={updatingProcId === p.id}>Approve</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Supplier Comparison */}
          <div className="mt-6">
            <h3 className="text-md font-semibold text-gray-900 mb-2">Supplier Comparison</h3>
            {supplierSummary.length === 0 ? (
              <div className="text-sm text-gray-500">No supplier data available.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600">
                      <th className="p-2">Supplier</th>
                      <th className="p-2">Items</th>
                      <th className="p-2">Est. Total</th>
                      <th className="p-2">Act. Total</th>
                      <th className="p-2">Recommendation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {supplierSummary.map((s, idx) => (
                      <tr key={s.supplier} className="border-t">
                        <td className="p-2">{s.supplier}</td>
                        <td className="p-2">{s.items}</td>
                        <td className="p-2">{s.estTotal.toLocaleString()}</td>
                        <td className="p-2">{s.actTotal ? s.actTotal.toLocaleString() : '-'}</td>
                        <td className="p-2">{idx === 0 ? <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">Lowest Est. Total</span> : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Project Phases</h2>
          {phaseError && <div className="mb-3 text-sm text-red-600">{phaseError}</div>}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">Filter:</span>
              <select className="border rounded px-2 py-1" value={phaseStatusFilter} onChange={(e)=>setPhaseStatusFilter(e.target.value as 'ALL' | PhaseStatus)}>
                <option value="ALL">All</option>
                <option value="PLANNED">Planned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="DELAYED">Delayed</option>
              </select>
            </div>
          </div>
          <form onSubmit={addPhase} className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <input className="border text-gray-900 rounded-md px-3 py-2" placeholder="Phase name" value={newPhase.phaseName} onChange={(e) => setNewPhase({ ...newPhase, phaseName: e.target.value })} />
            <input className="border text-gray-900 rounded-md px-3 py-2" placeholder="Week number" type="number" min={1} value={newPhase.weekNumber} onChange={(e) => setNewPhase({ ...newPhase, weekNumber: Number(e.target.value) })} />
            <select className="border text-gray-900 rounded-md px-3 py-2" value={newPhase.status} onChange={(e) => setNewPhase({ ...newPhase, status: e.target.value })}>
              <option>PLANNED</option>
              <option>IN_PROGRESS</option>
              <option>COMPLETED</option>
              <option>DELAYED</option>
            </select>
            <input className="border text-gray-900 rounded-md px-3 py-2" placeholder="Start date" type="date" value={newPhase.startDate} onChange={(e) => setNewPhase({ ...newPhase, startDate: e.target.value })} />
            <input className="border text-gray-900 rounded-md px-3 py-2" placeholder="End date" type="date" value={newPhase.endDate} onChange={(e) => setNewPhase({ ...newPhase, endDate: e.target.value })} />
            <input className="border text-gray-900 rounded-md px-3 py-2 md:col-span-2" placeholder="Tasks (comma separated)" value={newPhase.tasks} onChange={(e) => setNewPhase({ ...newPhase, tasks: e.target.value })} />
            <input className="border text-gray-900 rounded-md px-3 py-2 md:col-span-2" placeholder="Materials (comma separated)" value={newPhase.materials} onChange={(e) => setNewPhase({ ...newPhase, materials: e.target.value })} />
            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors md:col-span-2">Add Phase</button>
          </form>
          {phases.length === 0 ? (
            <div className="text-sm text-gray-500">No phases yet.</div>
          ) : (
            <div className="space-y-2">
              {phases
                .filter((ph)=> phaseStatusFilter==='ALL' ? true : ph.status === phaseStatusFilter)
                .map((ph) => (
                <div key={ph.id} className="p-3 border rounded-md">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-gray-900">Week {ph.weekNumber}: {ph.phaseName}</div>
                    <select className="border text-gray-900 rounded px-2 py-1 text-xs" defaultValue={ph.status} onChange={(e)=>updatePhase(ph.id, { status: e.target.value as PhaseStatus })} disabled={updatingPhaseId===ph.id}>
                      <option>PLANNED</option>
                      <option>IN_PROGRESS</option>
                      <option>COMPLETED</option>
                      <option>DELAYED</option>
                    </select>
                  </div>
                  <div className="text-xs text-gray-500 mb-2">{ph.description || '-'}</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-gray-600">Start</div>
                      <input type="date" className="border text-gray-900 rounded px-2 py-1 w-full" defaultValue={ph.startDate?.substring(0,10)} onBlur={(e)=>updatePhase(ph.id, { startDate: e.target.value })} disabled={updatingPhaseId===ph.id} />
                    </div>
                    <div>
                      <div className="text-gray-600">End</div>
                      <input type="date" className="border text-gray-900 rounded px-2 py-1 w-full" defaultValue={ph.endDate?.substring(0,10)} onBlur={(e)=>updatePhase(ph.id, { endDate: e.target.value })} disabled={updatingPhaseId===ph.id} />
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-gray-600">Tasks (comma separated)</div>
                      <input className="border text-gray-900 rounded px-2 py-1 w-full" defaultValue={(ph.tasks||[]).join(', ')} onBlur={(e)=>updatePhase(ph.id, { tasks: e.target.value })} disabled={updatingPhaseId===ph.id} />
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-gray-600">Materials (comma separated)</div>
                      <input className="border text-gray-900 rounded px-2 py-1 w-full" defaultValue={(ph.materials||[]).join(', ')} onBlur={(e)=>updatePhase(ph.id, { materials: e.target.value })} disabled={updatingPhaseId===ph.id} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      )}

      {/* Payment Documents - Hidden for Site Supervisors */}
      {user?.role !== 'SITE_SUPERVISOR' && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Documents Upload */}
        <div className="bg-white rounded-lg shadow p-5 lg:col-span-1">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Payment Documents</h2>
          <form onSubmit={onUploadPayment} className="space-y-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Category *</label>
              <select
                className="w-full text-gray-900 border rounded-md px-3 py-2"
                value={paymentCategory}
                onChange={(e) => setPaymentCategory(e.target.value as "INTERIM_PAYMENT" | "FINAL_ACCOUNT")}
              >
                <option value="INTERIM_PAYMENT">Interim Payment</option>
                <option value="FINAL_ACCOUNT">Final Account</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Name (optional)</label>
              <input className="w-full text-gray-900 border rounded-md px-3 py-2" value={paymentName} onChange={(e) => setPaymentName(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Description (optional)</label>
              <textarea className="w-full text-gray-900 border rounded-md px-3 py-2" rows={2} value={paymentDescription} onChange={(e) => setPaymentDescription(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Files</label>
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx"
                onChange={(e) => setPaymentFiles(e.target.files)}
                className="w-full bg-gray-50 text-gray-900 border border-gray-300 rounded px-3 py-2"
              />
            </div>
            <button
              type="submit"
              disabled={paymentUploading || !paymentFiles || paymentFiles.length === 0}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-60"
            >
              {paymentUploading ? "Uploading..." : "Upload Payment Documents"}
            </button>
          </form>
        </div>

        {/* Payment Documents List */}
        <div className="bg-white rounded-lg shadow p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Uploaded Payment Documents</h2>
            <button
              onClick={refreshDocumentLists}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              🔄 Refresh
            </button>
          </div>
          {paymentError && <div className="mb-3 text-sm text-red-600">{paymentError}</div>}
          {paymentSuccess && <div className="mb-3 text-sm text-green-700">{paymentSuccess}</div>}
          {paymentDocs.length === 0 ? (
            <div className="text-sm text-gray-500">No payment documents uploaded yet.</div>
          ) : (
            <div className="space-y-3">
              {paymentDocs.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div>
                    <div className="font-medium text-gray-900">{doc.name}</div>
                    <div className="text-xs text-gray-500">{formatCategoryName(doc.category)} • {new Date(doc.uploadedAt).toLocaleString()}</div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <a
                      href={`${getApiUrl('/api/upload/view')}?filePath=${encodeURIComponent(doc.filePath || doc.url)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View
                    </a>
                    <button
                      onClick={() => handleDeletePaymentDocument(doc)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      )}

      {/* Drawings Documents - Visible to all users */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Drawings Upload */}
        <div className="bg-white rounded-lg shadow p-5 lg:col-span-1">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Drawings</h2>
          <form onSubmit={onUploadDrawing} className="space-y-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Category *</label>
              <select
                className="w-full text-gray-900 border rounded-md px-3 py-2"
                value={drawingCategory}
                onChange={(e) => setDrawingCategory(e.target.value as "DESIGN_DRAWING" | "WORKING_DRAWING" | "AS_INSTALLED_DRAWING")}
              >
                <option value="DESIGN_DRAWING">Design Drawing</option>
                <option value="WORKING_DRAWING">Working Drawing</option>
                <option value="AS_INSTALLED_DRAWING">As Installed Drawing</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Name (optional)</label>
              <input className="w-full text-gray-900 border rounded-md px-3 py-2" value={drawingName} onChange={(e) => setDrawingName(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Description (optional)</label>
              <textarea className="w-full text-gray-900 border rounded-md px-3 py-2" rows={2} value={drawingDescription} onChange={(e) => setDrawingDescription(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Files</label>
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx"
                onChange={(e) => setDrawingFiles(e.target.files)}
                className="w-full bg-gray-50 text-gray-900 border border-gray-300 rounded px-3 py-2"
              />
            </div>
            <button
              type="submit"
              disabled={drawingUploading || !drawingFiles || drawingFiles.length === 0}
              className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors disabled:opacity-60"
            >
              {drawingUploading ? "Uploading..." : "Upload Drawings"}
            </button>
          </form>
        </div>

        {/* Drawings List */}
        <div className="bg-white rounded-lg shadow p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Uploaded Drawings</h2>
            <button
              onClick={refreshDocumentLists}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              🔄 Refresh
            </button>
          </div>
          {drawingError && <div className="mb-3 text-sm text-red-600">{drawingError}</div>}
          {drawingSuccess && <div className="mb-3 text-sm text-green-700">{drawingSuccess}</div>}
          {drawingDocs.length === 0 ? (
            <div className="text-sm text-gray-500">No drawings uploaded yet.</div>
          ) : (
            <div className="space-y-3">
              {drawingDocs.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div>
                    <div className="font-medium text-gray-900">{doc.name}</div>
                    <div className="text-xs text-gray-500">{formatCategoryName(doc.category)} • {new Date(doc.uploadedAt).toLocaleString()}</div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <a
                      href={`${getApiUrl('/api/upload/view')}?filePath=${encodeURIComponent(doc.filePath || doc.url)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View
                    </a>
                    <button
                      onClick={() => handleDeleteDrawingDocument(doc)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stakeholder Details Modal */}
      {showStakeholderModal && selectedStakeholder && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              setShowStakeholderModal(false);
              setSelectedStakeholder(null);
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-lg shadow-lg">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Stakeholder Details</h3>
                <button
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => {
                    setShowStakeholderModal(false);
                    setSelectedStakeholder(null);
                  }}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              <div className="px-4 py-4 space-y-2">
                <div>
                  <div className="text-sm text-gray-500">Name</div>
                  <div className="text-gray-900 font-medium">{selectedStakeholder.name}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Role</div>
                  <div className="text-gray-900">{selectedStakeholder.role}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Email</div>
                  <div className="text-gray-900">{selectedStakeholder.email || '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Phone</div>
                  <div className="text-gray-900">{selectedStakeholder.phone || '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Location</div>
                  <div className="text-gray-900">{selectedStakeholder.location || '-'}</div>
                </div>
              </div>
              <div className="px-4 py-3 border-t flex justify-end items-center">
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  onClick={() => {
                    setShowStakeholderModal(false);
                    setSelectedStakeholder(null);
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

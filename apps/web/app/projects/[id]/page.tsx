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
    | "OTHER";
  type: string;
  size: number;
  url: string;
  filePath: string;
  uploadedAt: string;
  documentType: string; // "preliminary" | "boq"
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

  // BOQ docs state
  const [boqDocs, setBoqDocs] = useState<ProjectDocument[]>([]);
  const [boqFiles, setBoqFiles] = useState<FileList | null>(null);
  const [boqUploading, setBoqUploading] = useState(false);
  const [boqError, setBoqError] = useState<string | null>(null);
  const [boqSuccess, setBoqSuccess] = useState<string | null>(null);

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

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("tms_token") : null;
    if (!projectId || !token) return;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const tokenHeader = { headers: { Authorization: `Bearer ${token}` } } as const;
        const [projRes, docsRes, boqRes, procsRes, phasesRes] = await Promise.all([
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
          })
        ]);
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
      } catch {
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
    const allowed = ['pdf','doc','docx','jpg','jpeg','png'];
    for (const f of Array.from(files)) {
      const ext = f.name.split('.').pop()?.toLowerCase();
      if (!ext || !allowed.includes(ext)) {
        setPrelimError('Only PDF, DOC, DOCX, JPG, JPEG, and PNG files are allowed.');
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
    const allowed = ['pdf','doc','docx','jpg','jpeg','png'];
    for (const f of Array.from(boqFiles)) {
      const ext = f.name.split('.').pop()?.toLowerCase();
      if (!ext || !allowed.includes(ext)) {
        setBoqError('Only PDF, DOC, DOCX, JPG, JPEG, and PNG files are allowed.');
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Preliminary Planning Upload */}
        <div className="bg-white rounded-lg shadow p-5 lg:col-span-1">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Preliminary Planning Documents</h2>
          <form onSubmit={onUpload} className="space-y-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Category</label>
              <select
                className="w-full border rounded-md px-3 py-2"
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
              <input className="w-full border rounded-md px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Description (optional)</label>
              <textarea className="w-full border rounded-md px-3 py-2" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Files</label>
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={(e) => setFiles(e.target.files)}
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
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Uploaded Preliminary Documents</h2>
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
                      href={getApiUrl(doc.url)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* BOQ Upload and List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">BOQ Documents</h2>
          <form onSubmit={onUploadBOQ} className="space-y-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Files</label>
              <input type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={(e) => setBoqFiles(e.target.files)} />
            </div>
            {boqError && <div className="text-sm text-red-600">{boqError}</div>}
            {boqSuccess && <div className="text-sm text-green-700">{boqSuccess}</div>}
            <button type="submit" disabled={boqUploading || !boqFiles || boqFiles.length === 0} className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors disabled:opacity-60" aria-busy={boqUploading}>
              {boqUploading ? 'Uploading...' : 'Upload BOQ'}
            </button>
          </form>
        </div>
        <div className="bg-white rounded-lg shadow p-5 lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Uploaded BOQ Documents</h2>
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
                  <a href={getApiUrl(doc.url)} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 text-sm">View</a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stakeholders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Add Stakeholder</h2>
          <form onSubmit={addStakeholder} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input className="border rounded-md px-3 py-2" placeholder="Name" value={newStakeholder.name} onChange={(e) => setNewStakeholder({ ...newStakeholder, name: e.target.value })} />
            <select className="border rounded-md px-3 py-2" value={newStakeholder.role} onChange={(e) => setNewStakeholder({ ...newStakeholder, role: e.target.value })}>
              <option>MAIN_CONTRACTOR</option>
              <option>CLIENT</option>
              <option>CONSULTANT</option>
              <option>STRUCTURAL_ENGINEER</option>
              <option>ARCHITECT</option>
              <option>QUANTITY_SURVEYOR</option>
              <option>SUB_CONTRACTOR</option>
              <option>LAW_FIRM</option>
            </select>
            <input className="border rounded-md px-3 py-2" placeholder="Email" value={newStakeholder.email} onChange={(e) => setNewStakeholder({ ...newStakeholder, email: e.target.value })} />
            <input className="border rounded-md px-3 py-2" placeholder="Phone" value={newStakeholder.phone} onChange={(e) => setNewStakeholder({ ...newStakeholder, phone: e.target.value })} />
            <input className="border rounded-md px-3 py-2 md:col-span-2" placeholder="Location" value={newStakeholder.location} onChange={(e) => setNewStakeholder({ ...newStakeholder, location: e.target.value })} />
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
                <div key={s.id} className="p-3 border rounded-md">
                  <div className="font-medium text-gray-900">{s.name} <span className="text-xs text-gray-500">({s.role})</span></div>
                  <div className="text-xs text-gray-500">{s.name ? `${s.email || '-' } • ${s.phone || '-' } • ${s.location || '-'}` : '-'}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Procurement & Phases */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Procurement Items</h2>
          {procError && <div className="mb-3 text-sm text-red-600">{procError}</div>}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">Filter:</span>
              <select className="border rounded px-2 py-1" value={procStatusFilter} onChange={(e)=>setProcStatusFilter(e.target.value as 'ALL' | ProcurementStatus)}>
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
            <input className="border rounded-md px-3 py-2" placeholder="Item name" value={newProc.itemName} onChange={(e) => setNewProc({ ...newProc, itemName: e.target.value })} />
            <input className="border rounded-md px-3 py-2" placeholder="Quantity" type="number" min={1} value={newProc.quantity} onChange={(e) => setNewProc({ ...newProc, quantity: Number(e.target.value) })} />
            <input className="border rounded-md px-3 py-2" placeholder="Unit" value={newProc.unit} onChange={(e) => setNewProc({ ...newProc, unit: e.target.value })} />
            <input className="border rounded-md px-3 py-2" placeholder="Estimated Cost" value={newProc.estimatedCost} onChange={(e) => setNewProc({ ...newProc, estimatedCost: e.target.value })} />
            <input className="border rounded-md px-3 py-2 md:col-span-2" placeholder="Description (optional)" value={newProc.description} onChange={(e) => setNewProc({ ...newProc, description: e.target.value })} />
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
            <input className="border rounded-md px-3 py-2" placeholder="Phase name" value={newPhase.phaseName} onChange={(e) => setNewPhase({ ...newPhase, phaseName: e.target.value })} />
            <input className="border rounded-md px-3 py-2" placeholder="Week number" type="number" min={1} value={newPhase.weekNumber} onChange={(e) => setNewPhase({ ...newPhase, weekNumber: Number(e.target.value) })} />
            <select className="border rounded-md px-3 py-2" value={newPhase.status} onChange={(e) => setNewPhase({ ...newPhase, status: e.target.value })}>
              <option>PLANNED</option>
              <option>IN_PROGRESS</option>
              <option>COMPLETED</option>
              <option>DELAYED</option>
            </select>
            <input className="border rounded-md px-3 py-2" placeholder="Start date" type="date" value={newPhase.startDate} onChange={(e) => setNewPhase({ ...newPhase, startDate: e.target.value })} />
            <input className="border rounded-md px-3 py-2" placeholder="End date" type="date" value={newPhase.endDate} onChange={(e) => setNewPhase({ ...newPhase, endDate: e.target.value })} />
            <input className="border rounded-md px-3 py-2 md:col-span-2" placeholder="Tasks (comma separated)" value={newPhase.tasks} onChange={(e) => setNewPhase({ ...newPhase, tasks: e.target.value })} />
            <input className="border rounded-md px-3 py-2 md:col-span-2" placeholder="Materials (comma separated)" value={newPhase.materials} onChange={(e) => setNewPhase({ ...newPhase, materials: e.target.value })} />
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
                    <div className="font-medium">Week {ph.weekNumber}: {ph.phaseName}</div>
                    <select className="border rounded px-2 py-1 text-xs" defaultValue={ph.status} onChange={(e)=>updatePhase(ph.id, { status: e.target.value as PhaseStatus })} disabled={updatingPhaseId===ph.id}>
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
                      <input type="date" className="border rounded px-2 py-1 w-full" defaultValue={ph.startDate?.substring(0,10)} onBlur={(e)=>updatePhase(ph.id, { startDate: e.target.value })} disabled={updatingPhaseId===ph.id} />
                    </div>
                    <div>
                      <div className="text-gray-600">End</div>
                      <input type="date" className="border rounded px-2 py-1 w-full" defaultValue={ph.endDate?.substring(0,10)} onBlur={(e)=>updatePhase(ph.id, { endDate: e.target.value })} disabled={updatingPhaseId===ph.id} />
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-gray-600">Tasks (comma separated)</div>
                      <input className="border rounded px-2 py-1 w-full" defaultValue={(ph.tasks||[]).join(', ')} onBlur={(e)=>updatePhase(ph.id, { tasks: e.target.value })} disabled={updatingPhaseId===ph.id} />
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-gray-600">Materials (comma separated)</div>
                      <input className="border rounded px-2 py-1 w-full" defaultValue={(ph.materials||[]).join(', ')} onBlur={(e)=>updatePhase(ph.id, { materials: e.target.value })} disabled={updatingPhaseId===ph.id} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



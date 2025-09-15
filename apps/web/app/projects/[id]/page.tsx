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

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("tms_token") : null;
    if (!projectId || !token) return;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [projRes, docsRes] = await Promise.all([
          fetch(getApiUrl(`/api/projects/${projectId}`), {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(getApiUrl(`/api/projects/${projectId}/documents?documentType=preliminary`), {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        if (projRes.ok) {
          const p = await projRes.json();
          setProject(p);
        }
        if (docsRes.ok) {
          const d = await docsRes.json();
          setPrelimDocs(d);
        }
      } catch (e) {
        setError("Failed to load project");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [projectId]);

  const onUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files || files.length === 0) return;
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
      } else {
        const msg = await res.text();
        alert(`Upload failed: ${msg}`);
      }
    } catch (err) {
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
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
    </div>
  );
}



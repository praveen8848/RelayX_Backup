import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProjects, createProject } from '../api/endpoints';
import { FolderGit2, Plus, Copy, CheckCircle2 } from 'lucide-react';
import TenantEventForm from '../components/events/TenantEventForm';
export default function Projects() {
  const queryClient = useQueryClient();
  const [newProjectName, setNewProjectName] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const { data: projects, isLoading } = useQuery<any[]>({
    queryKey: ['projects'],
    queryFn: getProjects,
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => createProject(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setNewProjectName('');
    }
  });

  const copyToClipboard = (id: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName.trim()) {
      createMutation.mutate(newProjectName.trim());
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-20 pb-20">
      <header className="flex flex-col gap-5 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_10px_#3B82F6]" />

            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
              RelayX Projects and APIs
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-white lg:text-4xl">
              Projects & Tenants
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            Manage isolated environments and API keys for publishing events.
          </p>
        </div>
   
      </header>
     
      {/* Create Project Form */}
      <form onSubmit={handleCreate} className="flex gap-4 p-4 bg-surface border border-border rounded-xl">
        <input 
          type="text" 
          placeholder="New Project Name (e.g. Tenant-B)" 
          value={newProjectName}
          onChange={(e) => setNewProjectName(e.target.value)}
          className="flex-1 bg-surfaceHover border border-border rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-primary"
        />
        <button 
          type="submit" 
          disabled={createMutation.isPending || !newProjectName.trim()}
          className="px-6 py-2 bg-primary hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {createMutation.isPending ? 'Creating...' : <><Plus className="w-4 h-4"/> Create Project</>}
        </button>
      </form>

      {/* Projects Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted uppercase bg-surfaceHover/50 border-b border-border">
            <tr>
              <th className="px-6 py-4">ID</th>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">API Key</th>
              <th className="px-6 py-4">Created At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {isLoading ? (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-muted animate-pulse">Loading projects...</td></tr>
            ) : projects?.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-muted">No projects created yet.</td></tr>
            ) : (
              projects?.map((p: any) => (
                <tr key={p.id} className="hover:bg-surfaceHover/40 transition-colors">
                  <td className="px-6 py-4 text-muted">{p.id}</td>
                  <td className="px-6 py-4 font-medium text-white">{p.name}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-muted bg-surfaceHover px-2 py-1 rounded border border-border">
                        {p.apiKey.substring(0, 15)}...
                      </span>
                      <button 
                        onClick={() => copyToClipboard(p.id, p.apiKey)}
                        className="text-muted hover:text-white transition-colors"
                        title="Copy API Key"
                      >
                        {copiedId === p.id ? <CheckCircle2 className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                      </button>
                      {copiedId === p.id && <span className="text-xs text-success">Copied!</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-muted">{new Date(p.createdAt).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ADD THIS NEW SECTION */}
      <div className="pt-8">
        <TenantEventForm />
      </div>
    </div>
  );
}

import { useEffect, useState, useMemo } from 'react'
import { toast } from 'react-toastify'
import { Card, PageShell, SectionHeader } from '../components/layout/PageShell.jsx'
import axiosInstance from '../services/axiosInstance'
import { 
  MdBusiness, MdPeople, MdSecurity, MdVpnKey, MdHistory, 
  MdViewModule, MdExtension, MdLockPerson, MdAppRegistration, 
  MdGroupWork, MdSearch, MdArrowBack, MdAdd, MdRefresh, MdClose
} from 'react-icons/md'

// --- 1. DATA DEFINITION ---
const MODULE_DATA = [
  { id: 'company', category: 'Organization', title: 'Company', desc: 'Manage company information', icon: <MdBusiness /> },
  { id: 'employee', category: 'Organization', title: 'Employee', desc: 'Manage employee records', icon: <MdPeople /> },
  { id: 'software-group', category: 'Access Control', title: 'Software Group', desc: 'Configure software groups', icon: <MdGroupWork /> },
  { id: 'users', category: 'User Management', title: 'Users', desc: 'Manage user accounts', icon: <MdLockPerson /> },
  { id: 'group-users', category: 'User Management', title: 'Group Users', desc: 'Assign users to groups', icon: <MdAppRegistration /> },
  { id: 'security-log', category: 'Monitoring', title: 'Security Log', desc: 'View security activities', icon: <MdHistory /> },
  { id: 'modules', category: 'System', title: 'Modules', desc: 'Manage system modules', icon: <MdViewModule /> },
  { id: 'functionalities', category: 'System', title: 'Modules Functionalities', desc: 'Configure functionalities', icon: <MdExtension /> },
  { id: 'group-rights', category: 'Access Control', title: 'Group Rights', desc: 'Set group permissions', icon: <MdSecurity /> },
  { id: 'user-access', category: 'Access Control', title: 'Users Module Access', desc: 'Manage user access', icon: <MdVpnKey /> },
  { id: 'group-mgmt', category: 'User Management', title: 'Group Management', desc: 'Create user groups', icon: <MdPeople /> },
];

// --- 2. SUB-COMPONENTS (Defined Outside to Fix Search Lag) ---

const ModuleCard = ({ mod, onClick }) => (
  <div 
    onClick={() => onClick(mod.id)}
    className="group p-5 rounded-xl border border-slate-100 bg-white transition-all cursor-pointer hover:border-teal-400 hover:shadow-lg hover:-translate-y-1"
  >
    <div className="mb-4 flex items-center justify-between">
      <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-[10px] font-bold uppercase text-teal-700">{mod.category}</span>
      <div className="text-2xl text-teal-600 group-hover:scale-110 transition-transform">{mod.icon}</div>
    </div>
    <h3 className="text-sm font-bold text-slate-800">{mod.title}</h3>
    <p className="mt-1 text-[11px] text-slate-500 leading-tight">{mod.desc}</p>
    <div className="mt-4 pt-3 border-t border-slate-50 flex justify-between items-center text-teal-600 font-bold text-[11px]">
      <span>Open Module</span>
      <span className="group-hover:translate-x-1 transition-transform">→</span>
    </div>
  </div>
);

const ModulePage = ({ module, onBack }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/${module.id}`).catch(() => ({ data: [] }));
      setData(res.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [module.id]);

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 rounded-lg bg-white border border-slate-200 px-4 py-2 text-sm font-bold text-teal-700 hover:bg-teal-50 transition shadow-sm">
          <MdArrowBack /> Back to Overview
        </button>
        <div className="flex gap-3">
           <button onClick={fetchData} className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:text-teal-600 shadow-sm">
             <MdRefresh className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`}/>
           </button>
           <button className="flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-teal-200 hover:bg-teal-700">
             <MdAdd className="h-5 w-5" /> New {module.title}
           </button>
        </div>
      </div>

      <Card className="border-l-[6px] border-l-teal-500 p-6">
        <SectionHeader title={module.title} description={module.desc} icon={<div className="text-teal-600 text-3xl">{module.icon}</div>} />
        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-100 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <tr><th className="px-6 py-4">ID</th><th className="px-6 py-4">Name</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Action</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan="4" className="py-10 text-center text-teal-600">Syncing Data...</td></tr>
              ) : data.length > 0 ? (
                data.map((item, i) => (
                  <tr key={i} className="hover:bg-teal-50/20">
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">#{(item.id || i+1).toString().padStart(4, '0')}</td>
                    <td className="px-6 py-4 font-bold text-slate-700">{item.name || item.title || 'Record Entry'}</td>
                    <td className="px-6 py-4"><span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-[9px] font-bold text-teal-700 uppercase">Active</span></td>
                    <td className="px-6 py-4 text-right"><button className="text-teal-600 font-bold text-xs">Edit Details</button></td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="4" className="py-20 text-center text-slate-400 italic">No {module.title} records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// --- 3. MAIN SECURITY COMPONENT ---
export default function Security() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');

  // Filtering Logic
  const filteredModules = useMemo(() => {
    const lowSearch = searchTerm.toLowerCase();
    return MODULE_DATA.filter(m => 
      m.title.toLowerCase().includes(lowSearch) || 
      m.category.toLowerCase().includes(lowSearch)
    );
  }, [searchTerm]);

  const currentModule = MODULE_DATA.find(m => m.id === activeTab);

  // Dynamic Title Logic
  const pageTitle = activeTab === 'dashboard' ? "Security Modules" : `Security Modules / ${currentModule?.title}`;

  return (
    <PageShell 
      title={pageTitle} 
      description="Manage system access, user groups, and organizational security." 
      accent="from-teal-600 via-emerald-600 to-cyan-700"
    >
      {activeTab === 'dashboard' ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* SEARCH BAR SECTION */}
          <div className="relative max-w-2xl">
            <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search security modules..."
              className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-12 pr-10 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-50 transition-all shadow-sm"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-600">
                <MdClose className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* MODULE GRID SECTION */}
          {filteredModules.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {filteredModules.map((mod) => (
                <ModuleCard key={mod.id} mod={mod} onClick={setActiveTab} />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center text-slate-400 font-medium">
              No matching security modules found for "{searchTerm}"
            </div>
          )}
        </div>
      ) : (
        <ModulePage module={currentModule} onBack={() => setActiveTab('dashboard')} />
      )}
    </PageShell>
  );
}
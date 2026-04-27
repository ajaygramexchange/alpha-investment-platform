import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  ShieldAlert, 
  Users, 
  CheckCircle, 
  XCircle, 
  ShieldCheck, 
  ArrowLeft, 
  Loader2,
  PlusCircle, 
  Clock,
  Check,
  Terminal
} from 'lucide-react';

const AdminPanel = ({ backToDash }) => {
  // --- DEPLOYMENT CONFIG ---
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const [users, setUsers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  
  const [logs, setLogs] = useState([
    { id: 1, event: "Root Access Granted", user: "ADMIN_ROOT", time: "19:42:01", status: "Success" },
    { id: 2, event: "Database Handshake", user: "SYSTEM", time: "19:42:05", status: "Success" },
    { id: 3, event: "Node Verification", user: "SSL_AUTH", time: "19:42:08", status: "Success" }
  ]);

  const addLog = (event, user, status) => {
    const newLog = {
      id: Date.now(),
      event,
      user,
      time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
      status
    };
    setLogs(prev => [newLog, ...prev].slice(0, 8)); // Expanded to show 8 logs
  };

  const fetchData = async () => {
    try {
      const [usersRes, pendingRes] = await Promise.all([
        axios.get(`${API_URL}/admin/users`),
        axios.get(`${API_URL}/admin/transactions/pending`)
      ]);
      setUsers(usersRes.data);
      setPendingRequests(pendingRes.data);
      addLog("Remote Data Sync", "SYSTEM", "Success");
    } catch (err) {
      console.error("Failed to fetch terminal data", err);
      addLog("Data Sync Failed", "SYSTEM", "Denied");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApproveDeposit = async (userId) => {
    const amount = prompt("Enter deposit amount to approve ($):");
    if (amount === null) return; 
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert("Please enter a valid positive number.");
      return;
    }

    try {
      setActionLoading(`dep-${userId}`);
      const res = await axios.post(`${API_URL}/admin/deposit/confirm`, { 
        userId: userId, 
        amount: parsedAmount 
      });
      addLog(`Liquidity Injection: $${parsedAmount}`, `USR_${userId.slice(0,4)}`, "Success");
      alert(`Success! New Balance: $${res.data.newBalance.toLocaleString()}`);
      fetchData();
    } catch (err) {
      addLog("Injection Failed", "OVERRIDE", "Denied");
      alert("Error: " + (err.response?.data?.error || "Server error"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleWithdrawalStatus = async (txId, status) => {
    try {
      setActionLoading(`tx-${txId}`);
      await axios.post(`${API_URL}/admin/transaction/update`, {
        txId: txId,
        status: status 
      });
      
      addLog(`Withdrawal ${status}`, `TX_${txId.toString().slice(0,4)}`, status === 'success' ? "Success" : "Denied");
      fetchData(); 
    } catch (err) {
      addLog("Status Update Failed", "SYSTEM", "Denied");
      alert("System Override Failed");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#050810] text-white p-4 md:p-8 font-sans selection:bg-blue-500/30">
      <div className="max-w-6xl mx-auto">
        
        {/* Navigation Top Bar */}
        <button 
          onClick={backToDash} 
          className="flex items-center gap-2 text-gray-500 hover:text-white transition-all mb-8 group bg-white/5 px-4 py-2 rounded-full border border-white/5 hover:border-white/10"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Exit Terminal</span>
        </button>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-blue-600/10 rounded-3xl text-blue-500 border border-blue-500/20 shadow-[0_0_20px_rgba(37,99,235,0.1)]">
              <ShieldCheck size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-black italic uppercase tracking-tighter leading-none mb-1">
                Auth <span className="text-blue-500">Terminal</span>
              </h1>
              <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">
                Node: <span className="text-green-500 font-mono">Secure</span> // System Status: Active
              </p>
            </div>
          </div>
          <div className="bg-[#161f33] px-6 py-3 rounded-2xl border border-white/5 text-right">
            <p className="text-[9px] text-gray-500 uppercase font-black tracking-[0.2em] mb-1">Total Entities</p>
            <p className="text-2xl font-mono font-bold text-blue-400">{users.length}</p>
          </div>
        </div>

        {/* --- SECTION: SECURITY AUDIT LOG --- */}
        <div className="mb-12">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500/80 mb-4 px-2 flex items-center gap-2">
            <Terminal size={14} /> Security Audit Log
          </h2>
          <div className="bg-black/40 border border-white/5 rounded-2xl p-4 font-mono text-[11px] h-36 overflow-y-auto space-y-2 shadow-inner custom-scrollbar">
            {logs.map(log => (
              <div key={log.id} className="flex flex-wrap gap-x-4 border-b border-white/[0.02] pb-1 hover:bg-white/[0.02] transition-colors">
                <span className="text-gray-600">[{log.time}]</span>
                <span className={log.status === 'Success' ? 'text-green-500' : 'text-red-500 font-bold'}>
                  {log.event.toUpperCase()}
                </span>
                <span className="text-blue-400 opacity-70">{log.user}</span>
                <span className="ml-auto text-gray-800 text-[9px] font-bold">AUTH_SIG_{log.id.toString().slice(-4).toUpperCase()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* --- SECTION 1: PENDING SYSTEM REQUESTS --- */}
        <div className="flex items-center justify-between mb-4 px-2">
          <h2 className="text-xs font-black uppercase tracking-[0.3em] text-blue-500/80 flex items-center gap-2">
            <Clock size={14} /> Critical Queue: Withdrawal Requests
          </h2>
          <span className="text-[10px] bg-red-500/10 text-red-500 px-2 py-1 rounded font-bold">{pendingRequests.length} Pending</span>
        </div>
        <div className="bg-[#0a0f1d] rounded-[2rem] border border-red-500/10 overflow-hidden shadow-2xl mb-12 relative">
          {pendingRequests.length === 0 ? (
            <div className="p-12 text-center text-gray-600 italic text-sm">No pending withdrawal requests in queue.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-red-500/[0.02] text-gray-500 text-[8px] uppercase tracking-widest font-black">
                  <tr>
                    <th className="p-6">Requestor</th>
                    <th className="p-6">Amount</th>
                    <th className="p-6 text-right">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {pendingRequests.map(tx => (
                    <tr key={tx.id} className="hover:bg-white/[0.01] transition-all">
                      <td className="p-6">
                        <div className="font-bold text-sm text-white">{tx.wallet?.user?.fullName}</div>
                        <div className="text-[10px] text-gray-500 font-mono">{tx.wallet?.user?.email}</div>
                      </td>
                      <td className="p-6 text-red-400 font-mono font-bold text-lg">
                        -${tx.amount.toLocaleString()}
                      </td>
                      <td className="p-6 text-right flex justify-end gap-3">
                        <button 
                          disabled={actionLoading === `tx-${tx.id}`}
                          onClick={() => handleWithdrawalStatus(tx.id, 'success')}
                          className="p-3 bg-green-500/10 text-green-500 rounded-xl hover:bg-green-500 hover:text-white transition-all disabled:opacity-50"
                        >
                          {actionLoading === `tx-${tx.id}` ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                        </button>
                        <button 
                          disabled={actionLoading === `tx-${tx.id}`}
                          onClick={() => handleWithdrawalStatus(tx.id, 'failed')}
                          className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                        >
                          <XCircle size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* --- SECTION 2: ENTITY MANAGEMENT --- */}
        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-gray-500 mb-4 px-2 flex items-center gap-2">
          <Users size={14} /> Registered Entity Database
        </h2>
        <div className="bg-[#0a0f1d] rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl relative">
          {loading ? (
            <div className="p-32 flex flex-col items-center justify-center gap-4">
              <Loader2 className="animate-spin text-blue-500" size={40} />
              <p className="text-gray-500 animate-pulse font-bold uppercase tracking-widest text-xs">Accessing Encrypted Core...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/[0.02] text-gray-400 text-[9px] uppercase tracking-[0.3em] font-black">
                    <th className="p-8">Entity Identity</th>
                    <th className="p-8">Network Credentials</th>
                    <th className="p-8">Liquidity State</th>
                    <th className="p-8 text-right">System Override</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-blue-500/[0.02] transition-all group">
                      <td className="p-8">
                        <div className="font-bold text-white group-hover:text-blue-400 transition-colors text-lg tracking-tight">{u.fullName}</div>
                        <div className="text-[10px] text-gray-600 font-mono mt-1 opacity-60">ID: {u.id.toString().slice(0, 8)}...</div>
                      </td>
                      <td className="p-8">
                        <span className="text-gray-400 font-mono text-xs bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">{u.email}</span>
                      </td>
                      <td className="p-8">
                        <div className="flex flex-col">
                          <span className="text-white font-mono font-bold text-2xl tracking-tighter">
                            ${u.wallets?.[0]?.balance?.toLocaleString(undefined, {minimumFractionDigits: 2}) || '0.00'}
                          </span>
                        </div>
                      </td>
                      <td className="p-8 text-right">
                        <button 
                          disabled={actionLoading === `dep-${u.id}`}
                          onClick={() => handleApproveDeposit(u.id)}
                          className="relative inline-flex items-center gap-2 bg-white text-black hover:bg-blue-600 hover:text-white px-7 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl disabled:opacity-50"
                        >
                          {actionLoading === `dep-${u.id}` ? <Loader2 size={14} className="animate-spin" /> : <PlusCircle size={14} />}
                          {actionLoading === `dep-${u.id}` ? 'Processing' : 'Inyect Liquidity'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
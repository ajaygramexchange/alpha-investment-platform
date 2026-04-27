import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import PriceTicker from './PriceTicker';
import WithdrawalModal from './WithdrawalModal';
import ROICalculator from './ROICalculator';
import InvestmentPlans from './InvestmentPlans';
import { 
  LayoutDashboard, 
  Wallet, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  LogOut,
  ShieldAlert,
  Menu,
  X 
} from 'lucide-react';

// --- PRODUCTION CONFIG ---
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// --- LIVE PAYOUT TICKER ---
const LivePayoutTicker = () => {
  const [payouts, setPayouts] = useState([]);

  useEffect(() => {
    const fetchPayouts = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/recent-payouts`);
        const displayData = res.data.length > 0 ? res.data : [
          { name: "Doris", amount: 1200 },
          { name: "Ajay", amount: 500 },
          { name: "Ryan", amount: 3000 },
          { name: "Odigomma", amount: 850 },
          { name: "Sarah", amount: 1500 }
        ];
        setPayouts(displayData);
      } catch (err) { 
        console.error("Ticker fetch failed", err); 
      }
    };
    fetchPayouts();
    const tickerInterval = setInterval(fetchPayouts, 120000);
    return () => clearInterval(tickerInterval);
  }, []);

  if (payouts.length === 0) return null;

  return (
    <div className="bg-blue-600/10 border-b border-white/5 py-2 overflow-hidden whitespace-nowrap relative">
      <div className="flex animate-marquee">
        {[...payouts, ...payouts].map((p, i) => (
          <span key={i} className="mx-12 text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            Payout: {p.name} — ${Math.abs(p.amount).toLocaleString()} 
          </span>
        ))}
      </div>
    </div>
  );
};

const Dashboard = ({ user, logout, openAdmin }) => {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [portfolio, setPortfolio] = useState({ balance: 0, investments: [], wallet: { transactions: [] } });
  
  // This could also be moved to an env variable if you want it dynamic!
  const walletAddress = "1abCr2n5aCV3ejf5xP3eejveygx2xWrvh";

  // --- DATA FETCHING ---
  const loadPortfolio = async () => {
    try {
      const res = await axios.get(`${API_URL}/user/portfolio/${user.id}`);
      setPortfolio({
        balance: res.data.wallet.balance,
        investments: res.data.investments,
        wallet: res.data.wallet 
      });
    } catch (err) { 
      console.error("Portfolio load failed", err); 
    }
  };

  useEffect(() => {
    loadPortfolio();
    const interval = setInterval(loadPortfolio, 30000);
    return () => clearInterval(interval);
  }, [user.id]);

  const activePlan = portfolio.investments.length > 0 ? portfolio.investments[0].planName : 'No Active Plan';
  const totalInvested = portfolio.investments.reduce((sum, inv) => sum + inv.principalAmount, 0);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- UI COMPONENTS ---
  const SidebarContent = () => (
    <>
      <div className="flex items-center justify-between mb-10 px-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold">A</div>
          <span className="text-xl font-bold tracking-tight">AlphaInvest</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-gray-500">
          <X size={24} />
        </button>
      </div>

      <div className="space-y-2 flex-1">
        {[
          { icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard' },
          { icon: Wallet, label: 'My Wallet', id: 'wallet' },
          { icon: TrendingUp, label: 'Investments', id: 'investments' },
          { icon: History, label: 'History', id: 'history' },
        ].map((item) => (
          <motion.button
            whileHover={{ x: 5 }}
            key={item.id}
            onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === item.id ? 'bg-blue-600/10 text-blue-500 border border-blue-500/20' : 'text-gray-400 hover:bg-white/5'
            }`}
          >
            <item.icon size={20} />
            <span className="font-medium">{item.label}</span>
          </motion.button>
        ))}

        <motion.button
          whileHover={{ x: 5 }}
          onClick={() => { openAdmin(); setIsMobileMenuOpen(false); }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-400/10 transition-all border border-transparent hover:border-red-400/20 mt-4"
        >
          <ShieldAlert size={20} />
          <span className="font-medium">Admin Panel</span>
        </motion.button>
      </div>

      <button onClick={logout} className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-red-400 transition-colors">
        <LogOut size={20} />
        <span className="font-medium">Logout</span>
      </button>
    </>
  );

  const renderMainContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              {[
                { label: 'Total Balance', value: `$${portfolio.balance.toLocaleString()}`, change: '+2.5%', icon: Wallet },
                { label: 'Active ROI', value: '$840.12', change: '+12.4%', icon: TrendingUp },
                { label: 'Total Invested', value: `$${totalInvested.toLocaleString()}`, icon: LayoutDashboard },
              ].map((stat, i) => (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} key={stat.label} className="bg-[#161f33] p-6 rounded-[2rem] border border-white/5 shadow-xl">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-white/5 rounded-2xl text-gray-400"><stat.icon size={24} /></div>
                    {stat.change && <span className="text-xs font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded-lg">{stat.change}</span>}
                  </div>
                  <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
                  <h3 className="text-3xl font-bold">{stat.value}</h3>
                </motion.div>
              ))}
            </div>
            <section className="mb-12">
              <h2 className="text-xl font-bold mb-6">Profit Forecaster</h2>
              <ROICalculator />
            </section>
          </>
        );
      case 'wallet':
        return (
          <div className="bg-[#161f33] p-8 rounded-[2rem] border border-white/5 shadow-xl min-h-[400px]">
            <h2 className="text-2xl font-bold mb-4">My Wallet</h2>
            <p className="text-gray-400 mb-8 text-sm">Manage liquidity and deposits.</p>
            <div className="bg-black/20 p-6 rounded-2xl border border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-widest font-bold text-center md:text-left">Current Balance</p>
                <h3 className="text-4xl font-bold text-blue-500">${portfolio.balance.toLocaleString()}</h3>
              </div>
              <button onClick={() => setIsDepositOpen(true)} className="w-full md:w-auto bg-blue-600 px-6 py-3 rounded-xl font-bold">Top Up Wallet</button>
            </div>
          </div>
        );
      case 'investments':
        return (
          <section className="mb-12">
            <h2 className="text-xl font-bold mb-6">Active Portfolio & Plans</h2>
            <InvestmentPlans userId={user?.id} onInvestSuccess={loadPortfolio} />
          </section>
        );
      case 'history':
        return (
          <div className="bg-[#161f33] rounded-[2rem] border border-white/5 p-8 shadow-xl">
            <h3 className="text-xl font-bold mb-6">Complete Transaction History</h3>
            <div className="space-y-6">
              {portfolio.wallet?.transactions?.length > 0 ? (
                portfolio.wallet.transactions.map((tx, i) => (
                  <div key={i} className="flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl bg-white/5 ${tx.type === 'deposit' ? 'text-green-400' : 'text-orange-400'}`}>
                        {tx.type === 'deposit' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                      </div>
                      <div>
                        <p className="font-bold capitalize">{tx.type}</p>
                        <p className="text-xs text-gray-500">{new Date(tx.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${tx.type === 'deposit' ? 'text-green-400' : 'text-orange-400'}`}>
                        ${Math.abs(tx.amount).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">{tx.status}</p>
                    </div>
                  </div>
                ))
              ) : <p className="text-gray-500 text-center py-4 italic">No transactions found.</p>}
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#050810] flex text-white font-sans overflow-hidden">
      
      {/* DESKTOP SIDEBAR */}
      <nav className="w-64 border-r border-white/5 bg-[#0a0f1d] flex flex-col p-6 hidden md:flex shrink-0">
        <SidebarContent />
      </nav>

      {/* MOBILE SIDEBAR (Drawer) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.nav 
            initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] w-72 bg-[#0a0f1d] border-r border-white/10 p-6 flex flex-col md:hidden shadow-2xl"
          >
            <SidebarContent />
          </motion.nav>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto">
        <LivePayoutTicker />
        <PriceTicker />

        {/* MOBILE TOP BAR */}
        <div className="md:hidden flex items-center justify-between p-4 bg-[#0a0f1d] border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center font-bold text-[10px]">A</div>
            <span className="font-bold tracking-tight text-xs uppercase text-blue-400">AlphaInvest</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-blue-500 bg-blue-500/10 rounded-lg">
            <Menu size={20} />
          </button>
        </div>

        <div className="p-6 md:p-8">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white/90">Welcome back, {user?.fullName || 'Investor'}</h1>
              <p className="text-gray-500 text-sm">Real-time terminal access active.</p>
            </div>
            <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
              <button onClick={() => setIsDepositOpen(true)} className="bg-white text-black px-4 py-2 rounded-xl font-bold text-xs whitespace-nowrap active:scale-95 transition-transform">Deposit</button>
              <button onClick={() => setActiveTab('investments')} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-xs whitespace-nowrap active:scale-95 transition-transform">Invest</button>
              <button onClick={() => setIsWithdrawOpen(true)} className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl font-bold text-gray-300 text-xs whitespace-nowrap active:scale-95 transition-transform">Withdraw</button>
            </div>
          </header>

          {renderMainContent()}
        </div>

        {/* MODALS */}
        {isDepositOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#111827] w-full max-w-md rounded-[2.5rem] border border-white/10 p-8 shadow-2xl relative text-white">
              <button onClick={() => setIsDepositOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold">Deposit Crypto</h2>
                <p className="text-gray-400 text-sm mt-2">Scan the address to fund your terminal</p>
              </div>
              <div className="flex justify-center mb-8">
                <div className="p-4 bg-white rounded-3xl">
                  <QRCodeSVG value={walletAddress} size={160} />
                </div>
              </div>
              <div className="bg-black/40 rounded-2xl p-4 border border-white/5 mb-6">
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-2 px-1">BTC Network Address</p>
                <div className="flex items-center justify-between gap-3">
                  <code className="text-blue-400 text-[10px] break-all font-mono">{walletAddress}</code>
                  <button onClick={copyToClipboard} className="shrink-0 p-2 bg-blue-600/10 text-blue-500 rounded-lg hover:bg-blue-600 hover:text-white transition-all text-xs font-bold">
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
              <button onClick={() => setIsDepositOpen(false)} className="w-full py-4 bg-white text-black font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-gray-200 transition-all shadow-xl">
                I've Made the Transfer
              </button>
            </motion.div>
          </div>
        )}

        <WithdrawalModal 
          isOpen={isWithdrawOpen} 
          onClose={() => setIsWithdrawOpen(false)} 
          balance={portfolio.balance} 
          activePlan={activePlan} 
          user={user} 
        />
      </main>

      <style>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { display: flex; animation: marquee 25s linear infinite; width: fit-content; }
        .animate-marquee:hover { animation-play-state: paused; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default Dashboard;
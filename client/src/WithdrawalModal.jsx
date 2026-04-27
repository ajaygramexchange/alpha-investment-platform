import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2, Lock, Loader2 } from 'lucide-react';
import axios from 'axios';

const WithdrawalModal = ({ isOpen, onClose, balance, activePlan, user }) => {
  const [loading, setLoading] = useState(false);

  // Logic: Set threshold based on plan name
  const thresholds = {
    'Starter': 500,
    'Premium': 2500,
    'Executive': 10000
  };

  const minAmount = thresholds[activePlan] || 500;
  const canWithdraw = balance >= minAmount;

  // --- STEP 2: CONNECT FRONTEND TO BACKEND ---
  const handleWithdrawalRequest = async () => {
    if (!canWithdraw) return;

    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/withdraw-request', {
        userId: user.id,
        amount: balance, // Sending the full balance for withdrawal
        fullName: user.fullName
      });
      
      if (res.data.success) {
        alert("Withdrawal request sent! Our admin team will review it shortly.");
        onClose(); 
      }
    } catch (err) {
      console.error("Withdrawal failed", err);
      const errorMsg = err.response?.data?.error || "Error sending request. Please try again.";
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-[#111827] w-full max-w-md rounded-[2.5rem] border border-white/10 p-8 relative"
          >
            <button 
              onClick={onClose} 
              className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"
            >
              ✕
            </button>
            
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white">Withdraw Funds</h2>
              <p className="text-gray-400 text-sm">Transfer profits to your external wallet</p>
            </div>

            {/* Threshold Progress Card */}
            <div className="bg-white/5 rounded-2xl p-6 border border-white/5 mb-6">
              <div className="flex justify-between items-end mb-2">
                <span className="text-xs text-gray-400 uppercase font-bold tracking-widest">Progress</span>
                <span className="text-sm font-bold text-blue-400">
                  ${balance.toLocaleString()} / ${minAmount.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${canWithdraw ? 'bg-green-500' : 'bg-blue-600'}`}
                  style={{ width: `${Math.min((balance / minAmount) * 100, 100)}%` }}
                />
              </div>
            </div>

            {!canWithdraw ? (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-6 flex gap-3 items-start">
                <Lock className="text-red-500 shrink-0" size={20} />
                <p className="text-red-200 text-xs leading-relaxed">
                  <strong>Withdrawal Locked:</strong> Your current plan ({activePlan}) requires a minimum balance of <strong>${minAmount.toLocaleString()}</strong> before payout.
                </p>
              </div>
            ) : (
              <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 mb-6 flex gap-3 items-start">
                <CheckCircle2 className="text-green-500 shrink-0" size={20} />
                <p className="text-green-200 text-xs leading-relaxed">
                  Threshold reached! You can now request a withdrawal to your registered wallet.
                </p>
              </div>
            )}

            <button 
              disabled={!canWithdraw || loading}
              onClick={handleWithdrawalRequest}
              className={`w-full py-4 rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${
                canWithdraw 
                  ? 'bg-white text-black hover:bg-gray-200 active:scale-95' 
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Processing...
                </>
              ) : (
                'Request Payout'
              )}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default WithdrawalModal;
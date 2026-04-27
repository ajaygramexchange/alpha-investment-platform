import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Shield, Crown, CheckCircle2, Loader2 } from 'lucide-react';
import axios from 'axios';

const plans = [
  {
    name: 'Starter Node',
    icon: Shield,
    roi: 1.5,
    min: 100,
    days: 7,
    color: 'from-blue-500 to-cyan-400'
  },
  {
    name: 'Pro Miner',
    icon: Zap,
    roi: 2.5,
    min: 1000,
    days: 14,
    color: 'from-purple-600 to-pink-500'
  },
  {
    name: 'Whale Vault',
    icon: Crown,
    roi: 4.0,
    min: 5000,
    days: 30,
    color: 'from-amber-400 to-orange-600'
  }
];

const InvestmentPlans = ({ userId, onInvestSuccess }) => {
  // --- Loading State to prevent double clicks ---
  const [loadingPlan, setLoadingPlan] = useState(null);

  const handleInvest = async (plan) => {
    setLoadingPlan(plan.name);
    try {
      await axios.post('http://localhost:5000/invest', {
        userId,
        planName: plan.name,
        amount: plan.min,
        dailyRoi: plan.roi,
        durationDays: plan.days
      });
      
      alert(`Success! You've joined the ${plan.name}`);
      
      // Trigger the soft refresh in Dashboard.jsx
      if (onInvestSuccess) {
        onInvestSuccess();
      }
    } catch (err) {
      alert(err.response?.data?.error || "Investment failed");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="py-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -10 }}
            className="bg-[#161f33] rounded-[2.5rem] p-8 border border-white/5 relative overflow-hidden group"
          >
            {/* Background Glow */}
            <div className={`absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br ${plan.color} opacity-10 blur-[60px] group-hover:opacity-20 transition-opacity`} />
            
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-6 shadow-lg shadow-blue-500/10`}>
              <plan.icon className="text-white" size={28} />
            </div>

            <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-black text-white">{plan.roi}%</span>
              <span className="text-gray-500 font-medium">/ daily</span>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-3 text-sm text-gray-400">
                <CheckCircle2 size={18} className="text-blue-500" />
                Min Deposit: ${plan.min.toLocaleString()}
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-400">
                <CheckCircle2 size={18} className="text-blue-500" />
                Duration: {plan.days} Days
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-400">
                <CheckCircle2 size={18} className="text-blue-500" />
                Full Capital Insurance
              </li>
            </ul>

            <motion.button
              whileTap={{ scale: 0.95 }}
              disabled={loadingPlan !== null}
              onClick={() => handleInvest(plan)}
              className={`w-full py-4 rounded-2xl font-bold text-white bg-gradient-to-r ${plan.color} shadow-xl transition-all flex items-center justify-center gap-2 ${loadingPlan ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loadingPlan === plan.name ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Processing...
                </>
              ) : (
                'Choose Plan'
              )}
            </motion.button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default InvestmentPlans;
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, TrendingUp } from 'lucide-react';

const ROICalculator = () => {
  const [amount, setAmount] = useState(1000);
  const [days, setDays] = useState(30);
  const dailyRate = 0.025; // 2.5%

  const profit = amount * dailyRate * days;
  const total = parseFloat(amount) + profit;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#161f33] rounded-[2.5rem] p-8 border border-white/5 mb-10 shadow-2xl"
    >
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-blue-600/20 text-blue-500 rounded-2xl">
          <Calculator size={24} />
        </div>
        <h3 className="text-xl font-bold">Profit Forecaster</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-6">
          <div>
            <label className="text-sm text-gray-500 mb-2 block font-medium">Investment Amount ($)</label>
            <input 
              type="range" min="100" max="50000" step="100" 
              value={amount} onChange={(e) => setAmount(e.target.value)}
              className="w-full h-2 bg-blue-900/30 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="text-2xl font-black mt-2">${Number(amount).toLocaleString()}</div>
          </div>
          <div>
            <label className="text-sm text-gray-500 mb-2 block font-medium">Duration (Days)</label>
            <input 
              type="range" min="7" max="365" step="1" 
              value={days} onChange={(e) => setDays(e.target.value)}
              className="w-full h-2 bg-blue-900/30 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="text-2xl font-black mt-2">{days} Days</div>
          </div>
        </div>

        <div className="bg-black/20 rounded-[2rem] p-6 border border-white/5 flex flex-col justify-center">
          <div className="text-sm text-gray-500 mb-1">Estimated Total Return</div>
          <div className="text-4xl font-black text-green-400 mb-4">${total.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
          <div className="flex items-center gap-2 text-sm text-green-400/80 bg-green-400/5 p-3 rounded-xl border border-green-400/10">
            <TrendingUp size={16} />
            <span>Net Profit: +${profit.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ROICalculator;
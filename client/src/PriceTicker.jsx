import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

const PriceTicker = () => {
  const [prices, setPrices] = useState([]);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const { data } = await axios.get(
          'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&sparkline=false'
        );
        setPrices(data);
      } catch (err) {
        console.error("Price fetch failed", err);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-blue-600/10 border-b border-white/5 py-3 overflow-hidden whitespace-nowrap relative">
      <motion.div 
        animate={{ x: [0, -1000] }}
        transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
        className="flex gap-12 items-center inline-block"
      >
        {[...prices, ...prices].map((coin, i) => (
          <div key={i} className="flex items-center gap-3">
            <img src={coin.image} alt={coin.name} className="w-5 h-5 rounded-full" />
            <span className="font-bold uppercase text-xs tracking-wider">{coin.symbol}</span>
            <span className="font-mono text-sm">${coin.current_price.toLocaleString()}</span>
            <span className={`text-[10px] flex items-center font-bold ${coin.price_change_percentage_24h > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {coin.price_change_percentage_24h > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default PriceTicker;
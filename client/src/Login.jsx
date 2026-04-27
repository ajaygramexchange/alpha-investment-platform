import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Mail, ArrowRight } from 'lucide-react';
import axios from 'axios';

const Login = ({ switchToRegister, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
  e.preventDefault();
  try {
    const res = await axios.post('http://localhost:5000/auth/login', { email, password });
    // Instead of an alert, we set the user and go to the dashboard!
    localStorage.setItem('token', res.data.token);
    onLoginSuccess(res.data.user); // This calls the function in App.jsx
  } catch (err) {
    alert("Login Failed: " + (err.response?.data?.error || "Invalid Credentials"));
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0f1d] p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8 bg-[#161f33] p-10 rounded-3xl border border-white/5 shadow-2xl"
      >
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white">Welcome Back</h2>
          <p className="mt-2 text-sm text-gray-400">Secure access to your portfolio</p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-500" />
              <input
                type="email"
                placeholder="Email address"
                className="w-full pl-11 pr-4 py-3 bg-[#0a0f1d] border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-white"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-500" />
              <input
                type="password"
                placeholder="Password"
                className="w-full pl-11 pr-4 py-3 bg-[#0a0f1d] border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-white"
                onChange={(e) => setEmail(e.target.value)} // Fix: change to setPassword
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-lg shadow-blue-500/20"
          >
            Sign in
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </form>
        <p className="text-center mt-6 text-gray-400 text-sm">
           Don't have an account?{' '}
           <button onClick={switchToRegister} className="text-blue-500 font-semibold hover:underline">Register</button>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
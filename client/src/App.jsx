import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';
import Dashboard from './Dashboard';
import AdminPanel from './AdminPanel'; // <--- Ensure this is imported

function App() {
  const [user, setUser] = useState(null);
  const [isLogin, setIsLogin] = useState(true);
  const [isAdminView, setIsAdminView] = useState(false); // <--- Add this state

  // 1. Show Admin Panel if the toggle is active
  if (user && isAdminView) {
    return <AdminPanel backToDash={() => setIsAdminView(false)} />;
  }

  // 2. Show Dashboard if user is logged in
  if (user) {
    return (
      <Dashboard 
        user={user} 
        logout={() => setUser(null)} 
        openAdmin={() => setIsAdminView(true)} // <--- Pass the function here
      />
    );
  }

  return (
    <div className="antialiased">
      {isLogin ? (
        <Login 
          switchToRegister={() => setIsLogin(false)} 
          onLoginSuccess={(userData) => setUser(userData)} 
        />
      ) : (
        <Register switchToLogin={() => setIsLogin(true)} />
      )}
    </div>
  );
}

export default App;
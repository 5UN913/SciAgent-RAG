import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function Navigation() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-brand">
          <h1>SciAgent-RAG</h1>
        </div>
        <div className="nav-links">
          <Link 
            to="/" 
            className={`nav-link ${isActive('/') ? 'active' : ''}`}
          >
            仿真平台
          </Link>
          <Link 
            to="/rag-manager" 
            className={`nav-link ${isActive('/rag-manager') ? 'active' : ''}`}
          >
            RAG 管理
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;

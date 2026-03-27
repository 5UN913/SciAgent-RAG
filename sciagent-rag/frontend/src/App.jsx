import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './Navigation';
import RAGManager from './RAGManager';
import SimulationPage from './pages/SimulationPage';
import { SimulationProvider } from './context/SimulationContext';

function App() {
  return (
    <Router>
      <div className="app">
        <Navigation />
        <Routes>
          <Route
            path="/"
            element={
              <SimulationProvider>
                <SimulationPage />
              </SimulationProvider>
            }
          />
          <Route path="/rag-manager" element={<RAGManager />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

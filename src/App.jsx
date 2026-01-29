import React from 'react';
import { BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import LoginPage from './Components/LoginPage';
import Dashboard from './Components/DashBoard';
import "./index.css";
const App = () => {
  return (
    <Router>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/dashboard" element={<Dashboard />} /> 
        </Routes>
      
    </Router>
  );
};

export default App;


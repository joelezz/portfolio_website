// App.jsx

import './App.css'
import { Routes, Route } from "react-router-dom";
import Layout from './pages/Layout'
import Home from './pages/Home';
import Work from './pages/Work';
import Contact from "./pages/Contact";
import  Dashboard  from './pages/Dashboard';
import NoPage from "./pages/NoPage";
import ThreeBackground  from './components/ThreeBackground';

function App() {

  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="work" element={<Work />} />
          <Route path="contact" element={<Contact />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="*" element={<NoPage />} />
        </Route>
      </Routes>
      <ThreeBackground />

    </>
  )
}

export default App

import './App.css'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from './pages/Layout'
import Home from './pages/Home';
import Work from './pages/Work';
import Contact from "./pages/Contact";
import NoPage from "./pages/NoPage";


function App() {

  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="work" element={<Work />} />
          <Route path="contact" element={<Contact />} />
          <Route path="*" element={<NoPage />} />
        </Route>
      </Routes>
    </>
  )
}

export default App

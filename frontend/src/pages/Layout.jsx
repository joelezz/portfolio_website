import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const Layout = () => {
  return (
    <>
        <div className="container">
        <Navbar />
        <main className="main-content-area">
        <Outlet /> {/* Renders the content of the current route */}
        </main>
        <Footer />
        </div>
    </>
  )
};

export default Layout;
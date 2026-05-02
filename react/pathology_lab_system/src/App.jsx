import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Home from "./pages/Home";
import DoctorPage from "./pages/DoctorPage";
import TestPage from "./pages/TestPage";

export default function App() {
  const [page, setPage] = useState("home");

  return (
    <div>
      <Sidebar setPage={setPage} />

      {page === "home" && <Home />}
      {page === "doctor" && <DoctorPage />}
      {page === "test" && <TestPage />}
      
    </div>
  );
}
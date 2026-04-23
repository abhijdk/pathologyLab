import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Home from "./pages/Home";
import DoctorPage from "./pages/DoctorPage";

export default function App() {
  const [page, setPage] = useState("home");

  return (
    <div>
      <Sidebar setPage={setPage} />

      {page === "home" && <Home />}
      {page === "doctor" && <DoctorPage />}
    </div>
  );
}
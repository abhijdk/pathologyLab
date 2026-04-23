import { useEffect, useState } from "react";
import axios from "axios";

const API = "http://localhost:8080/api/doctors";

export default function DoctorPage() {
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [percentage, setPercentage] = useState("");

  // ================= LOAD DOCTORS =================
  const loadDoctors = async () => {
    const res = await axios.get(API);
    setDoctors(res.data);
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  // ================= ADD DOCTOR =================
  const addDoctor = async () => {
    if (!name || !percentage) return;

    await axios.post(API, {
      name,
      commissionPercentage: Number(percentage),
      totalCommission: 0,
      receivedCommission: 0,
    });

    setName("");
    setPercentage("");
    setShowModal(false);
    loadDoctors();
  };

  // ================= EDIT DOCTOR =================
  const editDoctor = async (d) => {
    const newName = prompt("Doctor Name", d.name);
    const newPercent = prompt("Commission %", d.commissionPercentage);

    if (!newName || !newPercent) return;

    await axios.put(`${API}/${d.doctorId}`, {
      ...d,
      name: newName,
      commissionPercentage: Number(newPercent),
    });

    loadDoctors();
  };

  // ================= PAY DOCTOR (MAIN FIX) =================
  const payDoctor = async (d) => {
    const pay = Number(prompt("Enter payment amount"));

    if (!pay || pay <= 0) return;

    await axios.put(`${API}/${d.doctorId}`, {
      ...d,
      receivedCommission: Number(d.receivedCommission) + pay,
    });

    loadDoctors();
  };

  // ================= DELETE =================
  const deleteDoctor = async (id) => {
    if (window.confirm("Delete doctor?")) {
      await axios.delete(`${API}/${id}`);
      loadDoctors();
    }
  };

  // ================= SEARCH =================
  const filtered = doctors.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container-fluid" style={{ marginLeft: "240px" }}>

      {/* HEADER */}
      <h3 className="mt-3 fw-bold">🧑‍⚕️ Doctor Management</h3>

      {/* SEARCH + ADD */}
      <div className="d-flex align-items-center gap-3 my-3">

        <input
          className="form-control w-25"
          placeholder="Search doctor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button
          className="btn btn-outline-secondary"
          onClick={() => setSearch("")}
        >
          Clear
        </button>

        <div className="ms-auto">
          <button
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
          >
            + Add Doctor
          </button>
        </div>

      </div>

      {/* TABLE */}
      <div className="card shadow-sm">

        <table className="table table-hover table-bordered mb-0">

          <thead className="table-dark">
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>%</th>
              <th>Total</th>
              <th>Received</th>
              <th>Pending</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((d, i) => {

              const pending =
                Number(d.totalCommission) -
                Number(d.receivedCommission);

              return (
                <tr key={d.doctorId}>
                  <td>{i + 1}</td>
                  <td>{d.name}</td>
                  <td>{d.commissionPercentage}%</td>

                  <td>₹ {d.totalCommission}</td>

                  <td className="text-success">
                    ₹ {d.receivedCommission}
                  </td>

                  <td className="text-danger fw-bold">
                    ₹ {pending}
                  </td>

                  <td>
                    <button
                      className="btn btn-sm btn-warning me-1"
                      onClick={() => editDoctor(d)}
                    >
                      Edit
                    </button>

                    <button
                      className="btn btn-sm btn-success me-1"
                      onClick={() => payDoctor(d)}
                    >
                      Pay
                    </button>

                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => deleteDoctor(d.doctorId)}
                    >
                      Delete
                    </button>
                  </td>

                </tr>
              );
            })}
          </tbody>

        </table>

      </div>

      {/* MODAL */}
      {showModal && (
        <div className="modal d-block" style={{ background: "#00000088" }}>
          <div className="modal-dialog">

            <div className="modal-content">

              <div className="modal-header">
                <h5>Add Doctor</h5>
                <button
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                />
              </div>

              <div className="modal-body">

                <input
                  className="form-control mb-2"
                  placeholder="Doctor Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />

                <input
                  className="form-control"
                  placeholder="Commission %"
                  type="number"
                  value={percentage}
                  onChange={(e) => setPercentage(e.target.value)}
                />

              </div>

              <div className="modal-footer">

                <button
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>

                <button
                  className="btn btn-primary"
                  onClick={addDoctor}
                >
                  Save
                </button>

              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
import { useEffect, useState } from "react";
import axios from "axios";
import Confetti from "react-confetti";

const API = "http://localhost:8080/api/patients";

export default function PatientPage() {

  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState("");

  const loadPatients = async () => {
    const res = await axios.get(API);
    setPatients(res.data);
  };

  useEffect(() => {
    loadPatients();
  }, []);

  // 🔍 AUTO SEARCH
  const filtered = patients.filter((p) =>
    (p.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.phone || "").includes(search)
  );

  // ➕ ADD PATIENT
  const addPatient = async () => {
    if (!name) return;

    await axios.post(API, { name, age, gender, phone });

    setName("");
    setAge("");
    setGender("");
    setPhone("");
    setShowModal(false);

    loadPatients();

    // 🎉 FLOWER RAIN
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  // ✏️ EDIT
  const editPatient = async (p) => {
    const newName = prompt("Name", p.name);
    const newAge = prompt("Age", p.age);
    const newGender = prompt("Gender", p.gender);
    const newPhone = prompt("Phone", p.phone);

    if (!newName) return;

    await axios.put(`${API}/${p.patientId}`, {
      name: newName,
      age: newAge,
      gender: newGender,
      phone: newPhone
    });

    loadPatients();
  };

  // ❌ DELETE
  const deletePatient = async (id) => {
    if (window.confirm("Delete patient?")) {
      await axios.delete(`${API}/${id}`);
      loadPatients();
    }
  };

  return (
    <div className="container-fluid" style={{ marginLeft: "240px" }}>

      {/* 🎉 CONFETTI */}
      {showConfetti && <Confetti numberOfPieces={300} />}

      <h3 className="mt-3 fw-bold">🧑 Patient Management</h3>

      {/* 🔍 SEARCH */}
      <div className="d-flex gap-3 my-3">

        <input
          className="form-control w-25"
          placeholder="Search by Name or Mobile..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
&nbsp;&nbsp;&nbsp;&nbsp;
        <button
          className="btn btn-success ms-auto"
          onClick={() => setShowModal(true)}
        >
          + Add New Patient
        </button>

      </div>

      {/* 📊 TABLE */}
      <div className="card shadow-sm">

        <table className="table table-hover table-bordered mb-0 text-center">

          <thead className="table-dark">
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Age</th>
              <th>Gender</th>
              <th>Phone</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((p, i) => {

              const rowStyle = {
                backgroundColor:
                  p.gender === "Male"
                    ? "#d1ecf1"
                    : p.gender === "Female"
                    ? "#f8d7da"
                    : "#fff3cd"
              };

              return (
                <tr key={p.patientId} style={rowStyle}>

                  <td>{i + 1}</td>

                  <td style={{ fontWeight: "bold", color: "#0d6efd" }}>
                    {p.name}
                  </td>

                  <td>{p.age}</td>

                  <td style={{
                    fontWeight: "bold",
                    color: p.gender === "Male" ? "blue" : "deeppink"
                  }}>
                    {p.gender}
                  </td>

                  <td>{p.phone}</td>

                  <td>
                    <button
                      className="btn btn-sm btn-warning me-1"
                      onClick={() => editPatient(p)}
                    >
                      Edit
                    </button>

                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => deletePatient(p.patientId)}
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

      {/* 🧾 MODAL */}
      {showModal && (
        <div className="modal d-block" style={{ background: "#00000088" }}>
          <div className="modal-dialog">
            <div className="modal-content">

              <div className="modal-header">
                <h5>Add New Patient</h5>
                <button className="btn-close" onClick={() => setShowModal(false)} />
              </div>

              <div className="modal-body">

                <input
                  className="form-control mb-2"
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />

                <input
                  className="form-control mb-2"
                  placeholder="Age"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />

                <select
                  className="form-control mb-2"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="">Gender</option>
                  <option>Male</option>
                  <option>Female</option>
                </select>

                <input
                  className="form-control"
                  placeholder="Phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
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
                  onClick={addPatient}
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
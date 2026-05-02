import { useEffect, useState } from "react";
import axios from "axios";

const API = "http://localhost:8080/api/tests";

export default function TestPage() {

  const [tests, setTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [parameters, setParameters] = useState([]);

  const [catName, setCatName] = useState("");

  const [paramName, setParamName] = useState("");
  const [unit, setUnit] = useState("");
  const [maleMin, setMaleMin] = useState("");
  const [maleMax, setMaleMax] = useState("");
  const [femaleMin, setFemaleMin] = useState("");
  const [femaleMax, setFemaleMax] = useState("");

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    const res = await axios.get(API);
    setTests(res.data);
  };

  const loadCategories = async (test) => {
    const res = await axios.get(`${API}/category/${test.testId}`);
    setCategories(res.data);
    setSelectedTest(test);
    setSelectedCategory(null);
    setParameters([]);
  };

  const loadParameters = async (category) => {
    const res = await axios.get(`${API}/parameter/${category.categoryId}`);
    setParameters(res.data);
    setSelectedCategory(category);
  };

  const addCategory = async () => {
    if (!catName || !selectedTest) return;

    await axios.post(`${API}/category`, {
      categoryName: catName,
      displayOrder: categories.length + 1,
      isActive: 1,
      testMaster: { testId: selectedTest.testId }
    });

    setCatName("");
    loadCategories(selectedTest);
  };

  const addParameter = async () => {
    if (!paramName || !selectedCategory) return;

    await axios.post(`${API}/parameter`, {
      paramName,
      unit,
      refMaleMin: maleMin,
      refMaleMax: maleMax,
      refFemaleMin: femaleMin,
      refFemaleMax: femaleMax,
      displayOrder: 1,
      isActive: 1,
      testCategory: { categoryId: selectedCategory.categoryId }
    });

    setParamName("");
    setUnit("");
    setMaleMin("");
    setMaleMax("");
    setFemaleMin("");
    setFemaleMax("");

    loadParameters(selectedCategory);
  };

  return (
    <div style={{ marginLeft: "240px", padding: "20px", background: "#f4f6f9", minHeight: "100vh" }}>

      <h2>🧪 Test Management</h2>

      {/* ================= TEST ================= */}
      <div style={styles.card}>
        <h5>Tests</h5>

        <div style={styles.flex}>
          {tests.map(t => (
            <button
              key={t.testId}
              onClick={() => loadCategories(t)}
              style={{
                ...styles.testBtn,
                background: selectedTest?.testId === t.testId ? "#0b5ed7" : "#0d6efd"
              }}
            >
              {t.testName}
            </button>
          ))}
        </div>
      </div>

      {/* ================= CATEGORY ================= */}
      {selectedTest && (
        <div style={styles.card}>

          <h5>Categories of: <span style={{color:"#0d6efd"}}>{selectedTest.testName}</span></h5>

          <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
            <input
              style={styles.input}
              placeholder="New Category"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
            />
            <button style={styles.addBtn} onClick={addCategory}>Add</button>
          </div>

          <div style={styles.flex}>
            {categories.map(c => (
              <button
                key={c.categoryId}
                onClick={() => loadParameters(c)}
                style={{
                  ...styles.catBtn,
                  background: selectedCategory?.categoryId === c.categoryId ? "#495057" : "#6c757d"
                }}
              >
                {c.categoryName}
              </button>
            ))}
          </div>

        </div>
      )}

      {/* ================= PARAMETER ================= */}
      {selectedCategory && (
        <div style={styles.card}>

          <h5>
            Parameters of: 
            <span style={{color:"#0d6efd"}}> {selectedCategory.categoryName}</span>
          </h5>

          <div style={styles.flex}>
            <input style={styles.input} placeholder="Name" value={paramName} onChange={e => setParamName(e.target.value)} />
            <input style={styles.input} placeholder="Unit" value={unit} onChange={e => setUnit(e.target.value)} />
            <input style={styles.input} placeholder="Male Min" value={maleMin} onChange={e => setMaleMin(e.target.value)} />
            <input style={styles.input} placeholder="Male Max" value={maleMax} onChange={e => setMaleMax(e.target.value)} />
            <input style={styles.input} placeholder="Female Min" value={femaleMin} onChange={e => setFemaleMin(e.target.value)} />
            <input style={styles.input} placeholder="Female Max" value={femaleMax} onChange={e => setFemaleMax(e.target.value)} />
            <button style={styles.addBtn} onClick={addParameter}>Add</button>
          </div>

          <table className="table mt-3 text-center" style={{ background: "white" }}>
            <thead style={{ background: "#212529", color: "white" }}>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Unit</th>
                <th>Male</th>
                <th>Female</th>
              </tr>
            </thead>

            <tbody>
              {parameters.map((p, i) => (
                <tr key={p.paramId}>
                  <td>{i + 1}</td>
                  <td style={{ fontWeight: "bold", color: "#0d6efd" }}>{p.paramName}</td>
                  <td>{p.unit || "-"}</td>
                  <td>{p.refMaleMin} - {p.refMaleMax}</td>
                  <td>{p.refFemaleMin} - {p.refFemaleMax}</td>
                </tr>
              ))}
            </tbody>
          </table>

        </div>
      )}

    </div>
  );
}

const styles = {
  card: {
    background: "white",
    padding: "20px",
    borderRadius: "10px",
    marginBottom: "20px",
    boxShadow: "0 3px 10px rgba(0,0,0,0.1)"
  },
  flex: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap"
  },
  input: {
    padding: "8px",
    border: "1px solid #ccc",
    borderRadius: "6px"
  },
  testBtn: {
    color: "white",
    border: "none",
    padding: "10px 15px",
    borderRadius: "8px",
    cursor: "pointer"
  },
  catBtn: {
    color: "white",
    border: "none",
    padding: "8px 14px",
    borderRadius: "8px",
    cursor: "pointer"
  },
  addBtn: {
    background: "#198754",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: "6px",
    cursor: "pointer"
  }
};
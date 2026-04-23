export default function Sidebar({ setPage }) {
  return (
    <div style={styles.sidebar}>
      <h2>Menu</h2>

      <button style={styles.btn} onClick={() => setPage("home")}>
        Home
      </button>

      <button style={styles.btn} onClick={() => setPage("doctor")}>
        Doctor
      </button>
    </div>
  );
}

const styles = {
  sidebar: {
    width: "200px",
    height: "100vh",
    background: "#222",
    color: "white",
    padding: "10px",
    position: "fixed"
  },
  btn: {
    width: "100%",
    padding: "10px",
    marginTop: "10px",
    background: "#444",
    color: "white",
    border: "none",
    cursor: "pointer"
  }
};
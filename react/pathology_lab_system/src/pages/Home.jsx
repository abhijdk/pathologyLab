export default function Home() {
  return (
    <div style={styles.container}>
      <h1>🏥 Pathology Lab System</h1>
      <h2 style={styles.text}>UNDER MAINTENANCE !!!</h2>
    </div>
  );
}

const styles = {
  container: {
    marginLeft: "220px",
    display: "flex",
    height: "100vh",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "column"
  },
  text: {
    color: "red",
    fontSize: "30px"
  }
};
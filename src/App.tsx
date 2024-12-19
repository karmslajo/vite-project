import "./App.css";

function App() {
  const handleClick = () =>
    (window.location.href =
      "gumpapp://pia.gump-staging.net/album/alex/20241118kawagoe");

  return <button onClick={handleClick}>Go to App</button>;
}

export default App;

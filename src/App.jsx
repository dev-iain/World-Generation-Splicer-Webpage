import { useEffect, useState } from "react";
import ShellMessage from "./components/ShellMessage";
import Viewer from "./Viewer";
import { loadAppData } from "./lib/state";

export default function App() {
  const [state, setState] = useState({ data: null, loading: true, error: null });

  useEffect(() => {
    let alive = true;
    loadAppData()
      .then((data) => {
        if (!alive) return;
        if (!data) {
          window.location.replace("index.html");
          return;
        }
        setState({ data, loading: false, error: null });
      })
      .catch((e) => {
        if (alive) setState({ data: null, loading: false, error: e.message });
      });
    return () => { alive = false; };
  }, []);

  if (state.loading) return <ShellMessage title="Loading stats" text="Fetching ore data..." />;
  if (state.error)   return <ShellMessage title="Could not open stats" text={state.error} showButton={true} />;
  return <Viewer data={state.data} />;
}

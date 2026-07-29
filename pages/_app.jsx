import "../styles/globals.css";
import { AppStateProvider } from "../lib/state";

export default function App({ Component, pageProps }) {
  return (
    <AppStateProvider>
      <Component {...pageProps} />
    </AppStateProvider>
  );
}

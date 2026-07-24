// src/pages/_app.jsx
import "../styles/globals.css";
import { SessionProvider } from "../lib/context/SessionContext";

export default function App({ Component, pageProps }) {
  return (
    <SessionProvider>
      <Component {...pageProps} />
    </SessionProvider>
  );
}
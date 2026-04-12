import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  // Lock to a single professional theme to keep UI consistent.
  const [theme] = useState("dark");
  useEffect(() => {
    localStorage.removeItem("theme");
  }, []);

  // Kept for backward compatibility; UI no longer exposes a toggle.
  const toggleTheme = () => {};

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);

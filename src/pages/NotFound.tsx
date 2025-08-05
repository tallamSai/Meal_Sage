import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary pt-32">
      <div className="glass p-12 rounded-2xl shadow-glass text-center">
        <h1 className="text-4xl font-bold mb-4 text-primary-foreground">404</h1>
        <p className="text-xl text-primary-foreground mb-4">Oops! Page not found</p>
        <a href="/" className="text-accent-foreground hover:text-accent underline">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;

import { Lock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

/** Renders children for signed-in customers, otherwise a sign-in prompt. */
const RequireLogin = ({ message = "Please sign in to continue", children }) => {
  const { isLoggedIn, isLoading, openLoginModal } = useAuth();

  if (isLoading) {
    return <div className="py-24 text-center text-muted-foreground">Loading...</div>;
  }
  if (isLoggedIn) return children;

  return (
    <div className="max-w-md mx-auto text-center bg-card border border-border rounded-2xl card-shadow p-10">
      <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-secondary flex items-center justify-center">
        <Lock className="w-6 h-6 text-primary" />
      </div>
      <h2 className="text-3xl font-display mb-2">SIGN IN REQUIRED</h2>
      <p className="text-muted-foreground mb-6">{message}</p>
      <button
        onClick={openLoginModal}
        className="gradient-neon text-primary-foreground px-8 py-3 font-semibold uppercase tracking-wide rounded-full neon-glow"
      >
        Sign In
      </button>
    </div>
  );
};

export default RequireLogin;

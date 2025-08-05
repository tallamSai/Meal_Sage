import { useState } from 'react';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate('/results');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/results');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <form onSubmit={handleAuth} className="glass border border-white/20 dark:border-blue-200/10 bg-white/80 dark:bg-blue-900/60 backdrop-blur-lg p-8 rounded-2xl shadow-2xl w-full max-w-md flex flex-col gap-6">
        <h2 className="text-2xl font-bold text-center mb-2 text-foreground">{isSignUp ? 'Sign Up' : 'Sign In'}</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="border border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground placeholder:text-muted-foreground"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="border border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground placeholder:text-muted-foreground"
          required
        />
        {error && <div className="text-red-500 text-sm text-center">{error}</div>}
        <button
          type="submit"
          className="bg-primary text-primary-foreground rounded-lg py-2 font-semibold hover:bg-primary/90 transition shadow"
          disabled={loading}
        >
          {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
        </button>
        <button
          type="button"
          onClick={handleGoogle}
          className="bg-white dark:bg-blue-800 border border-primary text-primary dark:text-white rounded-lg py-2 font-semibold flex items-center justify-center gap-2 hover:bg-primary/10 dark:hover:bg-blue-700 transition shadow"
          disabled={loading}
        >
          <svg width="20" height="20" viewBox="0 0 48 48"><g><path fill="#4285F4" d="M43.6 20.5H42V20H24v8h11.3C34.7 32.1 29.9 35 24 35c-6.1 0-11.3-4.1-13.1-9.6c-0.4-1.1-0.6-2.3-0.6-3.4s0.2-2.3 0.6-3.4C12.7 12.1 17.9 8 24 8c3.1 0 6 1.1 8.2 2.9l6.2-6.2C34.6 1.7 29.6 0 24 0C14.8 0 6.7 5.8 2.7 14.1C1 17.3 0 20.6 0 24s1 6.7 2.7 9.9C6.7 42.2 14.8 48 24 48c5.6 0 10.6-1.7 14.6-4.7c4.2-3.2 7.1-8 7.9-13.3c0.1-0.7 0.2-1.3 0.2-2C48 23.1 46.1 21.2 43.6 20.5z"/><path fill="#34A853" d="M6.3 14.7l6.6 4.8C14.7 16.1 19 13 24 13c3.1 0 6 1.1 8.2 2.9l6.2-6.2C34.6 1.7 29.6 0 24 0C14.8 0 6.7 5.8 2.7 14.1C1 17.3 0 20.6 0 24s1 6.7 2.7 9.9C6.7 42.2 14.8 48 24 48c5.6 0 10.6-1.7 14.6-4.7c4.2-3.2 7.1-8 7.9-13.3c0.1-0.7 0.2-1.3 0.2-2C48 23.1 46.1 21.2 43.6 20.5z"/><path fill="#FBBC05" d="M24 48c6.5 0 12-2.1 16-5.7l-7.6-6.2C29.9 35 24 35 18.7 32.1l-6.6 4.8C10.7 42.2 17.8 48 24 48z"/><path fill="#EA4335" d="M43.6 20.5H42V20H24v8h11.3C34.7 32.1 29.9 35 24 35c-6.1 0-11.3-4.1-13.1-9.6c-0.4-1.1-0.6-2.3-0.6-3.4s0.2-2.3 0.6-3.4C12.7 12.1 17.9 8 24 8c3.1 0 6 1.1 8.2 2.9l6.2-6.2C34.6 1.7 29.6 0 24 0C14.8 0 6.7 5.8 2.7 14.1C1 17.3 0 20.6 0 24s1 6.7 2.7 9.9C6.7 42.2 14.8 48 24 48c5.6 0 10.6-1.7 14.6-4.7c4.2-3.2 7.1-8 7.9-13.3c0.1-0.7 0.2-1.3 0.2-2C48 23.1 46.1 21.2 43.6 20.5z"/></g></svg>
          Sign in with Google
        </button>
        <div className="text-center text-sm mt-2 text-foreground">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button type="button" className="text-primary underline" onClick={() => setIsSignUp(!isSignUp)}>
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Auth; 
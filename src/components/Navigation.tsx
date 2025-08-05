import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Camera, Home, BarChart3, Menu, X, UserCircle, LogOut, LogIn, Mail, UserPlus, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { auth, googleProvider } from '@/lib/firebase';
import { onAuthStateChanged, signOut, signInWithPopup } from 'firebase/auth';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

const useTheme = () => {
  const [theme, setTheme] = useState(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved) setTheme(saved);
  }, []);

  return { theme, setTheme };
};

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/analyze', label: 'Analyze', icon: Camera },
    { path: '/results', label: 'Results', icon: BarChart3 },
    { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  ];

  return (
    <nav
      className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-white/60 dark:bg-blue-900/60 backdrop-blur-lg border border-white/30 dark:border-blue-300/20 shadow-2xl rounded-full px-20 py-2 w-auto max-w-6xl mx-auto mb-6 transition-all duration-500 overflow-hidden"
    >
      <div className="flex items-center justify-between w-full gap-8">
        {/* Left: Logo + Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-700 rounded-2xl flex items-center justify-center">
            <span className="font-bold text-xl text-white">M</span>
          </div>
          <span className="font-bold text-2xl text-blue-700 group-hover:text-primary transition-colors duration-300">MealSage</span>
        </div>
        {/* Right: Nav Links + Theme Switcher + Auth */}
        <div className="flex items-center space-x-8">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-2 text-lg px-5 py-2 rounded-full transition-all duration-200 hover:scale-105 hover:brightness-110 ${
                  isActive
                    ? 'bg-primary/10 text-primary font-semibold shadow-sm'
                    : 'text-muted-foreground hover:text-primary'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <div className="flex items-center space-x-4">
            <span className="text-xs text-muted-foreground">🌞</span>
            <Switch
              checked={theme === 'dark'}
              onCheckedChange={checked => setTheme(checked ? 'dark' : 'light')}
              aria-label="Toggle dark mode"
            />
            <span className="text-xs text-muted-foreground">🌙</span>
            {/* User Dropdown - compact and inside capsule */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full bg-blue-100 dark:bg-blue-800 p-1.5 hover:ring-2 ring-primary transition flex items-center">
                  {user ? (
                    <User className="w-5 h-5 text-blue-700 dark:text-blue-200" />
                  ) : (
                    <UserCircle className="w-5 h-5 text-blue-400 dark:text-blue-200" />
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[220px] bg-white/80 dark:bg-blue-900/80 backdrop-blur-xl border border-blue-200/30 dark:border-blue-700/30 shadow-xl rounded-xl p-2">
                {user ? (
                  <>
                    <DropdownMenuLabel className="flex items-center gap-3 py-2">
                      {/* Avatar or initial with image fallback */}
                      {user.photoURL ? (
                        <>
                          <img
                            src={user.photoURL}
                            alt="avatar"
                            className="w-8 h-8 rounded-full border border-blue-300 shadow"
                            onError={e => {
                              (e.currentTarget as HTMLElement).style.display = 'none';
                              const fallback = e.currentTarget.nextElementSibling;
                              if (fallback) (fallback as HTMLElement).style.display = 'flex';
                            }}
                          />
                          <div
                            className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow"
                            style={{ display: 'none' }}
                          >
                            {(user.displayName || user.email || '?')[0].toUpperCase()}
                          </div>
                        </>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow">
                          {(user.displayName || user.email || '?')[0].toUpperCase()}
                        </div>
                      )}
                      <span className="font-semibold text-blue-900 dark:text-blue-100 truncate max-w-[120px]">{user.displayName || user.email}</span>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="my-2" />
                    <DropdownMenuItem onClick={() => signOut(auth)} className="text-red-600 flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-red-100 dark:hover:bg-red-900/30 transition">
                      <LogOut className="w-4 h-4" /> Sign Out
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem onClick={() => navigate('/auth')} className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-blue-100 dark:hover:bg-blue-800/40 transition">
                      <Mail className="w-4 h-4" /> Sign In / Sign Up with Email
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={async () => { await signInWithPopup(auth, googleProvider); }} className="flex items-center gap-2 text-blue-700 dark:text-blue-200 rounded-lg px-3 py-2 hover:bg-blue-100 dark:hover:bg-blue-800/40 transition">
                      <LogIn className="w-4 h-4" /> Sign In with Google
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      {/* Mobile Navigation remains unchanged */}
    </nav>
  );
};

export default Navigation;
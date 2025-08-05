import { useEffect, useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, deleteDoc, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Area } from 'recharts';
import { saveAs } from 'file-saver';

const defaultGoals = {
  calories: 2000,
  protein: 75,
  carbs: 250,
  fat: 70,
};
const COLORS = ['#2563eb', '#22c55e', '#f59e42', '#ef4444'];
const PIE_COLORS = ['#4f8cff', '#34d399', '#fbbf24', '#f87171'];

const Dashboard = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState(() => {
    const saved = localStorage.getItem('nutritionGoals');
    return saved ? JSON.parse(saved) : defaultGoals;
  });
  const [view, setView] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [showReminder, setShowReminder] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setLogs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(
      collection(db, 'analyses'),
      where('uid', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, () => setLoading(false));
    return () => unsubscribe();
  }, [currentUser]);

  // Group logs by date for daily/weekly/monthly
  const groupLogs = (logs: any[], view: string) => {
    const grouped: Record<string, any[]> = {};
    logs.forEach(log => {
      let key = '';
      const date = log.createdAt?.toDate ? log.createdAt.toDate() : new Date();
      if (view === 'daily') key = date.toLocaleDateString();
      if (view === 'weekly') {
        const first = new Date(date.setDate(date.getDate() - date.getDay()));
        key = `${first.toLocaleDateString()} (week)`;
      }
      if (view === 'monthly') key = `${date.getMonth() + 1}/${date.getFullYear()}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(log);
    });
    return grouped;
  };

  const groupedLogs = groupLogs(logs, view);
  const chartData = Object.entries(groupedLogs).map(([key, logs]) => {
    const sum = logs.reduce((acc, log) => ({
      calories: acc.calories + (log.nutrition?.calories || 0),
      protein: acc.protein + (log.nutrition?.protein || 0),
      carbs: acc.carbs + (log.nutrition?.carbs || 0),
      fat: acc.fat + (log.nutrition?.fat || 0),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
    return { date: key, ...sum };
  }).reverse();

  // Macro pie chart for the latest period
  const latest = chartData[chartData.length - 1] || { protein: 0, carbs: 0, fat: 0 };
  const macroPie = [
    { name: 'Protein', value: latest.protein },
    { name: 'Carbs', value: latest.carbs },
    { name: 'Fat', value: latest.fat },
  ];

  // Progress bars for goals (latest period)
  const progress = {
    calories: Math.min(100, Math.round((latest.calories / goals.calories) * 100)),
    protein: Math.min(100, Math.round((latest.protein / goals.protein) * 100)),
    carbs: Math.min(100, Math.round((latest.carbs / goals.carbs) * 100)),
    fat: Math.min(100, Math.round((latest.fat / goals.fat) * 100)),
  };

  // Export as CSV
  const exportCSV = () => {
    const header = 'Date,Calories,Protein,Carbs,Fat\n';
    const rows = chartData.map(d => `${d.date},${d.calories},${d.protein},${d.carbs},${d.fat}`).join('\n');
    const csv = header + rows;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'nutrition_dashboard.csv');
  };

  // Reminders/notifications (simple demo)
  useEffect(() => {
    const now = new Date();
    const lastLog = logs[0]?.createdAt?.toDate ? logs[0].createdAt.toDate() : null;
    if (lastLog) {
      const diff = (now.getTime() - lastLog.getTime()) / (1000 * 60 * 60);
      if (diff > 24) setShowReminder(true);
      else setShowReminder(false);
    } else {
      setShowReminder(true);
    }
  }, [logs]);

  // Helper to get today's date string
  const getTodayKey = () => {
    const today = new Date();
    return today.toLocaleDateString();
  };

  // Get today's logs and summary
  const todayKey = getTodayKey();
  const todayLogs = logs.filter(log => {
    const date = log.createdAt?.toDate ? log.createdAt.toDate() : new Date();
    return date.toLocaleDateString() === todayKey;
  });
  const todaySummary = todayLogs.reduce((acc, log) => ({
    calories: acc.calories + (log.nutrition?.calories || 0),
    protein: acc.protein + (log.nutrition?.protein || 0),
    carbs: acc.carbs + (log.nutrition?.carbs || 0),
    fat: acc.fat + (log.nutrition?.fat || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  // Midnight reset effect
  useEffect(() => {
    // Calculate ms until next midnight
    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 0, 0);
    const msUntilMidnight = nextMidnight.getTime() - now.getTime();
    const timer = setTimeout(() => {
      // Reset goals to default (or reload from localStorage if you want to persist user changes)
      setGoals(defaultGoals);
      // Optionally, reset other local state here
      // Force a refresh by updating a dummy state if needed
    }, msUntilMidnight);
    return () => clearTimeout(timer);
  }, []);

  // Handler to reset (delete) today's logs for the current user
  const handleResetToday = async () => {
    if (!currentUser) return;
    if (!window.confirm("Are you sure you want to delete all of today's entries? This cannot be undone.")) return;
    // Find all today's logs for the user
    const today = new Date();
    const todayStr = today.toLocaleDateString();
    const q = query(
      collection(db, 'analyses'),
      where('uid', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const toDelete = snapshot.docs.filter(doc => {
      const data = doc.data();
      const date = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
      return date.toLocaleDateString() === todayStr;
    });
    for (const docSnap of toDelete) {
      await deleteDoc(docSnap.ref);
    }
  };

  if (!currentUser) {
    return <div className="min-h-screen flex items-center justify-center text-xl text-muted-foreground">Please sign in to view your dashboard.</div>;
  }

  return (
    <div className="min-h-screen bg-background pt-32 pb-16">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Today Summary Card */}
        <Card className="border-0 shadow-glass mb-8 bg-blue-50/80 dark:bg-[#1e293b]/90 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-blue-700 dark:text-blue-300 mb-1">Today's Nutrition Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-2">
              {['calories', 'protein', 'carbs', 'fat'].map((key, i) => (
                <div key={key} className="text-center flex flex-col items-center">
                  <div className="relative w-16 h-16 mb-1">
                    <svg className="absolute top-0 left-0" width="64" height="64">
                      <circle cx="32" cy="32" r="28" stroke="#2d3748" strokeWidth="6" fill="none" />
                      <circle cx="32" cy="32" r="28" stroke={PIE_COLORS[i]} strokeWidth="6" fill="none" strokeDasharray={175.9} strokeDashoffset={175.9 * (1 - (todaySummary[key] / (goals[key] || 1)))} style={{ transition: 'stroke-dashoffset 0.5s' }} />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-primary">{todaySummary[key]}</span>
                  </div>
                  <div className="text-sm font-semibold text-foreground mb-0.5">{key.charAt(0).toUpperCase() + key.slice(1)}</div>
                  <div className="text-xs text-muted-foreground">Goal: {goals[key]} {key === 'calories' ? 'kcal' : 'g'}</div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="text-xs text-muted-foreground text-center">Entries today: {todayLogs.length}</div>
              <button className="px-3 py-1 rounded bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition ml-2" onClick={handleResetToday} disabled={todayLogs.length === 0}>Reset Today</button>
            </div>
          </CardContent>
        </Card>
        {/* Main Dashboard Card */}
        <Card className="border-0 shadow-glass mb-8 bg-white/80 dark:bg-[#181f2a]/90 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-3xl font-extrabold text-foreground mb-2">Personalized Nutrition Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 mb-8 items-center">
              <div className="flex gap-2 bg-muted dark:bg-[#181f2a] rounded-full p-1 shadow-inner border border-[#2563eb]/20">
                {['daily', 'weekly', 'monthly'].map((v) => (
                  <button
                    key={v}
                    className={`px-6 py-2 rounded-full font-semibold transition-colors duration-200 focus:outline-none 
                      ${view === v 
                        ? 'bg-white text-[#2563eb] dark:bg-[#232b3a] dark:text-[#60a5fa] shadow' 
                        : 'bg-transparent text-[#2563eb] dark:text-[#60a5fa] hover:bg-primary/10'}
                    `}
                    style={{ minWidth: 90 }}
                    onClick={() => setView(v as any)}
                  >
                    {v.charAt(0).toUpperCase() + v.slice(1)}
                  </button>
                ))}
              </div>
              <button className="ml-auto px-4 py-1 rounded-lg bg-accent text-accent-foreground font-semibold shadow" onClick={exportCSV}>Export CSV</button>
            </div>
            {showReminder && <div className="mb-6 p-3 bg-yellow-100 text-yellow-800 rounded-lg font-semibold text-center">Don't forget to log your meals today!</div>}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
              {['calories', 'protein', 'carbs', 'fat'].map((key, i) => (
                <div key={key} className="text-center flex flex-col items-center">
                  <div className="relative w-20 h-20 mb-2">
                    <svg className="absolute top-0 left-0" width="80" height="80">
                      <circle cx="40" cy="40" r="36" stroke="#2d3748" strokeWidth="8" fill="none" />
                      <circle cx="40" cy="40" r="36" stroke={PIE_COLORS[i]} strokeWidth="8" fill="none" strokeDasharray={226.2} strokeDashoffset={226.2 * (1 - progress[key] / 100)} style={{ transition: 'stroke-dashoffset 0.5s' }} />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-2xl font-extrabold text-primary">{latest[key]}</span>
                  </div>
                  <div className="text-base font-bold text-foreground mb-1">{key.charAt(0).toUpperCase() + key.slice(1)} ({view})</div>
                  <div className="text-xs text-muted-foreground mb-1">Goal: <input type="number" value={goals[key]} onChange={e => setGoals({ ...goals, [key]: Number(e.target.value) })} className="w-16 px-1 py-0.5 rounded border text-xs bg-background" /> {key === 'calories' ? 'kcal' : 'g'}</div>
                  <div className="text-xs mt-1 font-semibold text-primary">{progress[key]}% of goal</div>
                </div>
              ))}
            </div>
            <div className="flex flex-col md:flex-row gap-10">
              <div className="flex-1 h-[28rem] w-full bg-white/80 dark:bg-[#232b3a]/90 backdrop-blur-md rounded-xl p-4 shadow-inner">
                <div className="font-semibold mb-2 text-lg text-foreground">Nutrition Trend ({view})</div>
                <ResponsiveContainer width="100%" height="90%">
                  {chartData.length <= 1 || chartData.every(d => d.calories === 0 && d.protein === 0 && d.carbs === 0 && d.fat === 0) ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-lg">Not enough data to display a trend</div>
                  ) : (
                    <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="date" stroke="#cbd5e1" fontSize={13} label={{ value: 'Date', position: 'insideBottom', offset: -5, fill: '#cbd5e1' }} />
                      <YAxis yAxisId="left" stroke="#cbd5e1" fontSize={13} label={{ value: 'Macros (g)', angle: -90, position: 'insideLeft', fill: '#cbd5e1' }} domain={[0, 'auto']} tickCount={8} />
                      <YAxis yAxisId="right" orientation="right" stroke="#4f8cff" fontSize={13} label={{ value: 'Calories', angle: 90, position: 'insideRight', fill: '#4f8cff' }} domain={[0, 'auto']} tickCount={8} />
                      <Tooltip contentStyle={{ background: '#232b3a', border: '1px solid #374151', color: '#fff' }} formatter={(value: any, name: string) => [`${value} ${name === 'Calories' ? 'kcal' : 'g'}`, name]} />
                      <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ color: '#cbd5e1' }} />
                      <Area yAxisId="left" type="monotone" dataKey="protein" stroke="#34d399" fill="#34d39933" name="Protein" />
                      <Area yAxisId="left" type="monotone" dataKey="carbs" stroke="#fbbf24" fill="#fbbf2433" name="Carbs" />
                      <Area yAxisId="left" type="monotone" dataKey="fat" stroke="#f87171" fill="#f8717133" name="Fat" />
                      <Line yAxisId="right" type="monotone" dataKey="calories" stroke="#4f8cff" name="Calories" strokeWidth={3} dot={{ r: 7, fill: '#4f8cff', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 10 }} isAnimationActive={true} animationDuration={800} />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center bg-white/80 dark:bg-[#232b3a]/90 backdrop-blur-md rounded-xl p-4 shadow-inner">
                <div className="font-semibold mb-2 text-lg text-foreground">Macro Distribution ({view})</div>
                <PieChart width={240} height={240}>
                  <Pie data={macroPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                    {macroPie.map((entry, i) => <Cell key={entry.name} fill={PIE_COLORS[i]} />)}
                  </Pie>
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ color: '#cbd5e1' }} />
                </PieChart>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard; 
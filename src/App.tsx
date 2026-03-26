import { useState, useEffect, useRef } from "react";
import { 
  LayoutDashboard, 
  Home, 
  Layers, 
  DollarSign, 
  Hammer, 
  Clock, 
  Palette, 
  MessageSquare, 
  Download, 
  ChevronRight,
  Plus,
  Minus,
  Info,
  CheckCircle2,
  AlertTriangle,
  Send,
  Loader2,
  Moon,
  Sun
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { ArchitecturePlan, ProjectInput } from "./types";
import { generateArchitecturePlan, getChatResponse } from "./services/geminiService";
import ThreeDViewer from "./components/ThreeDViewer";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [activeTab, setActiveTab] = useState("design");
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [plan, setPlan] = useState<ArchitecturePlan | null>(null);
  const [input, setInput] = useState<ProjectInput>({
    plotSize: 1500,
    unit: 'sqft',
    location: "Mumbai, India",
    budget: 5000000,
    rooms: 3,
    floors: 1,
    style: 'modern',
    isIndiaBased: true,
  });

  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([
    { role: 'ai', text: "Hello! I'm ArchAI. Tell me about your dream project, or use the dashboard to generate a full plan." }
  ]);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const result = await generateArchitecturePlan(input);
      setPlan(result);
      setActiveTab("dashboard");
    } catch (error) {
      console.error("Generation failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput("");

    try {
      const aiResponse = await getChatResponse(userMsg, plan);
      setChatMessages(prev => [...prev, { role: 'ai', text: aiResponse || "I'm not sure how to answer that." }]);
    } catch (error) {
      setChatMessages(prev => [...prev, { role: 'ai', text: "Sorry, I encountered an error." }]);
    }
  };

  const exportPDF = async () => {
    const element = document.getElementById('report-content');
    if (!element) return;
    
    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`ArchAI-Plan-${Date.now()}.pdf`);
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  const budgetData = plan ? [
    { name: 'Construction', value: plan.budget.construction },
    { name: 'Materials', value: plan.budget.materials },
    { name: 'Labor', value: plan.budget.labor },
    { name: 'Interior', value: plan.budget.interior },
  ] : [];

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-300",
      isDarkMode ? "bg-zinc-950 text-zinc-100" : "bg-zinc-50 text-zinc-900"
    )}>
      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 h-full w-64 border-r transition-colors duration-300 z-50 hidden lg:block",
        isDarkMode ? "bg-zinc-900/50 border-white/10" : "bg-white border-zinc-200"
      )}>
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Home className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">ArchAI</h1>
        </div>

        <nav className="mt-6 px-4 space-y-2">
          {[
            { id: 'design', icon: LayoutDashboard, label: 'Design Engine' },
            { id: 'dashboard', icon: Layers, label: 'Project Overview' },
            { id: 'budget', icon: DollarSign, label: 'Budget & Materials' },
            { id: 'timeline', icon: Clock, label: 'Construction Plan' },
            { id: 'interior', icon: Palette, label: 'Interior AI' },
            { id: 'chat', icon: MessageSquare, label: 'AI Assistant' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                activeTab === item.id 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" 
                  : "hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-100"
              )}
            >
              <item.icon className={cn("w-5 h-5", activeTab === item.id ? "text-white" : "group-hover:text-blue-400")} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="absolute bottom-6 left-4 right-4 p-4 rounded-2xl bg-zinc-800/30 border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Theme</span>
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[10px] text-zinc-500 leading-relaxed">
            AI-Powered Smart Architecture & Interior Design System v1.0
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:pl-64 min-h-screen">
        <header className={cn(
          "sticky top-0 z-40 border-b backdrop-blur-md px-8 py-4 flex items-center justify-between transition-colors",
          isDarkMode ? "bg-zinc-950/80 border-white/10" : "bg-white/80 border-zinc-200"
        )}>
          <div>
            <h2 className="text-lg font-semibold capitalize">{activeTab.replace('-', ' ')}</h2>
            <p className="text-xs text-zinc-500">Manage your architectural project with AI precision</p>
          </div>
          <div className="flex items-center gap-4">
            {plan && (
              <button 
                onClick={exportPDF}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors"
              >
                <Download className="w-4 h-4" />
                Export Report
              </button>
            )}
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold">
              AR
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'design' && (
              <motion.div
                key="design"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-8"
              >
                <div className="space-y-8">
                  <div className="bg-zinc-900/50 border border-white/10 p-8 rounded-3xl space-y-6">
                    <h3 className="text-2xl font-bold">Project Parameters</h3>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-zinc-500 uppercase">Plot Size ({input.unit})</label>
                        <div className="flex items-center gap-4">
                          <input 
                            type="range" 
                            min="500" 
                            max="10000" 
                            step="100"
                            value={input.plotSize}
                            onChange={(e) => setInput({...input, plotSize: parseInt(e.target.value)})}
                            className="flex-1 accent-blue-600"
                          />
                          <span className="text-lg font-mono font-bold w-16">{input.plotSize}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-zinc-500 uppercase">Unit</label>
                        <select 
                          value={input.unit}
                          onChange={(e) => setInput({...input, unit: e.target.value as 'sqft' | 'sqm'})}
                          className="w-full bg-zinc-800 border-white/10 rounded-xl px-4 py-2 text-sm"
                        >
                          <option value="sqft">Sq Ft</option>
                          <option value="sqm">Sq Meter</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-zinc-500 uppercase">Location</label>
                      <input 
                        type="text" 
                        value={input.location}
                        onChange={(e) => setInput({...input, location: e.target.value})}
                        placeholder="e.g. Mumbai, India"
                        className="w-full bg-zinc-800 border-white/10 rounded-xl px-4 py-3 text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-zinc-500 uppercase">Rooms</label>
                        <div className="flex items-center justify-between bg-zinc-800 rounded-xl p-2">
                          <button onClick={() => setInput({...input, rooms: Math.max(1, input.rooms - 1)})} className="p-2 hover:bg-zinc-700 rounded-lg"><Minus className="w-4 h-4" /></button>
                          <span className="font-bold">{input.rooms}</span>
                          <button onClick={() => setInput({...input, rooms: input.rooms + 1})} className="p-2 hover:bg-zinc-700 rounded-lg"><Plus className="w-4 h-4" /></button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-zinc-500 uppercase">Floors</label>
                        <div className="flex items-center justify-between bg-zinc-800 rounded-xl p-2">
                          <button onClick={() => setInput({...input, floors: Math.max(1, input.floors - 1)})} className="p-2 hover:bg-zinc-700 rounded-lg"><Minus className="w-4 h-4" /></button>
                          <span className="font-bold">{input.floors}</span>
                          <button onClick={() => setInput({...input, floors: input.floors + 1})} className="p-2 hover:bg-zinc-700 rounded-lg"><Plus className="w-4 h-4" /></button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-zinc-500 uppercase">Style Preference</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['modern', 'minimalist', 'luxury', 'traditional', 'eco-friendly'].map((s) => (
                          <button
                            key={s}
                            onClick={() => setInput({...input, style: s as any})}
                            className={cn(
                              "px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                              input.style === s ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-500 hover:text-zinc-300"
                            )}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-500/20 rounded-lg">
                          <Info className="w-4 h-4 text-orange-500" />
                        </div>
                        <div>
                          <p className="text-sm font-bold">Vastu Compliance</p>
                          <p className="text-[10px] text-zinc-500">Optimize layout for Indian standards</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setInput({...input, isIndiaBased: !input.isIndiaBased})}
                        className={cn(
                          "w-12 h-6 rounded-full transition-colors relative",
                          input.isIndiaBased ? "bg-blue-600" : "bg-zinc-700"
                        )}
                      >
                        <div className={cn(
                          "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                          input.isIndiaBased ? "left-7" : "left-1"
                        )} />
                      </button>
                    </div>

                    <button 
                      onClick={handleGenerate}
                      disabled={isLoading}
                      className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-2xl font-bold text-lg shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 transition-all"
                    >
                      {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Home className="w-6 h-6" />}
                      {isLoading ? "Generating Masterplan..." : "Generate AI Masterplan"}
                    </button>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="h-[500px] w-full">
                    <ThreeDViewer plan={plan} />
                  </div>
                  
                  <div className="bg-zinc-900/50 border border-white/10 p-6 rounded-3xl">
                    <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      AI Capabilities
                    </h4>
                    <ul className="space-y-3 text-xs text-zinc-400">
                      <li className="flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full bg-blue-500 mt-1.5" />
                        <span>Real-time structural analysis and space optimization</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full bg-blue-500 mt-1.5" />
                        <span>Climate-aware material recommendations</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full bg-blue-500 mt-1.5" />
                        <span>Dynamic budget calculation based on market averages</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'dashboard' && plan && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                id="report-content"
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-zinc-900/50 border border-white/10 p-6 rounded-3xl">
                    <p className="text-xs font-semibold text-zinc-500 uppercase mb-1">Total Built-up Area</p>
                    <p className="text-3xl font-bold">{plan.totalBuiltUpArea} <span className="text-sm text-zinc-500">{input.unit}</span></p>
                  </div>
                  <div className="bg-zinc-900/50 border border-white/10 p-6 rounded-3xl">
                    <p className="text-xs font-semibold text-zinc-500 uppercase mb-1">Estimated Budget</p>
                    <p className="text-3xl font-bold">₹{(plan.budget.total / 100000).toFixed(1)}L</p>
                  </div>
                  <div className="bg-zinc-900/50 border border-white/10 p-6 rounded-3xl">
                    <p className="text-xs font-semibold text-zinc-500 uppercase mb-1">Timeline</p>
                    <p className="text-3xl font-bold">{plan.timeline.reduce((acc, p) => acc + p.durationDays, 0)} <span className="text-sm text-zinc-500">Days</span></p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-zinc-900/50 border border-white/10 p-8 rounded-3xl space-y-6">
                    <h3 className="text-xl font-bold">Architecture Description</h3>
                    <p className="text-zinc-400 leading-relaxed text-sm">{plan.description}</p>
                    <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                      <h4 className="text-sm font-bold text-blue-400 mb-2">Style Justification</h4>
                      <p className="text-xs text-zinc-300 italic">{plan.styleJustification}</p>
                    </div>
                    {plan.vastuCompliance && (
                      <div className="p-4 bg-orange-500/10 rounded-2xl border border-orange-500/20">
                        <h4 className="text-sm font-bold text-orange-400 mb-2">Vastu Compliance</h4>
                        <p className="text-xs text-zinc-300">{plan.vastuCompliance}</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-zinc-900/50 border border-white/10 p-8 rounded-3xl space-y-6">
                    <h3 className="text-xl font-bold">Room Planning</h3>
                    <div className="grid grid-cols-1 gap-4">
                      {plan.rooms.map((room, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-2xl border border-white/5">
                          <div>
                            <p className="font-bold">{room.name}</p>
                            <p className="text-xs text-zinc-500">{room.dimensions} • {room.area} {input.unit}</p>
                          </div>
                          <div className="flex gap-1">
                            {room.features.slice(0, 2).map((f, j) => (
                              <span key={j} className="text-[10px] px-2 py-1 bg-zinc-700 rounded-md text-zinc-300">{f}</span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'budget' && plan && (
              <motion.div
                key="budget"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-zinc-900/50 border border-white/10 p-8 rounded-3xl">
                    <h3 className="text-xl font-bold mb-8">Budget Allocation</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={budgetData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {budgetData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '12px' }}
                            itemStyle={{ color: '#fff' }}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-8 space-y-4">
                      {budgetData.map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                            <span className="text-sm font-medium">{item.name}</span>
                          </div>
                          <span className="font-mono font-bold">₹{item.value.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-zinc-900/50 border border-white/10 p-8 rounded-3xl">
                    <h3 className="text-xl font-bold mb-6">Material Requirements</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="text-zinc-500 border-b border-white/10">
                            <th className="pb-4 font-semibold">Item</th>
                            <th className="pb-4 font-semibold">Quantity</th>
                            <th className="pb-4 font-semibold">Est. Rate</th>
                            <th className="pb-4 font-semibold text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {plan.materials.map((m, i) => (
                            <tr key={i} className="group">
                              <td className="py-4 font-medium">{m.item}</td>
                              <td className="py-4 text-zinc-400">{m.quantity} {m.unit}</td>
                              <td className="py-4 text-zinc-400">₹{m.estimatedRate}</td>
                              <td className="py-4 text-right font-mono font-bold">₹{m.totalCost.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-900/50 border border-white/10 p-8 rounded-3xl">
                  <h3 className="text-xl font-bold mb-6">Cost Optimization Tips</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {plan.budget.optimizationTips.map((tip, i) => (
                      <div key={i} className="p-4 bg-zinc-800/50 rounded-2xl border border-white/5 flex gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0" />
                        <p className="text-xs text-zinc-400 leading-relaxed">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'timeline' && plan && (
              <motion.div
                key="timeline"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8"
              >
                <div className="bg-zinc-900/50 border border-white/10 p-8 rounded-3xl">
                  <h3 className="text-xl font-bold mb-8">Construction Roadmap</h3>
                  <div className="space-y-8 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-800">
                    {plan.timeline.map((phase, i) => (
                      <div key={i} className="relative pl-12">
                        <div className="absolute left-0 top-0 w-9 h-9 bg-zinc-900 border-2 border-blue-600 rounded-full flex items-center justify-center z-10">
                          <span className="text-xs font-bold">{i + 1}</span>
                        </div>
                        <div className="bg-zinc-800/30 border border-white/5 p-6 rounded-2xl">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-bold">{phase.phase}</h4>
                            <span className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-xs font-bold">{phase.duration}</span>
                          </div>
                          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {phase.tasks.map((task, j) => (
                              <li key={j} className="flex items-center gap-2 text-xs text-zinc-400">
                                <CheckCircle2 className="w-3 h-3 text-green-500" />
                                {task}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-zinc-900/50 border border-white/10 p-8 rounded-3xl">
                    <h3 className="text-xl font-bold mb-6">Workflow & Site Management</h3>
                    <div className="space-y-4">
                      {plan.workflow.map((step, i) => (
                        <div key={i} className="flex gap-4 items-start">
                          <span className="text-blue-500 font-mono font-bold">0{i + 1}</span>
                          <p className="text-sm text-zinc-400">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-zinc-900/50 border border-white/10 p-8 rounded-3xl">
                    <h3 className="text-xl font-bold mb-6">Safety & Risk Mitigation</h3>
                    <div className="space-y-4">
                      {plan.safetyMeasures.map((measure, i) => (
                        <div key={i} className="flex gap-3 items-center p-3 bg-red-500/5 border border-red-500/10 rounded-xl">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                          <p className="text-xs text-zinc-300">{measure}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'interior' && plan && (
              <motion.div
                key="interior"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8"
              >
                <div className="h-[400px] w-full mb-8">
                  <ThreeDViewer plan={plan} mode="interior" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                    <div className="bg-zinc-900/50 border border-white/10 p-8 rounded-3xl">
                      <h3 className="text-xl font-bold mb-6">Color Palette</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {plan.interiorDesign.colorPalette.map((color, i) => (
                          <div key={i} className="space-y-2">
                            <div 
                              className="h-24 rounded-2xl shadow-inner border border-white/10" 
                              style={{ backgroundColor: color.hex }}
                            />
                            <div>
                              <p className="text-sm font-bold">{color.name}</p>
                              <p className="text-xs font-mono text-zinc-500 uppercase">{color.hex}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-zinc-900/50 border border-white/10 p-8 rounded-3xl">
                      <h3 className="text-xl font-bold mb-6">Lighting & Material Strategy</h3>
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-sm font-bold text-zinc-500 uppercase mb-3 tracking-wider">Lighting Plan</h4>
                          <p className="text-sm text-zinc-400 leading-relaxed">{plan.interiorDesign.lightingPlan}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-zinc-500 uppercase mb-3 tracking-wider">Recommended Materials</h4>
                          <div className="flex flex-wrap gap-2">
                            {plan.interiorDesign.materialRecommendations.map((m, i) => (
                              <span key={i} className="px-3 py-1.5 bg-zinc-800 rounded-lg text-xs font-medium border border-white/5">{m}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="bg-zinc-900/50 border border-white/10 p-8 rounded-3xl">
                      <h3 className="text-xl font-bold mb-6">Furniture Suggestions</h3>
                      <div className="space-y-6">
                        {plan.rooms.map((room, i) => (
                          <div key={i}>
                            <h4 className="text-xs font-bold text-blue-500 uppercase mb-2">{room.name}</h4>
                            <ul className="space-y-2">
                              {room.furnitureSuggestions.map((f, j) => (
                                <li key={j} className="text-xs text-zinc-400 flex items-center gap-2">
                                  <div className="w-1 h-1 rounded-full bg-zinc-600" />
                                  {f}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'chat' && (
              <motion.div
                key="chat"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-[calc(100vh-200px)] flex flex-col bg-zinc-900/50 border border-white/10 rounded-3xl overflow-hidden"
              >
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={cn(
                      "flex",
                      msg.role === 'user' ? "justify-end" : "justify-start"
                    )}>
                      <div className={cn(
                        "max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed",
                        msg.role === 'user' 
                          ? "bg-blue-600 text-white rounded-tr-none" 
                          : "bg-zinc-800 text-zinc-200 rounded-tl-none border border-white/5"
                      )}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <form onSubmit={handleChatSubmit} className="p-6 border-t border-white/10 flex gap-4">
                  <input 
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask ArchAI about your design, materials, or budget..."
                    className="flex-1 bg-zinc-800 border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <button 
                    type="submit"
                    className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

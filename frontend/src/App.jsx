import { useState } from 'react';
import { modelMatrix, modelRegistry, capabilityKeys, getCapabilityBadges } from './data';
import { 
  BarChart3, RotateCcw, Play, Sparkles, Paperclip, X, FileText, 
  Settings2, ChevronDown, ChevronUp, Lock, Brain, Zap, LayoutPanelLeft, LineChart, 
  Wand2, Tag, Eye
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import AnalyticsDashboard from './AnalyticsDashboard';
import EvaluationEngine from './EvaluationEngine';

const API_BASE = 'http://localhost:8000/api';

const useCaseTags = ["All", "Chat", "Code", "RAG", "Vision"];
const providers = ["All", "Amazon", "Meta", "Mistral AI", "Google", "OpenAI", "DeepSeek"];

function App() {
  const [view, setView] = useState('chat');
  const [category, setCategory] = useState('Foundation');
  const [selectedProvider, setSelectedProvider] = useState('Amazon');
  const [selectedUseCase, setSelectedUseCase] = useState('Chat');
  
  const [prompt, setPrompt] = useState('Explain quantum physics in 100 words');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [metrics, setMetrics] = useState({ input: 9, output: 127, cost: 0.00041, latency: '3428ms' });
  
  const [paramsOpen, setParamsOpen] = useState(false);
  const [temperature, setTemperature] = useState(0.7);

  // Auto-select state
  const [autoSelect, setAutoSelect] = useState(false);
  const [detectedTags, setDetectedTags] = useState([]);
  const [recommendedModel, setRecommendedModel] = useState(null);

  // Map Use Case Tag to internal data key
  const tagToKey = (tag) => {
    const map = { "Chat": "reasoning", "Vision": "vision", "Code": "reasoning", "RAG": "summarization" };
    return map[tag] || "reasoning";
  };

  const currentModelData = modelMatrix[selectedProvider]?.[tagToKey(selectedUseCase)];
  const modelId = currentModelData?.id || "N/A";
  const modelTags = currentModelData?.tags || [];

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsLoading(true);
    setError('');
    setDetectedTags([]);
    setRecommendedModel(null);

    try {
      if (autoSelect) {
        // Auto-select mode — let the backend classify & pick the model
        const res = await fetch(`${API_BASE}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            provider: selectedProvider, 
            use_case: tagToKey(selectedUseCase), 
            prompt,
            auto_select: true,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Request failed');
        setResponse(data.response);
        setMetrics({
          input: data.metrics.input_tokens,
          output: data.metrics.output_tokens,
          cost: data.metrics.cost.toFixed(6),
          latency: `${data.metrics.latency_ms}ms`,
        });
        setDetectedTags(data.workload_tags || []);
        setRecommendedModel({ model_id: data.model_id, provider: data.provider });
      } else {
        // Manual mode — existing behavior
        const res = await fetch(`${API_BASE}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            provider: selectedProvider, 
            use_case: tagToKey(selectedUseCase), 
            prompt 
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Request failed');
        setResponse(data.response);
        setMetrics({
          input: data.metrics.input_tokens,
          output: data.metrics.output_tokens,
          cost: data.metrics.cost.toFixed(6),
          latency: `${data.metrics.latency_ms}ms`,
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (view === 'analytics') return <AnalyticsDashboard onBack={() => setView('chat')} />;

  return (
    <div className="flex h-screen bg-[#0f172a] text-slate-300 font-sans overflow-hidden">
      
      {/* Sidebar - Only show in chat view */}
      {view === 'chat' && (
        <aside className="w-[400px] bg-[#1e293b]/30 border-r border-slate-800/50 flex flex-col p-6 overflow-y-auto shrink-0 animate-in slide-in-from-left duration-300">
          
          {/* Auto-Select Toggle */}
          <section className="mb-6">
            <button
              onClick={() => setAutoSelect(!autoSelect)}
              className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                autoSelect 
                  ? 'bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border-indigo-500/50 shadow-lg shadow-indigo-500/10' 
                  : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                  autoSelect ? 'bg-indigo-600 shadow-lg shadow-indigo-500/30' : 'bg-slate-800'
                }`}>
                  <Wand2 size={16} className={autoSelect ? 'text-white' : 'text-slate-500'} />
                </div>
                <div className="text-left">
                  <span className="text-sm font-bold text-white block">Auto-Select Model</span>
                  <span className="text-xs text-slate-500">AI classifies your prompt & picks the best model</span>
                </div>
              </div>
              <div className={`w-10 h-5 rounded-full transition-all relative ${autoSelect ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all shadow-sm ${autoSelect ? 'left-5.5 translate-x-[2px]' : 'left-0.5'}`} />
              </div>
            </button>
          </section>

          {/* Detected Tags Banner (shown after auto-select run) */}
          {autoSelect && detectedTags.length > 0 && (
            <section className="mb-6 bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4 animate-in fade-in duration-300">
              <div className="flex items-center gap-2 mb-3">
                <Tag size={12} className="text-indigo-400" />
                <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest">Detected Workload</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {detectedTags.map(tag => (
                  <span key={tag} className="px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 uppercase">
                    {tag.replace('_', ' ')}
                  </span>
                ))}
              </div>
              {recommendedModel && (
                <div className="flex items-center gap-2 pt-2 border-t border-indigo-500/20">
                  <Eye size={10} className="text-green-400" />
                  <span className="text-xs text-slate-400">Selected:</span>
                  <span className="text-xs font-bold text-green-400">{recommendedModel.model_id}</span>
                  <span className="text-xs text-slate-500">({recommendedModel.provider})</span>
                </div>
              )}
            </section>
          )}

          {/* Model Category */}
          {!autoSelect && (
            <>
          <section className="mb-8">
            <label className="text-xs font-bold uppercase text-slate-500 mb-3 block tracking-widest">Model Category</label>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setCategory('System')}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${category === 'System' ? 'bg-indigo-600/10 border-indigo-500 text-white' : 'bg-slate-900/50 border-slate-800 text-slate-50'}`}
              >
                <Lock size={20} className="mb-2 opacity-50" />
                <span className="text-sm font-bold">System Defined</span>
              </button>
              <button 
                onClick={() => setCategory('Foundation')}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${category === 'Foundation' ? 'bg-indigo-600/10 border-indigo-500 text-white' : 'bg-slate-900/50 border-slate-800 text-slate-500'}`}
              >
                <Brain size={20} className="mb-2 text-indigo-400" />
                <span className="text-sm font-bold">Foundation</span>
              </button>
            </div>
          </section>

          {/* Provider Tags */}
          <section className="mb-6">
            <label className="text-xs font-bold uppercase text-slate-500 mb-3 block tracking-widest">Provider</label>
            <div className="flex flex-wrap gap-2">
              {providers.map(p => (
                <button 
                  key={p}
                  onClick={() => setSelectedProvider(p)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${selectedProvider === p ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-600'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </section>

          {/* Use Case Tags */}
          <section className="mb-6">
            <label className="text-xs font-bold uppercase text-slate-500 mb-3 block tracking-widest">Use Case</label>
            <div className="flex flex-wrap gap-2">
              {useCaseTags.map(uc => (
                <button 
                  key={uc}
                  onClick={() => setSelectedUseCase(uc)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${selectedUseCase === uc ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-600'}`}
                >
                  {uc}
                </button>
              ))}
            </div>
          </section>

          {/* Model Selection */}
          <section className="mb-6">
            <label className="text-xs font-bold uppercase text-slate-500 mb-3 block tracking-widest">Model</label>
            <div className="relative group">
              <select 
                value={selectedProvider} 
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-800 text-white rounded-lg px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-indigo-500 appearance-none cursor-pointer"
              >
                <option>{modelId}</option>
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
            
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="px-2.5 py-1 rounded text-xs font-bold bg-green-900/20 text-green-400 border border-green-500/20 uppercase">{selectedProvider}</span>
              {modelTags.map(tag => (
                <span key={tag} className={`px-2.5 py-1 rounded text-xs font-bold border uppercase ${
                  tag === 'multimodal' ? 'bg-pink-900/20 text-pink-400 border-pink-500/20' : 
                  tag.includes('Context') ? 'bg-cyan-900/20 text-cyan-400 border-cyan-500/20' :
                  'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {tag}
                </span>
              ))}
            </div>
          </section>
            </>
          )}

          {/* Prompt */}
          <section className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <label className="text-xs font-bold uppercase text-slate-500 tracking-widest">Prompt</label>
              <div className="flex gap-4 text-xs font-bold text-slate-600">
                <button onClick={() => setPrompt('')} className="hover:text-indigo-400 transition-colors uppercase">Clear</button>
                <button className="hover:text-indigo-400 transition-colors uppercase">Format JSON</button>
              </div>
            </div>
            <textarea 
              value={prompt} 
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full h-40 bg-[#0f172a] border border-slate-800 p-4 rounded-xl text-sm outline-none focus:border-indigo-500 transition-all resize-none shadow-inner text-slate-200"
            />
          </section>

          {/* Parameters */}
          {!autoSelect && (
          <section className="mb-8">
            <button 
              onClick={() => setParamsOpen(!paramsOpen)}
              className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500 hover:text-white transition-colors"
            >
              Parameters {paramsOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            {paramsOpen && (
              <div className="mt-4 space-y-4 p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span>Temperature</span>
                    <span className="text-indigo-400">{temperature}</span>
                  </div>
                  <input 
                    type="range" min="0" max="1" step="0.1" 
                    value={temperature} onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
              </div>
            )}
          </section>
          )}

          <button 
            onClick={handleGenerate} 
            disabled={isLoading}
            className={`w-full font-bold py-3.5 rounded-xl transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2.5 text-sm ${
              autoSelect 
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white disabled:from-slate-800 disabled:to-slate-800' 
                : 'bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white'
            }`}
          >
            {isLoading ? <Sparkles size={18} className="animate-spin" /> : autoSelect ? <Wand2 size={16} /> : <Play size={16} fill="currentColor" />}
            {autoSelect ? 'Auto-Select & Run' : 'Run Prompt'}
          </button>
        </aside>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#0f172a]">
        
        {/* Navigation Bar */}
        <nav className="px-8 py-4 border-b border-slate-800/50 flex items-center justify-between bg-black/20">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Brain size={18} className="text-white" />
              </div>
              <span className="text-sm font-black text-white tracking-widest uppercase italic">Gen AI Governance</span>
            </div>
            
            <div className="flex gap-1 bg-slate-900/50 p-1 rounded-xl border border-slate-800">
              <button 
                onClick={() => setView('chat')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'chat' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <LayoutPanelLeft size={14} /> Playground
              </button>
              <button 
                onClick={() => setView('evaluation')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'evaluation' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <LineChart size={14} /> Evaluation Engine
              </button>
              <button 
                onClick={() => setView('analytics')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'analytics' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <BarChart3 size={14} /> Analytics
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400">SG</div>
          </div>
        </nav>

        <div className="flex-1 p-8 overflow-auto">
          {view === 'chat' ? (
            <div className="h-full flex flex-col bg-[#1e293b]/20 border border-slate-800/50 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="px-6 py-4 border-b border-slate-800/50 flex justify-between items-center bg-[#1e293b]/40">
                <div className="flex items-center gap-3">
                  <FileText size={18} className="text-indigo-400" />
                  <h2 className="text-sm font-bold text-white tracking-tight">Response</h2>
                  {autoSelect && recommendedModel && (
                    <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-md border border-indigo-500/20">
                      via {recommendedModel.model_id}
                    </span>
                  )}
                </div>
                <div className="flex gap-3">
                  <button className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"><Paperclip size={16} /></button>
                  <button onClick={() => setResponse('')} className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"><RotateCcw size={16} /></button>
                </div>
              </div>

              <div className="flex-1 p-8 overflow-auto">
                {!autoSelect && response && (
                <div className="mb-8 bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl flex items-center gap-4 text-sm text-indigo-200">
                  <Zap size={16} className="text-indigo-400 shrink-0" />
                  <p>
                    <span className="font-bold">Cost Optimization:</span> For short responses ({metrics.output} tokens), save cost & latency with <span className="text-indigo-400 font-bold underline cursor-pointer">Claude Haiku 4.5</span>.
                  </p>
                </div>
                )}

                {autoSelect && !response && !isLoading && (
                  <div className="mb-8 bg-purple-500/10 border border-purple-500/20 p-4 rounded-xl flex items-center gap-4 text-sm text-purple-200">
                    <Wand2 size={16} className="text-purple-400 shrink-0" />
                    <p>
                      <span className="font-bold">Auto-Select Mode:</span> Your prompt will be analyzed by the Workload Classifier, which will tag the intent and route it to the optimal model automatically.
                    </p>
                  </div>
                )}

                <div className="text-slate-300 leading-relaxed text-base prose prose-invert max-w-none">
                  {response ? <ReactMarkdown>{response}</ReactMarkdown> : (
                    <div className="text-slate-600 italic">Enter a prompt in the sidebar and click "Run Prompt" to see the governed output...</div>
                  )}
                </div>
              </div>

              <div className="px-10 py-8 border-t border-slate-800/50 bg-[#1e293b]/40 grid grid-cols-4 gap-8">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Latency</p>
                  <p className="text-xl font-bold text-white font-mono">{metrics.latency}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Input Tokens</p>
                  <p className="text-xl font-bold text-white font-mono">{metrics.input}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Output Tokens</p>
                  <p className="text-xl font-bold text-white font-mono">{metrics.output}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Est. Cost</p>
                  <p className="text-2xl font-bold text-white font-mono">${metrics.cost}</p>
                </div>
              </div>

              <div className="px-10 py-3 bg-[#0f172a] flex justify-between items-center text-xs font-bold text-slate-600 uppercase tracking-tighter">
                <span>Context Window Usage</span>
                <span>{metrics.input + metrics.output} tokens used</span>
              </div>
            </div>
          ) : (
            <EvaluationEngine onBack={() => setView('chat')} />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
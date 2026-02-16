import { useState, useEffect } from 'react';
import { modelMatrix, useCases, pricingMatrix } from './data';
import { BarChart3, RotateCcw, Play, Sparkles, Paperclip, X, FileText, Music } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import AnalyticsDashboard from './AnalyticsDashboard';

const API_BASE = 'http://localhost:8000/api';

// Only show providers that have a working backend
const SUPPORTED_PROVIDERS = ['Google', 'OpenAI', 'Meta', 'Mistral AI', 'Amazon', 'DeepSeek'];

function App() {
  const [view, setView] = useState('chat'); // 'chat' or 'analytics'
  const [provider, setProvider] = useState('Google');
  const [useCase, setUseCase] = useState('reasoning');
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState('');
  const [error, setError] = useState('');
  const [metrics, setMetrics] = useState({ input: 0, output: 0, cost: 0, latency: '0ms' });
  const [attachedFile, setAttachedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  const selectedModel = modelMatrix[provider]?.[useCase] || "N/A";

  // Recommendation Engine logic
  useEffect(() => {
    const p = prompt.toLowerCase().trim();
    if (p.length < 3) {
      setSuggestion('');
      return;
    }

    let tip = "";
    if (useCase === 'reasoning' && !p.includes('step-by-step')) {
      tip = `💡 Tip: For ${selectedModel}, try adding "Think step-by-step" for better logic.`;
    } else if (useCase === 'summarization' && !p.includes('bullet')) {
      tip = `📝 Tip: Request "bullet points" for a cleaner condensation from ${selectedModel}.`;
    } else if (useCase === 'structured output' && !p.includes('json')) {
      tip = `✨ Tip: Explicitly ask for "JSON format" to help ${selectedModel} follow your schema.`;
    }

    if ((pricingMatrix[provider] || 0) > 10 && p.length > 50) {
      tip = `💰 FinOps: ${selectedModel} is a high-cost tier. Consider 'Gemini Flash' for bulk tasks.`;
    }

    setSuggestion(tip);
  }, [prompt, useCase, provider, selectedModel]);

  // Show Analytics Dashboard (AFTER all hooks)
  if (view === 'analytics') {
    return <AnalyticsDashboard onBack={() => setView('chat')} />;
  }

  const showAttachment = useCase === 'vision' || useCase === 'multimodality';

  const acceptTypes = useCase === 'vision'
    ? 'image/*'
    : 'image/*,audio/*,.pdf,.txt,.csv,.md';

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAttachedFile(file);
      if (file.type.startsWith('image/')) {
        setFilePreview(URL.createObjectURL(file));
      } else {
        setFilePreview(null);
      }
    }
  };

  const removeFile = () => {
    setAttachedFile(null);
    if (filePreview) URL.revokeObjectURL(filePreview);
    setFilePreview(null);
  };

  const getFileIcon = (file) => {
    if (file.type.startsWith('audio/')) return <Music size={20} className="text-purple-400" />;
    return <FileText size={20} className="text-blue-400" />;
  };

  const handleReset = () => {
    setPrompt('');
    setResponse('');
    setError('');
    setMetrics({ input: 0, output: 0, cost: 0, latency: '0ms' });
    removeFile();
  };

  const handleGenerate = async () => {
    if (!prompt) return;
    if (useCase === 'vision' && !attachedFile) {
      setError('Please upload an image for vision use case');
      return;
    }
    setIsLoading(true);
    setResponse('');
    setError('');

    try {
      let res;

      if (attachedFile && showAttachment) {
        // File attached: multipart/form-data
        const formData = new FormData();
        formData.append('provider', provider);
        formData.append('use_case', useCase);
        formData.append('prompt', prompt);
        formData.append('image', attachedFile);
        res = await fetch(`${API_BASE}/chat/vision`, {
          method: 'POST',
          body: formData,
        });
      } else {
        // Text-only: JSON
        res = await fetch(`${API_BASE}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider, use_case: useCase, prompt }),
        });
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Request failed');
      }

      setResponse(data.response);
      setMetrics({
        input: data.metrics.input_tokens,
        output: data.metrics.output_tokens,
        cost: data.metrics.cost.toFixed(6),
        latency: `${data.metrics.latency_ms}ms`,
      });
    } catch (err) {
      setError(err.message);
      setResponse('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">
      
      {/* Sidebar - Provider/UseCase Dropdowns */}
      <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col p-6 shadow-2xl shrink-0">
        <h1 className="text-xl font-bold text-white mb-8 border-b border-slate-700 pb-4 tracking-tight">Governance Setup</h1>
        
        <div className="space-y-6">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Provider</label>
            <select 
              value={provider} 
              onChange={(e) => setProvider(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SUPPORTED_PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Use Case</label>
            <select 
              value={useCase} 
              onChange={(e) => setUseCase(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 capitalize"
            >
              {useCases.map(uc => <option key={uc} value={uc}>{uc}</option>)}
            </select>
          </div>

          <div className="pt-6 border-t border-slate-800">
            <p className="text-[10px] font-bold uppercase text-slate-500 mb-2">Selected Model</p>
            <p className="text-sm font-mono text-blue-400 bg-blue-500/10 p-3 rounded-lg border border-blue-500/20 break-all text-center">
              {selectedModel}
            </p>
          </div>
        </div>

        {/* Analytics Button */}
        <button
          onClick={() => setView('analytics')}
          className="mt-8 w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2.5 text-sm"
        >
          <BarChart3 size={18} strokeWidth={2.5} />
          View Analytics
        </button>

        <div className="mt-auto pt-6 text-[10px] text-slate-600 font-bold uppercase tracking-widest text-center">
          Joint Cloud Initiative
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col p-8 overflow-hidden">
        
        {/* Suggestion Notification */}
        <div className="h-10 mb-4 shrink-0">
          {suggestion && (
            <div className="bg-blue-900/20 border border-blue-500/30 p-2 px-4 rounded-lg text-xs text-blue-200 flex items-center gap-2 animate-pulse">
              {suggestion}
            </div>
          )}
          {error && (
            <div className="bg-red-900/20 border border-red-500/30 p-2 px-4 rounded-lg text-xs text-red-200 flex items-center gap-2">
              ❌ {error}
            </div>
          )}
        </div>

        {/* Interaction Group */}
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          
          {/* Compact Prompt Box */}
          <div className="flex flex-col gap-2 shrink-0">
            <label className="text-[10px] font-bold uppercase text-slate-500">Prompt</label>
            <textarea 
              value={prompt} 
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={showAttachment ? `Describe what you want to know about the attached file...` : `Enter instructions for ${selectedModel}...`}
              className="h-24 bg-slate-900 border border-slate-800 p-4 rounded-xl text-sm outline-none focus:border-blue-500 transition-all resize-none shadow-inner"
            />
          </div>

          {/* File Upload — vision & multimodality */}
          {showAttachment && (
            <div className="shrink-0">
              {!attachedFile ? (
                <label className="flex items-center justify-center gap-3 h-20 border-2 border-dashed border-slate-700 hover:border-blue-500/50 rounded-xl cursor-pointer transition-all hover:bg-slate-900/50 group">
                  <Paperclip size={20} className="text-slate-500 group-hover:text-blue-400 transition-colors" />
                  <span className="text-sm text-slate-500 group-hover:text-blue-400 transition-colors">
                    {useCase === 'vision' ? 'Attach an image' : 'Attach a file (image, audio, PDF, text)'}
                  </span>
                  <input type="file" accept={acceptTypes} onChange={handleFileChange} className="hidden" />
                </label>
              ) : (
                <div className="flex items-center gap-3 bg-slate-900 border border-slate-700 rounded-xl p-3">
                  {filePreview ? (
                    <img src={filePreview} alt="Preview" className="w-14 h-14 object-cover rounded-lg" />
                  ) : (
                    <div className="w-14 h-14 bg-slate-800 rounded-lg flex items-center justify-center">
                      {getFileIcon(attachedFile)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{attachedFile.name}</p>
                    <p className="text-[10px] text-slate-500">{(attachedFile.size / 1024).toFixed(1)} KB · {attachedFile.type || 'unknown'}</p>
                  </div>
                  <button onClick={removeFile} className="p-1.5 hover:bg-red-500/20 rounded-lg transition-all">
                    <X size={16} className="text-slate-400 hover:text-red-400" />
                  </button>
                </div>
              )}
            </div>
          )}
          
          <div className="flex gap-4 shrink-0">
            <button 
              onClick={handleGenerate} 
              disabled={isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-bold py-3 rounded-xl transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2.5"
            >
              {isLoading ? (
                <><Sparkles size={18} className="animate-spin" /> Analyzing...</>
              ) : (
                <><Play size={18} strokeWidth={2.5} /> Run with Model Matrix</>
              )}
            </button>
            <button 
              onClick={handleReset}
              className="px-10 border border-slate-700 hover:border-red-500/50 hover:bg-red-500/10 text-slate-400 hover:text-red-400 font-bold py-3 rounded-xl transition-all flex items-center gap-2"
            >
              <RotateCcw size={16} /> Reset
            </button>
          </div>

          {/* Large Response Box */}
          <div className="flex-1 flex flex-col gap-2 min-h-0">
            <label className="text-[10px] font-bold uppercase text-slate-500">Response</label>
            <div className="flex-1 bg-black/40 border border-slate-800 p-6 rounded-2xl text-sm text-slate-300 overflow-auto leading-relaxed markdown-body">
              {response ? <ReactMarkdown>{response}</ReactMarkdown> : <span className="text-slate-500">Ready for request...</span>}
            </div>
          </div>
        </div>

        {/* Metrics Footer with Latency */}
        <footer className="mt-6 pt-4 border-t border-slate-800 flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          <div className="flex gap-10">
            <p>Estimated Cost: <span className="text-green-500 font-mono">${metrics.cost}</span></p>
            <p>Latency: <span className="text-blue-400 font-mono">{metrics.latency}</span></p>
            <p>Input Tokens: <span className="text-slate-300 font-mono">{metrics.input}</span></p>
            <p>Output Tokens: <span className="text-slate-300 font-mono">{metrics.output}</span></p>
          </div>
          <p>CoreStack Platform</p>
        </footer>
      </main>
    </div>
  );
}

export default App;
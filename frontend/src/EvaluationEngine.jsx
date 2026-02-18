import { useState, useCallback, useEffect } from 'react';
import { 
  X, Play, Search, Trash2, ChevronDown, ChevronRight, 
  Settings2, User, Bot, Star, Info, Download, Upload, AlertCircle, Clock, Coins, Sparkles, Plus, Wand2, Save, MessageSquare
} from 'lucide-react';
import { modelRegistry, getModelsByProvider, getCapabilityBadges, capabilityKeys } from './data';

const API_BASE = 'http://localhost:8000/api';

const SCORE_LABELS = { 1: 'Very Poor', 2: 'Poor', 3: 'Average', 4: 'Good', 5: 'Excellent' };
const SCORE_COLORS = { 
  1: 'bg-red-500', 2: 'bg-orange-500', 3: 'bg-yellow-500', 4: 'bg-blue-500', 5: 'bg-green-500'
};

const SCORING_PRESETS = {
  'General Quality':       { desc: 'Overall response quality assessment', metrics: ['Correctness', 'Relevance', 'Clarity', 'Completeness'] },
  'Safety & Compliance':   { desc: 'Risk, bias, and policy compliance', metrics: ['Safety', 'Bias', 'Toxicity', 'Compliance'] },
  'Code Generation':       { desc: 'Code quality and best practices', metrics: ['Correctness', 'Efficiency', 'Readability', 'Security'] },
  'Summarization':         { desc: 'Summary accuracy and coverage', metrics: ['Accuracy', 'Conciseness', 'Coverage', 'Coherence'] },
  'Creative Writing':      { desc: 'Creativity, tone, and engagement', metrics: ['Creativity', 'Tone', 'Engagement', 'Grammar'] },
  'RAG / Retrieval':       { desc: 'Retrieval faithfulness and grounding', metrics: ['Relevance', 'Faithfulness', 'Completeness', 'Citation Accuracy'] },
  'Custom':                { desc: 'Define your own scoring criteria', metrics: [] },
};

function EvaluationEngine({ onBack }) {
  const [prompts, setPrompts] = useState(['Explain quantum physics in 100 words', 'Explain macroeconomics in 100 words']);
  const [evalModels, setEvalModels] = useState([]);
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scoringType, setScoringType] = useState('Manual');
  const [activeModal, setActiveModal] = useState(null);
  const [selectedPreset, setSelectedPreset] = useState('General Quality');
  const [criteria, setCriteria] = useState(SCORING_PRESETS['General Quality'].metrics);
  const [showPresetDropdown, setShowPresetDropdown] = useState(false);
  const [newCriterion, setNewCriterion] = useState('');
  
  // Model picker state
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [expandedProvider, setExpandedProvider] = useState(null);

  // Scoring state  
  const [manualScores, setManualScores] = useState({});
  const [manualComments, setManualComments] = useState({});
  const [aiScores, setAiScores] = useState({});
  const [isAiScoring, setIsAiScoring] = useState(false);
  const [savedScores, setSavedScores] = useState({}); // key: "prompt:model_id" → avg score
  const [judgeModel, setJudgeModel] = useState({ provider: 'Google', model_id: 'gemini-2.5-flash', display_name: 'Gemini 2.5 Flash' });
  const [showJudgeDropdown, setShowJudgeDropdown] = useState(false);
  const [history, setHistory] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState(null);

  // Fetch History on mount
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}/evaluation/history`);
      if (!res.ok) throw new Error('Failed to fetch history');
      const data = await res.json();
      setHistory(data);
      
      // If we have history, group it and show the latest batch
      if (data.length > 0) {
        const latestBatchId = data[0].batch_id;
        loadBatch(latestBatchId, data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadBatch = (batchId, allHistory = history) => {
    const batchResults = allHistory.filter(h => h.batch_id === batchId);
    if (batchResults.length === 0) return;

    setSelectedBatchId(batchId);
    
    // Reconstruct the 'results' structure used by the table
    const formattedResults = {
      results: batchResults.map(r => ({
        prompt: r.prompt,
        provider: r.provider,
        model_id: r.model_id,
        response: r.response,
        metrics: {
          input_tokens: r.input_tokens,
          output_tokens: r.output_tokens,
          cost: r.cost,
          latency_ms: r.latency_ms
        },
        scores: r.scores,
        ai_evaluations: r.ai_evaluations,
        prompt_quality: r.prompt_quality
      })),
      summary_metrics: {}, // Backend calculates this, but we can't easily from history without more logic
      prompt_metadata: {}
    };

    // Reconstruct prompt metadata and summary metrics
    const stats = {};
    batchResults.forEach(r => {
      formattedResults.prompt_metadata[r.prompt] = r.prompt_quality;
      const key = `${r.provider}:${r.model_id}`;
      if (!stats[key]) {
        stats[key] = { latencies: [], costs: [] };
      }
      stats[key].latencies.push(r.latency_ms);
      stats[key].costs.push(r.cost);
    });

    // Calculate actual averages
    Object.keys(stats).forEach(key => {
      const latencies = stats[key].latencies;
      const costs = stats[key].costs;
      formattedResults.summary_metrics[key] = {
        avg_latency: Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length),
        avg_cost: costs.reduce((a, b) => a + b, 0) / costs.length
      };
    });

    setResults(formattedResults);
    
    // Update local scoring state too
    const newManualScores = {};
    const newAiScores = {};
    batchResults.forEach(r => {
      const key = `${r.prompt}::${r.model_id}`;
      newManualScores[key] = r.scores;
      newAiScores[key] = r.ai_evaluations;
    });
    setManualScores(newManualScores);
    setAiScores(newAiScores);
    
    // Update prompts and models used in that batch
    const uniquePrompts = [...new Set(batchResults.map(r => r.prompt))];
    const uniqueModels = batchResults.reduce((acc, r) => {
      if (!acc.find(m => m.model_id === r.model_id)) {
        acc.push({ provider: r.provider, model_id: r.model_id, display_name: r.model_id });
      }
      return acc;
    }, []);
    setPrompts(uniquePrompts);
    setEvalModels(uniqueModels);
  };

  const groupedModels = getModelsByProvider();

  const addModel = (model) => {
    if (evalModels.find(m => m.model_id === model.model_id)) return;
    setEvalModels([...evalModels, { provider: model.provider, model_id: model.model_id, display_name: model.display_name }]);
    setShowModelPicker(false);
    setPickerSearch('');
  };

  const removeModel = (index) => {
    setEvalModels(evalModels.filter((_, i) => i !== index));
  };

  const selectPreset = (name) => {
    setSelectedPreset(name);
    setCriteria([...SCORING_PRESETS[name].metrics]);
    setShowPresetDropdown(false);
  };

  const addCriterion = () => {
    const val = newCriterion.trim();
    if (val && !criteria.includes(val)) {
      setCriteria([...criteria, val]);
      setNewCriterion('');
    }
  };

  const removeCriterion = (c) => {
    setCriteria(criteria.filter(x => x !== c));
  };

  const filteredRegistry = pickerSearch
    ? modelRegistry.filter(m => 
        m.display_name.toLowerCase().includes(pickerSearch.toLowerCase()) ||
        m.provider.toLowerCase().includes(pickerSearch.toLowerCase()) ||
        m.model_id.toLowerCase().includes(pickerSearch.toLowerCase())
      )
    : modelRegistry;

  const runEvaluation = async () => {
    if (evalModels.length === 0) {
      setError('Please add at least one model to evaluate.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setSavedScores({});
    setAiScores({});
    const filteredPrompts = prompts.filter(p => p.trim());
    try {
      const res = await fetch(`${API_BASE}/eval/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompts: filteredPrompts, 
          models: evalModels, 
          criteria,
          scoring_type: scoringType,
          judge_model: scoringType === 'AI' ? judgeModel.model_id : null,
          judge_provider: scoringType === 'AI' ? judgeModel.provider : null
        })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Evaluation failed');
      }
      const data = await res.json();
      setResults(data);

      // Auto-populate scores if returned (for AI Scoring mode)
      const newManualScores = {};
      const newAiScores = {};
      data.results.forEach(resp => {
        const key = getModalKey(resp);
        if (resp.scores) {
          newManualScores[key] = resp.scores;
        }
        if (resp.ai_evaluations) {
          newAiScores[key] = resp.ai_evaluations;
        }
      });
      setManualScores(prev => ({ ...prev, ...newManualScores }));
      setAiScores(prev => ({ ...prev, ...newAiScores }));
      
      // Update history list
      fetchHistory();
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Scoring Functions ───────────────────────────────────
  const getModalKey = (resp) => `${resp.prompt}::${resp.model_id}`;

  const updateManualScore = (metric, score) => {
    if (!activeModal) return;
    const key = getModalKey(activeModal);
    setManualScores(prev => ({
      ...prev,
      [key]: { ...(prev[key] || {}), [metric]: score }
    }));
  };

  const updateManualComment = (metric, comment) => {
    if (!activeModal) return;
    const key = getModalKey(activeModal);
    setManualComments(prev => ({
      ...prev,
      [key]: { ...(prev[key] || {}), [metric]: comment }
    }));
  };

  const getScoreForMetric = (resp, metric) => {
    const key = getModalKey(resp);
    return manualScores[key]?.[metric] || 0;
  };

  const getCommentForMetric = (resp, metric) => {
    const key = getModalKey(resp);
    return manualComments[key]?.[metric] || '';
  };

  const getAiScoresForResp = (resp) => {
    const key = getModalKey(resp);
    return aiScores[key] || null;
  };

  const getAvgScore = (resp) => {
    const key = getModalKey(resp);
    if (savedScores[key]) return savedScores[key];
    const scores = manualScores[key];
    if (!scores) return null;
    const vals = Object.values(scores).filter(v => v > 0);
    return vals.length > 0 ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : null;
  };

  const handleRunAiScore = async (resp) => {
    const key = getModalKey(resp);
    setIsAiScoring(true);
    try {
      const res = await fetch(`${API_BASE}/eval/ai-score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: resp.prompt,
          response: resp.response,
          metrics: criteria,
          judge_model: judgeModel.model_id,
          judge_provider: judgeModel.provider,
        }),
      });
      if (!res.ok) throw new Error('AI Scoring failed');
      const data = await res.json();
      
      setAiScores(prev => ({ ...prev, [key]: data.ai_evaluation }));
      
      // Auto-fill manual scores with AI scores
      const newScores = {};
      for (const item of data.ai_evaluation) {
        newScores[item.metric] = item.score;
      }
      setManualScores(prev => ({ ...prev, [key]: { ...(prev[key] || {}), ...newScores } }));
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiScoring(false);
    }
  };

  const handleSaveScore = async () => {
    if (!activeModal) return;
    const key = getModalKey(activeModal);
    const scores = manualScores[key] || {};
    const comments = manualComments[key] || {};
    
    const scoreList = criteria.map(c => ({
      metric: c,
      score: scores[c] || 0,
      comment: comments[c] || '',
    }));
    
    try {
      const res = await fetch(`${API_BASE}/eval/save-scores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: activeModal.prompt,
          provider: activeModal.provider,
          model_id: activeModal.model_id,
          scores: scoreList,
        }),
      });
      const data = await res.json();
      setSavedScores(prev => ({ ...prev, [key]: data.avg_score }));
      setActiveModal(null);
    } catch (err) {
      console.error(err);
    }
  };

  const getModelEntry = (model_id) => modelRegistry.find(m => m.model_id === model_id);

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-white tracking-tight">Gen AI Evaluation Engine</h1>
          <p className="text-xs text-slate-500 font-medium">Benchmark model quality, speed, and cost across batch prompts</p>
        </div>
        <div className="flex gap-3">
          {history.length > 0 && (
            <div className="relative group">
              <button 
                className="flex items-center gap-2 px-4 py-2 bg-[#0f172a] border border-slate-700 rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors text-indigo-400"
                onClick={() => setShowPresetDropdown(!showPresetDropdown)} // Reusing dropdown state for simplicity or adding new one
              >
                <Clock size={14} /> View History ({[...new Set(history.map(h => h.batch_id))].length})
              </button>
              
              {/* History Dropdown */}
              <div className="absolute right-0 top-full mt-2 w-[300px] bg-[#0f172a] border border-slate-700 rounded-xl shadow-2xl z-50 hidden group-hover:block animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-3 border-b border-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Recent Evaluations</div>
                <div className="max-h-[300px] overflow-y-auto">
                  {[...new Set(history.map(h => h.batch_id))].map(batchId => {
                    const firstItem = history.find(h => h.batch_id === batchId);
                    return (
                      <button 
                        key={batchId}
                        onClick={() => loadBatch(batchId)}
                        className={`w-full text-left px-4 py-3 hover:bg-slate-800/50 transition-all border-b border-slate-800/50 last:border-0 ${selectedBatchId === batchId ? 'bg-indigo-500/5 border-l-2 border-indigo-500' : 'border-l-2 border-transparent'}`}
                      >
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-bold text-slate-300 truncate">{firstItem.prompt}</span>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-slate-500">{new Date(firstItem.created_at).toLocaleString()}</span>
                            <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/10">
                              {history.filter(h => h.batch_id === batchId).length} Results
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold hover:bg-slate-700 transition-colors text-slate-300">
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex items-center gap-3 text-xs text-red-300 animate-in fade-in duration-200">
          <AlertCircle size={16} className="text-red-400 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto p-1 hover:bg-red-500/20 rounded"><X size={14} /></button>
        </div>
      )}

      {/* Control Panel */}
      <div className="grid grid-cols-12 gap-8">
        
        {/* Input Prompts */}
        <section className="col-span-5 bg-[#1e293b]/20 border border-slate-800/50 rounded-2xl p-6 flex flex-col gap-4">
          <label className="text-sm font-bold uppercase text-slate-500 tracking-widest">Input Prompts ({prompts.length})</label>
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[400px]">
            {prompts.map((p, idx) => (
              <div key={idx} className="relative group">
                <textarea
                  value={p}
                  onChange={(e) => {
                    const updated = [...prompts];
                    updated[idx] = e.target.value;
                    setPrompts(updated);
                  }}
                  className="w-full bg-[#0f172a] border border-slate-800 p-3 pr-10 rounded-xl text-sm outline-none focus:border-indigo-500 transition-all resize-none shadow-inner text-slate-200 min-h-[56px]"
                  placeholder={`Prompt ${idx + 1}...`}
                  rows={2}
                />
                <div className="absolute top-2 right-2 flex items-center gap-1">
                  <span className="text-[9px] font-bold text-slate-700 bg-slate-800/80 px-1.5 py-0.5 rounded">#{idx + 1}</span>
                  {prompts.length > 1 && (
                    <button
                      onClick={() => setPrompts(prompts.filter((_, i) => i !== idx))}
                      className="p-1 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded transition-all opacity-0 group-hover:opacity-100"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => setPrompts([...prompts, ''])}
            className="w-full py-2.5 bg-[#0f172a]/50 border border-slate-800 border-dashed rounded-xl text-xs font-bold uppercase text-slate-500 hover:text-indigo-400 hover:border-indigo-500/50 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={14} /> Add New Prompt
          </button>
        </section>

        {/* Configuration */}
        <div className="col-span-7 flex flex-col gap-6">
          
          {/* Scoring Config */}
          <section className="bg-[#1e293b]/20 border border-slate-800/50 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-2">
                <Settings2 size={16} className="text-slate-500" />
                <label className="text-sm font-bold text-white">Scoring Configuration</label>
              </div>
              <div className="flex bg-[#0f172a] p-1 rounded-lg border border-slate-800">
                <button 
                  onClick={() => setScoringType('Manual')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all ${scoringType === 'Manual' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  <User size={14} /> Manual
                </button>
                <button 
                  onClick={() => setScoringType('AI')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all ${scoringType === 'AI' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  <Bot size={14} /> AI Score
                </button>
              </div>
            </div>

            {scoringType === 'Manual' ? (
              <>
                {/* Preset Dropdown */}
                <div className="relative mb-4">
                  <button
                    onClick={() => setShowPresetDropdown(!showPresetDropdown)}
                    className="w-full flex items-center justify-between bg-[#0f172a] border border-slate-800 rounded-xl px-4 py-3 text-sm text-left hover:border-slate-700 transition-all group"
                  >
                    <div>
                      <span className="font-bold text-white">{selectedPreset}</span>
                      <p className="text-xs text-slate-500 mt-0.5">{SCORING_PRESETS[selectedPreset].desc}</p>
                    </div>
                    <ChevronDown size={14} className={`text-slate-500 transition-transform ${showPresetDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {showPresetDropdown && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-[#0f172a] border border-slate-700 rounded-xl shadow-2xl z-40 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      {Object.entries(SCORING_PRESETS).map(([name, preset]) => (
                        <button
                          key={name}
                          onClick={() => selectPreset(name)}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-all ${
                            selectedPreset === name
                              ? 'bg-indigo-500/10 border-l-2 border-indigo-500'
                              : 'hover:bg-slate-800/50 border-l-2 border-transparent'
                          }`}
                        >
                          <div className="flex-1">
                            <span className={`font-bold ${selectedPreset === name ? 'text-indigo-300' : 'text-slate-300'}`}>{name}</span>
                            <p className="text-xs text-slate-500 mt-0.5">{preset.desc}</p>
                          </div>
                          <div className="flex gap-1 flex-wrap justify-end max-w-[160px]">
                            {preset.metrics.length > 0 ? preset.metrics.slice(0, 2).map(m => (
                              <span key={m} className="px-2 py-0.5 text-[9px] font-bold bg-slate-800 text-slate-500 rounded border border-slate-700/50">{m}</span>
                            )) : <span className="text-[9px] text-slate-600 italic">empty — add your own</span>}
                            {preset.metrics.length > 2 && (
                              <span className="px-2 py-0.5 text-[9px] font-bold bg-slate-800 text-slate-500 rounded border border-slate-700/50">+{preset.metrics.length - 2}</span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Active Metrics — removable */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {criteria.map(tag => (
                    <span key={tag} className="px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold rounded-full flex items-center gap-2 hover:bg-red-500/10 hover:border-red-500/30 group cursor-pointer transition-colors"
                      onClick={() => removeCriterion(tag)}
                    >
                      {tag} <X size={10} className="group-hover:text-red-400" />
                    </span>
                  ))}
                  {criteria.length === 0 && (
                    <span className="text-xs text-slate-600 italic">No criteria — add below or pick a preset</span>
                  )}
                </div>

                {/* Custom Criteria Input */}
                <div className="relative">
                  <input 
                    type="text" 
                    value={newCriterion}
                    onChange={(e) => setNewCriterion(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addCriterion()}
                    placeholder="Add custom criteria (e.g. Tone, Safety)..." 
                    className="w-full bg-[#0f172a] border border-slate-800 text-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-all pr-10"
                  />
                  <button 
                    onClick={addCriterion}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md text-white transition-colors"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </>
            ) : (
              /* AI Score Mode */
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-purple-500/5 to-indigo-500/5 border border-purple-500/20 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
                      <Wand2 size={16} className="text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-white">AI Judge</h3>
                      <p className="text-xs text-slate-500">Automated evaluation with justifications</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    The AI Judge will independently score each response on a <span className="text-purple-300 font-bold">1-5 scale</span> with 
                    written justifications per metric.
                  </p>
                </div>

                {/* Judge Model Selector */}
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-2 block">Judge Model</label>
                  <div className="relative">
                    <button
                      onClick={() => setShowJudgeDropdown(!showJudgeDropdown)}
                      className="w-full flex items-center justify-between bg-[#0f172a] border border-purple-500/30 rounded-xl px-4 py-3 text-sm text-left hover:border-purple-500/50 transition-all"
                    >
                      <div>
                        <span className="font-bold text-purple-300">{judgeModel.display_name}</span>
                        <span className="text-xs text-slate-500 ml-2">{judgeModel.provider}</span>
                      </div>
                      <ChevronDown size={14} className={`text-slate-500 transition-transform ${showJudgeDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    {showJudgeDropdown && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-[#0f172a] border border-slate-700 rounded-xl shadow-2xl z-40 max-h-[200px] overflow-y-auto">
                        {modelRegistry.map(m => (
                          <button
                            key={m.model_id}
                            onClick={() => {
                              setJudgeModel({ provider: m.provider, model_id: m.model_id, display_name: m.display_name });
                              setShowJudgeDropdown(false);
                            }}
                            className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-all ${
                              judgeModel.model_id === m.model_id
                                ? 'bg-purple-500/10 border-l-2 border-purple-500'
                                : 'hover:bg-slate-800/50 border-l-2 border-transparent'
                            }`}
                          >
                            <span className={`font-bold ${judgeModel.model_id === m.model_id ? 'text-purple-300' : 'text-slate-300'}`}>{m.display_name}</span>
                            <span className="text-xs text-slate-600">{m.provider}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* AI will score these metrics */}
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-2 block">Metrics the AI will evaluate</label>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-3 py-1.5 bg-indigo-500/20 border border-indigo-500/40 text-indigo-200 text-xs font-bold rounded-full flex items-center gap-1.5">
                      <Sparkles size={12} className="text-indigo-400" /> Prompt Quality (Mandatory)
                    </span>
                    {criteria.map(tag => (
                      <span key={tag} className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-bold rounded-full flex items-center gap-1.5 group cursor-pointer hover:bg-red-500/10 hover:border-red-500/30 transition-colors"
                        onClick={() => removeCriterion(tag)}
                      >
                        <Sparkles size={12} /> {tag} <X size={10} className="ml-1 opacity-0 group-hover:opacity-100 text-red-400" />
                      </span>
                    ))}
                  </div>

                  {/* Common Metrics Selection */}
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-[0.2em] mb-2 block">Available Metrics</label>
                  <div className="flex flex-wrap gap-1.5">
                    {['Correctness', 'Relevance', 'Clarity', 'Completeness', 'Safety', 'Tone', 'Compliance', 'Security', 'Efficiency'].map(m => {
                      const isSelected = criteria.includes(m);
                      return (
                        <button
                          key={m}
                          onClick={() => isSelected ? removeCriterion(m) : setCriteria([...criteria, m])}
                          className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border ${
                            isSelected 
                              ? 'bg-purple-600 text-white border-transparent shadow-lg shadow-purple-600/20' 
                              : 'bg-[#0f172a] text-slate-500 border-slate-800 hover:border-slate-700 hover:text-slate-300'
                          }`}
                        >
                          {isSelected ? <Plus size={10} className="rotate-45 inline mr-1" /> : <Plus size={10} className="inline mr-1" />}
                          {m}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Evaluation Models */}
          <section className="bg-[#1e293b]/20 border border-slate-800/50 rounded-2xl p-6 flex flex-col gap-4 relative">
            <label className="text-sm font-bold uppercase text-slate-500 tracking-widest">Evaluation Models</label>
            <div className="space-y-3">
              {evalModels.map((m, idx) => {
                const entry = getModelEntry(m.model_id);
                const badges = entry ? getCapabilityBadges(entry) : [];
                return (
                  <div key={idx} className="flex flex-col gap-2 p-3 bg-[#0f172a] border border-slate-800 rounded-xl group hover:border-slate-700 transition-all">
                    <div className="flex items-center gap-3">
                      <ChevronRight size={14} className="text-slate-600" />
                      <div className="flex-1">
                        <span className="text-sm font-bold text-slate-300">{m.display_name || m.model_id}</span>
                        <span className="text-xs text-slate-600 ml-2">{m.provider}</span>
                      </div>
                      <button onClick={() => removeModel(idx)} className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                        <Trash2 size={14} />
                      </button>
                    </div>
                    {badges.length > 0 && (
                      <div className="flex flex-wrap gap-1 pl-7">
                        {badges.slice(0, 5).map(b => (
                          <span key={b} className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-slate-500 border border-slate-700/50 uppercase">
                            {b.replace('_', ' ')}
                          </span>
                        ))}
                        {entry && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-green-900/20 text-green-500 border border-green-500/20">
                            ${entry.cost_per_1k}/1k
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Add Model Button / Picker */}
            <div className="relative">
              <button 
                onClick={() => setShowModelPicker(!showModelPicker)}
                className="w-full py-3 bg-[#0f172a]/50 border border-slate-800 border-dashed rounded-xl text-xs font-bold uppercase text-slate-500 hover:text-indigo-400 hover:border-indigo-500/50 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={14} /> Add Model to Evaluate
              </button>

              {showModelPicker && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-[#0f172a] border border-slate-700 rounded-xl shadow-2xl z-40 max-h-[400px] overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-3 border-b border-slate-800">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        value={pickerSearch}
                        onChange={(e) => setPickerSearch(e.target.value)}
                        placeholder="Search models..."
                        className="w-full bg-slate-900 border border-slate-800 text-slate-300 rounded-lg pl-9 pr-4 py-2 text-sm outline-none focus:border-indigo-500 transition-all"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-2">
                    {pickerSearch ? (
                      filteredRegistry.map(m => {
                        const isAdded = evalModels.find(em => em.model_id === m.model_id);
                        return (
                          <button key={m.model_id} onClick={() => !isAdded && addModel(m)} disabled={isAdded}
                            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center gap-3 transition-all ${isAdded ? 'opacity-40 cursor-not-allowed' : 'hover:bg-indigo-500/10 cursor-pointer'}`}>
                            <div className="flex-1">
                              <span className="font-bold text-slate-200">{m.display_name}</span>
                              <span className="text-slate-500 ml-2">{m.provider}</span>
                            </div>
                            <span className="text-[10px] font-bold text-green-400">${m.cost_per_1k}/1k</span>
                            {isAdded && <span className="text-[10px] text-indigo-400 font-bold">Added</span>}
                          </button>
                        );
                      })
                    ) : (
                      Object.entries(groupedModels).map(([provider, models]) => (
                        <div key={provider} className="mb-1">
                          <button onClick={() => setExpandedProvider(expandedProvider === provider ? null : provider)}
                            className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold uppercase text-slate-500 hover:text-white hover:bg-slate-800/50 transition-all flex items-center gap-2 tracking-widest">
                            <ChevronDown size={12} className={`transition-transform ${expandedProvider === provider ? 'rotate-0' : '-rotate-90'}`} />
                            {provider}
                            <span className="text-[10px] text-slate-600 font-normal ml-auto normal-case tracking-normal">{models.length} models</span>
                          </button>
                          
                          {expandedProvider === provider && models.map(m => {
                            const isAdded = evalModels.find(em => em.model_id === m.model_id);
                            const badges = getCapabilityBadges(m);
                            return (
                              <button key={m.model_id} onClick={() => !isAdded && addModel(m)} disabled={isAdded}
                                className={`w-full text-left px-3 py-2.5 pl-8 rounded-lg text-sm flex flex-col gap-1.5 transition-all ${isAdded ? 'opacity-40 cursor-not-allowed' : 'hover:bg-indigo-500/10 cursor-pointer'}`}>
                                <div className="flex items-center gap-3 w-full">
                                  <span className="font-bold text-slate-200 flex-1">{m.display_name}</span>
                                  <span className="text-[10px] font-bold text-green-400">${m.cost_per_1k}/1k</span>
                                  <span className="text-[10px] text-slate-600">{m.latency}ms</span>
                                  {isAdded && <span className="text-[10px] text-indigo-400 font-bold">Added</span>}
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {badges.map(b => (
                                    <span key={b} className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-slate-500 border border-slate-700/50 uppercase">
                                      {b.replace('_', ' ')}
                                    </span>
                                  ))}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-2 border-t border-slate-800">
                    <button 
                      onClick={() => { setShowModelPicker(false); setPickerSearch(''); }}
                      className="w-full py-2 text-xs font-bold text-slate-500 hover:text-white transition-colors"
                    >Close</button>
                  </div>
                </div>
              )}
            </div>
          </section>

          <button 
            onClick={runEvaluation}
            disabled={isLoading || evalModels.length === 0}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-3 text-sm"
          >
            {isLoading ? <Sparkles size={18} className="animate-spin" /> : <Play size={16} fill="currentColor" />}
            Run Evaluation
          </button>
        </div>
      </div>

      {/* Comparison Results */}
      {results && (
        <div className="bg-[#1e293b]/20 border border-slate-800/50 rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 duration-500">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1e293b]/40 border-b border-slate-800/50">
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-widest w-[20%]">Prompt</th>
                {evalModels.map((m, i) => (
                  <th key={i} className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-widest border-l border-slate-800/50">
                    <div className="flex flex-col gap-1">
                      <span>{m.display_name || m.model_id}</span>
                      <span className="text-[10px] text-slate-600 normal-case font-normal">{m.provider}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.results.reduce((acc, curr) => {
                const existing = acc.find(a => a.prompt === curr.prompt);
                if (existing) {
                  existing.responses.push(curr);
                } else {
                  acc.push({ prompt: curr.prompt, responses: [curr] });
                }
                return acc;
              }, []).map((row, i) => (
                <tr key={i} className="border-b border-slate-800/30 hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-8 text-sm text-slate-400 leading-relaxed font-medium align-top">
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-slate-300 font-bold">Prompt</span>
                        <span>{row.prompt}</span>
                      </div>
                      
                      {results?.prompt_metadata?.[row.prompt] && (
                        <div className="bg-[#0f172a] border border-slate-800 p-4 rounded-xl flex flex-col gap-2.5 shadow-inner">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Prompt Accuracy</span>
                            <span className={`text-sm font-mono font-bold ${
                              results.prompt_metadata[row.prompt].score >= 4 ? 'text-green-400' : 
                              results.prompt_metadata[row.prompt].score >= 3 ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                              {results.prompt_metadata[row.prompt].score}/5
                            </span>
                          </div>
                          <div className="h-px bg-slate-800/50 w-full" />
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-bold text-slate-600 bg-slate-800/50 px-1.5 py-0.5 rounded uppercase">Intent</span>
                              <p className="text-[11px] text-slate-400 font-medium italic">"{results.prompt_metadata[row.prompt].intent_detected}"</p>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">{results.prompt_metadata[row.prompt].summary}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                  {row.responses.map((resp, j) => {
                    const avg = getAvgScore(resp);
                    return (
                    <td key={j} className="px-6 py-6 border-l border-slate-800/50 align-top">
                      <div className="flex flex-col gap-4">
                        <div className="text-xs text-slate-300 leading-relaxed h-[60px] overflow-hidden relative">
                          {resp.response}
                          <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-[#0f172a]/20 to-transparent"></div>
                        </div>
                        
                        <div className="flex items-center flex-wrap gap-2">
                          <span className="flex items-center gap-1 text-xs font-bold text-green-400 bg-green-500/10 px-2.5 py-1 rounded border border-green-500/20">
                            <Coins size={12} /> ${resp.metrics.cost.toFixed(6)}
                          </span>
                          <span className="flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-800 px-2.5 py-1 rounded border border-slate-700">
                            <Clock size={12} /> {resp.metrics.latency_ms}ms
                          </span>
                          
                          {/* Score Badge */}
                          {avg && (
                            <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded border ${
                              avg >= 4 ? 'text-green-400 bg-green-500/10 border-green-500/20' :
                              avg >= 3 ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' :
                              'text-red-400 bg-red-500/10 border-red-500/20'
                            }`}>
                              <Star size={12} /> {avg}/5
                            </span>
                          )}
                          
                          <button 
                            onClick={() => setActiveModal(resp)}
                            className="ml-auto flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md text-xs font-bold text-slate-300 transition-colors"
                          >
                            <Star size={12} /> {scoringType === 'AI' ? 'AI Score' : 'Rate'}
                          </button>
                        </div>
                      </div>
                    </td>
                    );
                  })}
                </tr>
              ))}
              
              {/* Summary Rows */}
              <tr className="bg-indigo-500/5">
                <td className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest">Avg Score</td>
                {evalModels.map((m, i) => {
                  const promptRows = results.results.filter(r => r.model_id === m.model_id);
                  const avgs = promptRows.map(r => getAvgScore(r)).filter(Boolean).map(Number);
                  const modelAvg = avgs.length > 0 ? (avgs.reduce((a,b) => a+b, 0) / avgs.length).toFixed(1) : '--';
                  return (
                    <td key={i} className="px-6 py-3 border-l border-slate-800/50 font-bold text-white text-sm">{modelAvg}</td>
                  );
                })}
              </tr>
              <tr className="bg-green-500/5">
                <td className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest">Avg Latency</td>
                {evalModels.map((m, i) => (
                  <td key={i} className="px-6 py-3 border-l border-slate-800/30 text-sm font-bold text-green-400">
                    {results.summary_metrics[`${m.provider}:${m.model_id}`]?.avg_latency} ms
                  </td>
                ))}
              </tr>
              <tr className="bg-blue-500/5">
                <td className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest">Avg Cost</td>
                {evalModels.map((m, i) => (
                  <td key={i} className="px-6 py-3 border-l border-slate-800/30 text-sm font-bold text-blue-400">
                    ${results.summary_metrics[`${m.provider}:${m.model_id}`]?.avg_cost?.toFixed(6)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* ── Scoring Modal ──────────────────────────────────── */}
      {activeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-end p-4">
          <div className="w-[680px] h-full bg-[#0f172a] border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 rounded-l-3xl">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-white uppercase tracking-widest">Evaluation Details</h2>
                <p className="text-xs text-slate-500 mt-1">{scoringType === 'AI' ? 'AI Judge Scoring' : 'Manual Scoring'} • 1-5 Scale</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {/* Context */}
              <section>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 block">Prompt</label>
                <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl text-sm text-slate-400 italic">
                  {activeModal.prompt}
                </div>
              </section>

               {/* Prompt Quality Analysis (Mandatory) */}
               {activeModal.prompt_quality && (
                <section className="bg-indigo-500/5 border border-indigo-500/20 p-6 rounded-2xl animate-in slide-in-from-top-2 duration-300">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <Wand2 size={16} className="text-indigo-400" />
                      <label className="text-xs font-bold text-white uppercase tracking-widest">Prompt Quality (AI Analysis)</label>
                    </div>
                    <span className={`text-base font-mono font-bold ${
                      activeModal.prompt_quality.score >= 4 ? 'text-green-400' : activeModal.prompt_quality.score >= 3 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {activeModal.prompt_quality.score}/5
                    </span>
                  </div>
                  <div className="bg-[#0f172a] border border-slate-800 p-4 rounded-xl text-xs text-slate-300 leading-relaxed italic">
                    {activeModal.prompt_quality.summary}
                  </div>
                </section>
               )}

              <section>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 block">Model Response ({activeModal.model_id})</label>
                <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl text-sm text-slate-300 leading-relaxed font-mono max-h-[200px] overflow-y-auto">
                  {activeModal.response}
                </div>
              </section>



              {/* Scoring Section */}
              <section className="bg-indigo-500/5 border border-indigo-500/10 p-6 rounded-2xl space-y-6">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-white uppercase tracking-widest">
                    {scoringType === 'AI' ? 'AI Scores' : 'Manual Scoring'} ({criteria.length} metrics)
                  </label>
                  {(() => {
                    const key = getModalKey(activeModal);
                    const scores = manualScores[key];
                    if (!scores) return null;
                    const vals = Object.values(scores).filter(v => v > 0);
                    if (vals.length === 0) return null;
                    const avg = (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
                    return <span className="text-xs font-bold text-indigo-400 uppercase">AVG: {avg}/5</span>;
                  })()}
                </div>
                
                {criteria.map(c => {
                  const score = getScoreForMetric(activeModal, c);
                  const comment = getCommentForMetric(activeModal, c);
                  const aiData = getAiScoresForResp(activeModal);
                  const aiItem = aiData?.find(a => a.metric === c);
                  
                  return (
                    <div key={c} className="space-y-3 pb-5 border-b border-slate-800/30 last:border-none last:pb-0">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-slate-300">{c}</span>
                        <span className={`text-base font-mono font-bold ${
                          score >= 4 ? 'text-green-400' : score >= 3 ? 'text-yellow-400' : score >= 1 ? 'text-red-400' : 'text-slate-600'
                        }`}>
                          {score > 0 ? `${score}/5` : '--'}
                        </span>
                      </div>
                      
                      {/* Score Buttons (1-5) */}
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(s => (
                          <button
                            key={s}
                            onClick={() => updateManualScore(c, s)}
                            className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all border ${
                              score === s 
                                ? `${SCORE_COLORS[s]} text-white border-transparent shadow-lg scale-105` 
                                : 'bg-slate-900 text-slate-500 border-slate-800 hover:border-slate-600 hover:text-slate-300'
                            }`}
                          >
                            {s}
                            <span className="block text-[9px] opacity-70 mt-0.5">{SCORE_LABELS[s]}</span>
                          </button>
                        ))}
                      </div>

                      {/* AI Justification */}
                      {aiItem && (
                        <div className="bg-purple-500/5 border border-purple-500/20 p-3.5 rounded-lg flex items-start gap-2.5 mt-1">
                          <Bot size={14} className="text-purple-400 shrink-0 mt-0.5" />
                          <p className="text-xs text-purple-300 leading-relaxed">{aiItem.reason}</p>
                        </div>
                      )}


                    </div>
                  );
                })}
              </section>
            </div>

            <div className="p-6 border-t border-slate-800 bg-slate-900/20 flex gap-4">
              <button onClick={() => setActiveModal(null)} className="flex-1 py-3.5 border border-slate-700 text-sm font-bold rounded-xl hover:bg-slate-800 transition-colors text-slate-400">Cancel</button>
              <button 
                onClick={handleSaveScore}
                className="flex-1 py-3.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
              >
                <Save size={16} /> Save Score
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EvaluationEngine;

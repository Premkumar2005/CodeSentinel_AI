import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Bug, FileCode2, Activity, History as HistoryIcon, Loader2, AlertCircle, CheckCircle, Zap, Download } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('editor'); // 'editor', 'history'
  const [code, setCode] = useState('# Write your code here\ndef example_function():\n    import os\n    pass');
  const [language, setLanguage] = useState('python');
  const [analysisType, setAnalysisType] = useState('default');
  
  const [isInspecting, setIsInspecting] = useState(false);
  const [results, setResults] = useState(null);
  const [history, setHistory] = useState([]);

  const fetchHistory = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (e) {
      console.error("Failed to fetch history", e);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  const handleInspect = async () => {
    setIsInspecting(true);
    setResults(null);
    try {
      const response = await fetch('http://localhost:8000/api/inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language, analysis_type: analysisType })
      });
      if (response.ok) {
        const data = await response.json();
        setResults(data);
      } else {
        const error = await response.json();
        alert(`Error: ${error.detail || 'Failed to inspect code'}`);
      }
    } catch (error) {
      console.error("Inspection error:", error);
      alert("Failed to connect to the backend. Ensure FastAPI is running.");
    } finally {
      setIsInspecting(false);
    }
  };

  const handleDownloadReport = () => {
    if (!results) return;
    
    const reportContent = `# CodeSentinel AI Analysis Report\n\n## Language: ${language}\n## Focus: ${analysisType}\n\n### Issues Detected:\n${results.issues.length > 0 ? results.issues.map(i => `- Line ${i.line}: [${i.code}] ${i.message}`).join('\n') : 'No static analysis issues found.'}\n\n### AI Explanation:\n${results.ai_explanation}\n\n### Complexity:\n${results.complexity}\n\n### Suggested Fix:\n\`\`\`${language}\n${results.corrected_code}\n\`\`\`\n`;
    
    const blob = new Blob([reportContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CodeSentinel_Report_${new Date().getTime()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-screen bg-[#0d1117] text-white font-sans">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-[#161b22] shadow-sm">
        <div className="flex items-center gap-3">
          <Bug className="text-blue-500" size={28} />
          <h1 className="text-xl font-bold tracking-wide">CodeSentinel AI</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-[#0d1117] border border-gray-700 text-sm rounded-md px-3 py-2 outline-none focus:border-blue-500"
          >
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
          </select>

          <select 
            value={analysisType} 
            onChange={(e) => setAnalysisType(e.target.value)}
            className="bg-[#0d1117] border border-gray-700 text-sm rounded-md px-3 py-2 outline-none focus:border-blue-500"
          >
            <option value="default">Default Review</option>
            <option value="performance">Optimize Performance</option>
            <option value="security">Security Audit</option>
            <option value="readability">Enhance Readability</option>
          </select>

          <button 
            onClick={handleInspect}
            disabled={isInspecting}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed transition-colors rounded-md font-semibold text-sm shadow-md"
          >
            {isInspecting ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            {isInspecting ? 'Inspecting...' : 'Inspect Code'}
          </button>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Sidebar */}
        <aside className="w-64 border-r border-gray-800 bg-[#161b22] p-4 flex flex-col gap-2">
          <button 
            onClick={() => setActiveTab('editor')}
            className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-left ${activeTab === 'editor' ? 'text-white bg-gray-800' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
          >
            <FileCode2 size={18} />
            Code Editor
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-left ${activeTab === 'history' ? 'text-white bg-gray-800' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
          >
            <HistoryIcon size={18} />
            History
          </button>
        </aside>

        {/* Content Area */}
        {activeTab === 'editor' ? (
          <>
            <main className="flex-1 flex flex-col">
              <div className="flex items-center justify-between px-4 py-2 bg-[#0d1117] border-b border-gray-800">
                 <span className="text-sm text-gray-400 font-medium">main.{language === 'python' ? 'py' : language === 'javascript' ? 'js' : language === 'java' ? 'java' : 'cpp'}</span>
                 <span className="text-xs text-blue-400 bg-blue-400/10 px-2 py-1 rounded border border-blue-400/20 capitalize">{language}</span>
              </div>
              <div className="flex-1 relative">
                <Editor
                  height="100%"
                  language={language}
                  theme="vs-dark"
                  value={code}
                  onChange={(value) => setCode(value)}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    padding: { top: 16 },
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace"
                  }}
                />
              </div>
            </main>
            
            {/* Results Panel */}
            <aside className="w-[450px] border-l border-gray-800 bg-[#161b22] flex flex-col">
              <div className="p-4 border-b border-gray-800 bg-[#0d1117] flex justify-between items-center">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Activity className="text-green-500" size={20} />
                  Analysis Results
                </h2>
                {results && (
                  <button onClick={handleDownloadReport} className="text-gray-400 hover:text-white transition-colors" title="Download Report">
                    <Download size={18} />
                  </button>
                )}
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
                {!results && !isInspecting && (
                  <div className="text-center text-gray-500 mt-10">
                    <Zap size={32} className="mx-auto mb-3 opacity-50" />
                    <p>Run <span className="text-blue-400 font-medium">Inspect Code</span> to analyze your script.</p>
                  </div>
                )}

                {isInspecting && (
                  <div className="text-center text-gray-400 mt-10">
                    <Loader2 size={32} className="mx-auto mb-3 animate-spin text-blue-500" />
                    <p>Analyzing code with AI...</p>
                  </div>
                )}

                {results && (
                  <>
                    {/* Issues Section */}
                    {language === 'python' && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                          {results.issues.length > 0 ? <AlertCircle size={16} className="text-red-400" /> : <CheckCircle size={16} className="text-green-400" />}
                          Static Analysis ({results.issues.length})
                        </h3>
                        <div className="flex flex-col gap-2">
                          {results.issues.length === 0 ? (
                            <p className="text-sm text-green-400 bg-green-400/10 p-3 rounded-md border border-green-400/20">No linting issues found!</p>
                          ) : (
                            results.issues.map((issue, idx) => (
                              <div key={idx} className="p-3 border border-red-500/30 rounded-md bg-red-500/5">
                                <div className="flex items-start justify-between mb-1">
                                  <span className="font-mono text-xs font-bold text-red-400">{issue.code}</span>
                                  <span className="text-xs text-gray-500">Line {issue.line}</span>
                                </div>
                                <p className="text-sm text-gray-300">{issue.message}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    {/* AI Explanation Section */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">AI Explanation</h3>
                      <div className="p-4 bg-[#0d1117] border border-gray-700 rounded-md">
                        <p className="text-sm text-gray-300 whitespace-pre-wrap">{results.ai_explanation}</p>
                      </div>
                    </div>
                    
                    {/* Complexity Section */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">Complexity</h3>
                      <div className="p-4 bg-[#0d1117] border border-gray-700 rounded-md">
                        <p className="text-sm text-blue-300 font-mono">{results.complexity}</p>
                      </div>
                    </div>

                    {/* Corrected Code Section */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">Suggested Fix</h3>
                      <div className="border border-gray-700 rounded-md overflow-hidden">
                        <Editor
                          height="200px"
                          language={language}
                          theme="vs-dark"
                          value={results.corrected_code}
                          options={{ readOnly: true, minimap: { enabled: false }, fontSize: 12 }}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </aside>
          </>
        ) : (
          <main className="flex-1 p-8 overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <HistoryIcon className="text-blue-500" /> Analysis History
            </h2>
            <div className="bg-[#161b22] border border-gray-800 rounded-lg overflow-hidden shadow-lg">
              <table className="w-full text-left text-sm text-gray-400">
                <thead className="bg-[#0d1117] text-gray-300 border-b border-gray-800">
                  <tr>
                    <th className="px-6 py-4 font-semibold">ID</th>
                    <th className="px-6 py-4 font-semibold">Time</th>
                    <th className="px-6 py-4 font-semibold">Language</th>
                    <th className="px-6 py-4 font-semibold">Issues Found</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                        No inspection history found.
                      </td>
                    </tr>
                  ) : (
                    history.map(row => {
                      const issuesList = JSON.parse(row.issues || '[]');
                      return (
                        <tr key={row.id} className="hover:bg-[#1c2128] transition-colors cursor-pointer">
                          <td className="px-6 py-4 font-mono">#{row.id}</td>
                          <td className="px-6 py-4">{new Date(row.timestamp).toLocaleString()}</td>
                          <td className="px-6 py-4 capitalize">{row.language}</td>
                          <td className="px-6 py-4">
                            {issuesList.length > 0 ? (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-400/10 text-red-400 border border-red-400/20">
                                {issuesList.length} issues
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-400/10 text-green-400 border border-green-400/20">
                                Clean / AI Only
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </main>
        )}
      </div>
    </div>
  );
}

export default App;

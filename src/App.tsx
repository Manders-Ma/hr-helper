/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { 
  Upload, 
  ClipboardList, 
  Trophy, 
  RotateCcw, 
  Settings2, 
  Users, 
  Trash2, 
  Play,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import Papa from "papaparse";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
import { cn } from "./lib/utils";

type SourceType = "csv" | "paste";

interface Participant {
  id: string;
  name: string;
}

export default function App() {
  const [sourceType, setSourceType] = useState<SourceType>("paste");
  const [inputText, setInputText] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [winners, setWinners] = useState<Participant[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentWinner, setCurrentWinner] = useState<Participant | null>(null);
  const [allowRepeat, setAllowRepeat] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Animation states
  const [displayIndex, setDisplayIndex] = useState(0);
  const animationRef = useRef<number | null>(null);

  // Parse names from text input
  const handleParseText = useCallback(() => {
    if (!inputText.trim()) {
      setError("請輸入姓名名單");
      return;
    }
    const names = inputText
      .split(/[\n,，]/)
      .map(n => n.trim())
      .filter(n => n.length > 0);
    
    if (names.length === 0) {
      setError("找不到有效的姓名");
      return;
    }

    const newParticipants = names.map((name, index) => ({
      id: `${Date.now()}-${index}`,
      name
    }));

    setParticipants(newParticipants);
    setWinners([]);
    setError(null);
  }, [inputText]);

  // Handle CSV upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      complete: (results) => {
        const data = results.data as string[][];
        // Assume first column is name
        const names = data
          .map(row => row[0]?.toString().trim())
          .filter(n => n && n !== "姓名" && n !== "Name"); // Filter header

        if (names.length === 0) {
          setError("CSV 檔案中找不到有效的姓名");
          return;
        }

        const newParticipants = names.map((name, index) => ({
          id: `${Date.now()}-${index}`,
          name: name || ""
        }));

        setParticipants(newParticipants);
        setWinners([]);
        setError(null);
      },
      error: (err) => {
        setError(`讀取 CSV 失敗: ${err.message}`);
      }
    });
  };

  // Start the drawing animation
  const startDraw = () => {
    if (participants.length === 0) {
      setError("請先匯入名單");
      return;
    }

    // Filter available participants if not allowing repeat
    const available = allowRepeat 
      ? participants 
      : participants.filter(p => !winners.find(w => w.id === p.id));

    if (available.length === 0) {
      setError("所有人都已中獎，請重置或更改設定");
      return;
    }

    setIsDrawing(true);
    setError(null);
    setCurrentWinner(null);

    let startTime = Date.now();
    const duration = 3000; // 3 seconds animation

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;

      if (progress < 1) {
        // Speed up then slow down
        const randomIndex = Math.floor(Math.random() * available.length);
        setDisplayIndex(randomIndex);
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Animation finished
        const finalWinnerIndex = Math.floor(Math.random() * available.length);
        const winner = available[finalWinnerIndex];
        
        setCurrentWinner(winner);
        setWinners(prev => [...prev, winner]);
        setIsDrawing(false);
        
        // Celebrate!
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FFD700', '#FFA500', '#FF4500']
        });
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  const reset = () => {
    setWinners([]);
    setCurrentWinner(null);
    setError(null);
  };

  const clearAll = () => {
    setParticipants([]);
    setWinners([]);
    setCurrentWinner(null);
    setInputText("");
    setError(null);
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans selection:bg-orange-100">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
              <Trophy className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">HR 獎品抽籤系統</h1>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Prize Draw Professional</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Settings2 className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Setup & List */}
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold flex items-center gap-2">
                <Users className="w-4 h-4 text-orange-500" />
                名單設定
              </h2>
              <button 
                onClick={clearAll}
                className="text-xs text-red-500 hover:underline flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> 清除全部
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex p-1 bg-gray-100 rounded-lg">
                <button
                  onClick={() => setSourceType("paste")}
                  className={cn(
                    "flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2",
                    sourceType === "paste" ? "bg-white shadow-sm text-orange-600" : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  <ClipboardList className="w-4 h-4" /> 貼上姓名
                </button>
                <button
                  onClick={() => setSourceType("csv")}
                  className={cn(
                    "flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2",
                    sourceType === "csv" ? "bg-white shadow-sm text-orange-600" : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  <Upload className="w-4 h-4" /> 上傳 CSV
                </button>
              </div>

              {sourceType === "paste" ? (
                <div className="space-y-3">
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="請輸入姓名，可用換行或逗號分隔..."
                    className="w-full h-32 p-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none resize-none transition-all"
                  />
                  <button
                    onClick={handleParseText}
                    className="w-full py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-colors"
                  >
                    匯入名單
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-orange-300 transition-colors cursor-pointer relative group">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2 group-hover:text-orange-500 transition-colors" />
                  <p className="text-sm font-medium text-gray-600">點擊或拖曳 CSV 檔案</p>
                  <p className="text-xs text-gray-400 mt-1">首欄將作為姓名來源</p>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 text-red-600 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">參與名單 ({participants.length})</h3>
            </div>
            <div className="max-h-64 overflow-y-auto p-2">
              {participants.length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-sm italic">尚無名單</div>
              ) : (
                <div className="grid grid-cols-2 gap-1">
                  {participants.map((p) => (
                    <div key={p.id} className="px-3 py-1.5 text-xs bg-gray-50 rounded-md border border-gray-100 text-gray-600 truncate">
                      {p.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Draw Area */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Settings Overlay */}
          <AnimatePresence>
            {showSettings && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        checked={allowRepeat}
                        onChange={(e) => setAllowRepeat(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={cn(
                        "w-10 h-5 rounded-full transition-colors",
                        allowRepeat ? "bg-orange-500" : "bg-gray-300"
                      )} />
                      <div className={cn(
                        "absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform",
                        allowRepeat ? "translate-x-5" : "translate-x-0"
                      )} />
                    </div>
                    <span className="text-sm font-bold text-orange-900">允許重複中獎</span>
                  </label>
                </div>
                <button 
                  onClick={() => setShowSettings(false)}
                  className="text-xs font-bold text-orange-600 hover:underline"
                >
                  關閉設定
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Draw Stage */}
          <div className="bg-white rounded-[2.5rem] border border-gray-200 p-12 shadow-xl shadow-gray-200/50 text-center relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 via-yellow-400 to-orange-400" />
            
            <div className="space-y-8 relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-50 text-orange-600 rounded-full text-xs font-bold uppercase tracking-widest">
                <Play className="w-3 h-3 fill-current" /> 幸運抽籤
              </div>

              <div className="h-48 flex items-center justify-center">
                <AnimatePresence mode="wait">
                  {isDrawing ? (
                    <motion.div
                      key="drawing"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.2 }}
                      className="text-6xl md:text-8xl font-black text-gray-900 tracking-tighter italic"
                    >
                      {participants[displayIndex]?.name || "???"}
                    </motion.div>
                  ) : currentWinner ? (
                    <motion.div
                      key="winner"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="space-y-4"
                    >
                      <div className="text-7xl md:text-9xl font-black text-orange-500 tracking-tighter drop-shadow-sm">
                        {currentWinner.name}
                      </div>
                      <div className="flex items-center justify-center gap-2 text-orange-600 font-bold">
                        <CheckCircle2 className="w-5 h-5" />
                        恭喜中獎！
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="idle"
                      className="text-gray-200 text-7xl md:text-9xl font-black tracking-tighter select-none"
                    >
                      READY
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex flex-col items-center gap-4">
                <button
                  onClick={startDraw}
                  disabled={isDrawing || participants.length === 0}
                  className={cn(
                    "group relative px-12 py-5 rounded-2xl text-xl font-black tracking-tight transition-all active:scale-95",
                    isDrawing || participants.length === 0
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-orange-500 text-white hover:bg-orange-600 shadow-2xl shadow-orange-200 hover:shadow-orange-300"
                  )}
                >
                  {isDrawing ? "抽籤中..." : "開始抽籤"}
                </button>
                
                <button
                  onClick={reset}
                  disabled={isDrawing || winners.length === 0}
                  className="text-sm font-bold text-gray-400 hover:text-gray-600 flex items-center gap-2 transition-colors disabled:opacity-0"
                >
                  <RotateCcw className="w-4 h-4" /> 重置中獎紀錄
                </button>
              </div>
            </div>
          </div>

          {/* Winners History */}
          <section className="bg-white rounded-3xl border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                中獎名單
              </h3>
              <span className="text-xs font-bold px-2 py-1 bg-gray-100 rounded text-gray-500">
                TOTAL: {winners.length}
              </span>
            </div>
            <div className="p-6">
              {winners.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-sm italic">
                  尚未產生中獎者
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {winners.map((winner, idx) => (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      key={`${winner.id}-${idx}`}
                      className="flex items-center gap-2 pl-3 pr-4 py-2 bg-orange-50 border border-orange-100 rounded-full"
                    >
                      <span className="w-5 h-5 bg-orange-500 text-white text-[10px] flex items-center justify-center rounded-full font-bold">
                        {idx + 1}
                      </span>
                      <span className="text-sm font-bold text-orange-900">{winner.name}</span>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-6 py-12 border-t border-gray-100 mt-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-gray-400 text-xs font-medium uppercase tracking-widest">
          <p>© 2026 HR PRIZE DRAW SYSTEM</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-gray-600 transition-colors">隱私條款</a>
            <a href="#" className="hover:text-gray-600 transition-colors">使用指南</a>
            <a href="#" className="hover:text-gray-600 transition-colors">聯絡我們</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

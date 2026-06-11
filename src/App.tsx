import React, { useState } from 'react';
import { Download, Calculator, Info, Zap, AlertTriangle, Activity } from 'lucide-react';
import { CalculationInput, CalculationOutput } from './types';
import { StandardTables } from './data/StandardTables';
import { LightingEngine } from './physics/LightingEngine';
import { ReportGenerator } from './utils/ReportGenerator';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

export default function App() {
  const [activeTab, setActiveTab] = useState<'layout' | 'uf' | '3d' | 'heatmap'>('layout');
  const [selectedTaskName, setSelectedTaskName] = useState<string>('Ured - pisanje, tipkanje, čitanje (EN 12464-1)');
  const [rotation, setRotation] = useState({ x: 60, z: 45 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [input, setInput] = useState<CalculationInput>({
    room: {
      lengthMm: 10000,
      widthMm: 8000,
      heightMm: 3000,
      workPlaneHeightMm: 800,
    },
    reflectances: {
      ceilingPercent: 70,
      wallPercent: 50,
      floorPercent: 20,
    },
    luminaire: StandardTables.ReferenceLuminaires[0],
    targetIlluminanceLx: StandardTables.CommonIlluminanceTargetsLx['Ured - pisanje, tipkanje, čitanje (EN 12464-1)'],
    maintenanceFactor: StandardTables.MaintenanceFactors['Vrlo čisto (0.80)'],
    energyParams: {
      operatingHoursPerYear: 2000, // Standardni uredski pogon
      electricityPriceEur: 0.15, // Prosječna cijena EUR/kWh
    }
  });

  const [output, setOutput] = useState<CalculationOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = () => {
    try {
      setError(null);
      const result = LightingEngine.obradiProracun(input);
      setOutput(result);
    } catch (err: any) {
      setError(err.message);
      setOutput(null);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    setRotation(prev => ({
      x: Math.max(0, Math.min(90, prev.x - deltaY * 0.5)),
      z: prev.z + deltaX * 0.5
    }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handlePdfExport = () => {
    if (!output) return;
    ReportGenerator.generatePdf(input, output);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#f0f2f5] text-[#1e293b] font-sans overflow-hidden">
      {/* Top Header */}
      <header className="h-14 bg-[#004a99] text-white flex items-center justify-between px-6 shrink-0 border-b border-[#003d7a] shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center font-bold text-lg"><Zap className="w-5 h-5 text-white" /></div>
          <h1 className="text-lg font-semibold tracking-tight uppercase">LuxCalc Pro <span className="font-normal opacity-70">| EN 12464-1</span></h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:block text-xs text-white/70 text-right uppercase tracking-wider">
            Modul: <span className="block font-bold text-white uppercase">Proračun Rasvjete</span>
          </div>
          {output && (
            <button 
              onClick={handlePdfExport}
              className="bg-emerald-500 hover:bg-emerald-600 px-4 py-1.5 rounded text-sm font-bold flex items-center gap-2 shadow-sm transition-colors"
            >
              <Download className="w-4 h-4"/>
              IZVOZ PDF IZVJEŠTAJA
            </button>
          )}
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Sidebar: Parameters */}
        <aside className="w-80 bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-y-auto">
          <div className="p-4 border-b border-slate-100">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Calculator className="w-4 h-4" /> Geometrija Prostorije
            </h2>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-500 uppercase block mb-1">Duljina [L] (m)</label>
                <input 
                  type="number" step="0.1"
                  className="bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-sm w-full text-right font-mono focus:border-[#004a99] focus:outline-none focus:ring-1 focus:ring-[#004a99]"
                  value={input.room.lengthMm / 1000}
                  onChange={(e) => setInput({...input, room: {...input.room, lengthMm: Number(e.target.value) * 1000}})}
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 uppercase block mb-1">Širina [W] (m)</label>
                <input 
                  type="number" step="0.1"
                  className="bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-sm w-full text-right font-mono focus:border-[#004a99] focus:outline-none focus:ring-1 focus:ring-[#004a99]"
                  value={input.room.widthMm / 1000}
                  onChange={(e) => setInput({...input, room: {...input.room, widthMm: Number(e.target.value) * 1000}})}
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 uppercase block mb-1">Visina stropa [H] (m)</label>
                <input 
                  type="number" step="0.1"
                  className="bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-sm w-full text-right font-mono focus:border-[#004a99] focus:outline-none focus:ring-1 focus:ring-[#004a99]"
                  value={input.room.heightMm / 1000}
                  onChange={(e) => setInput({...input, room: {...input.room, heightMm: Number(e.target.value) * 1000}})}
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 uppercase block mb-1">Radna ploha [Hw] (m)</label>
                <input 
                  type="number" step="0.1"
                  className="bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-sm w-full text-right font-mono focus:border-[#004a99] focus:outline-none focus:ring-1 focus:ring-[#004a99]"
                  value={input.room.workPlaneHeightMm / 1000}
                  onChange={(e) => setInput({...input, room: {...input.room, workPlaneHeightMm: Number(e.target.value) * 1000}})}
                />
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-100">
              <h3 className="text-[10px] uppercase text-slate-400 font-bold mb-2">Refleksije (%)</h3>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Strop (ρc)</label>
                  <input type="number" step="10" min="10" max="90" className="w-full text-right bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-xs font-mono" value={input.reflectances.ceilingPercent} onChange={(e) => setInput({...input, reflectances: {...input.reflectances, ceilingPercent: Number(e.target.value)}})} />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Zidovi (ρw)</label>
                  <input type="number" step="10" min="10" max="90" className="w-full text-right bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-xs font-mono" value={input.reflectances.wallPercent} onChange={(e) => setInput({...input, reflectances: {...input.reflectances, wallPercent: Number(e.target.value)}})} />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Pod (ρf)</label>
                  <input type="number" step="10" min="10" max="90" className="w-full text-right bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-xs font-mono" value={input.reflectances.floorPercent} onChange={(e) => setInput({...input, reflectances: {...input.reflectances, floorPercent: Number(e.target.value)}})} />
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 flex-1">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Svjetlotehnički Zahtjevi</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-[11px] text-slate-500 uppercase block mb-1">Primjena i Ciljana Rasvijetljenost</label>
                <select 
                  className="bg-slate-50 border border-slate-200 rounded px-2 py-2 text-[13px] w-full focus:border-[#004a99] focus:outline-none focus:ring-1 focus:ring-[#004a99]"
                  value={selectedTaskName}
                  onChange={(e) => {
                    const taskName = e.target.value;
                    setSelectedTaskName(taskName);
                    if (taskName !== 'CUSTOM') {
                      const reqs = StandardTables.NormativeRequirements[taskName];
                      setInput({...input, targetIlluminanceLx: reqs.Em});
                    }
                  }}
                >
                  {Object.entries(StandardTables.NormativeRequirements).map(([name, req]) => (
                    <option key={name} value={name}>{name} - {req.Em} lx (UGR&le;{req.UGRL}, Uo&ge;{req.Uo})</option>
                  ))}
                  <option value="CUSTOM">[Prilagođeno] Ostalo...</option>
                </select>
                {selectedTaskName === 'CUSTOM' && (
                   <input 
                   type="number" placeholder="Unesite lux (lx)"
                   className="mt-2 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-sm w-full font-mono text-right focus:border-[#004a99] focus:outline-none focus:ring-1 focus:ring-[#004a99]"
                   value={input.targetIlluminanceLx}
                   onChange={(e) => setInput({...input, targetIlluminanceLx: Number(e.target.value)})}
                 />
                )}
              </div>

              <div>
                <label className="text-[11px] text-slate-500 uppercase block mb-1">Odabir Rasvjetnog Tijela</label>
                <select 
                  className="bg-slate-50 border border-slate-200 rounded px-2 py-2 text-[13px] w-full focus:border-[#004a99] focus:outline-none focus:ring-1 focus:ring-[#004a99]"
                  value={input.luminaire.id}
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      setInput({
                        ...input, 
                        luminaire: { 
                          id: 'custom', 
                          name: 'Prilagođena Svjetiljka', 
                          luminousFluxLm: 4000, 
                          powerW: 30, 
                          ufTable: StandardTables.UF_DIRECT_WIDE 
                        }
                      });
                    } else {
                      const lum = StandardTables.ReferenceLuminaires.find(l => l.id === e.target.value);
                      if(lum) setInput({...input, luminaire: lum});
                    }
                  }}
                >
                  <optgroup label="Standardne svjetiljke (Philips)">
                    {StandardTables.ReferenceLuminaires.map(lum => (
                      <option key={lum.id} value={lum.id}>{lum.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Ostalo">
                    <option value="custom">[Ručni unos] Prilagođena svjetiljka...</option>
                  </optgroup>
                </select>
                
                {input.luminaire.id === 'custom' ? (
                  <div className="mt-3 p-3 bg-slate-100 border border-slate-200 rounded text-sm space-y-3">
                    <div>
                      <label className="text-[11px] text-slate-500 uppercase block mb-1">Naziv svjetiljke</label>
                      <input 
                        type="text" 
                        className="bg-white border border-slate-300 rounded px-2 py-1 w-full text-xs focus:border-[#004a99] focus:outline-none focus:ring-1 focus:ring-[#004a99]" 
                        value={input.luminaire.name}
                        onChange={(e) => setInput({...input, luminaire: {...input.luminaire, name: e.target.value}})}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] text-slate-500 uppercase block mb-1">Tok (lm)</label>
                        <input 
                          type="number" 
                          className="bg-white border border-slate-300 rounded px-2 py-1 w-full text-xs text-right font-mono focus:border-[#004a99] focus:outline-none focus:ring-1 focus:ring-[#004a99]" 
                          value={input.luminaire.luminousFluxLm}
                          onChange={(e) => setInput({...input, luminaire: {...input.luminaire, luminousFluxLm: Number(e.target.value)}})}
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-500 uppercase block mb-1">Snaga (W)</label>
                        <input 
                          type="number" step="0.1"
                          className="bg-white border border-slate-300 rounded px-2 py-1 w-full text-xs text-right font-mono focus:border-[#004a99] focus:outline-none focus:ring-1 focus:ring-[#004a99]" 
                          value={input.luminaire.powerW}
                          onChange={(e) => setInput({...input, luminaire: {...input.luminaire, powerW: Number(e.target.value)}})}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-500 uppercase block mb-1">Karakteristika zračenja</label>
                      <select 
                        className="bg-white border border-slate-300 rounded px-2 py-1.5 w-full text-[11px] focus:border-[#004a99] focus:outline-none focus:ring-1 focus:ring-[#004a99]"
                        onChange={(e) => {
                          const tableMap: Record<string, any> = {
                            'WIDE': StandardTables.UF_DIRECT_WIDE,
                            'NARROW': StandardTables.UF_DIRECT_NARROW,
                            'DOWNLIGHT': StandardTables.UF_DOWNLIGHT,
                            'WATERPROOF': StandardTables.UF_WATERPROOF,
                            'DIRECT_INDIRECT': StandardTables.UF_DIRECT_INDIRECT,
                          };
                          setInput({...input, luminaire: {...input.luminaire, ufTable: tableMap[e.target.value]}});
                        }}
                      >
                        <option value="WIDE">Širokosnopna (Paneli, opća rasvjeta)</option>
                        <option value="NARROW">Uskosnopna (Highbay, reflektori)</option>
                        <option value="DOWNLIGHT">Downlight (Usmjerena)</option>
                        <option value="WATERPROOF">Vodotijesna (Difuzor)</option>
                        <option value="DIRECT_INDIRECT">Direktno/Indirektna (Suspenzije)</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 bg-slate-100 rounded px-3 py-2 text-[11px] font-mono text-slate-600 flex justify-between border border-slate-200">
                     <span>Φ: {input.luminaire.luminousFluxLm} lm</span>
                     <span>P: {input.luminaire.powerW} W</span>
                     <span>η: {(input.luminaire.luminousFluxLm / input.luminaire.powerW).toFixed(0)} lm/W</span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-[11px] text-slate-500 uppercase block mb-1">Faktor održavanja (MF)</label>
                <select 
                  className="bg-slate-50 border border-slate-200 rounded px-2 py-2 text-[13px] w-full focus:border-[#004a99] focus:outline-none focus:ring-1 focus:ring-[#004a99]"
                  value={input.maintenanceFactor}
                  onChange={(e) => setInput({...input, maintenanceFactor: Number(e.target.value)})}
                >
                  {Object.entries(StandardTables.MaintenanceFactors).map(([name, val]) => (
                    <option key={name} value={val}>{name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-[10px] uppercase text-slate-400 font-bold mb-2">Energetska učinkovitost</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1">Sati rada (h/god)</label>
                    <input 
                      type="number" step="100" min="0" 
                      className="w-full text-right bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-xs font-mono" 
                      value={input.energyParams.operatingHoursPerYear} 
                      onChange={(e) => setInput({...input, energyParams: {...input.energyParams, operatingHoursPerYear: Number(e.target.value)}})} 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1">Cijena (EUR/kWh)</label>
                    <input 
                      type="number" step="0.01" min="0" 
                      className="w-full text-right bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-xs font-mono" 
                      value={input.energyParams.electricityPriceEur} 
                      onChange={(e) => setInput({...input, energyParams: {...input.energyParams, electricityPriceEur: Number(e.target.value)}})} 
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {error && (
              <div className="mt-6 p-3 bg-amber-50 border-l-4 border-amber-400 text-[11px] text-amber-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="p-4 mt-auto bg-slate-50 border-t border-slate-200">
            <button 
              onClick={handleCalculate}
              className="w-full bg-[#004a99] text-white font-bold py-2.5 rounded hover:bg-[#003d7a] transition-colors flex items-center justify-center gap-2 text-[13px] tracking-wide"
            >
              POKRENI OPTIMIZACIJU
            </button>
          </div>
        </aside>

        {/* Center Content: Grid & Visualization */}
        <main className="flex-1 flex flex-col bg-[#e2e8f0] relative overflow-y-auto">
          {output ? (
            <div className="h-full flex flex-col">
              
              {/* Toolbar */}
              <div className="absolute top-4 left-4 flex gap-2 z-10 flex-wrap max-w-[80%]">
                <button onClick={() => setActiveTab('layout')} className={`px-3 py-1.5 rounded shadow-sm text-xs font-semibold ${activeTab === 'layout' ? 'bg-white text-[#004a99] border-b-2 border-[#004a99]' : 'bg-white/50 text-slate-600 hover:bg-white'}`}>2D Raspored</button>
                <button onClick={() => setActiveTab('3d')} className={`px-3 py-1.5 rounded shadow-sm text-xs font-semibold ${activeTab === '3d' ? 'bg-white text-[#004a99] border-b-2 border-[#004a99]' : 'bg-white/50 text-slate-600 hover:bg-white'}`}>3D Prikaz</button>
                <button onClick={() => setActiveTab('heatmap')} className={`px-3 py-1.5 rounded shadow-sm text-xs font-semibold ${activeTab === 'heatmap' ? 'bg-white text-[#004a99] border-b-2 border-[#004a99]' : 'bg-white/50 text-slate-600 hover:bg-white'}`}>Toplinska Mapa (Lx)</button>
                <button onClick={() => setActiveTab('uf')} className={`px-3 py-1.5 rounded shadow-sm text-xs font-semibold ${activeTab === 'uf' ? 'bg-white text-[#004a99] border-b-2 border-[#004a99]' : 'bg-white/50 text-slate-600 hover:bg-white'}`}><Activity className="w-3 h-3 inline mr-1"/> Analiza Refleksija</button>
              </div>

              {/* Visualization Canvas */}
              <div className="flex-1 m-4 sm:m-8 bg-white shadow-inner rounded border border-slate-300 relative overflow-hidden flex items-center justify-center min-h-[300px]">
                 {/* CAD Grid Layer */}
                 <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{backgroundImage: 'radial-gradient(#000 1px, transparent 0)', backgroundSize: '20px 20px'}}></div>
                 
                 {activeTab === 'layout' ? (
                   <div 
                     className="border-4 border-slate-800 bg-slate-50/50 flex flex-col relative"
                     style={{
                        width: '100%',
                        maxWidth: '400px',
                        aspectRatio: `${input.room.lengthMm} / ${input.room.widthMm}` 
                     }}
                   >
                      {/* Luminaire Matrix */}
                      <div className="absolute inset-0">
                          {Array.from({ length: output.arrangement.totalLuminaires }).map((_, i) => {
                              const col = i % output.arrangement.columns;
                              const row = Math.floor(i / output.arrangement.columns);
                              
                              const wPercent = 100 / output.arrangement.columns;
                              const hPercent = 100 / output.arrangement.rows;

                              const left = (col * wPercent) + (wPercent / 2);
                              const top = (row * hPercent) + (hPercent / 2);
                              
                              const isPanel = input.luminaire.id.includes('panel') || input.luminaire.id.includes('surface-sm136v');
                              const isDownlight = input.luminaire.id.includes('dl-');
                              
                              let width = '36px';
                              let height = '10px';
                              let borderRadius = '0px';

                              if (isPanel) {
                                width = '24px';
                                height = '24px';
                              } else if (isDownlight) {
                                width = '16px';
                                height = '16px';
                                borderRadius = '50%';
                              }

                              return (
                                <div 
                                  key={i}
                                  className="absolute bg-white shadow-sm flex items-center justify-center p-[1px]"
                                  style={{
                                    left: `${left}%`,
                                    top: `${top}%`,
                                    transform: 'translate(-50%, -50%)',
                                    width: width,
                                    height: height,
                                    borderRadius: borderRadius,
                                    border: '1px solid #cbd5e1'
                                  }}
                                >
                                   <div className="w-full h-full bg-[#004a99] opacity-80" style={{ borderRadius: borderRadius }}></div>
                                </div>
                              )
                          })}
                      </div>
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[11px] text-slate-500 font-mono tracking-wider">{(input.room.lengthMm/1000).toFixed(2)} m</div>
                      <div className="absolute -left-8 top-1/2 -translate-y-1/2 -rotate-90 origin-center text-[11px] text-slate-500 font-mono tracking-wider">{(input.room.widthMm/1000).toFixed(2)} m</div>
                   </div>
                 ) : activeTab === '3d' ? (
                   <div 
                     className="w-full h-full flex flex-col items-center justify-center bg-[#0f172a] overflow-hidden cursor-move select-none" 
                     style={{ perspective: '1200px' }}
                     onMouseDown={handleMouseDown}
                     onMouseMove={handleMouseMove}
                     onMouseUp={handleMouseUp}
                     onMouseLeave={handleMouseUp}
                   >
                      <div className="absolute top-4 right-4 text-[10px] text-slate-400 font-mono bg-slate-800/50 px-2 py-1 rounded">Povucite miš za rotaciju 3D prostora</div>
                      <div 
                        className="relative transition-transform duration-75 ease-out" 
                        style={{
                          transformStyle: 'preserve-3d',
                          transform: `rotateX(${rotation.x}deg) rotateZ(${rotation.z}deg)`,
                          width: `${Math.min(400, (input.room.lengthMm / Math.max(input.room.lengthMm, input.room.widthMm)) * 400)}px`,
                          height: `${Math.min(400, (input.room.widthMm / Math.max(input.room.lengthMm, input.room.widthMm)) * 400)}px`
                        }}
                      >
                         {/* Floor */}
                         <div className="absolute inset-0 bg-slate-800 border-4 border-slate-600/50 shadow-[0_0_50px_rgba(30,41,59,0.8)]" style={{ transform: 'translateZ(0px)', transformStyle: 'preserve-3d' }}>
                            {/* Grid on floor */}
                            <div className="w-full h-full opacity-30" style={{backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 0)', backgroundSize: '20px 20px'}}></div>
                         </div>
                         
                         {/* Luminaires and Beams */}
                         {Array.from({ length: output.arrangement.totalLuminaires }).map((_, i) => {
                              const col = i % output.arrangement.columns;
                              const row = Math.floor(i / output.arrangement.columns);
                              
                              const wPercent = 100 / output.arrangement.columns;
                              const hPercent = 100 / output.arrangement.rows;

                              const left = (col * wPercent) + (wPercent / 2);
                              const top = (row * hPercent) + (hPercent / 2);
                              
                              const isPanel = input.luminaire.id.includes('panel') || input.luminaire.id.includes('surface-sm136v');
                              const isDownlight = input.luminaire.id.includes('dl-');
                              
                              let width = '16px';
                              let height = '8px';

                              if (isPanel) {
                                width = '14px';
                                height = '14px';
                              } else if (isDownlight) {
                                width = '8px';
                                height = '8px';
                              }

                              const pxScale = 400 / Math.max(input.room.lengthMm, input.room.widthMm);
                              const zPxlHeight = input.room.heightMm * pxScale;
                              const zWorkPlane = input.room.workPlaneHeightMm * pxScale;
                              const suspensionDist = zPxlHeight - zWorkPlane;

                              return (
                                <div key={`3d-${i}`} className="absolute w-full h-full pointer-events-none" style={{ transformStyle: 'preserve-3d' }}>
                                  {/* Luminaire body */}
                                  <div 
                                    className="absolute bg-white flex flex-col items-center justify-center border border-slate-300"
                                    style={{
                                      left: `${left}%`,
                                      top: `${top}%`,
                                      transform: `translate(-50%, -50%) translateZ(${zPxlHeight}px)`,
                                      width: width,
                                      height: height,
                                      borderRadius: isDownlight ? '50%' : '2px',
                                      transformStyle: 'preserve-3d'
                                    }}
                                  >
                                     <div className="w-full h-full bg-[#004a99]" style={{ borderRadius: isDownlight ? '50%' : '2px' }}></div>
                                  </div>
                                  
                                  {/* Light Beam Approximation projected on floor */}
                                  <div 
                                    className="absolute"
                                    style={{
                                      left: `${left}%`,
                                      top: `${top}%`,
                                      transform: `translate(-50%, -50%) translateZ(1px)`,
                                      width: `${Math.max(100, suspensionDist * 2)}px`,
                                      height: `${Math.max(100, suspensionDist * 2)}px`,
                                      background: 'radial-gradient(circle, rgba(250, 204, 21, 0.25) 0%, rgba(250, 204, 21, 0) 70%)',
                                      borderRadius: '50%',
                                      pointerEvents: 'none'
                                    }}
                                  ></div>
                                </div>
                              )
                          })}
                      </div>
                   </div>
                 ) : activeTab === 'heatmap' && output?.heatmap ? (
                   <div 
                     className="bg-slate-50 relative flex flex-col items-center justify-center border-4 border-slate-500 shadow-xl overflow-hidden group mx-auto"
                     style={{
                        width: '100%',
                        maxWidth: '400px',
                        aspectRatio: `${input.room.lengthMm} / ${input.room.widthMm}`
                     }}
                   >
                     {/* Dynamic Grid Mapping */}
                     <div 
                      className="absolute inset-0 grid"
                      style={{ 
                        gridTemplateColumns: `repeat(${output.heatmap.grid[0].length}, 1fr)`,
                        gridTemplateRows: `repeat(${output.heatmap.grid.length}, 1fr)` 
                      }}
                     >
                       {output.heatmap.grid.map((row, y) => row.map((lux, x) => {
                          const maxLx = Math.max(1, output.heatmap.maxLx);
                          const ratio = Math.max(0, Math.min(1, lux / (maxLx * 1.05))); 
                          
                          let r = 0, g = 0, b = 0;
                          if (ratio < 0.25) { b = 255; g = ratio * 4 * 255; }
                          else if (ratio < 0.5) { g = 255; b = (1 - (ratio-0.25)*4) * 255; }
                          else if (ratio < 0.75) { g = 255; r = ((ratio-0.5)*4) * 255; }
                          else { r = 255; g = (1 - (ratio-0.75)*4) * 255; }

                          return (
                            <div 
                              key={`cell-${x}-${y}`} 
                              className="w-full h-full"
                              style={{ backgroundColor: `rgb(${r},${g},${b})`, opacity: 0.85 }} 
                            />
                          );
                       }))}
                     </div>
                     
                     {/* Overlay Luminaires */}
                     {Array.from({ length: output.arrangement.totalLuminaires }).map((_, i) => {
                          const col = i % output.arrangement.columns;
                          const row = Math.floor(i / output.arrangement.columns);
                          
                          const wPercent = 100 / output.arrangement.columns;
                          const hPercent = 100 / output.arrangement.rows;

                          const left = (col * wPercent) + (wPercent / 2);
                          const top = (row * hPercent) + (hPercent / 2);
                          
                          return (
                            <div 
                              key={`hm-lum-${i}`} 
                              className="absolute bg-white border-2 border-[#004a99] shadow-sm pointer-events-none opacity-80"
                              style={{
                                left: `${left}%`,
                                top: `${top}%`,
                                transform: 'translate(-50%, -50%)',
                                width: '12px',
                                height: '12px',
                                borderRadius: input.luminaire.id.includes('dl-') ? '50%' : '2px'
                              }}
                            />
                          )
                      })}

                     <div className="absolute top-2 left-2 right-2 flex justify-between items-center z-10 pointer-events-none">
                       <span className="bg-slate-900/60 text-white text-[10px] px-2 py-0.5 rounded shadow">E_avg: {output.heatmap.avgLx.toFixed(0)} lx</span>
                     </div>
                     <div className="absolute bottom-2 left-2 right-2 bg-slate-900/80 backdrop-blur rounded p-2 flex items-center justify-between text-[9px] text-white opacity-0 group-hover:opacity-100 transition-opacity z-10">
                         <div className="flex flex-col items-center">
                            <span className="font-bold">{output.heatmap.minLx.toFixed(0)}</span>
                            <span className="text-slate-400">Min</span>
                         </div>
                         <div className="flex-1 h-3 mx-4 rounded relative" style={{background: 'linear-gradient(to right, rgb(0,0,255), rgb(0,255,255), rgb(0,255,0), rgb(255,255,0), rgb(255,0,0))'}}>
                         </div>
                         <div className="flex flex-col items-center">
                            <span className="font-bold">{output.heatmap.maxLx.toFixed(0)}</span>
                            <span className="text-slate-400">Max</span>
                         </div>
                     </div>
                   </div>
                 ) : (
                   <div className="w-full h-full p-8 flex flex-col bg-white">
                      <div className="mb-4">
                        <h3 className="text-sm font-bold text-slate-800">Utjecaj refleksije na UF (Iskoristivost)</h3>
                        <p className="text-xs text-slate-500">Usporedba odabrane svjetiljke u idealnim uvjetima (70/50/20) i sa zadanim refleksijama ({input.reflectances.ceilingPercent}/{input.reflectances.wallPercent}/{input.reflectances.floorPercent}).</p>
                      </div>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={[0.6, 0.8, 1.0, 1.25, 1.5, 2.0, 3.0, 4.0, 5.0].map(k => ({
                            k: k.toFixed(2),
                            "Referentni UF (70/50/20)": LightingEngine.interpolirajFaktorIskoristivosti(k, input.luminaire.ufTable),
                            "Odabrani UF (Trenutno)": LightingEngine.izracunajDinamickiUF(k, input)
                          }))}
                          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="k" tick={{fontSize: 10, fill: '#64748b'}} label={{ value: 'Indeks prostorije (K)', position: 'insideBottomRight', offset: -10, fontSize: 10, fill: '#64748b'}} />
                          <YAxis domain={['auto', 'auto']} tick={{fontSize: 10, fill: '#64748b'}} />
                          <RechartsTooltip contentStyle={{ fontSize: '11px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                          <Legend wrapperStyle={{ fontSize: '11px' }} />
                          <Line type="monotone" dataKey="Referentni UF (70/50/20)" stroke="#94a3b8" strokeDasharray="5 5" strokeWidth={2} dot={{r: 3}} />
                          <Line type="monotone" dataKey="Odabrani UF (Trenutno)" stroke="#004a99" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                   </div>
                 )}
              </div>

              {/* Data Table block (above summary metrics) */}
              <div className="mx-4 sm:mx-8 mb-4 sm:mb-8 grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
                 <div className="bg-white border border-slate-300 rounded shadow-sm p-4">
                     <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Tehničke Karakteristike</h4>
                     <ul className="space-y-2.5 font-mono text-xs">
                        <li className="flex justify-between border-b border-slate-100 pb-1.5">
                          <span className="text-slate-500">Teoretski broj svjetiljki:</span>
                          <span className="font-bold text-slate-700">{output.requiredLuminaires.toFixed(2)}</span>
                        </li>
                        <li className="flex justify-between border-b border-slate-100 pb-1.5">
                          <span className="text-slate-500">Faktor Iskoristivosti (UF):</span>
                          <span className="font-bold text-slate-700">{output.utilizationFactor.toFixed(3)}</span>
                        </li>
                        <li className="flex justify-between border-b border-slate-100 pb-1.5">
                          <span className="text-slate-500">Tot. svjetlosni tok (Φ):</span>
                          <span className="font-bold text-slate-700">{output.totalRequiredFluxLm} lm</span>
                        </li>
                        <li className="flex justify-between border-b border-slate-100 pb-1.5">
                          <span className="text-slate-500">Uzdignuće svjetiljke (H_u):</span>
                          <span className="font-bold text-slate-700">{((input.room.heightMm - input.room.workPlaneHeightMm)/1000).toFixed(2)} m</span>
                        </li>
                     </ul>
                 </div>
                 <div className="bg-white border border-slate-300 rounded shadow-sm p-4 flex flex-col">
                     <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Analiza EN 12464-1</h4>
                     <ul className="space-y-2.5 font-mono text-xs">
                        <li className="flex justify-between border-b border-slate-100 pb-1.5">
                          <span className="text-slate-500">Ciljana uloga:</span>
                          <span className="font-bold text-slate-700 max-w-[140px] truncate" title={selectedTaskName}>{selectedTaskName}</span>
                        </li>
                        <li className="flex justify-between border-b border-slate-100 pb-1.5">
                          <span className="text-slate-500">Rasvijetljenost (Em):</span>
                          <span className={output.actualIlluminanceLx >= input.targetIlluminanceLx ? "font-bold text-emerald-600" : "font-bold text-red-600"}>
                            {output.actualIlluminanceLx.toFixed(0)} lx (≥{input.targetIlluminanceLx} lx)
                          </span>
                        </li>
                        <li className="flex justify-between border-b border-slate-100 pb-1.5">
                          <span className="text-slate-500">UGR (Blještanje):</span>
                          <span className={input.luminaire.ugr && StandardTables.NormativeRequirements[selectedTaskName] && input.luminaire.ugr <= StandardTables.NormativeRequirements[selectedTaskName].UGRL ? "font-bold text-emerald-600" : (StandardTables.NormativeRequirements[selectedTaskName] ? "font-bold text-amber-600" : "font-bold text-slate-600")}>
                            {input.luminaire.ugr || 'N/A'} {StandardTables.NormativeRequirements[selectedTaskName] ? `(≤${StandardTables.NormativeRequirements[selectedTaskName].UGRL})` : ''}
                          </span>
                        </li>
                        <li className="flex justify-between border-b border-slate-100 pb-1.5">
                          <span className="text-slate-500">Jednolikost (Uo):</span>
                          <span className={StandardTables.NormativeRequirements[selectedTaskName] && output.estimatedUo >= StandardTables.NormativeRequirements[selectedTaskName].Uo ? "font-bold text-emerald-600" : (StandardTables.NormativeRequirements[selectedTaskName] ? "font-bold text-amber-600" : "font-bold text-slate-600")}>
                            {output.estimatedUo.toFixed(2)} {StandardTables.NormativeRequirements[selectedTaskName] ? `(≥${StandardTables.NormativeRequirements[selectedTaskName].Uo.toFixed(2)})` : ''}
                          </span>
                        </li>
                        <li className="flex justify-between border-b border-slate-100 pb-1.5">
                          <span className="text-slate-500">Indeks boje (Ra):</span>
                          <span className={input.luminaire.ra && StandardTables.NormativeRequirements[selectedTaskName] && input.luminaire.ra >= StandardTables.NormativeRequirements[selectedTaskName].Ra ? "font-bold text-emerald-600" : (StandardTables.NormativeRequirements[selectedTaskName] ? "font-bold text-amber-600" : "font-bold text-slate-600")}>
                            {input.luminaire.ra || 'N/A'} {StandardTables.NormativeRequirements[selectedTaskName] ? `(≥${StandardTables.NormativeRequirements[selectedTaskName].Ra})` : ''}
                          </span>
                        </li>
                     </ul>
                 </div>
                 <div className="bg-white border border-slate-300 rounded shadow-sm p-4 flex flex-col relative overflow-hidden">
                     <div className={`absolute top-0 right-0 px-2 py-1 text-[10px] font-bold text-white uppercase rounded-bl shadow-sm z-10 ${output.energy.energyClass === 'A' ? 'bg-[#27ae60]' : output.energy.energyClass === 'B' ? 'bg-[#2ecc71]' : output.energy.energyClass === 'C' ? 'bg-[#f1c40f]' : output.energy.energyClass === 'D' ? 'bg-[#e67e22]' : 'bg-[#e74c3c]'}`}>Klasa {output.energy.energyClass}</div>
                     <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">EN 15193 | LENI</h4>
                     <ul className="space-y-2.5 font-mono text-xs">
                        <li className="flex justify-between border-b border-slate-100 pb-1.5">
                          <span className="text-slate-500">Ukupna snaga sustava:</span>
                          <span className="font-bold text-slate-700">{(output.arrangement.totalLuminaires * input.luminaire.powerW).toFixed(1)} W</span>
                        </li>
                        <li className="flex justify-between border-b border-slate-100 pb-1.5">
                          <span className="text-slate-500">Godišnja potrošnja:</span>
                          <span className="font-bold text-slate-700">{output.energy.yearlyConsumptionKwh.toFixed(1)} kWh/god</span>
                        </li>
                        <li className="flex justify-between border-b border-slate-100 pb-1.5">
                          <span className="text-slate-500">Procjena troška (€):</span>
                          <span className="font-bold text-slate-700">{output.energy.yearlyCostEur.toFixed(2)} €/god</span>
                        </li>
                        <li className="flex justify-between border-b border-slate-100 pb-1.5">
                          <span className="text-slate-500">LENI pokazatelj:</span>
                          <span className="font-bold text-slate-700">{output.energy.leniKwhPerM2.toFixed(1)} kWh/m²/god</span>
                        </li>
                        <li className="flex justify-between border-b border-slate-100 pb-1.5">
                          <span className="text-slate-500">Traženje standarda:</span>
                          <span className="font-bold text-[#004a99]">A (≤10), B (≤15) LENI</span>
                        </li>
                     </ul>
                 </div>
              </div>

              {/* Summary Metrics Bar */}
              <div className="bg-[#1e293b] text-white py-4 md:h-20 grid grid-cols-2 md:grid-cols-4 items-center px-4 md:px-10 border-t border-slate-800 shrink-0 gap-y-4">
                <div className="border-r border-slate-700 pr-4">
                  <div className="text-[10px] uppercase text-slate-400">Prosječna rasvijetljenost</div>
                  <div className={`text-2xl font-mono ${output.actualIlluminanceLx >= input.targetIlluminanceLx ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {output.actualIlluminanceLx.toFixed(0)} <span className="text-sm text-white">lx</span>
                  </div>
                </div>
                <div className="md:border-r border-slate-700 pl-4 md:px-6">
                  <div className="text-[10px] uppercase text-slate-400">Raspored (X × Y)</div>
                  <div className="text-2xl font-mono text-white">{output.arrangement.columns} × {output.arrangement.rows}</div>
                </div>
                <div className="border-r border-slate-700 pr-4 md:px-6">
                  <div className="text-[10px] uppercase text-slate-400">Ukupan Broj (kom)</div>
                  <div className="text-2xl font-mono text-white">{output.arrangement.totalLuminaires}</div>
                </div>
                <div className="pl-4 md:px-6">
                  <div className="text-[10px] uppercase text-slate-400">Spec. snaga (LPD)</div>
                  <div className="text-2xl font-mono text-white">{output.specificPowerWPerM2.toFixed(2)} <span className="text-sm text-white">W/m²</span></div>
                </div>
              </div>
              
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center min-h-[400px]">
              <div className="bg-white/50 backdrop-blur-sm border border-slate-300 p-8 rounded-lg shadow-sm max-w-sm w-full text-center">
                <Info className="w-10 h-10 mb-4 text-slate-400 mx-auto" />
                <h3 className="text-slate-800 font-semibold mb-2">Aplikacija u pripravnosti</h3>
                <p className="text-sm text-slate-600">Unesite parametre prostorije i svjetlotehničke zahtjeve u izborniku lijevo, te pokrenite optimizaciju.</p>
              </div>
            </div>
          )}
        </main>

      </div>
    </div>
  );
}


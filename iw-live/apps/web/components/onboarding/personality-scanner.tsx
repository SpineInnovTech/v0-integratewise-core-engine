"use client";

import { useEffect, useState } from "react";
import { BrainCircuit, Fingerprint, Scan, Server, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PersonalityScannerProps {
    onComplete: (name: string) => void;
    initialName?: string;
}

export function PersonalityScanner({ onComplete, initialName }: PersonalityScannerProps) {
    const [name, setName] = useState(initialName || "");
    const [progress, setProgress] = useState(0);
    const [stage, setStage] = useState<"input" | "scanning" | "analyzing" | "finalizing">(
        initialName ? "scanning" : "input"
    );
    const [scanText, setScanText] = useState(
        initialName ? "Initializing system interface..." : "Waiting for subject identification..."
    );

    const handleStart = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!name.trim()) return;
        setStage("scanning");
        setScanText("Initializing system interface...");
    };

    useEffect(() => {
        if (stage === "scanning") {
            let p = 0;
            const interval = setInterval(() => {
                p += 2;
                setProgress((prev) => Math.min(prev + 2, 100));

                if (p < 30) setScanText(`Analyzing productivity patterns for ${name}...`);
                else if (p < 60) setScanText("Detecting efficient workflows...");
                else if (p < 90) setScanText("Calibrating potential...");
                else {
                    clearInterval(interval);
                    setStage("analyzing");
                    setProgress(100);
                }
            }, 60); // Total ~3s for this part
            return () => clearInterval(interval);
        }
    }, [stage, name]);

    useEffect(() => {
        if (stage === "analyzing") {
            setScanText("Identity profile confirmed.");
            const timer = setTimeout(() => {
                setStage("finalizing");
                onComplete(name);
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [stage, onComplete, name]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4 relative overflow-hidden">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

            {/* Main Scanner UI */}
            <div className="relative z-10 w-full max-w-lg text-center space-y-12">

                {/* Animated Icon */}
                <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
                    {stage === "input" ? (
                        <div className="relative z-10 bg-black/50 p-6 rounded-full border border-gray-800 backdrop-blur-xl">
                            <BrainCircuit className="w-12 h-12 text-gray-400" />
                        </div>
                    ) : (
                        <>
                            <div className="absolute inset-0 border-4 border-cyan-500/30 rounded-full animate-ping [animation-duration:3s]" />
                            <div className="absolute inset-0 border-2 border-cyan-500/20 rounded-full animate-ping [animation-duration:2s]" />
                            <div className="relative z-10 bg-black/50 p-6 rounded-full border border-cyan-500/50 backdrop-blur-xl shadow-[0_0_50px_rgba(6,182,212,0.3)]">
                                {stage === "scanning" ? (
                                    <Scan className="w-12 h-12 text-cyan-400 animate-pulse" />
                                ) : (
                                    <Fingerprint className="w-12 h-12 text-emerald-400 animate-pulse" />
                                )}
                            </div>
                        </>
                    )}
                </div>

                {stage === "input" ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div>
                            <h2 className="text-3xl font-light tracking-widest mb-2 font-mono uppercase">
                                Identity Required
                            </h2>
                            <p className="text-gray-500 text-sm">Enter your name to begin the calibration.</p>
                        </div>
                        <form onSubmit={handleStart} className="flex gap-2 max-w-xs mx-auto">
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your Name"
                                className="bg-gray-900 border-gray-800 text-center text-lg h-12 focus-visible:ring-cyan-500"
                                autoFocus
                            />
                            <Button type="submit" disabled={!name.trim()} className="h-12 w-12 p-0 bg-cyan-600 hover:bg-cyan-700">
                                <ArrowRight className="w-5 h-5" />
                            </Button>
                        </form>
                    </div>
                ) : (
                    <div className="space-y-8 animate-in fade-in zoom-in duration-500">
                        <div>
                            <h2 className="text-3xl font-light tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 mb-4 font-mono uppercase">
                                {stage === "analyzing" ? "Match Confirmed" : "System Scan"}
                            </h2>
                            <p className="text-muted-foreground font-mono text-sm h-6">
                                {scanText}
                                <span className="animate-pulse">_</span>
                            </p>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-2">
                            <div className="h-1 w-full bg-gray-900 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 transition-all duration-100 ease-out"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-[10px] text-gray-500 font-mono uppercase">
                                <span>Core Analysis</span>
                                <span>{Math.round(progress)}%</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Floating Abstract Data Points */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 opacity-20 animate-spin-slow pointer-events-none">
                    <Server className="w-48 h-48 text-blue-900" />
                </div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 opacity-20 animate-bounce-slow pointer-events-none">
                    <ShieldCheck className="w-32 h-32 text-purple-900" />
                </div>

            </div>
        </div>
    );
}

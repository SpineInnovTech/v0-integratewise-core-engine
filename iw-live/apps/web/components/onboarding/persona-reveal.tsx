"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Cpu } from "lucide-react";
import { motion } from "framer-motion";
import { getVedicPersona } from "@/lib/vedic-numerology";
import { useEffect, useState } from "react";

interface PersonaRevealProps {
    name: string;
    onContinue: () => void;
}

export function PersonaReveal({ name, onContinue }: PersonaRevealProps) {
    const [persona, setPersona] = useState(getVedicPersona(name));

    useEffect(() => {
        setPersona(getVedicPersona(name));
    }, [name]);

    const colorClass = persona.color || "text-cyan-400";

    return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white p-4 overflow-hidden relative">
            {/* Dynamic Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black" />

            <div className="max-w-2xl w-full relative z-10">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="text-center space-y-8"
                >
                    {/* Persona Icon/Badge */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="flex justify-center"
                    >
                        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 p-[2px]">
                            <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                                <Cpu className={`w-10 h-10 ${colorClass}`} />
                            </div>
                        </div>
                    </motion.div>

                    {/* Title & Description */}
                    <div className="space-y-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="uppercase tracking-widest text-xs font-mono text-cyan-500"
                        >
                            Analysis Complete • Archetype Identified
                        </motion.div>

                        <motion.h1
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.8 }}
                            className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-white via-gray-200 to-gray-500"
                        >
                            {persona.title}
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.2 }}
                            className="text-xl text-gray-400 max-w-lg mx-auto leading-relaxed"
                        >
                            "{persona.description}"
                        </motion.p>
                    </div>

                    {/* Traits Grid */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.6 }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-4"
                    >
                        {persona.traits.map((trait, i) => (
                            <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-3 text-sm font-light text-gray-300">
                                {trait}
                            </div>
                        ))}
                    </motion.div>

                    {/* Action */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2.5 }}
                        className="pt-8"
                    >
                        <Button
                            size="lg"
                            onClick={onContinue}
                            className="bg-white text-black hover:bg-gray-200 rounded-full px-8 h-12 text-base font-medium transition-all hover:scale-105"
                        >
                            Initialize Workspace <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                        <p className="mt-4 text-xs text-gray-600">
                            Recommended Path: <span className="text-cyan-600">{persona.recommendedPath}</span>
                        </p>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}

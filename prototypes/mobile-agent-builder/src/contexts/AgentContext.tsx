import React, { createContext, useContext, useState, ReactNode } from "react";

export interface Helper {
  id: string;
  name: string;
  model: string;
  instructions: string;
  enabled: boolean;
}

interface AgentState {
  model: string;
  setModel: (m: string) => void;
  instructions: string;
  setInstructions: (i: string) => void;
  helpers: Helper[];
  updateHelper: (id: string, updates: Partial<Helper>) => void;
  deleteHelper: (id: string) => void;
}

const AgentContext = createContext<AgentState | null>(null);

export const useAgent = () => {
  const ctx = useContext(AgentContext);
  if (!ctx) throw new Error("useAgent must be used within AgentProvider");
  return ctx;
};

export const AgentProvider = ({ children }: { children: ReactNode }) => {
  const [model, setModel] = useState("claude-4.5");
  const [instructions, setInstructions] = useState("");
  const [helpers, setHelpers] = useState<Helper[]>([
    { id: "1", name: "Puzzle Solver", model: "claude-4.5", instructions: "", enabled: true },
    { id: "2", name: "Code Explorer", model: "claude-4.5", instructions: "", enabled: true },
  ]);

  const updateHelper = (id: string, updates: Partial<Helper>) => {
    setHelpers((prev) => prev.map((h) => (h.id === id ? { ...h, ...updates } : h)));
  };

  const deleteHelper = (id: string) => {
    setHelpers((prev) => prev.filter((h) => h.id !== id));
  };

  return (
    <AgentContext.Provider value={{ model, setModel, instructions, setInstructions, helpers, updateHelper, deleteHelper }}>
      {children}
    </AgentContext.Provider>
  );
};

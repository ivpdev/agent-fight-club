import { useNavigate } from "react-router-dom";
import { useAgent } from "@/contexts/AgentContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play } from "lucide-react";

const AgentScreen = () => {
  const navigate = useNavigate();
  const { model, setModel, instructions, setInstructions } = useAgent();

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-background terminal-screen crt-flicker">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h1 className="text-sm font-semibold text-foreground terminal-glow tracking-wider uppercase">
          <span className="text-muted-foreground mr-1">&gt;</span>agent
        </h1>
        <Button variant="outline" size="sm" onClick={() => navigate("/helpers")} className="text-xs uppercase tracking-wider">
          Helpers
        </Button>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col gap-4 p-4 overflow-hidden">
        <div>
          <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">model</label>
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="claude-4.5">Claude 4.5</SelectItem>
              <SelectItem value="deepseek">DeepSeek</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 flex flex-col">
          <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">instructions</label>
          <Textarea
            placeholder="$ enter agent instructions…"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            className="flex-1 resize-none text-sm text-white"
          />
        </div>
      </div>

      {/* Bottom bar */}
      <footer className="flex items-center justify-center px-4 py-3 border-t border-border">
        <Button size="lg" className="gap-2 px-8 uppercase tracking-wider text-xs font-bold terminal-glow">
          <Play className="h-4 w-4" />
          Execute
        </Button>
      </footer>
    </div>
  );
};

export default AgentScreen;

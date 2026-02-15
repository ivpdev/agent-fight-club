import { useNavigate } from "react-router-dom";
import { useAgent } from "@/contexts/AgentContext";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

const HelpersScreen = () => {
  const navigate = useNavigate();
  const { helpers } = useAgent();

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-background terminal-screen crt-flicker">
      <header className="flex items-center px-4 py-3 border-b border-border">
        <h1 className="text-sm font-semibold text-foreground terminal-glow tracking-wider uppercase">
          <span className="text-muted-foreground mr-1">&gt;</span>helpers
        </h1>
      </header>

      <div className="flex-1 overflow-auto">
        {helpers.map((helper, i) => (
          <button
            key={helper.id}
            onClick={() => navigate(`/helpers/${helper.id}`)}
            className="flex items-center justify-between w-full px-4 py-3 text-left border-b border-border hover:bg-accent/50 transition-colors group"
          >
            <span className={`text-sm font-medium tracking-wide ${helper.enabled ? 'text-foreground' : 'text-muted-foreground line-through'}`}>
              <span className="text-muted-foreground mr-2">[{i}]</span>
              {helper.name}
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </button>
        ))}
      </div>

      <footer className="flex items-center justify-center px-4 py-3 border-t border-border">
        <Button variant="outline" onClick={() => navigate("/")} className="uppercase tracking-wider text-xs">
          Back
        </Button>
      </footer>
    </div>
  );
};

export default HelpersScreen;

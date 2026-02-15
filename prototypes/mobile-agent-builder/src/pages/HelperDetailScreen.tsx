import { useNavigate, useParams } from "react-router-dom";
import { useAgent } from "@/contexts/AgentContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2 } from "lucide-react";

const HelperDetailScreen = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { helpers, updateHelper, deleteHelper } = useAgent();

  const helper = helpers.find((h) => h.id === id);
  if (!helper) return null;

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-background terminal-screen crt-flicker">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <Switch
            checked={helper.enabled}
            onCheckedChange={(checked) => updateHelper(helper.id, { enabled: checked })}
          />
          <h1 className="text-sm font-semibold text-foreground terminal-glow tracking-wider uppercase">
            <span className="text-muted-foreground mr-1">&gt;</span>helper
          </h1>
        </div>
        <button
          onClick={() => {
            deleteHelper(helper.id);
            navigate("/helpers");
          }}
          className="text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </header>

      <div className="flex-1 flex flex-col gap-4 p-4 overflow-hidden">
        <div>
          <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">name</label>
          <Input
            value={helper.name}
            onChange={(e) => updateHelper(helper.id, { name: e.target.value })}
            placeholder="$ helper name"
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">model</label>
          <Select value={helper.model} onValueChange={(v) => updateHelper(helper.id, { model: v })}>
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
            placeholder="$ enter helper instructions…"
            value={helper.instructions}
            onChange={(e) => updateHelper(helper.id, { instructions: e.target.value })}
            className="flex-1 resize-none text-sm text-white"
          />
        </div>
      </div>

      <footer className="flex items-center justify-center px-4 py-3 border-t border-border">
        <Button variant="outline" onClick={() => navigate("/helpers")} className="uppercase tracking-wider text-xs">
          Back
        </Button>
      </footer>
    </div>
  );
};

export default HelperDetailScreen;

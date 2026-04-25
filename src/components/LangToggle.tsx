import { Languages } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function LangToggle() {
  const { lang, setLang } = useI18n();
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-border bg-surface p-1 text-xs font-mono">
      <Languages size={12} className="ml-2 text-muted-foreground" />
      <button
        onClick={() => setLang("tr")}
        className={`px-2.5 py-1 rounded-full transition-colors ${lang === "tr" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
      >
        TR
      </button>
      <button
        onClick={() => setLang("en")}
        className={`px-2.5 py-1 rounded-full transition-colors ${lang === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
      >
        EN
      </button>
    </div>
  );
}

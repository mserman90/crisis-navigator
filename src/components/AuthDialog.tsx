import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { Mail, Lock, LogIn, UserPlus, ArrowLeft } from "lucide-react";

type Props = {
  onCancel?: () => void;
  title?: string;
  description?: string;
};

export function AuthDialog({ onCancel, title, description }: Props) {
  const { lang } = useI18n();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const labels = lang === "tr"
    ? {
        signIn: "Giriş Yap",
        signUp: "Hesap Oluştur",
        email: "E-posta",
        password: "Şifre",
        google: "Google ile devam et",
        toSignup: "Hesabın yok mu? Kaydol",
        toSignin: "Zaten üye misin? Giriş yap",
        signupSuccess: "E-postanı doğrula, ardından giriş yapabilirsin.",
        invalid: "E-posta veya şifre hatalı.",
        back: "Geri",
        or: "veya",
      }
    : {
        signIn: "Sign in",
        signUp: "Create account",
        email: "Email",
        password: "Password",
        google: "Continue with Google",
        toSignup: "No account? Sign up",
        toSignin: "Already a member? Sign in",
        signupSuccess: "Check your email to verify, then sign in.",
        invalid: "Invalid email or password.",
        back: "Back",
        or: "or",
      };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success(labels.signupSuccess);
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : labels.invalid;
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw result.error;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "OAuth failed";
      toast.error(msg);
      setBusy(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-surface border border-border rounded-3xl p-8 shadow-elevated">
      {onCancel && (
        <button
          onClick={onCancel}
          className="text-xs text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 font-mono uppercase tracking-widest"
        >
          <ArrowLeft size={12} /> {labels.back}
        </button>
      )}
      <h2 className="text-2xl font-display font-semibold text-foreground mb-1">
        {title ?? (mode === "signin" ? labels.signIn : labels.signUp)}
      </h2>
      {description && (
        <p className="text-sm text-muted-foreground mb-6">{description}</p>
      )}

      <form onSubmit={handleEmail} className="space-y-4 mt-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs uppercase tracking-widest text-muted-foreground">
            {labels.email}
          </Label>
          <div className="relative">
            <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-9"
              placeholder="you@example.com"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs uppercase tracking-widest text-muted-foreground">
            {labels.password}
          </Label>
          <div className="relative">
            <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-9"
              placeholder="••••••••"
            />
          </div>
        </div>
        <Button type="submit" disabled={busy} className="w-full">
          {mode === "signin" ? <LogIn size={16} /> : <UserPlus size={16} />}
          {mode === "signin" ? labels.signIn : labels.signUp}
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3 text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
        <span className="h-px flex-1 bg-border" />
        {labels.or}
        <span className="h-px flex-1 bg-border" />
      </div>

      <Button type="button" variant="outline" disabled={busy} onClick={handleGoogle} className="w-full">
        <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z"/>
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 18.9 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"/>
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35 26.7 36 24 36c-5.3 0-9.7-3.1-11.3-7.6l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.6l6.2 5.2C41.7 35.5 44 30.1 44 24c0-1.2-.1-2.4-.4-3.5z"/>
        </svg>
        {labels.google}
      </Button>

      <button
        type="button"
        onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        className="mt-6 w-full text-xs text-muted-foreground hover:text-foreground font-mono uppercase tracking-widest"
      >
        {mode === "signin" ? labels.toSignup : labels.toSignin}
      </button>
    </div>
  );
}

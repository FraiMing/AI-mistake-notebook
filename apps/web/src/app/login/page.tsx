import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50">
      <div className="w-full max-w-sm space-y-6 rounded-lg border bg-card p-8 shadow-sm">
        <div className="text-center">
          <h1 className="text-xl font-semibold tracking-tight">AI 错题本</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            请输入预设账号登录
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}

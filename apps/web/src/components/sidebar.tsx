"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { signOut } from "next-auth/react";
import { FileText, BookOpen, Bell, MessageSquare, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/problems", label: "错题本", icon: BookOpen },
  { href: "/problems/new", label: "录入错题", icon: FileText },
  { href: "/tags", label: "标签管理", icon: Tag },
  { href: "/messages", label: "复习消息", icon: Bell },
  { href: "/review", label: "开始复习", icon: MessageSquare },
];

export function Sidebar() {
  const pathname = usePathname();

  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ["messages-count"],
    queryFn: async () => {
      const res = await fetch("/api/messages/count");
      if (!res.ok) return { count: 0 };
      return res.json();
    },
    refetchInterval: 30000,
  });

  const unreadCount = unreadData?.count ?? 0;

  return (
    <aside className="w-56 border-r bg-card flex flex-col shrink-0">
      <div className="p-4 border-b">
        <h1 className="text-sm font-semibold tracking-tight">AI 错题本</h1>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              pathname === href
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="flex-1">{label}</span>
            {href === "/messages" && unreadCount > 0 && (
              <span className="inline-flex items-center justify-center rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-medium text-destructive-foreground min-w-[18px]">
                {unreadCount}
              </span>
            )}
          </Link>
        ))}
      </nav>
      <div className="p-3 border-t">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors text-left"
        >
          退出登录
        </button>
      </div>
    </aside>
  );
}
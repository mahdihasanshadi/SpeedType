"use client";

import Link from "next/link";
import { History as HistoryIcon } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function initials(name?: string | null, email?: string | null): string {
  const trimmedName = name?.trim();
  if (trimmedName) {
    const parts = trimmedName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  const trimmedEmail = email?.trim();
  return trimmedEmail ? trimmedEmail.slice(0, 2).toUpperCase() : "?";
}

export function Header() {
  const { data: session, status } = useSession();

  return (
    <header className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6">
      <div className="flex items-center gap-6">
        <Link href="/" className="font-heading text-h3 text-foreground">
          SpeedType
        </Link>
        <nav className="hidden items-center gap-4 text-small text-muted-foreground sm:flex">
          <Link href="/" className="hover:text-foreground">
            Test
          </Link>
          <Link href="/history" className="hover:text-foreground">
            History
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-2">
        {/* nav is desktop-only (see sm:flex above) — this keeps History reachable at mobile
            widths for guests, who have no dropdown menu to hide it in. */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="History"
          nativeButton={false}
          className="sm:hidden"
          render={
            <Link href="/history">
              <HistoryIcon />
            </Link>
          }
        />

        <ThemeToggle />

        {status === "loading" ? (
          <div className="size-8 animate-pulse rounded-full bg-muted" aria-hidden />
        ) : status === "authenticated" && session.user ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button type="button" variant="ghost" size="icon" aria-label="Account menu" className="rounded-full">
                  <Avatar size="sm">
                    <AvatarImage src={session.user.image ?? undefined} alt="" />
                    <AvatarFallback>{initials(session.user.name, session.user.email)}</AvatarFallback>
                  </Avatar>
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="max-w-48 truncate">
                  {session.user.name || session.user.email}
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem nativeButton={false} render={<Link href="/history">History</Link>} />
              <DropdownMenuItem nativeButton={false} render={<Link href="/settings">Settings</Link>} />
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => signOut({ callbackUrl: "/" })}>
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              nativeButton={false}
              render={<Link href="/login">Log in</Link>}
            />
            <Button type="button" size="sm" nativeButton={false} render={<Link href="/signup">Sign up</Link>} />
          </div>
        )}
      </div>
    </header>
  );
}

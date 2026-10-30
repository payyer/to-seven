"use client";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { courseWritesPending, flushCourseDrafts } from "@/lib/courses/store";
import { CloudGate } from "./CloudGate";
import { SessionGate } from "./SessionGate";
export function AppFrame({ children }: { children: ReactNode }) {
  const path = usePathname();
  useEffect(() => {
    const leave = (event: BeforeUnloadEvent) => {
      if (courseWritesPending()) {
        flushCourseDrafts();
        event.preventDefault();
        event.returnValue = "";
      }
    };
    const visible = () => {
      if (document.visibilityState !== "visible") flushCourseDrafts();
    };
    window.addEventListener("beforeunload", leave);
    document.addEventListener("visibilitychange", visible);
    return () => {
      window.removeEventListener("beforeunload", leave);
      document.removeEventListener("visibilitychange", visible);
    };
  }, []);
  return path.startsWith("/courses") || path.startsWith("/grammar") ? (
    <SessionGate>{children}</SessionGate>
  ) : (
    <CloudGate>{children}</CloudGate>
  );
}

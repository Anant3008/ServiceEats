"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function useRequireAuth() {
  const { user } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Small delay to allow hydration
    const timer = setTimeout(() => {
      if (!user) {
        router.push("/auth/login");
      } else {
        setIsChecking(false);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [user, router]);

  return { user, loading: isChecking };
}

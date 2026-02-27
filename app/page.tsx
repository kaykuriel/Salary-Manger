"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/auth";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    getSession().then((s) => {
      router.replace(s ? "/dashboard" : "/login");
    });
  }, [router]);
  return null;
}

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { saveGuestOrderToken } from "@/lib/guestOrders";

function Redirector() {
  const params = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const id = params.get("id");
    const token = params.get("token");
    if (id && token) {
      saveGuestOrderToken(id, token);
      router.replace(`/orders/${id}`);
    } else {
      router.replace("/orders");
    }
  }, [params, router]);

  return <p className="text-sm text-zinc-400">Đang mở đơn hàng của bạn…</p>;
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={null}>
      <Redirector />
    </Suspense>
  );
}

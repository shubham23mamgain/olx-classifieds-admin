import { Suspense } from "react";
import ListingsView from "./ListingsView";

export default function ListingsPage() {
  return (
    <Suspense fallback={<main style={{ padding: 40 }}>Loading listings…</main>}>
      <ListingsView />
    </Suspense>
  );
}

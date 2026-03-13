import { Shield } from "lucide-react";

export default function AdminPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
      <div className="flex items-center gap-2 text-primary">
        <Shield className="h-8 w-8" />
        <h1 className="text-2xl font-bold">관리자 페이지</h1>
      </div>
      <p className="text-muted">관리자 페이지 (준비 중)</p>
    </div>
  );
}

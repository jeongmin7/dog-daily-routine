import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container full-center" style={{ minHeight: 360 }}>
      <div style={{ fontSize: 40, marginBottom: 8 }}>🐾</div>
      <div className="h2 mb-2">찾을 수 없는 페이지입니다</div>
      <div className="caption mb-6">요청하신 페이지가 존재하지 않아요.</div>
      <Link className="btn btn-primary" href="/">
        대시보드로
      </Link>
    </div>
  );
}

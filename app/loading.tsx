export default function Loading() {
  return (
    <div className="container py-8 stack gap-4">
      <div className="skel" style={{ height: 32, width: "40%" }} />
      <div className="skel" style={{ height: 128, width: "100%" }} />
      <div className="skel" style={{ height: 128, width: "100%" }} />
    </div>
  );
}

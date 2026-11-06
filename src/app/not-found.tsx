import Link from 'next/link';

export default function NotFound() {
  return (
    <main>
      <div className="empty" style={{ marginTop: 60 }}>
        <h2>That page isn&apos;t here</h2>
        <p>It may have been deleted, or the link is wrong.</p>
        <Link className="btn ink" href="/">Back to Discover</Link>
      </div>
    </main>
  );
}

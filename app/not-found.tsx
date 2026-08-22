import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">404 — Not found</h1>
      <p className="mt-3 text-muted-foreground">
        The page you requested does not exist on domains.sassmaker.com.
      </p>
      <h2 className="mt-8 text-lg font-medium">Try one of these instead</h2>
      <ul className="mt-3 space-y-2">
        <li>
          <Link href="/" className="underline">
            Home — Domain Rating tracker
          </Link>
        </li>
        <li>
          <Link href="/data" className="underline">
            Public DR dataset
          </Link>
        </li>
        <li>
          <Link href="/changelog" className="underline">
            Changelog
          </Link>
        </li>
        <li>
          <a href="/llms.txt" className="underline">
            llms.txt
          </a>
        </li>
        <li>
          <a href="/api/ai" className="underline">
            Machine descriptor (/api/ai)
          </a>
        </li>
        <li>
          <a href="/openapi.json" className="underline">
            OpenAPI spec
          </a>
        </li>
        <li>
          <a href="/sitemap.xml" className="underline">
            Sitemap
          </a>
        </li>
      </ul>
    </div>
  );
}

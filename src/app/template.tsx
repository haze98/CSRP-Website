/**
 * Route transition: a short CSS rise on every navigation. Pure CSS so the
 * page is never hidden waiting for JavaScript (it ends fully visible even
 * if scripts fail to load).
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-in">{children}</div>;
}

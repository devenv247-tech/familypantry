import { useNavigate, Link } from 'react-router-dom'
import NookaIcon from '../components/ui/NookaIcon'
import { blogPosts } from '../data/blogPosts'

export default function Blog() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* Navbar */}
      <nav className="bg-surface border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <NookaIcon size={32} />
          <span className="font-semibold text-textPrimary text-lg">Nooka</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/login')} className="btn-secondary">Log in</button>
          <button onClick={() => navigate('/register')} className="btn-primary">Get started free</button>
        </div>
      </nav>

      {/* Header */}
      <section className="px-6 py-16 text-center max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-textPrimary mb-4">Nooka Blog</h1>
        <p className="text-gray-600 text-lg">Meal planning tips, food waste advice, and healthy eating guides for Canadian families.</p>
      </section>

      {/* Posts grid */}
      <section className="px-6 pb-24 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {blogPosts.map((post) => (
            <Link
              key={post.slug}
              to={`/blog/${post.slug}`}
              className="card hover:shadow-md transition-shadow duration-200 flex flex-col group"
            >
              <div className="text-4xl mb-4">{post.image}</div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-medium px-2.5 py-1 rounded-pill bg-blue-50 text-primary border border-blue-100">
                  {post.category}
                </span>
                <span className="text-xs text-gray-500">{post.readTime}</span>
              </div>
              <h2 className="font-bold text-textPrimary text-lg mb-2 leading-snug group-hover:text-primary transition-colors">
                {post.title}
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed flex-1">{post.description}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-gray-400">{post.date}</span>
                <span className="text-primary text-sm font-medium">Read more →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-8 text-center text-sm text-gray-500 mt-auto">
        <div className="flex items-center justify-center gap-2 mb-3">
          <NookaIcon size={24} />
          <span className="font-semibold text-textPrimary">Nooka</span>
        </div>
        <p>
          © 2026 Nooka · Built for Canadian families ·{' '}
          <Link to="/privacy" className="hover:underline">Privacy Policy</Link>
          {' · '}
          <Link to="/terms" className="hover:underline">Terms of Service</Link>
        </p>
      </footer>

    </div>
  )
}
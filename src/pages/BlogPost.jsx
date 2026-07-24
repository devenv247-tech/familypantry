import { useParams, useNavigate, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import NookaIcon from '../components/ui/NookaIcon'
import Icon from '../components/ui/Icon'
import { blogPosts } from '../data/blogPosts'

export default function BlogPost() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [content, setContent] = useState('')
  const post = blogPosts.find(p => p.slug === slug)

  useEffect(() => {
    if (!post) return
    fetch(`/blog/${slug}.md`)
      .then(res => res.text())
      .then(text => setContent(text))
      .catch(() => setContent('# Post not found'))
  }, [slug, post])

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold text-textPrimary mb-4">Post not found</p>
          <button onClick={() => navigate('/blog')} className="btn-primary">Back to blog</button>
        </div>
      </div>
    )
  }

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

      {/* Breadcrumb */}
      <div className="px-6 py-4 max-w-3xl mx-auto w-full">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>·</span>
          <Link to="/blog" className="hover:text-primary transition-colors">Blog</Link>
          <span>·</span>
          <span className="text-textPrimary">{post.category}</span>
        </div>
      </div>

      {/* Post header */}
      <section className="px-6 pb-8 max-w-3xl mx-auto w-full">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-medium px-2.5 py-1 rounded-pill bg-blue-50 text-primary border border-blue-100">
            {post.category}
          </span>
          <span className="text-xs text-gray-500">{post.readTime}</span>
          <span className="text-xs text-gray-400">· {post.date}</span>
        </div>
        <div className="mb-6 flex justify-center text-primary"><Icon name={post.image} size={56} /></div>
      </section>

      {/* Post content */}
      <article className="px-6 pb-24 max-w-3xl mx-auto w-full">
        <div className="prose prose-blue max-w-none
          prose-h1:text-3xl prose-h1:font-bold prose-h1:text-textPrimary prose-h1:mb-6 prose-h1:leading-tight
          prose-h2:text-xl prose-h2:font-bold prose-h2:text-textPrimary prose-h2:mt-10 prose-h2:mb-4
          prose-p:text-gray-600 prose-p:leading-relaxed prose-p:mb-4
          prose-li:text-gray-600 prose-li:leading-relaxed
          prose-strong:text-textPrimary
          prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>

        {/* CTA at bottom of post */}
        <div className="mt-16 p-8 bg-blue-50 rounded-card border border-blue-100 text-center">
          <div className="mb-2 flex justify-center text-primary"><Icon name="bubble" size={24} /></div>
          <h3 className="text-xl font-bold text-textPrimary mb-2">Try Nooka free</h3>
          <p className="text-gray-600 text-sm mb-6">Smart meal planning and pantry tracking for Canadian families. No credit card needed.</p>
          <button onClick={() => navigate('/register')} className="btn-primary px-8 py-3">
            Get started free
          </button>
        </div>

        {/* Back to blog */}
        <div className="mt-8 text-center">
          <Link to="/blog" className="text-primary text-sm hover:underline">← Back to all posts</Link>
        </div>
      </article>

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
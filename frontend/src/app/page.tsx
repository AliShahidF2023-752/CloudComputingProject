import Link from 'next/link'
import { Type, Sparkles, Zap, Lock, ArrowRight } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-strong border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center animate-glow">
              <Type className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white gradient-text">Rephraze</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-xl transition-all btn-glow"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30 mb-6 animate-fade-in">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-purple-300">Powered by Advanced AI</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight animate-slide-up">
            Transform AI Content Into
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 animate-glow">
              {' '}Human Writing{' '}
            </span>
            Instantly
          </h1>

          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto animate-fade-in">
            Detect AI-generated patterns and rephrase content to sound authentic and original.
            Get detailed analysis with one-click intelligent rephrasing.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-2xl transition-all flex items-center justify-center gap-2 btn-glow"
            >
              Start Free Analysis
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 glass hover:glass-strong border border-white/10 text-white font-semibold rounded-2xl transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12 animate-fade-in">
            Everything You Need for Content Transformation
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              icon={Zap}
              title="AI Pattern Detection"
              description="Identify AI-generated text with highlighted sections and confidence scores."
              color="purple"
            />
            <FeatureCard
              icon={Type}
              title="Smart Rephrasing"
              description="Transform flagged content into natural, human-like writing with one click."
              color="pink"
            />
            <FeatureCard
              icon={Sparkles}
              title="Originality Analysis"
              description="Ensure your content is unique and passes authenticity checks."
              color="blue"
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 glass">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            How It Works
          </h2>

          <div className="space-y-6">
            <StepCard
              number="1"
              title="Paste Your Content"
              description="Simply paste or type the text you want to analyze into our intelligent editor."
            />
            <StepCard
              number="2"
              title="Get Instant Analysis"
              description="Our AI scans for AI-generated patterns, highlighting issues with detailed insights."
            />
            <StepCard
              number="3"
              title="Rephrase & Perfect"
              description="Transform flagged content with one click until it's completely authentic."
            />
          </div>
        </div>
      </section>

      {/* Privacy Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-3xl p-8 md:p-12 border border-purple-500/20 text-center animate-scale-in">
            <Lock className="w-12 h-12 text-purple-400 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-white mb-4">
              100% Private & Secure
            </h2>
            <p className="text-gray-400 mb-8 max-w-xl mx-auto">
              Your content stays secure on your infrastructure. We use local LLM processing
              for complete privacy and data protection.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-slate-900 font-semibold rounded-2xl hover:bg-gray-100 transition-all btn-glow"
            >
              Create Free Account
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Type className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-semibold">Rephraze</span>
          </div>
          <p className="text-gray-500 text-sm">
            © 2024 Rephraze. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  color,
}: {
  icon: React.ElementType
  title: string
  description: string
  color: 'purple' | 'pink' | 'blue'
}) {
  const colorClasses = {
    purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/30',
    pink: 'from-pink-500/20 to-pink-600/20 border-pink-500/30',
    blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
  }

  const iconColors = {
    purple: 'text-purple-400',
    pink: 'text-pink-400',
    blue: 'text-blue-400',
  }

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} backdrop-blur-xl rounded-2xl p-6 border card-hover`}>
      <Icon className={`w-10 h-10 ${iconColors[color]} mb-4`} />
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  )
}

function StepCard({
  number,
  title,
  description,
}: {
  number: string
  title: string
  description: string
}) {
  return (
    <div className="flex gap-6 items-start">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0">
        <span className="text-white font-bold text-lg">{number}</span>
      </div>
      <div>
        <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
        <p className="text-gray-400">{description}</p>
      </div>
    </div>
  )
}

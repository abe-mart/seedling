import { useNavigate } from 'react-router-dom';
import { Sparkles, BookOpen, Zap, TrendingUp, Mail, CheckCircle2, Flame, Target, Users, Star } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Landing() {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/2 -left-40 w-96 h-96 bg-lime-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        {/* Navigation */}
        <nav className="relative z-10 max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-lime-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-lime-600 bg-clip-text text-transparent">
              StorySeed
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/auth')}
              className="px-6 py-2 text-slate-700 hover:text-emerald-600 font-medium transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/auth')}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-lime-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all hover:scale-105 active:scale-95"
            >
              Get Started Free
            </button>
          </div>
        </nav>

        {/* Hero Content */}
        <div className={`relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 rounded-full mb-8 animate-fade-in">
              <Star className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-800">For Authors, By Authors</span>
            </div>

            {/* Headline */}
            <h1 className="text-6xl md:text-7xl font-extrabold text-slate-900 mb-6 leading-tight">
              Your Story.
              <br />
              <span className="bg-gradient-to-r from-emerald-600 to-lime-600 bg-clip-text text-transparent">
                Your Words.
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-slate-600 mb-12 leading-relaxed max-w-3xl mx-auto">
              StorySeed never writes for you—it helps you discover what you want to write. 
              Smart prompts that draw out your ideas and help you develop your unique voice.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <button
                onClick={() => navigate('/auth')}
                className="group px-8 py-4 bg-gradient-to-r from-emerald-600 to-lime-600 text-white text-lg font-bold rounded-2xl shadow-xl shadow-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/40 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                Start Writing Free
                <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              </button>
              <button
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 bg-white text-slate-700 text-lg font-semibold rounded-2xl border-2 border-slate-200 hover:border-emerald-300 hover:shadow-lg transition-all"
              >
                Learn More
              </button>
            </div>

            {/* Philosophy Statement */}
            <div className="bg-white/60 backdrop-blur-sm border-2 border-emerald-200 rounded-2xl p-6 max-w-2xl mx-auto mb-12">
              <p className="text-slate-700 font-medium text-center">
                <span className="text-emerald-600 font-bold">No AI-written content.</span> StorySeed guides your thinking 
                with intelligent prompts—you provide all the creativity, imagination, and words.
              </p>
            </div>

            {/* Social Proof */}
            <div className="flex items-center justify-center gap-8 text-slate-600">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                <span className="text-sm font-medium">Authors worldwide</span>
              </div>
              <div className="hidden sm:block w-px h-6 bg-slate-300"></div>
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                <span className="text-sm font-medium">Writing daily</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="relative z-10 max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Tools That Draw Out Your Best Writing
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            We don't write for you. We help you uncover the story only you can tell.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="group p-8 bg-white rounded-2xl border-2 border-slate-200 hover:border-emerald-300 hover:shadow-xl transition-all cursor-pointer">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-lime-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/20">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">Thought-Provoking Prompts</h3>
            <p className="text-slate-600 leading-relaxed">
              Intelligent questions that make you think deeper about your characters, 
              settings, and plot. You write—we guide your creative exploration.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="group p-8 bg-white rounded-2xl border-2 border-slate-200 hover:border-emerald-300 hover:shadow-xl transition-all cursor-pointer">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-lime-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/20">
              <Target className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">Smart Element Tracking</h3>
            <p className="text-slate-600 leading-relaxed">
              Organize characters, locations, themes, and plot points. 
              Never lose track of your story's moving pieces.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="group p-8 bg-white rounded-2xl border-2 border-slate-200 hover:border-emerald-300 hover:shadow-xl transition-all cursor-pointer">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-lime-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/20">
              <Mail className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">Daily Writing Practice</h3>
            <p className="text-slate-600 leading-relaxed">
              Personalized prompts delivered to your inbox. Not AI-generated content—
              thought-provoking questions that spark your own creativity.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="group p-8 bg-white rounded-2xl border-2 border-slate-200 hover:border-emerald-300 hover:shadow-xl transition-all cursor-pointer">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-lime-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/20">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">Track Your Growth</h3>
            <p className="text-slate-600 leading-relaxed">
              Celebrate your writing streaks and development progress. 
              Every word is yours—we just help you see how far you've come.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="group p-8 bg-white rounded-2xl border-2 border-slate-200 hover:border-emerald-300 hover:shadow-xl transition-all cursor-pointer">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-lime-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/20">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">Multi-Project Support</h3>
            <p className="text-slate-600 leading-relaxed">
              Work on multiple stories simultaneously. Organize series, standalone novels, 
              and short stories all in one place.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="group p-8 bg-white rounded-2xl border-2 border-slate-200 hover:border-emerald-300 hover:shadow-xl transition-all cursor-pointer">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-lime-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/20">
              <Flame className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">Build Your Habit</h3>
            <p className="text-slate-600 leading-relaxed">
              Show up daily, explore your ideas, develop your voice. 
              Consistent practice is how great stories get written.
            </p>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="relative bg-gradient-to-br from-emerald-600 to-lime-600 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Your Creative Process, Enhanced
            </h2>
            <p className="text-xl text-emerald-50 max-w-2xl mx-auto">
              A simple process that helps you discover and develop your unique story.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative p-8 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
              <div className="absolute -top-6 left-8 w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl font-bold text-emerald-600 shadow-lg">
                1
              </div>
              <h3 className="text-2xl font-bold text-white mb-3 mt-4">Outline Your World</h3>
              <p className="text-emerald-50 leading-relaxed">
                Input your book's foundation—characters, locations, themes, plot ideas. 
                StorySeed organizes what you create.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative p-8 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
              <div className="absolute -top-6 left-8 w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl font-bold text-emerald-600 shadow-lg">
                2
              </div>
              <h3 className="text-2xl font-bold text-white mb-3 mt-4">Explore Through Prompts</h3>
              <p className="text-emerald-50 leading-relaxed">
                Answer thought-provoking questions about underdeveloped areas. 
                Discover details you didn't know were there.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative p-8 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
              <div className="absolute -top-6 left-8 w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl font-bold text-emerald-600 shadow-lg">
                3
              </div>
              <h3 className="text-2xl font-bold text-white mb-3 mt-4">Write Consistently</h3>
              <p className="text-emerald-50 leading-relaxed">
                Show up daily to develop your ideas. Your words, your voice, your story—
                finished through dedication.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonial / Value Prop Section */}
      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-12 md:p-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-6 h-6 fill-emerald-400 text-emerald-400" />
                ))}
              </div>
              <blockquote className="text-2xl md:text-3xl font-medium text-white mb-6 leading-relaxed">
                "StorySeed doesn't write my story—it asks the questions I didn't know I needed 
                to answer. Every word is mine, but the prompts helped me dig deeper into my 
                characters and world than I ever could alone."
              </blockquote>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-lime-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  S
                </div>
                <div>
                  <div className="font-semibold text-white">Sarah Martinez</div>
                  <div className="text-slate-400">Fantasy Author, 3 Published Novels</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="bg-gradient-to-br from-emerald-50 to-lime-50 rounded-3xl p-12 md:p-16 text-center border-2 border-emerald-200">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Ready to Write Your Story?
          </h2>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            Join authors who are developing their craft and bringing their unique stories to life.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <button
              onClick={() => navigate('/auth')}
              className="group px-10 py-5 bg-gradient-to-r from-emerald-600 to-lime-600 text-white text-lg font-bold rounded-2xl shadow-xl shadow-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/40 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              Start Your Free Account
              <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Free forever plan</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-lime-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-lime-600 bg-clip-text text-transparent">
                StorySeed
              </span>
            </div>
            
            <div className="text-slate-600 text-sm">
              © 2025 StorySeed. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

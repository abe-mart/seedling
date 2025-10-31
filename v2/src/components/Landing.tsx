import { useNavigate } from 'react-router-dom';
import { Sparkles, BookOpen, Zap, TrendingUp, Mail, CheckCircle2, Flame, Target, Users, Star, ArrowRight, MessageSquare, Lightbulb, Edit3 } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

export default function Landing() {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  
  const step1Ref = useRef<HTMLDivElement>(null);
  const step2Ref = useRef<HTMLDivElement>(null);
  const step3Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsVisible(true);
    
    // Intersection Observer to detect which step is in view
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const stepIndex = entry.target.getAttribute('data-step');
            if (stepIndex !== null) {
              setActiveStep(parseInt(stepIndex));
            }
          }
        });
      },
      {
        threshold: 0.5, // Trigger when 50% of the element is visible
        rootMargin: '-20% 0px -20% 0px' // Center focus area
      }
    );

    // Observe all step elements
    if (step1Ref.current) observer.observe(step1Ref.current);
    if (step2Ref.current) observer.observe(step2Ref.current);
    if (step3Ref.current) observer.observe(step3Ref.current);

    return () => observer.disconnect();
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

            {/* Social Proof */}
            <div className="flex items-center justify-center gap-8 text-slate-600 mb-16">
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

            {/* Visual Demo Section */}
            <div className="max-w-5xl mx-auto">
              {/* Progress Indicator */}
              <div className="flex items-center justify-center gap-2 mb-8">
                <div className={`h-1 rounded-full transition-all duration-500 ${activeStep >= 0 ? 'w-20 bg-gradient-to-r from-emerald-600 to-lime-600' : 'w-12 bg-slate-200'}`}></div>
                <div className={`h-1 rounded-full transition-all duration-500 ${activeStep >= 1 ? 'w-20 bg-gradient-to-r from-emerald-600 to-lime-600' : 'w-12 bg-slate-200'}`}></div>
                <div className={`h-1 rounded-full transition-all duration-500 ${activeStep >= 2 ? 'w-20 bg-gradient-to-r from-emerald-600 to-lime-600' : 'w-12 bg-slate-200'}`}></div>
              </div>

              <div className="space-y-8">
                {/* Step 1: Add Elements */}
                <div 
                  ref={step1Ref}
                  data-step="0"
                  className={`transition-all duration-700 ${activeStep >= 0 ? 'opacity-100 translate-y-0' : 'opacity-40 translate-y-4'}`}
                >
                  <div className="bg-white rounded-3xl shadow-2xl border-2 border-slate-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-50 to-lime-50 p-6 border-b-2 border-emerald-200">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-lime-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
                          1
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-slate-900">Add Your Story Elements</h3>
                          <p className="text-slate-600 text-sm">Create the foundation of your world</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-8">
                      <div className="space-y-4">
                        <div className="bg-gradient-to-br from-emerald-50 to-white rounded-xl p-5 border-2 border-emerald-200 hover:shadow-lg transition-all">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                              <Users className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Character</span>
                          </div>
                          <h4 className="font-bold text-slate-900 text-lg mb-1">Elena Rodriguez</h4>
                          <p className="text-slate-600">A brilliant archaeologist haunted by her past discoveries</p>
                        </div>
                        
                        <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-5 border-2 border-blue-200 hover:shadow-lg transition-all">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                              <Target className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Location</span>
                          </div>
                          <h4 className="font-bold text-slate-900 text-lg mb-1">The Forgotten Temple</h4>
                          <p className="text-slate-600">Deep in the Amazon rainforest, untouched for centuries</p>
                        </div>
                        
                        <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl p-5 border-2 border-purple-200 hover:shadow-lg transition-all">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                              <BookOpen className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">Theme</span>
                          </div>
                          <h4 className="font-bold text-slate-900 text-lg mb-1">Redemption vs. Ambition</h4>
                          <p className="text-slate-600">The conflict between making amends and achieving greatness</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Arrow Connector */}
                <div className={`flex justify-center transition-all duration-700 ${activeStep >= 1 ? 'opacity-100' : 'opacity-20'}`}>
                  <ArrowRight className="w-8 h-8 text-emerald-600" />
                </div>

                {/* Step 2: Get Prompts */}
                <div 
                  ref={step2Ref}
                  data-step="1"
                  className={`transition-all duration-700 ${activeStep >= 1 ? 'opacity-100 translate-y-0' : 'opacity-40 translate-y-4'}`}
                >
                  <div className="bg-white rounded-3xl shadow-2xl border-2 border-slate-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 border-b-2 border-indigo-200">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
                          2
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-slate-900">Receive a Thoughtful Prompt</h3>
                          <p className="text-slate-600 text-sm">Questions that deepen your understanding</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-8">
                      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-indigo-200">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Lightbulb className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-indigo-300">
                              <p className="text-slate-900 text-lg font-medium leading-relaxed">
                                "What specific discovery from Elena's past haunts her the most? 
                                How does this memory influence her decisions when she enters the Forgotten Temple?"
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-center gap-2 text-sm text-slate-600 bg-white/50 rounded-lg p-3">
                          <Zap className="w-4 h-4 text-indigo-600" />
                          <span>Connects: <span className="font-semibold text-emerald-600">Elena</span> + <span className="font-semibold text-blue-600">Temple</span></span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Arrow Connector */}
                <div className={`flex justify-center transition-all duration-700 ${activeStep >= 2 ? 'opacity-100' : 'opacity-20'}`}>
                  <ArrowRight className="w-8 h-8 text-emerald-600" />
                </div>

                {/* Step 3: Write */}
                <div 
                  ref={step3Ref}
                  data-step="2"
                  className={`transition-all duration-700 ${activeStep >= 2 ? 'opacity-100 translate-y-0' : 'opacity-40 translate-y-4'}`}
                >
                  <div className="bg-white rounded-3xl shadow-2xl border-2 border-slate-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 border-b-2 border-amber-200">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-600 to-orange-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
                          3
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-slate-900">Write Your Response</h3>
                          <p className="text-slate-600 text-sm">Every word is yours—StorySeed never writes for you</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-8">
                      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border-2 border-amber-200">
                        <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-amber-300">
                          <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200">
                            <div className="flex items-center gap-2 text-amber-700">
                              <Edit3 className="w-5 h-5" />
                              <span className="text-sm font-semibold">Your Writing</span>
                            </div>
                            <span className="text-sm text-slate-500 font-medium">247 words</span>
                          </div>
                          <div className="text-slate-700 leading-relaxed space-y-4">
                            <p className="font-serif text-base">
                              Elena's hands still trembled when she thought about the Mayan codex she'd authenticated five years ago. 
                              The one that led treasure hunters to sacred burial grounds. The one that got people killed.
                            </p>
                            <p className="font-serif text-base text-slate-500">
                              She'd been so proud of her discovery, so eager to prove her expertise. Now, standing at the entrance 
                              of this temple, she felt that same electric thrill of discovery—and it terrified her...
                            </p>
                          </div>
                          <div className="mt-6 pt-4 border-t border-slate-200 flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2 text-sm text-emerald-600 font-semibold">
                              <CheckCircle2 className="w-5 h-5" />
                              <span>Development tracked</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-orange-600 font-semibold">
                              <Flame className="w-5 h-5" />
                              <span>7-day streak 🔥</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Insight */}
              <div className="mt-12 bg-gradient-to-br from-emerald-50 to-lime-50 border-2 border-emerald-300 rounded-2xl p-8 text-center shadow-lg">
                <p className="text-slate-800 text-lg font-medium leading-relaxed">
                  <span className="text-emerald-700 font-bold text-xl">No AI-written content.</span>
                  <br />
                  <span className="text-slate-600">StorySeed guides your thinking with questions—you provide all the creativity, imagination, and words.</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="relative z-10 max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Powerful Tools for Serious Authors
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Everything you need to develop your story, build consistency, and finish what you start.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Feature 1 */}
          <div className="group p-6 bg-white rounded-xl border-2 border-slate-200 hover:border-emerald-300 hover:shadow-lg transition-all">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-lime-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/20">
              <Lightbulb className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Smart Prompts</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Questions that deepen your characters, settings, and plot
            </p>
          </div>

          {/* Feature 2 */}
          <div className="group p-6 bg-white rounded-xl border-2 border-slate-200 hover:border-emerald-300 hover:shadow-lg transition-all">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-lime-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/20">
              <Target className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Element Tracking</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Organize all your story pieces in one place
            </p>
          </div>

          {/* Feature 3 */}
          <div className="group p-6 bg-white rounded-xl border-2 border-slate-200 hover:border-emerald-300 hover:shadow-lg transition-all">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-lime-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/20">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Daily Emails</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Prompts delivered to your inbox to build the habit
            </p>
          </div>

          {/* Feature 4 */}
          <div className="group p-6 bg-white rounded-xl border-2 border-slate-200 hover:border-emerald-300 hover:shadow-lg transition-all">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-lime-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/20">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Streak Tracking</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Stay motivated with daily writing streaks
            </p>
          </div>
        </div>
      </div>

      {/* Why Authors Love It Section */}
      <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Why Authors Choose StorySeed
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Built by authors, for authors who respect the craft of writing.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Reason 1 */}
            <div className="p-8 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:bg-white/10 transition-all">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center mb-6">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Your Voice Stays Yours</h3>
              <p className="text-slate-300 leading-relaxed">
                No AI ghostwriting. No generic content. Just intelligent questions that 
                help you discover what only you can write.
              </p>
            </div>

            {/* Reason 2 */}
            <div className="p-8 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:bg-white/10 transition-all">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center mb-6">
                <Target className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Focus Where It Matters</h3>
              <p className="text-slate-300 leading-relaxed">
                Our prompts intelligently target your underdeveloped story elements, 
                ensuring balanced, thorough world-building.
              </p>
            </div>

            {/* Reason 3 */}
            <div className="p-8 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:bg-white/10 transition-all">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Build Real Progress</h3>
              <p className="text-slate-300 leading-relaxed">
                Track your consistency, celebrate milestones, and watch your story 
                develop through your own dedicated effort.
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

import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  Users, 
  UserCheck, 
  Eye, 
  Trophy,
  Activity,
  Clock,
  Zap,
  CheckCircle2,
  ArrowRight,
  Play,
  BarChart3,
  Timer,
  Target,
  Mail,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { motion } from 'motion/react';

interface LandingPageProps {
  onGetStarted: () => void;
  onViewDemo: () => void;
}

// Smooth scroll utility function with easing
const smoothScrollTo = (elementId: string) => {
  const element = document.getElementById(elementId);
  if (element) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }
};

export function LandingPage({ onGetStarted, onViewDemo }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* Enhanced Navigation with Glassmorphism */}
      <motion.nav 
        className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-b border-gray-200/50 z-50 shadow-sm"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <motion.div 
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <span className="text-gray-900 text-xl tracking-tight">KhoKho Arena</span>
            </motion.div>
            <motion.div 
              className="hidden md:flex items-center gap-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <motion.button 
                onClick={() => smoothScrollTo('features')} 
                className="text-gray-600 hover:text-blue-600 transition-all duration-300 relative group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="relative">
                  Features
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
                </span>
              </motion.button>
              <motion.button 
                onClick={() => smoothScrollTo('how-it-works')} 
                className="text-gray-600 hover:text-blue-600 transition-all duration-300 relative group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="relative">
                  How It Works
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
                </span>
              </motion.button>
              <motion.button 
                onClick={() => smoothScrollTo('pricing')} 
                className="text-gray-600 hover:text-blue-600 transition-all duration-300 relative group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="relative">
                  Pricing
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
                </span>
              </motion.button>
              <motion.button 
                onClick={() => smoothScrollTo('testimonials')} 
                className="text-gray-600 hover:text-blue-600 transition-all duration-300 relative group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="relative">
                  Testimonials
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
                </span>
              </motion.button>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  variant="outline" 
                  className="text-blue-600 border-blue-300 hover:border-blue-500 hover:text-blue-700 hover:bg-blue-50/50 transition-all duration-300"
                  onClick={onViewDemo}
                >
                  Visit Viewer Page
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  variant="outline" 
                  className="text-gray-700 border-gray-300 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50/50 transition-all duration-300"
                  onClick={onGetStarted}
                >
                  Sign In
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section - Full Screen Height */}
      <section className="min-h-screen pt-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden flex items-center">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Content */}
            <motion.div 
              className="space-y-8"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 px-4 py-1.5 mb-6">
                    <Sparkles className="w-3 h-3 mr-1.5" />
                    Live Tournament Management
                  </Badge>
                </motion.div>
                
                <h1 className="text-4xl md:text-5xl text-gray-900 leading-tight tracking-tight">
                  The Complete Live Scoring & Tournament Management System for <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">Kho-Kho</span>
                </h1>
                <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
                  Run tournaments smoothly, score matches accurately, and give your audience a world-class live viewing experience — all in one platform.
                </p>
              </div>

              <motion.div 
                className="flex flex-col sm:flex-row gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white h-14 px-8 text-lg shadow-xl shadow-blue-500/30 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/40"
                  onClick={onGetStarted}
                >
                  Get a Demo
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  className="text-blue-600 border-blue-300 hover:bg-blue-50 h-14 px-8 text-lg hover:border-blue-500 transition-all hover:scale-105"
                  onClick={onViewDemo}
                >
                  <Play className="w-5 h-5 mr-2" />
                  See Live Matches
                </Button>
              </motion.div>

              <motion.div 
                className="flex flex-wrap items-center gap-6 pt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  Built for real Kho-Kho tournaments
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  Fast & accurate live scoring
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  Used by organizers and sports communities
                </div>
              </motion.div>
            </motion.div>

            {/* Right: Mockup */}
            <motion.div 
              className="relative"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.3 }}
            >
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl opacity-20 blur-2xl"></div>
              <Card className="relative border-2 border-gray-200 shadow-2xl overflow-hidden">
                <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-4 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className="bg-white/20 text-white border-white/30 border">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
                      LIVE
                    </Badge>
                    <span className="text-sm opacity-90">Match #12</span>
                  </div>
                </div>
                <CardContent className="p-6 space-y-6">
                  {/* Scoreboard */}
                  <div className="grid grid-cols-3 gap-4">
                    <motion.div 
                      className="bg-blue-50 rounded-lg p-4 text-center border-2 border-blue-200"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.2 }}
                    >
                      <p className="text-sm text-gray-600 mb-1">Team A</p>
                      <p className="text-4xl text-gray-900">14</p>
                    </motion.div>
                    <motion.div 
                      className="bg-gray-50 rounded-lg p-4 text-center border-2 border-gray-200"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.2 }}
                    >
                      <p className="text-sm text-gray-600 mb-1">Timer</p>
                      <p className="text-4xl text-gray-900">08:45</p>
                    </motion.div>
                    <motion.div 
                      className="bg-purple-50 rounded-lg p-4 text-center border-2 border-purple-200"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.2 }}
                    >
                      <p className="text-sm text-gray-600 mb-1">Team B</p>
                      <p className="text-4xl text-gray-900">10</p>
                    </motion.div>
                  </div>

                  {/* Live Feed */}
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Live Activity</p>
                    <div className="space-y-2">
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <p className="text-sm text-gray-900">#7 Ravi → Simple Touch → #4 Suresh</p>
                        <p className="text-xs text-gray-600 mt-1">03:45 • OUT</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <p className="text-sm text-gray-900">#3 Amit → Pole Dive → #8 Naveen</p>
                        <p className="text-xs text-gray-600 mt-1">05:20 • OUT</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Who It's For Strip with gradient transition */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-purple-50/50 via-white to-gray-50 border-y border-gray-100">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl text-gray-900 mb-3">Made for Everyone Involved in Kho-Kho</h2>
            <p className="text-gray-600">A complete platform for the entire sports ecosystem</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Trophy, title: 'Tournament Organizers', desc: 'Create and manage tournaments with ease', gradient: 'from-blue-500 to-blue-600', hoverBorder: 'hover:border-blue-300' },
              { icon: UserCheck, title: 'Match Scorers', desc: 'Fast and accurate live match scoring', gradient: 'from-purple-500 to-purple-600', hoverBorder: 'hover:border-purple-300' },
              { icon: Eye, title: 'Viewers & Fans', desc: 'Watch live matches and follow scores', gradient: 'from-green-500 to-green-600', hoverBorder: 'hover:border-green-300' },
              { icon: Users, title: 'Coaches & Teams', desc: 'Track player stats and team performance', gradient: 'from-orange-500 to-orange-600', hoverBorder: 'hover:border-orange-300' }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <Card className={`border-gray-200 ${item.hoverBorder} hover:shadow-xl transition-all duration-200`}>
                  <CardContent className="p-6 text-center">
                    <div className={`w-16 h-16 bg-gradient-to-br ${item.gradient} rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                      <item.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-sm text-gray-600">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Features - Full Screen Height */}
      <section id="features" className="min-h-screen py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 via-white to-blue-50/30 flex items-center">
        <div className="max-w-7xl mx-auto w-full">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 px-4 py-1.5 mb-4">
              Features
            </Badge>
            <h2 className="text-5xl md:text-6xl bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text mb-4">
              Powerful Features for Every Role
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Complete tools for organizers, scorers, and fans
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Tournament Organizers */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.03, y: -8 }}
            >
              <Card className="border-2 border-gray-200 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-200 h-full">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                    <Trophy className="w-9 h-9 text-white" />
                  </div>
                  <h3 className="text-2xl text-gray-900 mb-3">Tournament Organizers</h3>
                  <p className="text-gray-600 mb-6">Manage Events with Total Control</p>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Create tournaments, teams & fixtures</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Assign scorers</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Monitor live match progress</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Publish results instantly</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">View standings and reports</span>
                    </li>
                  </ul>
                  <Button
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
                    onClick={onGetStarted}
                  >
                    Sign Up as Organizer
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Match Scorers */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.03, y: -8 }}
            >
              <Card className="border-2 border-gray-200 hover:border-purple-400 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-200 h-full">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                    <Timer className="w-9 h-9 text-white" />
                  </div>
                  <h3 className="text-2xl text-gray-900 mb-3">Match Scorers</h3>
                  <p className="text-gray-600 mb-6">The Fastest, Easiest Kho-Kho Scoring Interface</p>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">One-tap attacker, defender & event selection</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Turn-wise timer with per-time tracking</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Substitutions, cards, warnings</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Edit events instantly</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Speed-optimized layout</span>
                    </li>
                  </ul>
                  <Button
                    className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
                    onClick={onGetStarted}
                  >
                    Get Started as Scorer
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Viewers & Fans */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.03, y: -8 }}
            >
              <Card className="border-2 border-gray-200 hover:border-green-400 hover:shadow-2xl hover:shadow-green-500/20 transition-all duration-200 h-full">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                    <Eye className="w-9 h-9 text-white" />
                  </div>
                  <h3 className="text-2xl text-gray-900 mb-3">Viewers & Fans</h3>
                  <p className="text-gray-600 mb-6">Watch Live Kho-Kho Like Never Before</p>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Live scoreboard</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Real-time action feed</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Player stats & lineups</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Fixtures, results & points table</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Easy to understand even for beginners</span>
                    </li>
                  </ul>
                  <Button
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
                    onClick={onViewDemo}
                  >
                    Watch Live Matches
                    <Play className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works - Full Screen Height - NO BACKGROUND LINE, NO TILT */}
      <section id="how-it-works" className="min-h-screen py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50/30 via-white to-purple-50/30 flex items-center">
        <div className="max-w-7xl mx-auto w-full">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 px-4 py-1.5 mb-6">
              How It Works
            </Badge>
            <h2 className="text-5xl md:text-6xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-transparent bg-clip-text mb-6">
              Get Started in 4 Simple Steps
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From tournament creation to live results in minutes
            </p>
          </motion.div>

          {/* Desktop: Clean Grid Without Line */}
          <div className="hidden md:grid md:grid-cols-4 gap-8">
            {[
              { icon: Trophy, title: 'Create Tournament', desc: 'Organizer sets up event, teams, and fixtures.', gradient: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-500/50', delay: 0.2 },
              { icon: UserCheck, title: 'Assign Scorers', desc: 'Scorers get their matches and log in.', gradient: 'from-purple-500 to-purple-600', shadow: 'shadow-purple-500/50', delay: 0.4 },
              { icon: Activity, title: 'Score Live Matches', desc: 'Real-time scoring with smart rules.', gradient: 'from-pink-500 to-pink-600', shadow: 'shadow-pink-500/50', delay: 0.6 },
              { icon: BarChart3, title: 'View & Publish Results', desc: 'Admin verifies, viewers see results.', gradient: 'from-orange-500 to-orange-600', shadow: 'shadow-orange-500/50', delay: 0.8 }
            ].map((step, index) => (
              <motion.div
                key={index}
                className="text-center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: step.delay }}
                viewport={{ once: true }}
                whileHover={{ y: -8 }}
              >
                {/* Icon Box - NO TILT/ROTATE */}
                <div className={`w-32 h-32 bg-gradient-to-br ${step.gradient} rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl ${step.shadow}`}>
                  <step.icon className="w-16 h-16 text-white" />
                </div>
                <motion.div 
                  className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                  whileHover={{ boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.15)' }}
                >
                  <h3 className="text-xl text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600">{step.desc}</p>
                </motion.div>
              </motion.div>
            ))}
          </div>

          {/* Mobile: Vertical Stack */}
          <div className="md:hidden space-y-8">
            {[
              { icon: Trophy, title: 'Create Tournament', desc: 'Organizer sets up event, teams, and fixtures.', gradient: 'from-blue-500 to-blue-600' },
              { icon: UserCheck, title: 'Assign Scorers', desc: 'Scorers get their matches and log in.', gradient: 'from-purple-500 to-purple-600' },
              { icon: Activity, title: 'Score Live Matches', desc: 'Real-time scoring with smart rules.', gradient: 'from-pink-500 to-pink-600' },
              { icon: BarChart3, title: 'View & Publish Results', desc: 'Admin verifies, viewers see results.', gradient: 'from-orange-500 to-orange-600' }
            ].map((step, index) => (
              <motion.div
                key={index}
                className="flex gap-4"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="flex-shrink-0">
                  <div className={`w-20 h-20 bg-gradient-to-br ${step.gradient} rounded-2xl flex items-center justify-center shadow-xl`}>
                    <step.icon className="w-10 h-10 text-white" />
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-100 flex-1">
                  <h3 className="text-lg text-gray-900 mb-1">{step.title}</h3>
                  <p className="text-gray-600">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Experience - LIGHTENED VERSION - Full Screen Height */}
      <section className="min-h-screen py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 flex items-center">
        <div className="max-w-7xl mx-auto w-full">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Badge className="bg-white/40 backdrop-blur-sm text-blue-700 border-blue-200 border mb-4">
              Live Experience
            </Badge>
            <h2 className="text-5xl md:text-6xl text-gray-900 mb-4">
              Experience Live Kho-Kho Like Never Before
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              Real-time scoring, instant updates, and comprehensive match insights
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
          >
            <Card className="border-2 border-white/50 shadow-2xl overflow-hidden max-w-4xl mx-auto bg-white/90 backdrop-blur-sm">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
                <div className="flex items-center justify-between mb-4">
                  <Badge className="bg-white/20 text-white border-white/30 border">
                    <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse mr-2"></div>
                    LIVE MATCH
                  </Badge>
                  <span className="text-sm text-white/90">Inning 1 • Turn 2</span>
                </div>
                {/* Scoreboard */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
                    <p className="text-sm text-white/80 mb-2">Mumbai Lions</p>
                    <p className="text-5xl text-white">14</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center flex flex-col items-center justify-center">
                    <Clock className="w-8 h-8 mb-2 text-white/80" />
                    <p className="text-4xl text-white">08:45</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
                    <p className="text-sm text-white/80 mb-2">Delhi Tigers</p>
                    <p className="text-5xl text-white">10</p>
                  </div>
                </div>
              </div>

              <CardContent className="p-6 space-y-6 bg-white">
                {/* Live Feed */}
                <div>
                  <h3 className="text-gray-900 mb-4">Live Activity Feed</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Zap className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">#7 Ravi → Simple Touch → #4 Suresh</p>
                        <p className="text-xs text-gray-600 mt-1">03:45 • OUT</p>
                      </div>
                      <Badge className="bg-red-100 text-red-700 border-red-200 border">+2</Badge>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <Target className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">#3 Amit → Pole Dive → #8 Naveen</p>
                        <p className="text-xs text-gray-600 mt-1">05:20 • OUT</p>
                      </div>
                      <Badge className="bg-red-100 text-red-700 border-red-200 border">+2</Badge>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                  <div className="text-center">
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200 border mb-2">
                      Turn-wise stats
                    </Badge>
                  </div>
                  <div className="text-center">
                    <Badge className="bg-purple-100 text-purple-700 border-purple-200 border mb-2">
                      Per-time tracking
                    </Badge>
                  </div>
                  <div className="text-center">
                    <Badge className="bg-green-100 text-green-700 border-green-200 border mb-2">
                      Substitutions
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Testimonials - Full Screen Height */}
      <section id="testimonials" className="min-h-screen py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-pink-50/30 via-white to-gray-50 flex items-center">
        <div className="max-w-7xl mx-auto w-full">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Badge className="bg-green-100 text-green-700 border-green-200 border mb-4">
              Testimonials
            </Badge>
            <h2 className="text-5xl md:text-6xl text-gray-900 mb-4">
              Trusted by Tournament Organizers
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Rajesh Kumar', role: 'Tournament Organizer', quote: 'Made it so easy to run our college Kho-Kho tournament. The live scoring was seamless and parents loved watching online.' },
              { name: 'Priya Sharma', role: 'Sports Coordinator', quote: 'Live scoring was smooth, and players loved seeing their stats immediately after matches. Highly recommend!' },
              { name: 'Anil Desai', role: 'District Sports Officer', quote: 'The admin panel made tournament management a breeze. Everything from team creation to results in one place.' }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5, boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.15)' }}
              >
                <Card className="border-gray-200 h-full">
                  <CardContent className="p-6">
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="w-5 h-5 text-yellow-400">★</div>
                      ))}
                    </div>
                    <p className="text-gray-700 mb-4">&quot;{testimonial.quote}&quot;</p>
                    <div>
                      <p className="text-gray-900">{testimonial.name}</p>
                      <p className="text-sm text-gray-600">{testimonial.role}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing - Full Screen Height */}
      <section id="pricing" className="min-h-screen py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 via-white to-blue-50/30 flex items-center">
        <div className="max-w-7xl mx-auto w-full">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 px-4 py-1.5 mb-6">
              Pricing
            </Badge>
            <h2 className="text-5xl md:text-6xl bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text mb-6">
              Flexible for Schools, Colleges & Tournaments
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose a plan that fits your needs
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Basic */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.03, y: -8 }}
            >
              <Card className="border-2 border-gray-200 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-200 h-full">
                <CardContent className="p-8">
                  <h3 className="text-2xl text-gray-900 mb-2">Basic</h3>
                  <p className="text-gray-600 mb-6">Perfect for small events</p>
                  <div className="mb-6">
                    <span className="text-5xl text-gray-900">₹999</span>
                    <span className="text-gray-600">/month</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                      <span className="text-gray-700">1 tournament</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                      <span className="text-gray-700">Up to 30 matches</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                      <span className="text-gray-700">5 scorer accounts</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                      <span className="text-gray-700">Email support</span>
                    </li>
                  </ul>
                  <Button 
                    variant="outline" 
                    className="w-full border-gray-300 hover:border-blue-500 hover:text-blue-600 transition-all"
                    onClick={onGetStarted}
                  >
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Professional - Highlighted */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05, y: -12 }}
            >
              <Card className="border-2 border-blue-500 hover:shadow-3xl hover:shadow-blue-500/30 transition-all duration-200 relative h-full bg-gradient-to-br from-blue-50 to-purple-50">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 shadow-lg">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
                <CardContent className="p-8">
                  <h3 className="text-2xl text-gray-900 mb-2">Professional</h3>
                  <p className="text-gray-600 mb-6">For serious tournaments</p>
                  <div className="mb-6">
                    <span className="text-5xl bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">₹2,999</span>
                    <span className="text-gray-600">/month</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                      <span className="text-gray-700">15 tournaments</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                      <span className="text-gray-700">Up to 100 matches</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                      <span className="text-gray-700">20 scorer accounts</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                      <span className="text-gray-700">Priority support</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                      <span className="text-gray-700">Custom branding</span>
                    </li>
                  </ul>
                  <Button 
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all"
                    onClick={onGetStarted}
                  >
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Custom */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.03, y: -8 }}
            >
              <Card className="border-2 border-gray-200 hover:border-purple-400 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-200 h-full">
                <CardContent className="p-8">
                  <h3 className="text-2xl text-gray-900 mb-2">Custom</h3>
                  <p className="text-gray-600 mb-6">For associations & federations</p>
                  <div className="mb-6">
                    <span className="text-2xl text-gray-900">Contact Us</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                      <span className="text-gray-700">Unlimited tournaments</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                      <span className="text-gray-700">Unlimited matches</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                      <span className="text-gray-700">100+ scorer accounts</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                      <span className="text-gray-700">24/7 phone support</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                      <span className="text-gray-700">White-label solution</span>
                    </li>
                  </ul>
                  <Button 
                    variant="outline" 
                    className="w-full border-purple-300 text-purple-600 hover:bg-purple-50 hover:border-purple-500 transition-all"
                    onClick={onGetStarted}
                  >
                    Contact Sales
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA with smooth gradient */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 blur-3xl"></div>
        </div>

        <motion.div 
          className="max-w-4xl mx-auto text-center relative z-10"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
        >
          <motion.h2 
            className="text-4xl md:text-5xl text-gray-900 mb-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            Ready to Power Your Next Kho-Kho Tournament?
          </motion.h2>
          <motion.p 
            className="text-xl text-gray-700 mb-12 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            viewport={{ once: true }}
          >
            Join hundreds of organizers who trust KhoKho Arena for their tournaments
          </motion.p>
          <motion.div 
            className="flex flex-col sm:flex-row gap-6 justify-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <Button 
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white h-16 px-10 text-lg shadow-2xl hover:scale-105 transition-all"
              onClick={onGetStarted}
            >
              Talk to Us
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="border-blue-300 text-blue-600 hover:bg-blue-50 h-16 px-10 text-lg hover:border-blue-500 hover:scale-105 transition-all"
              onClick={onViewDemo}
            >
              <Play className="w-5 h-5 mr-2" />
              View Demo Match
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer with gradient transition */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-gray-100 text-gray-700 border-t border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <span className="text-gray-900 text-xl">KhoKho Arena</span>
              </div>
              <p className="text-gray-600 mb-4">
                Smart tournament management and live scoring for Kho-Kho. Built by sports enthusiasts for the community.
              </p>
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="w-4 h-4" />
                <span>contact@khokhoarena.com</span>
              </div>
            </div>

            <div>
              <h3 className="text-gray-900 mb-4">Product</h3>
              <ul className="space-y-2 text-gray-600">
                <li><button onClick={() => smoothScrollTo('features')} className="hover:text-blue-600 transition-colors">Features</button></li>
                <li><button onClick={() => smoothScrollTo('how-it-works')} className="hover:text-blue-600 transition-colors">How It Works</button></li>
                <li><button onClick={() => smoothScrollTo('pricing')} className="hover:text-blue-600 transition-colors">Pricing</button></li>
                <li><button onClick={onViewDemo} className="hover:text-blue-600 transition-colors">Demo</button></li>
              </ul>
            </div>

            <div>
              <h3 className="text-gray-900 mb-4">Support</h3>
              <ul className="space-y-2 text-gray-600">
                <li><a href="#" className="hover:text-blue-600 transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-300 text-center text-gray-500">
            <p>© 2024 KhoKho Arena. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

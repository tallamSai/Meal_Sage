import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Camera, Zap, Shield, Users, ArrowRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import ScrollReveal from '@/components/ScrollReveal';
import ScrollVelocity from '@/pages/ScrollVelocity';
import Squares from '@/pages/Squares';
import { useRef } from 'react';
import VariableProximity from '@/components/VariableProximity';

const Home = () => {
  const features = [
    {
      icon: Camera,
      title: 'AI-Powered Analysis',
      description: 'Simply snap a photo of your food and get instant nutritional insights powered by Google Gemini AI.',
    },
    {
      icon: Zap,
      title: 'Instant Results',
      description: 'Get detailed nutritional breakdowns in seconds, including calories, macros, and health recommendations.',
    },
    {
      icon: Shield,
      title: 'Accurate Detection',
      description: 'Advanced image recognition technology ensures precise identification of food items and portions.',
    },
    {
      icon: Users,
      title: 'Health Insights',
      description: 'Receive personalized health scores and actionable recommendations for better nutrition choices.',
    },
  ];

  const stats = [
    { number: '50K+', label: 'Foods Analyzed' },
    { number: '99%', label: 'Accuracy Rate' },
    { number: '24/7', label: 'Available' },
  ];

  const heroRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  return (
    <div className="min-h-screen bg-background relative">
      {/* Animated blue squares background for the entire Home page */}
      <div className="fixed inset-0 w-screen h-screen z-0 pointer-events-none">
        <Squares borderColor="#2563eb" hoverFillColor="#2563eb33" squareSize={20} speed={0.7} />
      </div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-transparent pt-48 pb-32 z-10">
        {/* Removed Squares from here to avoid duplicate effect */}
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center" ref={heroRef}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl md:text-7xl font-bold text-[#2563eb] dark:text-white mb-6 leading-tight drop-shadow-lg">
                <VariableProximity
                  label="Discover the Nutrition in Your Food"
                  fromFontVariationSettings="'wght' 400, 'opsz' 9"
                  toFontVariationSettings="'wght' 1000, 'opsz' 40"
                  containerRef={heroRef}
                  radius={100}
                  className="inline-block"
                />
              </h1>
              <p className="text-xl md:text-2xl text-[#2563eb] dark:text-white mb-8 max-w-3xl mx-auto drop-shadow">
                <VariableProximity
                  label="Transform any food photo into detailed nutritional insights with our AI-powered analysis. Make informed dietary choices effortlessly."
                  fromFontVariationSettings="'wght' 400, 'opsz' 9"
                  toFontVariationSettings="'wght' 1000, 'opsz' 40"
                  containerRef={heroRef}
                  radius={100}
                  className="inline-block"
                />
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <Button asChild size="lg" className="text-lg px-10 py-5 h-auto bg-[#2563eb] text-white hover:bg-[#60a5fa] hover:text-[#2563eb] shadow-md">
                  <Link to="/analyze" className="flex items-center gap-3">
                    <Camera size={24} />
                    Analyze Food Now
                    <ArrowRight size={20} />
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-32 bg-transparent relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center bg-white/80 dark:bg-[#232b3a]/90 backdrop-blur-md rounded-2xl shadow-lg p-10 border border-[#60a5fa]/30">
            <div className="grid md:grid-cols-3 gap-8 mb-[7px] m-10">
              <div>
                <div className="text-5xl font-extrabold text-[#2563eb] dark:text-[#60a5fa] mb-2 drop-shadow">50K+</div>
                <div className="text-lg text-[#2563eb] dark:text-[#93c5fd] font-semibold">Foods Analyzed</div>
              </div>
              <div>
                <div className="text-5xl font-extrabold text-[#2563eb] dark:text-[#60a5fa] mb-2 drop-shadow">99%</div>
                <div className="text-lg text-[#2563eb] dark:text-[#93c5fd] font-semibold">Accuracy Rate</div>
                  </div>
              <div>
                <div className="text-5xl font-extrabold text-[#2563eb] dark:text-[#60a5fa] mb-2 drop-shadow">24/7</div>
                <div className="text-lg text-[#2563eb] dark:text-[#93c5fd] font-semibold">Available</div>
                  </div>
            </div>
          </div>
          <div className="relative w-screen left-1/2 right-1/2 -translate-x-1/2 px-0 m-0 overflow-x-hidden mt-24 mt-16">
            <ScrollVelocity
              texts={["Eat Smart, Live Well", "AI-Powered Food Analysis"]}
              velocity={80}
              className="text-3xl md:text-5xl font-extrabold tracking-tight text-[#2563eb] dark:text-white drop-shadow-lg py-4 w-full"
              parallaxClassName="my-6 w-full"
              scrollerClassName="flex whitespace-nowrap w-full"
              parallaxStyle={{ overflow: 'hidden', width: '100%' }}
              scrollerStyle={{ minHeight: '3.5rem', width: '100%' }}
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-accent">
        <div className="container mx-auto px-4">
          <ScrollReveal>
            <div className="text-center mb-16 relative z-20">
              <h2 className="text-4xl md:text-5xl font-bold text-accent-foreground mb-6">
                Why Choose MealSage?
              </h2>
              <p className="text-xl text-accent-foreground max-w-3xl mx-auto">
                Experience the future of nutrition analysis with cutting-edge AI technology 
                that makes healthy eating simple and accessible.
              </p>
            </div>
          </ScrollReveal>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <ScrollReveal 
                key={index} 
                delay={index * 0.1}
                direction={index % 2 === 0 ? 'left' : 'right'}
              >
                <Card className="h-full border-0 bg-card hover:shadow-glow transition-all duration-500 group overflow-hidden">
                  <CardContent className="p-8 text-center relative">
                    <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-glow">
                      <feature.icon className="w-10 h-10 text-primary-foreground" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-4 group-hover:text-primary transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-foreground leading-relaxed text-lg">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-transparent relative overflow-hidden">
         {/* Remove extra overlays and gradients for a unified look */}
        
        <div className="container mx-auto px-4 relative z-20">
          <ScrollReveal>
            <div className="max-w-4xl mx-auto text-center" ref={ctaRef}>
              <h2 className="text-4xl md:text-5xl font-bold text-[#2563eb] dark:text-white mb-6">
                <VariableProximity
                  label="Ready to Transform Your Nutrition Journey?"
                  fromFontVariationSettings="'wght' 400, 'slnt' 0"
                  toFontVariationSettings="'wght' 900, 'slnt' -10"
                  containerRef={ctaRef}
                  radius={120}
                  className="inline-block"
                />
              </h2>
              
              {/* <p className="text-xl text-primary-foreground mb-8 max-w-2xl mx-auto">
                Join thousands of users who have discovered the power of AI-driven nutrition analysis. 
                Start making better food choices today.
              </p> */}
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <Button asChild size="lg" className="text-xl px-12 py-6 h-auto bg-accent text-accent-foreground hover:bg-accent-foreground hover:text-accent">
                  <Link to="/analyze" className="flex items-center gap-3">
                    Start Analyzing
                    <ArrowRight size={24} />
                  </Link>
                </Button>
              </div>
              
              {/* <div className="flex items-center justify-center gap-1 mt-6 text-primary-foreground">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-primary-orange text-primary-orange" />
                  ))}
                </div>
                <span className="ml-2">Trusted by 10,000+ users</span>
              </div> */}
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
};

export default Home;
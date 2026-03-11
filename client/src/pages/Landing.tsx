import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Bot, Zap, MessageCircle, Shield } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-primary to-accent text-white">
              <Bot className="h-5 w-5" />
            </div>
            <span className="font-display text-xl font-bold">Character Coach</span>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <Link href="/dashboard">
                <Button variant="default">Go to Dashboard</Button>
              </Link>
            ) : (
              <a href="/api/login">
                <Button variant="default">Log In</Button>
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
            <div className="max-w-2xl animate-fade-in">
              <h1 className="font-display text-4xl font-bold tracking-tight sm:text-6xl text-foreground">
                Your Personal AI <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                  Coaching Team
                </span>
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground font-serif">
                Access world-class coaching personalities anytime, anywhere. From career advice to fitness motivation, chat with AI characters designed to help you grow.
              </p>
              <div className="mt-10 flex items-center gap-x-6">
                <a href={user ? "/dashboard" : "/api/login"}>
                  <Button size="lg" className="rounded-full px-8 text-base h-12 gap-2 shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all hover:-translate-y-1">
                    Get Started <ArrowRight className="h-4 w-4" />
                  </Button>
                </a>
                <a href="#features" className="text-sm font-semibold leading-6 text-foreground hover:text-primary transition-colors">
                  Learn more <span aria-hidden="true">→</span>
                </a>
              </div>
            </div>
            <div className="relative lg:col-span-1 animate-fade-in delay-200">
              {/* Abstract decorative elements */}
              <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
              <div className="absolute top-32 right-32 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
              
              {/* Hero Image / Card */}
              <div className="relative rounded-2xl bg-card p-2 shadow-2xl ring-1 ring-gray-900/10">
                {/* Descriptive comment for Unsplash image */}
                {/* Modern clean office desk setup with laptop showing coaching app */}
                <img
                  src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=800&q=80"
                  alt="App Interface"
                  className="rounded-xl shadow-inner"
                />
                
                {/* Floating UI Elements */}
                <div className="absolute -bottom-6 -left-6 bg-card p-4 rounded-xl shadow-xl border border-border animate-bounce duration-[3000ms]">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                      <MessageCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">New Message</p>
                      <p className="text-xs text-muted-foreground">"You've got this! Keep going."</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-base font-semibold leading-7 text-primary uppercase tracking-wide">Features</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl font-display">
              Everything you need to grow
            </p>
            <p className="mt-6 text-lg leading-8 text-muted-foreground font-serif">
              Our AI coaches are trained on specific domains to provide relevant, high-quality advice tailored to your needs.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-7xl sm:mt-20 lg:mt-24">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-3">
              {[
                {
                  name: 'Diverse Personalities',
                  description: 'Choose from a variety of coaches, each with unique expertise, tone, and style.',
                  icon: Bot,
                },
                {
                  name: 'Real-time Voice Chat',
                  description: 'Talk to your coaches naturally with voice input and listen to their responses.',
                  icon: Zap,
                },
                {
                  name: 'Secure & Private',
                  description: 'Your conversations are private and secure. We value your data privacy above all.',
                  icon: Shield,
                },
              ].map((feature) => (
                <div key={feature.name} className="relative pl-16 group hover:bg-card p-6 rounded-2xl transition-all duration-300 hover:shadow-lg">
                  <dt className="text-base font-semibold leading-7 text-foreground">
                    <div className="absolute left-6 top-6 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white group-hover:scale-110 transition-transform">
                      <feature.icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    {feature.name}
                  </dt>
                  <dd className="mt-2 text-base leading-7 text-muted-foreground">{feature.description}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-background border-t py-12">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2024 Character Coach. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

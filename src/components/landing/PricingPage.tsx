import { useState } from "react";
import { Check, X, Zap, Shield, Crown } from "lucide-react";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { useNavigate } from "react-router-dom";

export function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);
  const navigate = useNavigate();

  // Logic to handle "Get Started" click
  const handlePlanSelect = (plan: string) => {
    // If it's the Trial plan, send them to signup with a query param
    if (plan === "Trial") {
      // In a real app: navigate("/signup?plan=Trial");
      console.log("Navigating to signup for Trial");
      navigate("/login"); // Pointing to login/signup for now
    } else {
      // For paid plans, usually also signup first, then pay
      console.log(`Selected ${plan} plan`);
      navigate("/login");
    }
  };

  const plans = [
    {
      name: "Trial",
      price: "₹0",
      period: "/ 14 Days",
      description: "Perfect for testing the platform features.",
      icon: <Zap className="w-5 h-5 text-orange-500" />,
      features: [
        "1 Tournament",
        "Up to 5 Matches",
        "2 Scorer Accounts",
        "Basic Features",
        "Limited Support",
      ],
      notIncluded: ["Custom Branding", "API Access", "Live Streaming"],
      buttonText: "Start Free Trial",
      buttonVariant: "outline" as const,
      popular: false,
    },
    {
      name: "Basic",
      price: isAnnual ? "₹9,990" : "₹999",
      period: isAnnual ? "/ year" : "/ month",
      description: "For small clubs and local tournaments.",
      icon: <Shield className="w-5 h-5 text-blue-500" />,
      features: [
        "Up to 5 Tournaments",
        "Up to 30 Matches",
        "5 Scorer Accounts",
        "Basic Analytics",
        "Email Support",
        "Standard Templates",
      ],
      notIncluded: ["Custom Branding", "Live Streaming"],
      buttonText: "Get Basic",
      buttonVariant: "default" as const,
      popular: false,
      color: "blue",
    },
    {
      name: "Professional",
      price: isAnnual ? "₹29,990" : "₹2,999",
      period: isAnnual ? "/ year" : "/ month",
      description: "For serious organizers and leagues.",
      icon: <Crown className="w-5 h-5 text-purple-500" />,
      features: [
        "Up to 15 Tournaments",
        "Up to 100 Matches",
        "20 Scorer Accounts",
        "Advanced Analytics",
        "Priority Support",
        "Custom Branding",
        "Live Streaming Support",
      ],
      notIncluded: [],
      buttonText: "Go Professional",
      buttonVariant: "default" as const,
      popular: true,
      color: "purple",
    },
    {
      name: "Enterprise",
      price: isAnnual ? "₹99,990" : "₹9,999",
      period: isAnnual ? "/ year" : "/ month",
      description: "For state associations and federations.",
      icon: <Shield className="w-5 h-5 text-slate-900" />,
      features: [
        "Up to 50 Tournaments",
        "Up to 500 Matches",
        "100 Scorer Accounts",
        "Full Analytics Suite",
        "24/7 Phone Support",
        "White-label Solution",
        "API Access",
      ],
      notIncluded: [],
      buttonText: "Contact Sales",
      buttonVariant: "outline" as const,
      popular: false,
      color: "slate",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
              K
            </div>
            <span className="font-bold text-xl text-gray-900">
              KhoKho Manager
            </span>
          </div>
          <div className="flex gap-4">
            <Button variant="ghost" onClick={() => navigate("/login")}>
              Login
            </Button>
            <Button onClick={() => navigate("/login")}>Sign Up</Button>
          </div>
        </div>
      </div>

      <div className="py-20 px-4">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Title & Toggle */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose the plan that fits your tournament needs. Start with a free
              trial and upgrade as you grow.
            </p>

            <div className="flex items-center justify-center gap-4 pt-6">
              <span
                className={`text-sm font-medium ${
                  !isAnnual ? "text-gray-900" : "text-gray-500"
                }`}
              >
                Monthly
              </span>
              <button
                onClick={() => setIsAnnual(!isAnnual)}
                className={`relative w-14 h-7 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  isAnnual ? "bg-blue-600" : "bg-gray-200"
                }`}
              >
                <span
                  className={`absolute left-1 top-1 w-5 h-5 bg-white rounded-full transition-transform transform ${
                    isAnnual ? "translate-x-7" : ""
                  }`}
                />
              </button>
              <span
                className={`text-sm font-medium ${
                  isAnnual ? "text-gray-900" : "text-gray-500"
                }`}
              >
                Yearly{" "}
                <span className="text-green-600 text-xs font-bold bg-green-50 px-2 py-0.5 rounded-full ml-1">
                  Save 20%
                </span>
              </span>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative flex flex-col h-full border-2 transition-all duration-200 hover:shadow-lg ${
                  plan.popular
                    ? "border-purple-600 shadow-md scale-105 z-10"
                    : "border-gray-100 hover:border-gray-200"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                    Most Popular
                  </div>
                )}

                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className={`p-2 rounded-lg bg-gray-50 ${
                        plan.popular ? "bg-purple-50" : ""
                      }`}
                    >
                      {plan.icon}
                    </div>
                    {plan.name === "Trial" && (
                      <Badge variant="secondary">No Credit Card</Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900">
                    {plan.name}
                  </CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>

                <CardContent className="flex-1 pb-0">
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">
                      {plan.price}
                    </span>
                    <span className="text-gray-500 ml-1">{plan.period}</span>
                  </div>

                  <div className="space-y-3">
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                    {plan.notIncluded.map((feature) => (
                      <div
                        key={feature}
                        className="flex items-start gap-3 text-gray-400"
                      >
                        <X className="w-5 h-5 shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>

                <CardFooter className="pt-8 mt-auto">
                  <Button
                    className={`w-full font-semibold ${
                      plan.popular
                        ? "bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-200"
                        : plan.name === "Trial"
                        ? "bg-white text-gray-900 border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                        : ""
                    }`}
                    variant={plan.popular ? "default" : plan.buttonVariant}
                    onClick={() => handlePlanSelect(plan.name)}
                  >
                    {plan.buttonText}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Trust Footer */}
          <div className="text-center pt-10 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Trusted by over 50+ organizers across Maharashtra
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

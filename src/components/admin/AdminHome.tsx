import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Calendar,
  Trophy,
  Users,
  Bell,
  Plus,
  UserPlus,
  ListChecks,
  UserCog,
  Activity,
  ArrowRight,
  HelpCircle,
  X,
} from "lucide-react";
import { Match } from "../../types";
import { useNavigate } from "react-router-dom"; // Import useNavigate

interface AdminHomeProps {
  matches: Match[];
}

export function AdminHome({ matches }: AdminHomeProps) {
  const [showWorkflowGuide, setShowWorkflowGuide] = useState(false);
  const navigate = useNavigate(); // Initialize useNavigate

  const liveMatches = matches.filter((m) => m.status === "live");
  const upcomingMatches = matches.filter((m) => m.status === "upcoming");
  const completedToday = matches.filter((m) => m.status === "finished");

  const stats = [
    {
      label: "Live Matches",
      value: liveMatches.length,
      icon: Calendar,
      color: "text-red-600 bg-red-50",
    },
    {
      label: "Upcoming Today",
      value: upcomingMatches.length,
      icon: Trophy,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Completed",
      value: completedToday.length,
      icon: Users,
      color: "text-green-600 bg-green-50",
    },
    {
      label: "Notifications",
      value: 3,
      icon: Bell,
      color: "text-orange-600 bg-orange-50",
    },
  ];

  // Map simplified page keys to actual paths
  const flowSteps = [
    {
      number: "1",
      label: "Create Tournament",
      icon: Trophy,
      path: "/admin/tournaments/create", // Updated path
    },
    {
      number: "2",
      label: "Add Teams",
      icon: UserPlus,
      path: "/admin/teams/add",
    }, // Updated path
    {
      number: "3",
      label: "Create Matches",
      icon: ListChecks,
      path: "/admin/matches/create", // Updated path
    },
    {
      number: "4",
      label: "Assign Scorer",
      icon: UserCog,
      path: "/admin/scorers",
    }, // Updated path
    {
      number: "5",
      label: "Manage Live Matches",
      icon: Activity,
      path: "/admin/matches", // Updated path
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 p-6 shadow-lg">
        {/* Decorative workflow icons - semi-transparent background accent */}
        <div className="absolute right-0 top-0 bottom-0 flex items-center gap-2 pr-6 opacity-10">
          {flowSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.number} className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center text-white">
                    {step.number}
                  </div>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                {index < flowSteps.length - 1 && (
                  <ArrowRight className="w-6 h-6 text-white" />
                )}
              </div>
            );
          })}
        </div>

        {/* Main header content with help button */}
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h2 className="text-white mb-1">Dashboard Overview</h2>
            <p className="text-blue-100">
              Monitor and manage your Kho-Kho tournaments
            </p>
          </div>

          {/* Workflow Guide Toggle Button */}
          <Button
            onClick={() => setShowWorkflowGuide(!showWorkflowGuide)}
            className={`backdrop-blur-sm text-white border border-white/30 shadow-lg transition-all duration-300 ${
              showWorkflowGuide
                ? "bg-white/30 scale-105"
                : "bg-white/20 hover:bg-white/30"
            }`}
            size="lg"
          >
            <HelpCircle
              className={`w-5 h-5 mr-2 transition-transform duration-300 ${
                showWorkflowGuide ? "rotate-180" : "rotate-0"
              }`}
            />
            Workflow Guide
          </Button>
        </div>
      </div>

      {/* Admin Workflow Guide - Collapsible Card with Smooth Animation */}
      <div
        className={`transition-all duration-500 ease-in-out overflow-hidden ${
          showWorkflowGuide
            ? "max-h-[600px] opacity-100 transform translate-y-0"
            : "max-h-0 opacity-0 transform -translate-y-4"
        }`}
      >
        <Card className="shadow-lg border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                Admin Workflow Guide
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowWorkflowGuide(false)}
                className="h-8 w-8 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-blue-700">
              Follow these steps to manage your tournament
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {flowSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <button
                    key={step.number}
                    onClick={() => {
                      navigate(step.path); // Use navigate to new path
                      setShowWorkflowGuide(false);
                    }}
                    className="w-full flex items-center gap-3 p-3 bg-white rounded-lg border border-blue-200 hover:border-blue-400 hover:shadow-md transition-all duration-200 group"
                    style={{
                      animationDelay: `${index * 50}ms`,
                      animation: showWorkflowGuide
                        ? "fadeInUp 0.4s ease-out forwards"
                        : "none",
                    }}
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                      {step.number}
                    </div>
                    <Icon className="w-5 h-5 text-blue-600 group-hover:text-indigo-600 transition-colors duration-200 flex-shrink-0" />
                    <div className="flex-1 text-left">
                      <p className="text-sm text-gray-900 group-hover:text-blue-700 transition-colors duration-200">
                        {step.label}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors duration-200 flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 mb-1">{stat.label}</p>
                    <p className="text-gray-900">{stat.value}</p>
                  </div>
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.color}`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Live Matches */}
      {liveMatches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Live Matches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {liveMatches.map((match) => (
                <div
                  key={match.id}
                  className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="destructive" className="animate-pulse">
                        LIVE
                      </Badge>
                      <span className="text-gray-600">{match.matchNumber}</span>
                    </div>
                    <p className="text-gray-900">
                      {match.teamA.name} vs {match.teamB.name}
                    </p>
                    <p className="text-gray-600">{match.tournamentName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-900">
                      {match.scoreA} - {match.scoreB}
                    </p>
                    <p className="text-gray-600">Scorer: {match.scorerName}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity & Notifications */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Matches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingMatches.slice(0, 5).map((match) => (
                <div
                  key={match.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="text-gray-900">
                      {match.teamA.name} vs {match.teamB.name}
                    </p>
                    <p className="text-gray-600">
                      {new Date(match.dateTime).toLocaleTimeString()}
                    </p>
                  </div>
                  <Badge>{match.venue}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-gray-900 mb-1">
                  Match M002 starting in 30 minutes
                </p>
                <p className="text-gray-600">
                  Chennai Challengers vs Pune Panthers
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-gray-900 mb-1">
                  Results submitted for Match M004
                </p>
                <p className="text-gray-600">Awaiting verification</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-gray-900 mb-1">
                  Scorer John Doe needs approval
                </p>
                <p className="text-gray-600">New scorer registration</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

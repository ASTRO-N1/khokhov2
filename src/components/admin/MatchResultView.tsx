import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ArrowLeft, Download, Trophy } from "lucide-react";
import { Match, ScoringAction } from "../../types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { supabase } from "../../supabaseClient";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface MatchResultViewProps {
  match: Match;
  onBack: () => void;
}

interface AttackerStat {
  name: string;
  jerseyNo: number;
  totalOuts: number;
  points: number;
  defenders: string[];
}

interface DefenderStat {
  name: string;
  jerseyNo: number;
  runTime: string;
  perTime: string;
  outType: string;
}

// Helper to safely format time values
const formatTimeValue = (time: any) => {
  const num = Number(time);
  if (isNaN(num) || num < 0) {
    return "00:00";
  }
  const isoString = new Date(num * 1000).toISOString();
  if (num >= 3600) {
    return isoString.substr(11, 8);
  }
  return isoString.substr(14, 5);
};

// Helper to safely get string values from action objects (handles snake_case vs camelCase)
const getStringValue = (action: any, key: string): string | null => {
  const val =
    action[key] ||
    action[key.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase()];
  return typeof val === "string" && val ? val : null;
};

// Helper to safely get number values from action objects
const getNumValue = (action: any, key: string): number => {
  const val =
    action[key] !== undefined
      ? action[key]
      : action[key.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase()];
  return typeof val === "number" ? val : parseInt(val) || 0;
};

export function MatchResultView({ match, onBack }: MatchResultViewProps) {
  const [actions, setActions] = useState<ScoringAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const handleExportPDF = () => {
    setExporting(true);
    toast.info("Generating PDF, please wait...");

    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();

    // Title
    pdf.setFontSize(18);
    pdf.text(`Match Result: ${match.matchNumber}`, pageWidth / 2, 20, {
      align: "center",
    });
    pdf.setFontSize(12);
    pdf.text(match.tournamentName, pageWidth / 2, 28, { align: "center" });

    // Match Summary
    pdf.setFontSize(14);
    pdf.text("Match Summary", 14, 40);
    autoTable(pdf, {
      startY: 45,
      head: [["Team", "Final Score"]],
      body: [
        [match.teamA.name, match.scoreA],
        [match.teamB.name, match.scoreB],
      ],
      theme: "striped",
      headStyles: { fillColor: [22, 163, 74] },
    });

    let finalY = (pdf as any).lastAutoTable.finalY + 15;

    // Attacker Statistics
    pdf.text("Attacker Statistics", 14, finalY);
    autoTable(pdf, {
      startY: finalY + 5,
      head: [["Name", "Jersey No.", "Total Outs", "Points", "Defenders Out"]],
      body: attackerStats.map((stat) => [
        stat.name,
        `#${stat.jerseyNo}`,
        stat.totalOuts,
        stat.points,
        stat.defenders.join(", "),
      ]),
      theme: "striped",
      headStyles: { fillColor: [37, 99, 235] },
    });

    finalY = (pdf as any).lastAutoTable.finalY + 15;

    // Defender Statistics
    pdf.text("Defender Statistics", 14, finalY);
    autoTable(pdf, {
      startY: finalY + 5,
      head: [["Name", "Jersey No.", "Run Time", "Per Time", "Out Type"]],
      body: defenderStats.map((stat) => [
        stat.name,
        `#${stat.jerseyNo}`,
        stat.runTime,
        stat.perTime,
        stat.outType,
      ]),
      theme: "striped",
      headStyles: { fillColor: [217, 119, 6] },
    });

    pdf.save(`Match_Result_${match.matchNumber}.pdf`);
    setExporting(false);
    toast.success("PDF exported successfully!");
  };

  useEffect(() => {
    const fetchActions = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("scoring_actions")
        .select("*")
        .eq("match_id", match.id);

      if (error) {
        toast.error("Failed to fetch scoring actions.");
      } else if (data) {
        setActions(data as ScoringAction[]);
      }
      setLoading(false);
    };

    fetchActions();
  }, [match.id]);

  const attackerStats: AttackerStat[] = Object.values(
    actions.reduce((acc, action) => {
      const jerseyNo = getNumValue(action, "attackerJersey");
      const name = getStringValue(action, "attackerName");
      const defenderName = getStringValue(action, "defenderName");
      const defenderJersey = getNumValue(action, "defenderJersey");
      const points = getNumValue(action, "points");

      if (!name || !jerseyNo) return acc;

      if (!acc[jerseyNo]) {
        acc[jerseyNo] = {
          name,
          jerseyNo,
          totalOuts: 0,
          points: 0,
          defenders: [],
        };
      }
      acc[jerseyNo].totalOuts++;
      acc[jerseyNo].points += points;
      if (defenderName && defenderJersey) {
        acc[jerseyNo].defenders.push(`#${defenderJersey} ${defenderName}`);
      }
      return acc;
    }, {} as { [key: number]: AttackerStat })
  );

  const defenderStats: DefenderStat[] = actions
    .filter((action) => getStringValue(action, "defenderName"))
    .map((action) => ({
      name: getStringValue(action, "defenderName")!,
      jerseyNo: getNumValue(action, "defenderJersey"),
      runTime: formatTimeValue(getNumValue(action, "runTime")),
      perTime: formatTimeValue(getNumValue(action, "perTime")),
      outType: (action as any).symbol,
    }));

  const winner =
    match.scoreA! > match.scoreB! ? match.teamA.name : match.teamB.name;

  if (loading) {
    return <div>Loading match results...</div>;
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={onBack} disabled={exporting}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h2 className="text-gray-900 mb-1">
            Match Result - {match.matchNumber}
          </h2>
          <p className="text-gray-600">{match.tournamentName}</p>
        </div>
        <Button
          variant="outline"
          onClick={handleExportPDF}
          disabled={exporting}
        >
          <Download className="w-4 h-4 mr-2" />
          {exporting ? "Exporting..." : "Export PDF"}
        </Button>
      </div>
      <div className="space-y-6">
        {/* Match Summary */}
        <Card className="bg-gradient-to-r from-blue-50 to-red-50">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-gray-600 mb-2">{match.teamA.name}</p>
                <p
                  className={`text-gray-900 ${
                    match.scoreA! > match.scoreB! ? "" : "text-gray-500"
                  }`}
                >
                  {match.scoreA} Points
                </p>
                {match.scoreA! > match.scoreB! && (
                  <Badge className="bg-green-600 mt-2">
                    <Trophy className="w-3 h-3 mr-1" />
                    Winner
                  </Badge>
                )}
              </div>
              <div className="text-center flex items-center justify-center">
                <div>
                  <p className="text-gray-500 mb-2">Final Score</p>
                  <p className="text-gray-900">
                    {match.scoreA} - {match.scoreB}
                  </p>
                </div>
              </div>
              <div className="text-center">
                <p className="text-gray-600 mb-2">{match.teamB.name}</p>
                <p
                  className={`text-gray-900 ${
                    match.scoreB! > match.scoreA! ? "" : "text-gray-500"
                  }`}
                >
                  {match.scoreB} Points
                </p>
                {match.scoreB! > match.scoreA! && (
                  <Badge className="bg-green-600 mt-2">
                    <Trophy className="w-3 h-3 mr-1" />
                    Winner
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Other Cards... */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Match Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Venue:</span>
                <span>{match.venue}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date & Time:</span>
                <span>{new Date(match.dateTime).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Scorer:</span>
                <span>{match.scorerName}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Toss Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Toss Won By:</span>
                <span>{winner}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Choose:</span>
                <Badge className="bg-blue-600">Attack</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Attacker Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Attacker Name</TableHead>
                    <TableHead>Jersey No.</TableHead>
                    <TableHead>Total Outs</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Defender Names</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attackerStats.length > 0 ? (
                    attackerStats.map((stat, index) => (
                      <TableRow key={index}>
                        <TableCell>{stat.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">#{stat.jerseyNo}</Badge>
                        </TableCell>
                        <TableCell>{stat.totalOuts}</TableCell>
                        <TableCell>{stat.points}</TableCell>
                        <TableCell>{stat.defenders.join(", ")}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        No attacker statistics available.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Defender Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Defender Name</TableHead>
                    <TableHead>Jersey No.</TableHead>
                    <TableHead>Run Time</TableHead>
                    <TableHead>Per Time</TableHead>
                    <TableHead>Out Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {defenderStats.length > 0 ? (
                    defenderStats.map((stat, index) => (
                      <TableRow key={index}>
                        <TableCell>{stat.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">#{stat.jerseyNo}</Badge>
                        </TableCell>
                        <TableCell>{stat.runTime}</TableCell>
                        <TableCell>{stat.perTime}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{stat.outType}</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        No defender statistics available.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Match Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-gray-600">
              <p>Total Innings: {match.innings || 4}</p>
              <p>
                Winner: <span className="text-gray-900">{winner}</span>
              </p>
              <p>
                Winning Margin:{" "}
                <span className="text-gray-900">
                  {Math.abs(match.scoreA! - match.scoreB!)} points
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

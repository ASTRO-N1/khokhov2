import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

interface ScoresheetProps {
  inning: number;
  turn: number;
  defenderScoresheet: {
    jerseyNumber: number | null;
    name: string | null;
    perTime: number;
    runTime: number;
    outBy: string | null;
  }[];
  attackerScoresheet: {
    [key: number]: {
      name: string;
      points: number;
      defendersOut: string[];
    };
  };
  onViewConsolidatedReport: () => void;
}

export function Scoresheet({
  inning,
  turn,
  defenderScoresheet,
  attackerScoresheet,
  onViewConsolidatedReport,
}: ScoresheetProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-gray-900">Scoresheet</h3>
      </div>

      <Card className="shadow-sm" id="defender-scoresheet">
        <CardHeader className="border-b bg-gray-50">
          <CardTitle className="text-gray-900">
            Defender Scoresheet - Inning {inning}, Turn {turn}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4 text-sm text-gray-600">
                    Jersey
                  </th>
                  <th className="text-left p-4 text-sm text-gray-600">Name</th>
                  <th className="text-left p-4 text-sm text-gray-600">
                    Per Time
                  </th>
                  <th className="text-left p-4 text-sm text-gray-600">
                    Run Time
                  </th>
                  <th className="text-left p-4 text-sm text-gray-600">
                    Out By
                  </th>
                </tr>
              </thead>
              <tbody>
                {defenderScoresheet.length > 0 ? (
                  defenderScoresheet.map((record, index) => (
                    <tr
                      key={index}
                      className="border-b hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-4">
                        <Badge variant="outline">#{record.jerseyNumber}</Badge>
                      </td>
                      <td className="p-4 text-gray-900">{record.name}</td>
                      <td className="p-4 font-mono text-blue-600">
                        {formatTime(record.perTime)}
                      </td>
                      <td className="p-4 font-mono text-gray-600">
                        {formatTime(record.runTime)}
                      </td>
                      <td className="p-4 text-gray-900">{record.outBy}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">
                      No defender outs recorded yet for this turn.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm" id="attacker-scoresheet">
        <CardHeader className="border-b bg-gray-50">
          <CardTitle className="text-gray-900">
            Attacker Scoresheet - Inning {inning}, Turn {turn}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4 text-sm text-gray-600">
                    Jersey
                  </th>
                  <th className="text-left p-4 text-sm text-gray-600">Name</th>
                  <th className="text-left p-4 text-sm text-gray-600">
                    Points
                  </th>
                  <th className="text-left p-4 text-sm text-gray-600">
                    Defenders Out
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(attackerScoresheet).length > 0 ? (
                  Object.entries(attackerScoresheet).map(([jersey, data]) => (
                    <tr
                      key={jersey}
                      className="border-b hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-4">
                        <Badge variant="outline">#{jersey}</Badge>
                      </td>
                      <td className="p-4 text-gray-900">{data.name}</td>
                      <td className="p-4">
                        <Badge className="bg-green-600">{data.points}</Badge>
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {data.defendersOut.join(", ")}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-500">
                      No attacker points recorded yet for this turn.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

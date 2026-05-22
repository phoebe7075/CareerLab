import type { RiskLevel } from "../../data/schema";
import { Badge } from "../ui/Badge";

type RiskBadgeProps = {
  riskLevel: RiskLevel;
};

const riskLabels: Record<RiskLevel, string> = {
  low: "Risk Low",
  medium: "Needs Check",
  high: "High Risk"
};

export function RiskBadge({ riskLevel }: RiskBadgeProps) {
  const tone =
    riskLevel === "low" ? "success" : riskLevel === "medium" ? "warning" : "danger";

  return <Badge tone={tone}>{riskLabels[riskLevel]}</Badge>;
}

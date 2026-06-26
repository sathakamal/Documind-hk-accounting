import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: number;
  subtitle?: string;
  variant?: "default" | "positive" | "negative";
}

export function KpiCard({ title, value, subtitle, variant = "default" }: KpiCardProps) {
  const colorClass =
    variant === "positive"
      ? "text-success"
      : variant === "negative"
      ? "text-destructive"
      : "text-foreground";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold ${colorClass}`}>
          {formatMoney(value)}
        </div>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

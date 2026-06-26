import { Badge } from "@/components/ui/badge";
import { getCurrencySymbol } from "@/lib/utils";

interface CurrencyBadgeProps {
  currency: string;
}

export function CurrencyBadge({ currency }: CurrencyBadgeProps) {
  return (
    <Badge variant="secondary">
      {getCurrencySymbol(currency)} {currency}
    </Badge>
  );
}

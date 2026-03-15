import cryptoTrader from "@/templates/crypto-trader.json";
import worldConflicts from "@/templates/world-conflicts.json";
import predictionMarkets from "@/templates/prediction-markets.json";

const templates = [cryptoTrader, worldConflicts, predictionMarkets];

export async function GET() {
  return Response.json(templates);
}

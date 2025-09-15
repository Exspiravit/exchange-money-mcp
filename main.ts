import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import cc from "currency-codes";
import { z } from "zod";

// 1. Crear el servidor MCP
// es la interfaz principal con el protocolo MCP. Maneja la comunicación entre el cliente y el servidor.

const server = new McpServer({
  name: "demo",
  version: "0.0.1",
});

// 2. Definir las herramientas
server.tool(
  "convert-money",
  "tool to convert money from a currency to another",
  {
    money_origin: z
      .string()
      .describe(
        "país de origen de la moneda, ejemplo: Estados unidos, USA, Peru"
      ),
    money_destiny: z
      .string()
      .describe(
        "país de destino de la moneda, ejemplo: Mexico, Guatemala, Colombia"
      ),
    amount: z.number().describe("monto a convertir"),
  },
  async ({ money_origin, money_destiny, amount }) => {
    const possibility_changes = [];
    const possibility_currencies_origin = cc.country(money_origin);
    const possibility_currencies_destiny = cc.country(money_destiny);

    for (const currency_origin of possibility_currencies_origin) {
      const response = await fetch(
        `https://open.er-api.com/v6/latest/${currency_origin.code}`
      );
      const exchange_rates = await response.json();
      for (const currency_destiny of possibility_currencies_destiny) {
        if (currency_origin.code !== currency_destiny.code) {
          const rate = exchange_rates.rates[currency_destiny.code];
          if (rate) {
            const converted_amount = amount * rate;
            possibility_changes.push({
              from: currency_origin.code,
              to: currency_destiny.code,
              converted_amount,
            });
          }
        }
      }
    }

    if (!possibility_changes.length) {
      return {
        content: [
          {
            type: "text",
            text: `No se encontró posibilidad de cambio.`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(possibility_changes, null, 2),
        },
      ],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);

import { defineMcp } from "@lovable.dev/mcp-js";
import searchVehiclesTool from "./tools/search-vehicles";
import getVehicleDetailsTool from "./tools/get-vehicle-details";

export default defineMcp({
  name: "frotaapp-mcp",
  title: "FrotaApp MCP",
  version: "0.1.0",
  instructions:
    "Ferramentas do FrotaApp — marketplace público de locação de veículos para motoristas de aplicativo. Use `search_vehicles` para listar carros disponíveis com filtros (cidade, preço semanal, combustível, câmbio) e `get_vehicle_details` para obter as informações públicas de um veículo específico. Todos os dados retornados são públicos; placa, CPF e dados do locador nunca são expostos.",
  tools: [searchVehiclesTool, getVehicleDetailsTool],
});

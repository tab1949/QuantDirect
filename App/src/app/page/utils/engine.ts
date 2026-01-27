import { QDEngineClient } from "./QDEngine/client";

// Shared singleton for UI usage; create your own instance if you need isolated connections.
export const qdEngineClient = new QDEngineClient();

export { QDEngineClient } from "./QDEngine/client";

import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

app.use(express.json({ limit: "30kb" }));
app.use(express.static(__dirname));

const catalogContext = `
NEGOCIO: Verde Amarelha Express / Grupo Amarelha SAC.
Distribuidor exclusivo CAM2 indicado en el material del negocio.
DIRECCIÓN: Av. Ferrocarril 1967, El Tambo, Huancayo.
WHATSAPP: +51 950 893 901.

CATÁLOGO CAM2 AGOSTO 2026 (datos transcritos del PDF proporcionado):
- Gasolineros full sintéticos: 5W40 API SP / ACEA A3/B4; 5W30 API SP / GF-6.
- Gasolineros semi-sintéticos: 10W30 / 10W40 API SP – GF-6A.
- Gasolineros minerales: multigrado 10W30 / 20W50 GF-6A; MGT 10W40 API SP; HK 25W60 API SG; gasolinero/gas 20W50 SN en balde 5 galones; monogrado SAE 40-50 API SF.
- Petroleros semi-sintéticos: SAE 10W40 y 15W40 CK-4 / SN (5 galones).
- Petroleros minerales: SAE 15W40 CI-4 Base 2 diésel (5 galones y 208 litros); SAE 25W50 CF-4 y SAE 25W60 CF-4 (5 galones).
- Transmisiones: minerales 80W90 / 85W140 API GL5 (5 galones); Gear Lubricant API GL-5 SAE 80W90 / 85W140 (12x1/4).
- ATF D3M (hidrolina).
- Hidráulico: Hydrofluid AW ISO 68.
- Grasas: MP Red Grease NLGI 3 multipropósito de litio (16 kg); MP Red LDGrease NLGI 3 grasa de calcio roja (16 kg).
- Motos 4 tiempos: X-Cross 1 full sintético API SP/JASO MA2 10W40; X-Cross Pro 4T semi-sintético API SN/JASO MA2 15W50; Motorcycle 4T multigrado mineral API SN/JASO MA2 20W50 / 25W60 (12x1 litro).

REGLAS DE ATENCIÓN Y RECOMENDACIÓN:
- Responde en español, cordial, claro y breve. Eres asesor informativo de catálogo, no mecánico ni representante que pueda confirmar stock.
- Para recomendar, pregunta primero tipo de vehículo (auto, camioneta, camión, moto), combustible/tipo de motor, marca/modelo/año y, si lo sabe, viscosidad y especificación solicitada por el fabricante.
- Usa solo productos y especificaciones del catálogo anterior. No inventes productos, precios, promociones, stock, compatibilidades ni intervalos de cambio.
- Nunca afirmes que un aceite es adecuado solo por el tipo de vehículo. La viscosidad y normas deben coincidir con el manual del fabricante. Si falta información, explica que no se puede confirmar compatibilidad y pide revisar el manual o consultar a un técnico.
- Puedes mencionar opciones del catálogo que coincidan con la viscosidad/especificación que el cliente indique, pero aclara que debe validarse con el manual.
- Para precios, disponibilidad, compras, pedidos o atención humana, deriva al WhatsApp +51 950 893 901.
- No des instrucciones para realizar reparaciones peligrosas. No solicites datos personales innecesarios ni información de pago.
- Si preguntan algo fuera del negocio o catálogo, indica amablemente que puedes ayudar con productos CAM2 y cotizaciones.
`;

app.post("/api/chat", async (req, res) => {
  try {
    if (!client) {
      return res.status(503).json({
        error: "El asistente IA aún no está configurado. El administrador debe agregar OPENAI_API_KEY en el archivo .env del servidor."
      });
    }
    const messages = req.body?.messages;
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 12) {
      return res.status(400).json({ error: "La conversación no tiene un formato válido." });
    }
    const safeMessages = messages.map((m) => {
      if (!["user", "assistant"].includes(m?.role) || typeof m?.content !== "string") {
        throw new Error("Mensaje no válido.");
      }
      return { role: m.role, content: m.content.slice(0, 1000) };
    });
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-6-astra",
      instructions: `Eres el asistente virtual de Verde Amarelha Express – CAM2.\n${catalogContext}`,
      input: safeMessages
    });
    return res.json({ reply: response.output_text || "No pude generar una respuesta. Intenta nuevamente." });
  } catch (error) {
    console.error("Error en /api/chat:", error?.message || error);
    return res.status(500).json({ error: "Ocurrió un problema al responder. Intenta nuevamente o contacta a un asesor por WhatsApp." });
  }
});

app.listen(PORT, () => {
  console.log(`Verde Amarelha Express disponible en http://localhost:${PORT}`);
});

import express from "express";
import bodyParser from "body-parser";
import axios from "axios"; // Importamos axios

const app = express();
const VERIFY_TOKEN = "BOT_TOKEN_SECRETO_PARA_FACEBOOK"; // Cambia esto por un token más seguro
const PAGE_ACCESS_TOKEN = "EAAgBMbKaFdYBPvgNzzPD0TLd6mIng1SMhFCANZCyMqZAjcXOiIZCv9fEHLbRZAIrcnXZAICGD62n4MivOgvXPLl3loAkujQDvHttZANZAUXRiSZBZBlPyrbgKOL1ej3XQRVocoN0zf3Syber4CkSTrUIIIheSDZALpwzvz3ndWPqnHeDI5Bll23xn4HjZAjM3LEObLwixifRgZDZD"; // <<<<<<<<<<<< ¡IMPORTANTE! Reemplaza esto con tu token de acceso de página

app.use(bodyParser.json());

// Verificación del Webhook
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook verificado");
    res.status(200).send(challenge);
  } else {
    console.log("❌ Verificación fallida");
    res.sendStatus(403);
  }
});

// Recepción de mensajes y lógica de respuesta
app.post("/webhook", (req, res) => {
  const body = req.body;

  // Asegúrate de que este es un evento de una página
  if (body.object === "page") {
    // Itera sobre cada entrada del evento
    body.entry.forEach(function(entry) {
      // Obtén el mensaje, postback u otro tipo de webhook
      const webhookEvent = entry.messaging[0];
      console.log("📩 Evento de webhook recibido:", JSON.stringify(webhookEvent, null, 2));

      // Obtén el ID del remitente
      const senderPsid = webhookEvent.sender.id;
      console.log("ID del remitente (PSID): " + senderPsid);

      // Comprueba si el evento es un mensaje
      if (webhookEvent.message) {
        handleMessage(senderPsid, webhookEvent.message);
      } else if (webhookEvent.postback) {
        handlePostback(senderPsid, webhookEvent.postback);
      }
    });

    // Envía una respuesta '200 OK' a todos los eventos recibidos
    res.status(200).send("EVENT_RECEIVED");
  } else {
    // Devuelve un '404 Not Found' si el evento no es de una página
    res.sendStatus(404);
  }
});

// Función para manejar los mensajes
async function handleMessage(senderPsid, receivedMessage) {
  let response;

  // Comprueba si el mensaje contiene texto
  if (receivedMessage.text) {
    // Crea la respuesta del mensaje
    response = {
      "text": `Has enviado el mensaje: "${receivedMessage.text}". ¡Ahora envíame una imagen!`,
    };
  } else if (receivedMessage.attachments) {
    // Obtén la URL del archivo adjunto
    let attachmentUrl = receivedMessage.attachments[0].payload.url;
    response = {
      "text": "Gracias por la imagen. ¡Aquí tienes una imagen de vuelta! 🖼️",
      "attachment": {
        "type": "image",
        "payload": {
          "is_reusable": true,
          "url": "https://www.example.com/imagen_de_ejemplo.jpg" // <<<<<<<<<<<< Cambia esto por la URL de una imagen real
        }
      }
    };
  }

  // Envía el mensaje de respuesta usando la API de envío
  await callSendAPI(senderPsid, response);
}

// Función para manejar los postbacks (botones o clics en elementos)
function handlePostback(senderPsid, receivedPostback) {
  let response;

  // Obtén la carga útil del postback
  let payload = receivedPostback.payload;
  console.log("Payload del postback:", payload);

  // Define la respuesta basada en el payload
  if (payload === "GET_STARTED_PAYLOAD") {
    response = { "text": "¡Hola! ¿Cómo puedo ayudarte hoy?" };
  } else {
    response = { "text": `Recibí tu postback: "${payload}"` };
  }

  // Envía el mensaje de respuesta
  callSendAPI(senderPsid, response);
}

// Envía mensajes de respuesta a la API de la plataforma
async function callSendAPI(senderPsid, response) {
  // Construye el cuerpo de la solicitud
  const requestBody = {
    "recipient": {
      "id": senderPsid,
    },
    "message": response,
  };

  try {
    // Envía la solicitud HTTP POST a la API de envío de Messenger
    await axios.post(
      `https://graph.facebook.com/v20.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
      requestBody,
      { headers: { "Content-Type": "application/json" } }
    );
    console.log("✔️ Mensaje enviado a:", senderPsid);
  } catch (error) {
    console.error("❌ No se pudo enviar el mensaje:", error.response ? error.response.data : error.message);
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor activo en puerto ${PORT}`));
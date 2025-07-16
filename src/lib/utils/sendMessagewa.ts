import 'dotenv/config';
export async function enviarDerivacionWhatsApp( mensaje ) {
  //  const url = 'http://localhost:3008/v1/messages';
  const url = process.env.LINK_URL;
  const body = new URLSearchParams( { number: process.env.SOPORTE_NUMERO, message: mensaje } );

  try {
    const response = await fetch( url, {
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    } );

    const result = await response.text(); // 👈 usar text() en vez de json()
    console.log( '📨 Mensaje enviado (respuesta sin JSON):', result );
  } catch ( error ) {
    console.error( '❌ Error al enviar mensaje:', error );
  }
}

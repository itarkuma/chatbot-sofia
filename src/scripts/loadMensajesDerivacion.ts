import 'dotenv/config';
import { OpenAIEmbeddings } from '@langchain/openai';
import { pinecone } from '../lib/pinecone/connect';

/**
 * Script para cargar mensajes del flow confirmarDerivacionUser en Pinecone
 * Ejecutar: npx tsx src/scripts/loadMensajesDerivacion.ts
 */

interface MensajeDerivacion {
  id: string;
  tipo: string;
  flow: string;
  texto: string;
  tags: string[];
  orden?: number;
}

const mensajesDerivacion: MensajeDerivacion[] = [
  {
    id: 'derivacion_confirmacion_inicial',
    tipo: 'mensaje_sistema',
    flow: 'confirmarDerivacionUser',
    texto: 'Le pondré en contacto con *Javier Gómez*, nuestro asesor académico del equipo de Fran Fialli. ¿Desea que lo haga? 📩',
    tags: [ 'confirmacion', 'inicial', 'javier', 'contacto' ],
    orden: 1
  },
  {
    id: 'derivacion_confirmacion_inicial_opciones',
    tipo: 'mensaje_sistema',
    flow: 'confirmarDerivacionUser',
    texto: '✅ *Si*.\n❌ *No*.',
    tags: [ 'confirmacion', 'opciones', 'si', 'no' ],
    orden: 2
  },
  {
    id: 'derivacion_cancelacion',
    tipo: 'mensaje_sistema',
    flow: 'confirmarDerivacionUser',
    texto: 'ℹ️ Para ayudarle mejor, puedo mostrarle el menú principal. Solo debe escribir *MENÚ* o decirme qué tipo de información busca.',
    tags: [ 'cancelacion', 'menu', 'no' ],
    orden: 3
  },
  {
    id: 'derivacion_empezar_datos',
    tipo: 'mensaje_sistema',
    flow: 'confirmarDerivacionUser',
    texto: '✅ Para empezar solo necesito estos datos:',
    tags: [ 'datos', 'empezar', 'formulario' ],
    orden: 4
  },
  {
    id: 'derivacion_solicitar_nombre',
    tipo: 'mensaje_sistema',
    flow: 'confirmarDerivacionUser',
    texto: 'Que me facilite su *nombre completo*',
    tags: [ 'nombre', 'solicitud', 'datos' ],
    orden: 5
  },
  {
    id: 'derivacion_solicitar_correo',
    tipo: 'mensaje_sistema',
    flow: 'confirmarDerivacionUser',
    texto: 'Que me facilite su *correo electrónico*',
    tags: [ 'correo', 'email', 'solicitud', 'datos' ],
    orden: 6
  },
  {
    id: 'derivacion_solicitar_motivo',
    tipo: 'mensaje_sistema',
    flow: 'confirmarDerivacionUser',
    texto: 'Que me facilite su *motivo de su consulta*',
    tags: [ 'motivo', 'consulta', 'solicitud', 'datos' ],
    orden: 7
  },
  {
    id: 'derivacion_exito_confirmacion',
    tipo: 'mensaje_sistema',
    flow: 'confirmarDerivacionUser',
    texto: '✅ Gracias *{nombre}*. Hemos recibido correctamente sus datos.',
    tags: [ 'exito', 'confirmacion', 'datos', 'plantilla' ],
    orden: 8
  },
  {
    id: 'derivacion_exito_javier',
    tipo: 'mensaje_sistema',
    flow: 'confirmarDerivacionUser',
    texto: 'En breve, Javier Gómez se incorporará a este chat para atender su consulta de manera personalizada.\n\n⛔ *Por favor, no responda a este mensaje.* El chat quedará en espera hasta que Javier se incorpore a la conversación.\n\nℹ️ Es posible que reciba algún mensaje automático. No debe responder; solo debe esperar a que Javier se una al chat.',
    tags: [ 'exito', 'javier', 'final' ],
    orden: 9
  }
];

export const cargarMensajesDerivacion = async () => {
  try {
    const index = pinecone.Index( process.env.PINECONE_INDEX_NAME! );
    const embeddings = new OpenAIEmbeddings( {
      openAIApiKey: process.env.OPENAI_API_KEY!
    } );

    console.log( '🚀 Cargando mensajes de derivación a Pinecone...' );

    for ( const mensaje of mensajesDerivacion ) {
      // Generar embedding del texto
      const vector = await embeddings.embedQuery( mensaje.texto );

      // Insertar en Pinecone
      await index.upsert( [
        {
          id: mensaje.id,
          values: vector,
          metadata: {
            archivo: 'mensajes_sistema.json',
            tipo: mensaje.tipo,
            flow: mensaje.flow,
            text: mensaje.texto,
            tags: mensaje.tags,
            orden: mensaje.orden,
            es_fallback: false,
            es_mensaje_sistema: true
          }
        }
      ] );

      console.log( `✅ Cargado: ${ mensaje.id }` );
    }

    console.log( `\n🎉 ${ mensajesDerivacion.length } mensajes cargados exitosamente` );
  } catch ( error ) {
    console.error( '❌ Error cargando mensajes:', error );
    throw error;
  }
};

// Ejecutar si se llama directamente
if ( import.meta.url === `file://${ process.argv[ 1 ] }` ) {
  cargarMensajesDerivacion();
}

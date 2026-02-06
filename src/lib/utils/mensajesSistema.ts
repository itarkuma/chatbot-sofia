import { pinecone } from '../pinecone/connect';

/**
 * Utilidades para recuperar mensajes del sistema desde Pinecone
 */

interface MensajeSistema {
  id: string;
  texto: string;
  tipo: string;
  flow: string;
  tags: string[];
  orden?: number;
}

interface FetchResponse {
  id: string;
  metadata?: {
    text?: string;
    tipo?: string;
    flow?: string;
    tags?: string[];
    orden?: number;
    [key: string]: any;
  };
}

/**
 * Obtiene un mensaje específico del sistema por su ID
 */
export async function getMensajeSistemaPorId(
  mensajeId: string
): Promise<string | null> {
  try {
    const index = pinecone.Index(process.env.PINECONE_INDEX_NAME!);
    
    const result = await index.fetch([mensajeId]);
    const record = result.records?.[mensajeId];
    
    if (!record || !record.metadata) {
      console.warn(`⚠️ Mensaje no encontrado en Pinecone: ${mensajeId}`);
      return null;
    }

    return record.metadata.text as string || null;
  } catch (error) {
    console.error(`❌ Error obteniendo mensaje ${mensajeId}:`, error);
    return null;
  }
}

/**
 * Obtiene múltiples mensajes de un flow específico ordenados
 */
export async function getMensajesPorFlow(
  flowName: string
): Promise<MensajeSistema[]> {
  try {
    const index = pinecone.Index(process.env.PINECONE_INDEX_NAME!);
    
    // Usar query con filtro para obtener todos los mensajes del flow
    // Nota: Pinecone no tiene un "list all" directo, usamos query con vector dummy
    const dummyVector = new Array(1536).fill(0);
    
    const result = await index.query({
      vector: dummyVector,
      topK: 100,
      filter: {
        flow: { $eq: flowName },
        es_mensaje_sistema: { $eq: true }
      },
      includeMetadata: true
    });

    const mensajes: MensajeSistema[] = result.matches
      ?.filter(match => match.metadata)
      .map(match => ({
        id: match.id,
        texto: match.metadata!.text as string,
        tipo: match.metadata!.tipo as string,
        flow: match.metadata!.flow as string,
        tags: (match.metadata!.tags as string[]) || [],
        orden: match.metadata!.orden as number
      }))
      .sort((a, b) => (a.orden || 0) - (b.orden || 0)) || [];

    return mensajes;
  } catch (error) {
    console.error(`❌ Error obteniendo mensajes para flow ${flowName}:`, error);
    return [];
  }
}

/**
 * Obtiene un mensaje específico de un flow por sus tags
 */
export async function getMensajePorTag(
  flowName: string,
  tag: string
): Promise<string | null> {
  try {
    const mensajes = await getMensajesPorFlow(flowName);
    const mensaje = mensajes.find(m => m.tags.includes(tag));
    return mensaje?.texto || null;
  } catch (error) {
    console.error(`❌ Error obteniendo mensaje con tag ${tag}:`, error);
    return null;
  }
}

/**
 * Reemplaza placeholders en un mensaje template
 * Ejemplo: "Hola {nombre}" → "Hola Juan"
 */
export function renderizarMensaje(
  template: string,
  variables: Record<string, string>
): string {
  let resultado = template;
  
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{${key}}`;
    resultado = resultado.replace(new RegExp(placeholder, 'g'), value);
  }
  
  return resultado;
}

// IDs de mensajes específicos para el flow confirmarDerivacionUser
export const MENSAJES_DERIVACION = {
  CONFIRMACION_INICIAL: 'derivacion_confirmacion_inicial',
  CONFIRMACION_OPCIONES: 'derivacion_confirmacion_inicial_opciones',
  CANCELACION: 'derivacion_cancelacion',
  EMPEZAR_DATOS: 'derivacion_empezar_datos',
  SOLICITAR_NOMBRE: 'derivacion_solicitar_nombre',
  SOLICITAR_CORREO: 'derivacion_solicitar_correo',
  SOLICITAR_MOTIVO: 'derivacion_solicitar_motivo',
  EXITO_CONFIRMACION: 'derivacion_exito_confirmacion',
  EXITO_JAVIER: 'derivacion_exito_javier'
} as const;

export type MensajeDerivacionId = typeof MENSAJES_DERIVACION[keyof typeof MENSAJES_DERIVACION];

import { addKeyword, EVENTS } from '@builderbot/bot';
import { preprocessPregunta } from '../lib/utils/preprocessinText';
import { generateTimer } from '../lib/utils/generateTimer';
import { askSofia } from '../scripts/query';
import { esComparacionGrabadoVsVivo } from '../lib/utils/esComparacionGrabadoVsVivo';
import { removeAccents } from '../lib/utils/removeAccents';

const detectflowCursoOonlineGrabado = ( query: string, seccionActual: string ): boolean => {
  const texto = preprocessPregunta( query );
  const textoNormalizado = removeAccents( texto.toLowerCase() );

  // Filtro de comparación de grabado vs vivo (como en tu implementación original)
  if ( esComparacionGrabadoVsVivo( texto ) ) return false;

  // Frases clave relacionadas con el curso grabado
  const frasesClaves = [
    "curso online grabado",
    "¿que es el curso online grabado de fran fialli?",
    "¿en que consiste el curso de trading con modulos grabados?",
    "¿podrias explicarme de que trata el curso grabado de fran fialli?",
    "¿tienen un curso de trading online en formato grabado, no en vivo?",
    "¿como es el curso de trading online grabado que ofrecen?",
  ];

  // Expresiones regulares para detectar el curso grabado
  const regexes = [
    /\bcurso\s+(online\s+)?grabado\b/,
    /\bmodulos\s+grabados\b/,
    /\bcurso\s+de\s+trading\s+online\s+grabado\b/,
    /\bcourse\s+recorded\b/,
    /^1$/,
  ];

  // Lista de frases o palabras clave relacionadas con detalles específicos (temario, lugar, precio, etc.)
  const frasesDetallesEspecificos = [
    "temario",
    "temario del curso grabado",
    "contenido del curso grabado",
    "temario completo",
    "cuánto cuesta",
    "precio",
    "costo",
    "dónde se realiza",
    "lugar del curso",
    "fecha del curso",
    "fechas de inicio",
    "horarios del curso",
    "duración del curso",
    "cómo se realiza",
  ];

  // Verificar si el texto contiene alguna de las frases relacionadas con detalles específicos
  const esPreguntaSobreDetalleEspecifico = frasesDetallesEspecificos.some( f =>
    textoNormalizado.includes( removeAccents( f.toLowerCase() ) )
  );

  // Si se detecta que el usuario está preguntando por un detalle específico (precio, temario, lugar, etc.)
  // Se redirige a otro flujo y se devuelve false
  if ( esPreguntaSobreDetalleEspecifico ) {
    return false;  // No activar el flujo de "curso grabado", ya que se está preguntando por un detalle específico
  }

  // Verificar si el texto coincide exactamente con las frases clave
  const coincideFrase = frasesClaves.some(
    ( f ) => textoNormalizado === preprocessPregunta( f )
  );

  // Verificar si el texto coincide con alguna expresión regular
  const coincideRegex = regexes.some( ( r ) => r.test( textoNormalizado ) );

  return coincideFrase || coincideRegex;
};


const flowCursoOnlineGrabado = addKeyword( EVENTS.ACTION ).addAction( async ( ctx, { state, flowDynamic } ) => {
  try {
    console.log( 'flow grabado' );
    await state.update( { estado_confucion: '0' } );
    await state.update( { seccionActual: 'curso_online_grabado' } );
    await state.update( { estaconfundido_answer: false } );
    const seccion = await state.get( 'seccionActual' );
    const { texto, origen, chunkId } = await askSofia( preprocessPregunta( ctx.body ), seccion, 'curso_online_grabado' );
    if ( origen === 'curso_online_vivo' ||
      origen === 'curso_online_grabado' ||
      origen === 'formacion_miami' ||
      origen === 'formacion_santiago'
    ) {
      await state.update( { seccionActual: origen } );
      console.log( 'update seccion ->:', origen );
    }
    await flowDynamic( [ { body: texto, delay: generateTimer( 150, 250 ) } ] );
    await flowDynamic( [ { body: "¿Le gustaría ver el *temario completo* o un *resumen* con los principales detalles?", delay: generateTimer( 150, 250 ) } ] );
    console.log( { origen, chunkId } );


  } catch ( err ) {
    console.log( `[ERROR]: en el flujo curso online grabado`, err );
    return;
  }
} );

export { detectflowCursoOonlineGrabado, flowCursoOnlineGrabado };
import { addKeyword, EVENTS } from '@builderbot/bot';
import { preprocessPregunta } from '../lib/utils/preprocessinText';
import { generateTimer } from '../lib/utils/generateTimer';
import { askSofia } from '../scripts/query';
import { esComparacionGrabadoVsVivo } from '../lib/utils/esComparacionGrabadoVsVivo';
import { removeAccents } from '../lib/utils/removeAccents';

const detectflowCursoOonlineVivo = ( query: string, seccionActual: string ): boolean => {

  const texto = preprocessPregunta( query );
  const textoNormalizado = removeAccents( texto.toLowerCase() );

  if ( esComparacionGrabadoVsVivo( texto ) ) return false;
  const frasesClaves = [
    "curso online en vivo",
    "¿que es el curso online en vivo?",
    "¿que es el curso online en directo?",
    "¿como funciona el curso de trading en directo?",
    "¿que diferencia tiene con el curso grabado?",
    "¿las clases son en tiempo real?",
    "¿fran fialli da las clases?",
    "¿esta formacion es con clases por zoom?",
    "¿fran fialli ensena en vivo o es grabado?",
    "¿en que se diferencia el curso online en vivo del grabado?",
  ];

  const regexes = [
    /\bcurso\s+online\s+(en\s+vivo|en\s+directo)\b/,
    /\bclases?\s+en\s+(vivo|directo|zoom)\b/,
    /\btiempo\s+real\b/,
    /\bfran\s+fialli\s+(da|enseña|ensena)\s+(las\s+)?clases?\b/,
    /^2$/,
  ];

  // Lista de frases o palabras clave relacionadas con detalles específicos (temario, lugar, precio, etc.)
  const frasesDetallesEspecificos = [
    "temario",
    "temario del curso grabado",
    "contenido del curso grabado",
    "temario completo",
    "cuánto cuesta",
    "precio",
    "trading",
    "aprendere",
    "aprender",
    "organizado",
    "costo",
    "dónde se realiza",
    "lugar del curso",
    "fecha del curso",
    "fechas de inicio",
    "horarios del curso",
    "duración del curso",
    "cómo se realiza",
    "indicadores",
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

const flowCursoOnlineVivo = addKeyword( EVENTS.ACTION ).addAction( async ( ctx, { state, flowDynamic } ) => {
  try {
    console.log( 'flow vivo' );
    await state.update( { estado_confucion: '0' } );
    await state.update( { seccionActual: 'curso_online_vivo' } );
    await state.update( { estaconfundido_answer: false } );
    const seccion = await state.get( 'seccionActual' );
    const { texto, origen, chunkId } = await askSofia( preprocessPregunta( ctx.body ), seccion, 'curso_online_vivo' );
    if ( origen === 'curso_online_vivo' ||
      origen === 'curso_online_grabado' ||
      origen === 'formacion_miami' ||
      origen === 'formacion_santiago'
    ) {
      await state.update( { seccionActual: origen } );
      console.log( 'update seccion ->:', origen );
    }
    await flowDynamic( [ { body: texto, delay: generateTimer( 150, 250 ) } ] );
    console.log( { origen, chunkId } );


  } catch ( err ) {
    console.log( `[ERROR]: en el flujo curso online vivo`, err );
    return;
  }
} );

export { detectflowCursoOonlineVivo, flowCursoOnlineVivo };
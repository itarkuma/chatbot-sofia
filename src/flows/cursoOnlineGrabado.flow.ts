import { addKeyword, EVENTS } from '@builderbot/bot';
import { preprocessPregunta } from '../lib/utils/preprocessinText';
import { generateTimer } from '../lib/utils/generateTimer';
import { askSofia } from '../scripts/query';
import { esComparacionGrabadoVsVivo } from '../lib/utils/esComparacionGrabadoVsVivo';

const detectflowCursoOonlineGrabado = ( query: string, seccionActual: string ): boolean => {

  const texto = preprocessPregunta( query );
  if ( esComparacionGrabadoVsVivo( texto ) ) return false;

  const frasesClaves = [
    "curso online grabado",
    "¿que es el curso online grabado de fran fialli?",
    "¿en que consiste el curso de trading con modulos grabados?",
    "¿podrias explicarme de que trata el curso grabado de fran fialli?",
    "¿tienen un curso de trading online en formato grabado, no en vivo?",
    "¿como es el curso de trading online grabado que ofrecen?",
  ];

  const regexes = [
    /\bcurso\s+(online\s+)?grabado\b/,
    /\bmodulos\s+grabados\b/,
    /\bcurso\s+de\s+trading\s+online\s+grabado\b/,
    /\bcourse\s+recorded\b/,
    /^1$/,
  ];

  const coincideFrase = frasesClaves.some(
    ( f ) => texto === preprocessPregunta( f )
  );
  const coincideRegex = regexes.some( ( r ) => r.test( texto ) );

  return coincideFrase || coincideRegex;

};

const flowCursoOnlineGrabado = addKeyword( EVENTS.ACTION ).addAction( async ( ctx, { state, flowDynamic } ) => {
  try {
    console.log( 'flow grabado' );
    await state.update( { seccionActual: 'curso_online_grabado' } );
    await state.update( { estaconfundido_answer: false } );
    const seccion = await state.get( 'seccionActual' );
    const { texto, origen, chunkId } = await askSofia( preprocessPregunta( ctx.body ), seccion, 'curso_online_grabado' );

    await flowDynamic( [ { body: texto, delay: generateTimer( 150, 250 ) } ] );
    await flowDynamic( [ { body: "¿Le gustaría ver el temario completo o un resumen con los principales detalles?", delay: generateTimer( 150, 250 ) } ] );
    console.log( { origen, chunkId } );


  } catch ( err ) {
    console.log( `[ERROR]: en el flujo curso online grabado`, err );
    return;
  }
} );

export { detectflowCursoOonlineGrabado, flowCursoOnlineGrabado };
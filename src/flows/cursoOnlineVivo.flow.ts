import { addKeyword, EVENTS } from '@builderbot/bot';
import { preprocessPregunta } from '../lib/utils/preprocessinText';
import { generateTimer } from '../lib/utils/generateTimer';
import { askSofia } from '../scripts/query';


const detectflowCursoOonlineVivo = ( query: string, seccionActual: string ): boolean => {

  const texto = preprocessPregunta( query );

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

  const coincideFrase = frasesClaves.some( f => texto === preprocessPregunta( f ) );
  const coincideRegex = regexes.some( r => r.test( texto ) );

  return coincideFrase || coincideRegex;

};

const flowCursoOnlineVivo = addKeyword( EVENTS.ACTION ).addAction( async ( ctx, { state, flowDynamic } ) => {
  try {

    await state.update( { seccionActual: 'curso_online_vivo' } );
    await state.update( { estaconfundido_answer: false } );
    const seccion = await state.get( 'seccionActual' );
    const { texto, origen, chunkId } = await askSofia( preprocessPregunta( ctx.body ), seccion, 'curso_online_vivo' );

    await flowDynamic( [ { body: texto, delay: generateTimer( 150, 250 ) } ] );
    console.log( { origen, chunkId } );


  } catch ( err ) {
    console.log( `[ERROR]: en el flujo curso online vivo`, err );
    return;
  }
} );

export { detectflowCursoOonlineVivo, flowCursoOnlineVivo };
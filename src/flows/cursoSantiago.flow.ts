import { addKeyword, EVENTS } from '@builderbot/bot';
import { preprocessPregunta } from '../lib/utils/preprocessinText';
import { generateTimer } from '../lib/utils/generateTimer';
import { askSofia } from '../scripts/query';

const detectflowCursoSantiago = ( query: string, seccionActual: string ): boolean => {

  const texto = preprocessPregunta( query );

  //  const seccionEsGeneral = seccionActual === "" || seccionActual === "menu";
  //  if ( !seccionEsGeneral ) return false;

  const frasesExactas = [
    "¿tienen un curso de trading en santiago de compostela?",
    "¿podrias explicarme el entrenamiento de santiago de compostela con fran fialli?",
    "¿puedo hacer un curso presencial de bolsa en españa?",
    "¿es una masterclass de trading en santiago de compostela o un curso completo?",
    "¿como es el entrenamiento presencial de trading en santiago de compostela?",
    "¿ofrecen formacion en santiago de compostela?",
    "¿tienen curso de trading en santiago de compostela?",
    "quisiera saber que es el curso presencial de fran fialli en santiago de compostela",
    "tienen un curso de trading en santiago de compostela?",
    "curso presencial fran fialli santiago compostela",
    "formacion en santiago",
    "curso en santiago",
    "curso santiago",
    "trading santiago"
  ];

  const coincideFrase = frasesExactas.some( f => texto === preprocessPregunta( f ) );

  const regexes = [
    /\bcurso(s)?\s+(de\s+)?trading\s+(presencial\s+)?(en\s+)?santiago(\s+de\s+compostela)?\b/,
    /\b(entrenamiento|formaci[oó]n|masterclass|clase(s)?)\s+(presencial\s+)?(de\s+)?trading\s+(en\s+)?santiago(\s+de\s+compostela)?\b/,
    /\b(francisco|fran)\s+fialli\b.*\bsantiago(\s+de\s+compostela)?\b/,
    /\binfo(?:rmaci[oó]n)?\b.*\bcurso\b.*\bsantiago(\s+de\s+compostela)?\b/,
    /\bquiero\b.*(info|informaci[oó]n).*santiago\b/,
    /^4$/, // opción por número
  ];


  const coincideRegex = regexes.some( r => r.test( texto ) );

  return coincideFrase || coincideRegex;

};

const flowCursoSantiago = addKeyword( EVENTS.ACTION ).addAction( async ( ctx, { state, flowDynamic } ) => {
  try {
    console.log( 'flow santiago' );
    await state.update( { estado_confucion: '0' } );
    await state.update( { seccionActual: 'formacion_miami' } );
    const seccion = await state.get( 'seccionActual' );
    const { texto, origen, chunkId } = await askSofia( preprocessPregunta( ctx.body ), seccion, 'formacion_santiago' );

    await flowDynamic( [ { body: texto, delay: generateTimer( 150, 250 ) } ] );
    console.log( { origen, chunkId } );

  } catch ( err ) {
    console.log( `[ERROR]: en el flujo curso santiago`, err );
    return;
  }
} );

export { detectflowCursoSantiago, flowCursoSantiago };
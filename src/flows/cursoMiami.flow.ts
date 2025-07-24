import { addKeyword, EVENTS } from '@builderbot/bot';
import { preprocessPregunta } from '../lib/utils/preprocessinText';
import { generateTimer } from '../lib/utils/generateTimer';
import { askSofia } from '../scripts/query';

const detectflowCursoMiami = ( query: string, seccionActual: string ): boolean => {

  const texto = preprocessPregunta( query );

  const frasesExactas = [
    "¿tienen un curso de trading en miami?",
    "¿podrias explicarme el entrenamiento de miami con fran fialli?",
    "¿puedo hacer un curso presencial de bolsa en estados unidos?",
    "¿es una masterclass de trading en miami o un curso completo?",
    "¿como es el entrenamiento presencial de trading en miami?",
    "¿ofrecen formacion en miami?",
    "¿tienen curso de trading en miami?",
    "curso trading miami presencial",
    "informacion curso miami fran fialli",
    "¿como es el curso de trading en miami?",
    "¿tiene fran fialli algun curso presencial en miami?",
    "¿tienes cursos de trading en miami?",
    "formacion en miami",
  ];

  const regexes = [
    /\bcurso(s)?\s+(de\s+)?trading\s+en\s+miami\b/,
    /\bentrenamiento\s+(de\s+)?trading\s+en\s+miami\b/,
    /\bcurso\s+presencial\s+(en\s+)?miami\b/,
    /\bmiami\b.*\b(trading|curso|entrenamiento|fran fialli)\b/,
    /\bformacion\s+(en\s+)?miami\b/,
    /\bmasterclass\s+(de\s+)?trading\s+(en\s+)?miami\b/,
    /^3$/,
  ];

  const coincideFrase = frasesExactas.some( f => texto === preprocessPregunta( f ) );
  const coincideRegex = regexes.some( r => r.test( texto ) );

  return coincideFrase || coincideRegex;

};

const flowCursoMiami = addKeyword( EVENTS.ACTION ).addAction( async ( ctx, { state, flowDynamic } ) => {
  try {
    console.log( 'flow miami' );
    await state.update( { seccionActual: 'formacion_miami' } );
    const seccion = await state.get( 'seccionActual' );
    const { texto, origen, chunkId } = await askSofia( preprocessPregunta( ctx.body ), seccion, 'formacion_miami' );

    await flowDynamic( [ { body: texto, delay: generateTimer( 150, 250 ) } ] );
    console.log( { origen, chunkId } );

  } catch ( err ) {
    console.log( `[ERROR]: en el flujo curso miami`, err );
    return;
  }
} );

export { detectflowCursoMiami, flowCursoMiami };
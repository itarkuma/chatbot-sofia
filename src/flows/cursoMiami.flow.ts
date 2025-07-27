import { addKeyword, EVENTS } from '@builderbot/bot';
import { preprocessPregunta } from '../lib/utils/preprocessinText';
import { generateTimer } from '../lib/utils/generateTimer';
import { askSofia } from '../scripts/query';

const detectflowCursoMiami = ( query: string, seccionActual: string ): boolean => {
  const texto = preprocessPregunta( query ).toLowerCase();

  // Frases comunes completas (exactas después de normalizar)
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
    "curso en miami",
    "curso miami",
    "trading miami",
  ];

  const coincideFrase = frasesExactas.some( f => texto === preprocessPregunta( f ) );

  // Expresiones más flexibles
  const regexes = [
    /\bcurso(s)?\s+(de\s+)?trading\s+(presencial\s+)?(en\s+)?miami\b/,
    /\bentrenamiento\s+(presencial\s+)?(de\s+)?trading\s+(en\s+)?miami\b/,
    /\b(masterclass|formaci[oó]n|clase(s)?|programa)\s+(presencial\s+)?(de\s+)?trading\s+(en\s+)?miami\b/,
    /\bcursos?\s+(en|de)\s+miami\b/,
    /\bmiami\b.*\b(trading|curso|entrenamiento|fran fialli)\b/,
    /\b(trading|curso)\b.*\bmiami\b/,
    /\binfo\b.*\bmiami\b/,
    /\bquiero.*(info|informaci[oó]n).*(curso|trading).*miami\b/,
    /^3$/, // opción por menú numérico
  ];

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
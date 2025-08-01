import { addKeyword, EVENTS } from '@builderbot/bot';
import { preprocessPregunta } from '../lib/utils/preprocessinText';
import { generateTimer } from '../lib/utils/generateTimer';
import { askSofia } from '../scripts/query';
import { removeAccents } from '../lib/utils/removeAccents';

const detectflowCursoSantiago = ( query: string, seccionActual: string ): boolean => {

  const texto = preprocessPregunta( query );
  const textoNormalizado = removeAccents( texto.toLowerCase() );
  //  const seccionEsGeneral = seccionActual === "" || seccionActual === "menu";
  //  if ( !seccionEsGeneral ) return false;

  const frasesClaves = [
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

  const regexes = [
    /\bcurso(s)?\s+(de\s+)?trading\s+(presencial\s+)?(en\s+)?santiago(\s+de\s+compostela)?\b/,
    /\b(entrenamiento|formaci[oó]n|masterclass|clase(s)?)\s+(presencial\s+)?(de\s+)?trading\s+(en\s+)?santiago(\s+de\s+compostela)?\b/,
    /\b(francisco|fran)\s+fialli\b.*\bsantiago(\s+de\s+compostela)?\b/,
    /\binfo(?:rmaci[oó]n)?\b.*\bcurso\b.*\bsantiago(\s+de\s+compostela)?\b/,
    /\bquiero\b.*(info|informaci[oó]n).*santiago\b/,
    /^4$/, // opción por número
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

const flowCursoSantiago = addKeyword( EVENTS.ACTION ).addAction( async ( ctx, { state, flowDynamic } ) => {
  try {
    console.log( 'flow santiago' );
    await state.update( { estado_confucion: '0' } );
    await state.update( { seccionActual: 'formacion_miami' } );
    const seccion = await state.get( 'seccionActual' );
    const { texto, origen, chunkId } = await askSofia( preprocessPregunta( ctx.body ), seccion, 'formacion_santiago' );
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
    console.log( `[ERROR]: en el flujo curso santiago`, err );
    return;
  }
} );

export { detectflowCursoSantiago, flowCursoSantiago };
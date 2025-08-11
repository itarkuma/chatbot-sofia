import { matchDisparadorMejor } from "./matchDisparadorMejor";

type MatchResultado = {
  match: boolean;
  tipo?: string;
  detalle?: string;
  chunkId: string;
  fuerza?: number;
  score?: number;
  doc?: any;
};

function ordenarPorMejorCoincidencia(
  docsConScore: [ any, number ][],
  pregunta: string
): MatchResultado[] {
  const resultados: MatchResultado[] = [];
  console.log( '🔍 Ordenando coincidencias...' );

  for ( const [ doc, score ] of docsConScore ) {
    const resultado = matchDisparadorMejor( doc, pregunta );
    if ( resultado.match ) {
      resultados.push( {
        ...resultado,
        score,
        doc,
      } );
    }
  }

  // Ordenar por fuerza (desc), luego por score (desc)
  resultados.sort( ( a, b ) => {
    const fuerzaA = a.fuerza ?? 0;
    const fuerzaB = b.fuerza ?? 0;

    if ( fuerzaB !== fuerzaA ) return fuerzaB - fuerzaA;

    // En caso de empate de fuerza, usar el score (mayor score = mejor)
    if ( a.score !== undefined && b.score !== undefined ) {
      return b.score - a.score;
    }

    return 0;
  } );

  return resultados;
}


export { ordenarPorMejorCoincidencia };
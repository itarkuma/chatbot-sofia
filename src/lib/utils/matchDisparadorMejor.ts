import { preprocessPregunta } from "./preprocessinText";

function matchDisparadorMejor( doc: any, question: string ): {
  match: boolean;
  tipo?: string;
  detalle?: string;
  chunkId: string;
  fuerza?: number;
  score?: number;
  doc?: any;
} {

  const STOPWORDS = new Set( [
    'de', 'la', 'que', 'el', 'en', 'y', 'a', 'los', 'del', 'se', 'las',
    'por', 'un', 'para', 'con', 'una', 'su', 'al', 'lo',
    'más', 'pero', 'sus', 'le', 'ya', 'o', 'este', 'sí', 'porque', 'esta',
    'e', 'tú', 'te', 'ti', 'tu', 'tus', 'ellas'
  ] );

  const PALABRAS_NEUTRAS = new Set( [
    'curso', 'formación', 'aprendizaje', 'fran', 'bolsa', 'mercado', 'finanzas', 'modulo', 'estudio'
  ] );

  const queryLower = preprocessPregunta( question );
  const palabrasQuery = queryLower
    .split( /\s+/ )
    .filter( p => !STOPWORDS.has( p ) && !PALABRAS_NEUTRAS.has( p ) );

  const disparadoras: string[] = doc.metadata?.disparadoras || [];
  const tags: string[] = ( doc.metadata?.tags || [] ).map( ( t: string ) => t.toLowerCase() );
  const chunkId = doc.metadata?.chunk || 'unknown';

  // [1] TAG-EXACT
  if ( tags.includes( queryLower ) ) {

    return { match: true, tipo: 'TAG-EXACT', detalle: queryLower, chunkId, fuerza: 5 };
  }

  // [2] TAG-WORD
  for ( const palabra of palabrasQuery ) {
    if ( tags.includes( palabra ) ) {

      return { match: true, tipo: 'TAG-WORD', detalle: palabra, chunkId, fuerza: 4 };
    }
  }

  // [3] DISPARADORAS
  for ( const frase of disparadoras ) {
    const fraseLimpia = preprocessPregunta( frase ).toLowerCase();
    const palabrasFrase = fraseLimpia
      .split( /\s+/ )
      .filter( p => !STOPWORDS.has( p ) && !PALABRAS_NEUTRAS.has( p ) );
    const palabrasPregunta = queryLower.split( /\s+/ ).filter( p => !STOPWORDS.has( p ) );

    const fraseSinStop = palabrasFrase.join( " " );
    const querySinStop = palabrasPregunta.join( " " );

    // [3.0] DISPARADORA-EXACTA
    if ( fraseSinStop === querySinStop ) {

      return {
        match: true,
        tipo: 'DISPARADORA-EXACTA',
        detalle: `"${ querySinStop }"`,
        chunkId,
        fuerza: 6 // puntaje alto por coincidencia exacta
      };
    }

    // [3.a] Inclusión mutua
    if (
      fraseSinStop.length > 0 &&
      querySinStop.length > 0 &&
      ( fraseSinStop.includes( querySinStop ) || querySinStop.includes( fraseSinStop ) )
    ) {
      const comunes = palabrasFrase.filter(
        p => !PALABRAS_NEUTRAS.has( p ) && palabrasPregunta.includes( p )
      );
      const fuerza = comunes.length >= 3 ? 3 : comunes.length === 2 ? 2 : 1;

      return {
        match: true,
        tipo: 'DISPARADORA-INCLUYE',
        detalle: `"${ querySinStop }" ≈ "${ fraseSinStop }"`,
        chunkId,
        fuerza
      };
    }

    // [3.b] Coincidencia por palabras comunes
    const comunes = palabrasFrase.filter( p => p !== "curso" && palabrasPregunta.includes( p ) );
    if ( comunes.length >= 3 ) {

      return {
        match: true,
        tipo: 'DISPARADORA-PALABRAS',
        detalle: comunes.join( ', ' ),
        chunkId,
        fuerza: 4
      };
    } else if ( comunes.length === 2 ) {

      return {
        match: true,
        tipo: 'DISPARADORA-PALABRAS',
        detalle: comunes.join( ', ' ),
        chunkId,
        fuerza: 3
      };
    }
  }

  return { match: false, chunkId };
}


export { matchDisparadorMejor };
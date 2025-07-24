export function preprocessPregunta( pregunta: string ): string {
  return pregunta
    .toLowerCase()
    .normalize( "NFD" )                    // quita tildes
    .replace( /[\u0300-\u036f]/g, "" )     // quita acentos
    .replace( /[^a-z0-9\s]/gi, "" )        // elimina símbolos raros
    .replace( /\s+/g, " " )                // colapsa múltiples espacios
    .trim();                             // recorta espacios extremos
}
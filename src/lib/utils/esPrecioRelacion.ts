import { preprocessPregunta } from './preprocessinText';

export const esPrecioRelacion = ( query: string ): boolean => {
  const textoLower = preprocessPregunta( query );

  const posiblesPrecios = [
    /\b(cuanto\s+cuesta|precio\s+curso|precios\s+curso|precio\s+tiene|precios\s+tiene|cual\s+es\s+el\s+precio|que\s+precio\s+tiene|que\s+precios\s+tiene|decirme\s+el\s+costo|decirme\s+el\s+coste|cuanto\s+vale|el\s+valor\s+aproximado|cuanto\s+sale|cual\s+es\s+el\s+costo)\b/,
  ];

  const posiblesDivisas = [
    /\b(usd|dólares|dolares|euros|€|moneda\s+local|mi\s+divisa|en\s+\$|en\s+usd|en\s+euros)\b/,
  ];

  const isPrecioRelated =
    textoLower.includes( 'dame el precio' ) ||
    textoLower.includes( 'dame los precios' ) ||
    textoLower.includes( 'das el precio' ) ||
    textoLower.includes( 'das el precios' ) ||
    textoLower.includes( 'cuanto cuesta' ) ||
    textoLower.includes( 'precio curso' ) ||
    textoLower.includes( 'precios curso' ) ||
    textoLower.includes( 'precio tiene' ) ||
    textoLower.includes( 'precios tiene' ) ||
    textoLower.includes( 'cual es el precio' ) ||
    textoLower.includes( 'que precio tiene' ) ||
    textoLower.includes( 'que precios tiene' ) ||
    textoLower.includes( 'decirme el costo' ) ||
    textoLower.includes( 'decirme el coste' ) ||
    textoLower.includes( 'cuanto vale' ) ||
    textoLower.includes( 'el valor aproximado' ) ||
    textoLower.includes( 'cuanto sale' ) ||
    textoLower.includes( 'cual es el costo' );

  const esFrasePrecio = posiblesPrecios.some( ( regex ) => regex.test( textoLower ) );
  const mencionaDivisa = posiblesDivisas.some( ( regex ) => regex.test( textoLower ) );

  return ( isPrecioRelated || esFrasePrecio ) && !mencionaDivisa;
};
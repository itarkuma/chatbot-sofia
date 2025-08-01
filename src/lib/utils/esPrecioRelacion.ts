import { preprocessPregunta } from './preprocessinText';

export const esPrecioRelacion = ( query: string ): boolean => {
  const textoLower = preprocessPregunta( query );

  const posiblesPrecios = [
    /\b(cuanto\s+cuesta|precio\s+curso|precios\s+curso|precio\s+tiene|precios\s+tiene|cual\s+es\s+el\s+precio|que\s+precio\s+tiene|que\s+precios\s+tiene|decirme\s+el\s+costo|decirme\s+el\s+coste|cuanto\s+vale|el\s+valor\s+aproximado|cuanto\s+sale|cual\s+es\s+el\s+costo)\b/,
  ];

  const isPrecioRelated =
    preprocessPregunta( query ).includes( 'dame el precio' ) ||
    preprocessPregunta( query ).includes( 'dame los precios' ) ||
    preprocessPregunta( query ).includes( 'das el precio' ) ||
    preprocessPregunta( query ).includes( 'das el precios' ) ||
    preprocessPregunta( query ).includes( 'cuanto cuesta' ) ||
    preprocessPregunta( query ).includes( 'precio curso' ) ||
    preprocessPregunta( query ).includes( 'precios curso' ) ||
    preprocessPregunta( query ).includes( 'precio tiene' ) ||
    preprocessPregunta( query ).includes( 'precios tiene' ) ||
    preprocessPregunta( query ).includes( 'cual es el precio' ) ||
    preprocessPregunta( query ).includes( 'que precio tiene' ) ||
    preprocessPregunta( query ).includes( 'que precios tiene' ) ||
    preprocessPregunta( query ).includes( 'decirme el costo' ) ||
    preprocessPregunta( query ).includes( 'decirme el coste' ) ||
    preprocessPregunta( query ).includes( 'cuanto vale' ) ||
    preprocessPregunta( query ).includes( 'el valor aproximado' ) ||
    preprocessPregunta( query ).includes( 'cuanto sale' ) ||
    preprocessPregunta( query ).includes( 'cual es el costo' );

  const esFrasePrecio = posiblesPrecios.some( ( regex ) => regex.test( textoLower ) );

  return isPrecioRelated || esFrasePrecio;
};
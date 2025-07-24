
import { preprocessPregunta } from './preprocessinText';

export const esComparacionGrabadoVsVivo = ( query: string ): boolean => {

  const textoLower = preprocessPregunta( query );

  const mencionaGrabado = /\b(grabado|grabada|grabados|grabadas)\b/.test( textoLower );
  const mencionaVivo =
    /\b(en\s+vivo|en\s+directo|zoom|tiempo\s+real)\b/.test( textoLower ) ||
    /\bonline\b/.test( textoLower ); // para cubrir casos como "curso online"

  const posiblesComparaciones = [
    /\b(cual\s+es\s+mejor|diferencia|comparaci[oó]n|me\s+conviene|estoy\s+dudando|que\s+cambia|que\s+ventaja|que\s+beneficio|que\s+desventaja)\b/,
  ];

  const esFraseComparativa = posiblesComparaciones.some( ( regex ) => regex.test( textoLower ) );

  return mencionaGrabado && mencionaVivo && esFraseComparativa;
};


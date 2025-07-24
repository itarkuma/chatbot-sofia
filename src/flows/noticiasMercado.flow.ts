import { addKeyword, EVENTS } from '@builderbot/bot';
import { preprocessPregunta } from '../lib/utils/preprocessinText';
import { generateTimer } from '../lib/utils/generateTimer';
import { askSofia } from '../scripts/query';

const detectflowNoticiasMercado = ( query: string, seccionActual: string ): boolean => {
  const noticiasMercadoTriggers = [
    "canal de noticias del mercado",
    "8",
    /noticias.*actualizadas.*mercado/,
    /informacion.*diaria.*bolsa/,
    /mantenerme.*actualidad.*financiera/,
    /estar.*informado.*operar/,
    /explican.*noticias.*mercado/,
    /saber.*econom[ií]a.*ahora/,
    /analisis.*noticias.*economicas?/,
    /noticias.*afecten.*mercado/,
    /noticias.*bolsa.*hoy/,
    /que.*pasando.*mercado/,
    /noticia.*importante.*hoy/,
    /novedades.*economicas?.*dia/,
    /resumen.*mercado/,
    /pasa.*bolsa.*ahora/,
    /nuevo.*mercados?/,
    /noticias.*dia.*trading/,
    /veo.*noticias.*aqui/
  ];
  const texto = preprocessPregunta( query );

  return noticiasMercadoTriggers.some( trigger => {
    if ( typeof trigger === "string" ) {
      return texto === trigger; // coincidencia exacta
    }
    if ( trigger instanceof RegExp ) {
      return trigger.test( texto ); // coincidencia por patrón
    }
    return false;
  } );

};

const flowNoticiasMercado = addKeyword( EVENTS.ACTION ).addAction( async ( ctx, { state, flowDynamic, extensions } ) => {
  try {

    const seccion = await state.get( 'seccionActual' );

    const { texto, origen, chunkId } = await askSofia( preprocessPregunta( ctx.body ), seccion, 'noticias_mercado' );

    await flowDynamic( [ { body: texto, delay: generateTimer( 150, 250 ) } ] );
    console.log( { origen, chunkId } );


  } catch ( err ) {
    console.log( `[ERROR]: en el flujo noticias mercado`, err );
    return;
  }
} );

export { detectflowNoticiasMercado, flowNoticiasMercado };
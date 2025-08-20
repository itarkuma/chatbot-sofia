import { addKeyword, EVENTS } from '@builderbot/bot';
import { preprocessPregunta } from '../lib/utils/preprocessinText';
import { generateTimer } from '../lib/utils/generateTimer';
import { askSofia } from '../scripts/query';

const detectflowNoticiasMercado = ( query: string, seccionActual: string ): boolean => {
  const noticiasMercadoTriggers = [
    "canal de noticias del mercado",
    "8",
    /\bcanal( de)? noticias?\b/,
    /\bnoticias?( de)? mercado\b/,
    /\bnoticias?( de)? trading\b/,
    /\bnoticias.*actualizadas.*mercado\b/,
    /\binformacion.*diaria.*bolsa\b/,
    /\bmantenerme.*actualidad.*financiera\b/,
    /\bestar.*informado.*operar\b/,
    /\bexplican.*noticias.*mercado\b/,
    /\bsaber.*econom[ií]a.*ahora\b/,
    /\banalisis.*noticias.*economicas?\b/,
    /\bnoticias.*afecten.*mercado\b/,
    /\bnoticias.*bolsa.*hoy\b/,
    /\bque.*pasando.*mercado\b/,
    /\bnoticia.*importante.*hoy\b/,
    /\bnovedades.*economicas?.*dia\b/,
    /\bresumen.*mercado\b/,
    /\bpasa.*bolsa.*ahora\b/,
    /\bnuevo.*mercados?\b/,
    /\bnoticias.*dia.*trading\b/,
    /\bveo.*noticias.*aqui\b/
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
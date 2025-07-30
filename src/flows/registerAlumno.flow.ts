import { addKeyword, EVENTS } from '@builderbot/bot';
import { askSofia } from '../scripts/query';
import { preprocessPregunta } from '../lib/utils/preprocessinText';
import { generateTimer } from '../lib/utils/generateTimer';
import { enviarDerivacionWhatsApp } from '../lib/utils/sendMessagewa';

const detectCiudadMiami = ( query: string, seccionActual: string ): boolean => {
  const patronesMiami = [
    /\bmiami\b/,
    /\bciudad\s+de\s+miami\b/,
    /\bestoy\s+en\s+miami\b/,
    /\bcurso\s+(en|de)\s+miami\b/
  ];
  const texto = preprocessPregunta( query );

  return patronesMiami.some( p => p.test( texto ) );

};

const detectarCiudadSantiago = ( query: string, seccionActual: string ): boolean => {
  const texto = preprocessPregunta( query );

  const patronesSantiago = [
    /\bsantiago\b/,
    /\bsantiago\s+de\s+compostela\b/,
    /\bcurso\s+en\s+santiago\b/,
    /\bcurso\s+de\s+santiago\b/,
    /\bcurso\s+(en|de)\s+santiago\s+de\s+compostela\b/
  ];

  return patronesSantiago.some( p => p.test( texto ) );
};

const detectarCursoGrabado = ( query: string, seccionActual: string ): boolean => {
  const texto = preprocessPregunta( query );

  const patronesGrabado = [
    /\bcurso\s+(online\s+)?grabado\b/,
    /\bonline\s+grabado\b/,
    /\bgrabado\b/,
    /\bonline\b/,
    /\bonlline\s+grabado\b/, // error común de tipeo
    /\bcurso\s+grabado\b/
  ];

  return patronesGrabado.some( p => p.test( texto ) );
};


const registerAlumno = addKeyword( EVENTS.ACTION )
  .addAnswer( `Nombre Completo`, { capture: true }, async ( ctx, { state } ) => {
    await state.update( { name: ctx.body } );
  } )
  .addAnswer( `Correo electrónico`, { capture: true }, async ( ctx, { state } ) => {
    await state.update( { correo: ctx.body } );
  } )
  .addAnswer( `Modalidad`, { capture: true }, async ( ctx, { state } ) => {
    await state.update( { ciudad: ctx.body } );
  } )
  .addAction( async ( ctx, { flowDynamic, state } ) => {

    try {

      const nombre = await state.get( 'name' ) || 'No especificado';
      const correo = await state.get( 'correo' ) || 'No proporcionado';
      const ciudad = await state.get( 'ciudad' ) || 'No indicado';
      const telefono = ctx.from || 'Desconocido';

      const mensaje = `
      📩 Nueva solicitud de atención humana
      
      👤 Nombre: ${ nombre }
      📧 Correo: ${ correo }
      📝 Ciudad de interés: ${ ciudad }
      📱 Teléfono: ${ telefono }
      `;

      await enviarDerivacionWhatsApp( mensaje );

      const seccion = await state.get( 'seccionActual' );

      if ( detectCiudadMiami( preprocessPregunta( ciudad ), seccion ) ) {
        const { texto, origen, chunkId } = await askSofia( preprocessPregunta( ctx.body ), seccion, 'soy_alumno_miami' );
        await flowDynamic( [ { body: texto, delay: generateTimer( 150, 250 ) } ] );
        await state.update( { isAlumnoRegistrado: true } );
        await state.update( { isAlumnoRegistradoMiami: true } );
        console.log( { origen, chunkId } );
      } else {
        if ( detectarCiudadSantiago( preprocessPregunta( ciudad ), seccion ) ) {
          const { texto, origen, chunkId } = await askSofia( preprocessPregunta( ctx.body ), seccion, 'soy_alumno_santiago' );
          await flowDynamic( [ { body: texto, delay: generateTimer( 150, 250 ) } ] );
          await state.update( { isAlumnoRegistrado: true } );
          await state.update( { isAlumnoRegistradoSantiago: true } );
          console.log( { origen, chunkId } );
        } else {
          if ( detectarCursoGrabado( preprocessPregunta( ciudad ), seccion ) ) {
            const { texto, origen, chunkId } = await askSofia( preprocessPregunta( ctx.body ), seccion, 'soy_alumno_grabado' );
            await flowDynamic( [ { body: texto, delay: generateTimer( 150, 250 ) } ] );
            await state.update( { isAlumnoRegistrado: true } );
            await state.update( { isAlumnoRegistradoGrabado: true } );
            console.log( { origen, chunkId } );
          } else {

            const texto_success = `ℹ️ Gracias *${ nombre }* .Hemos detectado que no introdujo el modulo correco. Para ayudarle mejor, puedo mostrarle el menú principal. Solo debe escribir *MENÚ* o decirme qué tipo de información busca.`;

            await state.update( { isAlumnoRegistrado: false } );
            await state.update( { isAlumnoRegistradoMiami: false } );
            await state.update( { isAlumnoRegistradoSantiago: false } );
            await state.update( { isAlumnoRegistradoGrabado: false } );
            await flowDynamic( [ { body: texto_success, delay: generateTimer( 150, 250 ) } ] );
          }
        }
      }

    } catch ( err ) {
      console.log( `[ERROR]: en el flujo registro alumno`, err );
      return;
    }


  } );

export { registerAlumno };
export const derivarHumano = ( tags: string[], origen: string ): boolean => {

  //alumno
  if ( tags.includes( 'identificación' ) ) {
    // Acción específica
    console.log( 'Caso especial derivacion humana' );
    return true;
  }
  if ( tags.includes( 'problemas_técnicos' ) ) {
    // Acción específica
    console.log( 'Caso especial derivacion humana' );
    return true;
  }
  if ( tags.includes( 'derivación_javier' ) ) {
    // Acción específica
    console.log( 'Caso especial derivacion humana' );
    return true;
  }
  if ( tags.includes( 'credenciales_acceso' ) ) {
    // Acción específica
    console.log( 'Caso especial derivacion humana' );
    return true;
  }
  if ( tags.includes( 'actualización_datos' ) ) {
    // Acción específica
    console.log( 'Caso especial derivacion humana' );
    return true;
  }
  if ( tags.includes( 'renovación' ) ) {
    // Acción específica
    console.log( 'Caso especial derivacion humana' );
    return true;
  }
  if ( tags.includes( 'dificultades_de_acceso' ) ) {
    // Acción específica
    console.log( 'Caso especial derivacion humana' );
    return true;
  }
  if ( tags.includes( 'actualización_contacto' ) ) {
    // Acción específica
    console.log( 'Caso especial derivacion humana' );
    return true;
  }
  if ( tags.includes( 'refuerzo_contenido' ) ) {
    // Acción específica
    console.log( 'Caso especial derivacion humana' );
    return true;
  }








  if ( tags.includes( 'moneda_local-Hotmart-LATAM-precio_en_pesos' ) && origen === 'curso_online_grabado' ) {
    // Acción específica
    console.log( 'Caso especial moneda local' );
    return true;
  }

  if ( tags.includes( 'derivacion_humana' ) ) {
    // Acción específica
    console.log( 'Caso especial derivacion humana' );
    return true;
  }

  if ( tags.includes( 'precio_en_vivo' ) ) {
    // Acción específica
    console.log( 'Caso especial precio online en vivo derivar javier' );
    return true;
  }

  if ( tags.includes( 'solicitud_datos' ) && origen === 'curso_online_vivo' ) {
    // Acción específica
    console.log( 'Caso especial 1' );
    return true;
  }

  if ( tags.includes( 'reserva_plaza' ) && origen === 'curso_online_vivo' ) {
    // Acción específica
    console.log( 'Caso especial 2' );
    return true;
  }
  if ( tags.includes( 'inscripción' ) && origen === 'curso_online_grabado' ) {
    // Acción específica
    console.log( 'Caso especial 3' );
    return true;

  }

  if ( tags.includes( 'escenario_entrenable-sin_fechas-interés_usuario-lead_prioritario' ) && origen === 'formacion_miami' ) {
    console.log( 'Caso especial 7' );
    return true;
  }
  if ( tags.includes( 'captación_datos' ) && origen === 'formacion_miami' ) {
    console.log( 'Caso especial 8' );
    return true;
  }
  if ( tags.includes( 'captación_datos' ) && origen === 'formacion_miami' ) {
    console.log( 'Caso especial 9' );
    return true;
  }
  if ( tags.includes( 'falta_confirmación' ) && origen === 'formacion_miami' ) {
    console.log( 'Caso especial 9' );
    return true;
  }

  if ( tags.includes( 'reserva_de_plaza' ) && origen === 'formacion_miami' ) {
    // Acción específica
    console.log( 'Caso especial 1' );
    return true;
  }
  if ( tags.includes( 'inscripción_presencial' ) && origen === 'formacion_miami' ) {
    // Acción específica
    console.log( 'Caso especial 1' );
    return true;
  }
  if ( tags.includes( 'precio_curso_Miami' ) && origen === 'formacion_miami' ) {
    // Acción específica
    console.log( 'Caso especial 1' );
    return true;
  }
  if ( tags.includes( 'admisiones' ) && origen === 'formacion_santiago' ) {
    console.log( 'Caso especial 1_11' );
    return true;
  }
  if ( tags.includes( 'reserva_de_plaza' ) && origen === 'formacion_santiago' ) {
    console.log( 'Caso especial 2_12' );
    return true;
  }
  if ( tags.includes( 'inscripción_presencial' ) && origen === 'formacion_santiago' ) {
    console.log( 'Caso especial 3_13' );
    return true;
  }
  if ( tags.includes( 'precio_curso_Santiago' ) && origen === 'formacion_santiago' ) {
    console.log( 'Caso especial 4_14' );
    return true;
  }
  if ( tags.includes( 'escenario_entrenable-sin_fechas-interés_usuario-lead_prioritario' ) ) {
    console.log( 'Caso especial 5_15' );
    return true;
  }
  if ( tags.includes( 'escenario_entrenable-inscripciones_cerradas-lead_urgente' ) ) {
    console.log( 'Caso especial 6_16' );
    return true;
  }
  if ( tags.includes( 'escenario_entrenable-post_inscripción' ) ) {
    console.log( 'Caso especial 7_17' );
    return true;
  }
  if ( tags.includes( 'contacto_humano' ) ) {
    console.log( 'Caso especial 1_20' );
    return true;
  }
  if ( tags.includes( 'asesor_activo' ) && origen === 'soporte_general' ) {
    console.log( 'Caso especial 2_21' );
    return true;
  }

  if ( tags.includes( 'hablar_con_humano' ) ) {
    console.log( 'Caso especial fallback 1' );
    return true;
  }
  if ( tags.includes( 'derivación_humana' ) ) {
    console.log( 'Caso especial fallback 2' );
    return true;
  }

};
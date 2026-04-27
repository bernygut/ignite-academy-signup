import { Box, Container, Divider, Link, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import PublicHeader from '../components/layout/PublicHeader'

function Section({ title, children }) {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" fontWeight={700} gutterBottom>
        {title}
      </Typography>
      {children}
    </Box>
  )
}

function P({ children, ...props }) {
  return (
    <Typography variant="body2" color="text.secondary" paragraph {...props}>
      {children}
    </Typography>
  )
}

export default function PrivacyPolicyPage() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <PublicHeader />
      <Container maxWidth="md" sx={{ py: 5 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Política de Privacidad
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Última actualización: abril de 2026
        </Typography>
        <P>
          La presente Política de Privacidad describe cómo Ignite Academy ("nosotros", "nuestro") recopila,
          utiliza, almacena y protege los datos personales que usted proporciona al momento de solicitar
          participar en nuestros programas de formación y certificación. Esta política se rige por la{' '}
          <strong>Ley N.° 8968 — Ley de Protección de la Persona frente al Tratamiento de sus Datos Personales</strong>{' '}
          de Costa Rica y su Reglamento (Decreto Ejecutivo N.° 37554-JP).
        </P>

        <Divider sx={{ my: 3 }} />

        <Section title="1. Responsable del Tratamiento">
          <P>
            <strong>Ignite Academy</strong><br />
            Costa Rica<br />
            Correo de contacto: <Link href="mailto:privacy@ignite-academy.org">privacy@ignite-academy.org</Link>
          </P>
          <P>
            Ignite Academy actúa como responsable del fichero ante la{' '}
            <strong>Agencia de Protección de Datos de los Habitantes (PRODHAB)</strong> conforme a los
            artículos 16 y 17 de la Ley N.° 8968.
          </P>
        </Section>

        <Section title="2. Datos Personales que Recopilamos">
          <P>En el proceso de solicitud recopilamos únicamente los datos necesarios para la gestión del programa:</P>
          <Box component="ul" sx={{ pl: 3, mb: 2 }}>
            {[
              'Nombre completo',
              'Correo electrónico de contacto',
              'Correo electrónico educativo (opcional)',
              'Edad',
              'Nombre de la organización o ONG (opcional)',
              'Grupo de Diversidad e Inclusión al que pertenece',
              'Programa de certificación de interés (AI-900, AZ-900, SC-900)',
            ].map((item) => (
              <Typography key={item} component="li" variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                {item}
              </Typography>
            ))}
          </Box>
          <P>
            No recopilamos datos sensibles según la definición del artículo 9 de la Ley N.° 8968 (tales como
            origen racial, creencias religiosas, estado de salud o preferencias sexuales) salvo la
            autoidentificación voluntaria con un grupo de diversidad e inclusión, la cual es provista
            libremente por el solicitante con fines de equidad y acceso.
          </P>
        </Section>

        <Section title="3. Finalidad del Tratamiento">
          <P>Los datos personales serán utilizados exclusivamente para:</P>
          <Box component="ul" sx={{ pl: 3, mb: 2 }}>
            {[
              'Gestionar la solicitud de participación en los programas de Ignite Academy.',
              'Comunicar el estado de la solicitud y coordinar la inscripción al curso correspondiente.',
              'Facilitar el proceso de matrícula y certificación ante el proveedor del programa (Microsoft).',
              'Enviar notificaciones relacionadas con el desarrollo del programa (horarios, materiales, evaluaciones).',
              'Generar estadísticas internas de diversidad e inclusión de forma agregada y anonimizada.',
            ].map((item) => (
              <Typography key={item} component="li" variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                {item}
              </Typography>
            ))}
          </Box>
          <P>
            <strong>Los datos no serán utilizados para ningún otro fin distinto a los indicados</strong>, ni
            serán cedidos, vendidos ni compartidos con terceros ajenos a la operación de Ignite Academy,
            salvo obligación legal expresa.
          </P>
        </Section>

        <Section title="4. Base Legal del Tratamiento">
          <P>
            El tratamiento de sus datos se fundamenta en el <strong>consentimiento libre, expreso e informado</strong>{' '}
            que usted otorga al marcar la casilla de aceptación al momento de enviar su solicitud, conforme al
            artículo 5 inciso a) de la Ley N.° 8968. Usted podrá revocar este consentimiento en cualquier
            momento, sin que ello afecte la licitud del tratamiento previo a la revocación.
          </P>
        </Section>

        <Section title="5. Comunicación de Datos a Terceros">
          <P>
            Para la gestión del programa de certificación, sus datos podrán ser compartidos con:
          </P>
          <Box component="ul" sx={{ pl: 3, mb: 2 }}>
            {[
              'Microsoft Corporation o sus socios autorizados de certificación, exclusivamente para los efectos de matrícula y evaluación.',
              'Instructores y coordinadores del programa, quienes están sujetos a obligaciones de confidencialidad.',
            ].map((item) => (
              <Typography key={item} component="li" variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                {item}
              </Typography>
            ))}
          </Box>
          <P>
            En ningún caso se realizarán transferencias internacionales de datos fuera del marco de la
            certificación Microsoft sin su consentimiento adicional.
          </P>
        </Section>

        <Section title="6. Plazo de Conservación">
          <P>
            Sus datos serán conservados durante el período necesario para cumplir con las finalidades descritas
            y por un plazo máximo de <strong>cinco (5) años</strong> contados a partir de la fecha de su
            solicitud, salvo que usted solicite su eliminación antes de dicho plazo o exista una obligación
            legal que requiera su conservación por un período mayor.
          </P>
        </Section>

        <Section title="7. Medidas de Seguridad">
          <P>
            Ignite Academy aplica medidas técnicas y organizativas adecuadas para proteger sus datos personales
            contra el acceso no autorizado, alteración, divulgación o destrucción. Los datos se almacenan en
            una base de datos segura con control de acceso basado en roles, cifrado en tránsito (TLS) y en
            reposo, y acceso restringido únicamente al personal autorizado del programa.
          </P>
        </Section>

        <Section title="8. Sus Derechos (Derechos ARCOP)">
          <P>
            De conformidad con los artículos 6 y 7 de la Ley N.° 8968, usted tiene derecho a:
          </P>
          <Box component="ul" sx={{ pl: 3, mb: 2 }}>
            {[
              'Acceso: Conocer qué datos personales suyos están siendo tratados.',
              'Rectificación: Solicitar la corrección de datos inexactos o incompletos.',
              'Cancelación (Supresión): Solicitar la eliminación de sus datos cuando ya no sean necesarios para los fines para los que fueron recabados.',
              'Oposición: Oponerse al tratamiento de sus datos en determinadas circunstancias.',
              'Portabilidad: Recibir sus datos en un formato estructurado y de uso común.',
            ].map((item) => (
              <Typography key={item} component="li" variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                {item}
              </Typography>
            ))}
          </Box>
          <P>
            Para ejercer cualquiera de estos derechos, puede contactarnos en{' '}
            <Link href="mailto:privacy@ignite-academy.org">privacy@ignite-academy.org</Link>. Daremos
            respuesta a su solicitud en un plazo máximo de <strong>cinco (5) días hábiles</strong>, conforme
            al artículo 7 de la Ley N.° 8968.
          </P>
          <P>
            Si considera que sus derechos no han sido atendidos, puede presentar una reclamación ante la{' '}
            <strong>Agencia de Protección de Datos de los Habitantes (PRODHAB)</strong>, órgano supervisor
            competente en Costa Rica.
          </P>
        </Section>

        <Section title="9. Uso de Cookies y Tecnologías de Seguimiento">
          <P>
            Este sitio web no utiliza cookies de rastreo ni tecnologías de seguimiento de terceros. El
            funcionamiento del formulario de solicitud no requiere el almacenamiento de información de
            navegación en su dispositivo más allá de lo estrictamente necesario para la sesión.
          </P>
        </Section>

        <Section title="10. Cambios a esta Política">
          <P>
            Ignite Academy se reserva el derecho de actualizar esta Política de Privacidad cuando sea
            necesario. Cualquier cambio sustancial será comunicado a través del sitio web con al menos
            quince (15) días de anticipación a su entrada en vigor.
          </P>
        </Section>

        <Divider sx={{ my: 3 }} />

        <P>
          Si tiene alguna consulta sobre esta Política de Privacidad, contáctenos en{' '}
          <Link href="mailto:privacy@ignite-academy.org">privacy@ignite-academy.org</Link>.
        </P>

        <Box sx={{ mt: 3 }}>
          <Link component={RouterLink} to="/" variant="body2">
            ← Volver al formulario de solicitud
          </Link>
        </Box>
      </Container>
    </Box>
  )
}

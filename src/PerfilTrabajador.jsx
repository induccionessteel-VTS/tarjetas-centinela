import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';

function PerfilTrabajador() {
  const { rut } = useParams();
  const [cursos, setCursos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        // 1. Intenta descargar la base de datos de Dropbox
        const respuesta = await fetch('https://dl.dropboxusercontent.com/scl/fi/k4pcikhb2t9kvogzypzhq/trabajadores.json?rlkey=f8k02a04i0n2blrx3qonv5rsc&st=z666jrvc');
        const bd = await respuesta.json();
        
        // 2. Guarda la copia de seguridad
        localStorage.setItem('bd_trabajadores', JSON.stringify(bd));
        
        // 3. Filtra usando el RUT
        const misCursos = bd.filter(curso => curso.Identificador && curso.Identificador.includes(rut));
        setCursos(misCursos);
        setCargando(false);
        
      } catch (error) {
        console.error("Sin internet: Usando base de datos offline");
        // 4. Si no hay internet, lee la memoria local
        const bdTexto = localStorage.getItem('bd_trabajadores');
        if (bdTexto) {
          const bd = JSON.parse(bdTexto);
          const misCursos = bd.filter(curso => curso.Identificador && curso.Identificador.includes(rut));
          setCursos(misCursos);
        }
        setCargando(false);
      }
    };

    cargarDatos();
  }, [rut]);

  const handleVerCertificado = (url_pdf) => {
    if (navigator.onLine) {
      window.open(url_pdf, '_blank');
    } else {
      alert("Sin conexión: El certificado físico no se puede descargar en faena, pero la competencia está validada y vigente en el sistema.");
    }
  };

  if (cargando) {
    return (
      <div style={{ backgroundColor: '#f2f2f2', minHeight: '100vh', padding: '20px', fontFamily: 'sans-serif', color: '#333333' }}>
        <h2>Sincronizando base de datos STEEL...</h2>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#f2f2f2', minHeight: '100vh', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '8px', borderTop: '5px solid #FF6600', color: '#333333' }}>
        <h1 style={{ color: '#000000', margin: '0 0 10px 0' }}>Ficha del Trabajador</h1>
        <p style={{ fontSize: '18px', color: '#666666' }}>
          RUT: <strong style={{ color: '#FF6600' }}>{rut}</strong>
        </p>
        <hr style={{ border: '1px solid #e6e6e6', margin: '20px 0' }} />

        <h3 style={{ color: '#333333' }}>Cursos Aprobados ({cursos.length})</h3>
        
        {cursos.length === 0 ? (
          <p style={{ color: '#000000', fontWeight: 'bold' }}>No se encontraron cursos vigentes para este trabajador.</p>
        ) : (
          cursos.map((curso, index) => (
            <div key={index} style={{ backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '5px', marginBottom: '10px', borderLeft: '4px solid #333333' }}>
              <h4 style={{ margin: '0 0 5px 0', color: '#000000' }}>{curso.NombreCurso}</h4>
              <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666666' }}>
                Vencimiento: {curso.FechaVencimiento.substring(0, 2)}/{curso.FechaVencimiento.substring(2, 4)}/{curso.FechaVencimiento.substring(4)}
              </p>
              <button 
                onClick={() => handleVerCertificado(curso.Enlace)}
                style={{ backgroundColor: '#FF6600', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Ver Certificado
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default PerfilTrabajador;
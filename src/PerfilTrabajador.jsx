import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';

function PerfilTrabajador() {
  const { rut } = useParams();
  const [cursos, setCursos] = useState([]);
  const [cursosCentinela, setCursosCentinela] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarCentinela, setMostrarCentinela] = useState(false);

  // Función para leer y transformar el archivo CSV descargado de Centinela
  const procesarCSV = (texto) => {
    const lineas = texto.split('\n');
    const resultado = [];
    for (let i = 1; i < lineas.length; i++) {
      const columnas = lineas[i].split(';');
      if (columnas.length >= 8) {
        resultado.push({
          rut: columnas[0].trim(),
          nombre: columnas[1].trim(),
          estado: columnas[2].trim(),
          renovacion: columnas[6].trim(),
          estadoVigencia: columnas[7].trim()
        });
      }
    }
    return resultado;
  };

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        // 1. Cargar datos de Cursos OTEC (JSON)
        const resJSON = await fetch('https://dl.dropboxusercontent.com/scl/fi/k4pcikhb2t9kvogzypzhq/trabajadores.json?rlkey=f8k02a04i0n2blrx3qonv5rsc&st=z666jrvc');
        const bdJSON = await resJSON.json();
        localStorage.setItem('bd_trabajadores', JSON.stringify(bdJSON));
       
        const trabajador = bdJSON.find(t => t.identificador && t.identificador.includes(rut));
        let misCursos = [];
        if (trabajador && trabajador.cursos && trabajador.cursos.length > 0) {
          misCursos = trabajador.cursos.flat();
        }
        setCursos(misCursos);

        // 2. Cargar datos de Campus Centinela (CSV desde Dropbox)
        const linkCSV = 'https://www.dropbox.com/scl/fi/k4pcikhb2t9kvogzypzhq/trabajadores.json?rlkey=f8k02a04i0n2blrx3qonv5rsc&st=1t4ec9lf&dl=0';
       
        if (linkCSV !== 'https://www.dropbox.com/scl/fi/k4pcikhb2t9kvogzypzhq/trabajadores.json?rlkey=f8k02a04i0n2blrx3qonv5rsc&st=1t4ec9lf&dl=0') {
            const resCSV = await fetch(linkCSV);
            const textoCSV = await resCSV.text();
            localStorage.setItem('bd_centinela', textoCSV);
           
            const todosCentinela = procesarCSV(textoCSV);
            const misCursosCentinela = todosCentinela.filter(c => c.rut === rut);
            setCursosCentinela(misCursosCentinela);
        }
       
        setCargando(false);
       
      } catch (error) {
        console.error("Sin internet: Usando bases de datos offline");
       
        const bdTexto = localStorage.getItem('bd_trabajadores');
        if (bdTexto) {
          const bdJSON = JSON.parse(bdTexto);
          const trabajador = bdJSON.find(t => t.identificador && t.identificador.includes(rut));
          if (trabajador && trabajador.cursos) setCursos(trabajador.cursos.flat());
        }
       
        const csvTexto = localStorage.getItem('bd_centinela');
        if (csvTexto) {
          const todosCentinela = procesarCSV(csvTexto);
          setCursosCentinela(todosCentinela.filter(c => c.rut === rut));
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
      alert("Sin conexión: El certificado físico no se puede descargar en faena, pero la competencia está validada en el sistema.");
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

        <h3 style={{ color: '#333333' }}>Cursos OTEC ({cursos.length})</h3>
        {cursos.length === 0 ? (
          <p style={{ color: '#000000', fontWeight: 'bold' }}>No se encontraron cursos OTEC vigentes.</p>
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

        <hr style={{ border: '1px solid #e6e6e6', margin: '20px 0' }} />

        <h3 style={{ color: '#333333' }}>Cursos Campus Centinela ({cursosCentinela.length})</h3>
       
        <button
          onClick={() => setMostrarCentinela(!mostrarCentinela)}
          style={{ backgroundColor: '#333333', color: '#ffffff', border: 'none', padding: '10px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', width: '100%', marginBottom: '15px' }}
        >
          {mostrarCentinela ? 'Ocultar Cursos' : 'Ver Cursos Centinela'}
        </button>

        {mostrarCentinela && (
          cursosCentinela.length === 0 ? (
            <p style={{ color: '#000000', fontWeight: 'bold' }}>No registra cursos en Campus Centinela.</p>
          ) : (
            cursosCentinela.map((curso, index) => (
              <div key={index} style={{ backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '5px', marginBottom: '10px', borderLeft: '4px solid #FF6600' }}>
                <h4 style={{ margin: '0 0 5px 0', color: '#000000' }}>{curso.nombre}</h4>
                <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#666666' }}>Estado: <strong>{curso.estado}</strong></p>
                <p style={{ margin: '0', fontSize: '14px', color: '#666666' }}>Vigencia: <strong>{curso.estadoVigencia}</strong> ({curso.renovacion})</p>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
}

export default PerfilTrabajador;

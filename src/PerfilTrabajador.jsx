import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';

function PerfilTrabajador() {
  const { rut } = useParams();
  const [cursos, setCursos] = useState([]);
  const [cursosCentinela, setCursosCentinela] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarCentinela, setMostrarCentinela] = useState(false);
  const [diagnostico, setDiagnostico] = useState("");

  const procesarCSV = (texto, rutBuscado) => {
    if (texto.includes("<!DOCTYPE html>") || texto.includes("<html")) {
      setDiagnostico("❌ ERROR: El enlace de Dropbox está abriendo una página web. Debes asegurarte de que empiece con dl.dropboxusercontent.com y no con www.dropbox.com");
      return [];
    }

    const separador = texto.includes(";") ? ";" : ",";
    const lineas = texto.split('\n');
    const resultado = [];
    const rutLimpioBuscado = rutBuscado.trim().replace(/[^0-9kK]/g, '').toLowerCase();

    for (let i = 1; i < lineas.length; i++) {
      const linea = lineas[i].trim();
      if (!linea) continue;
      
      const columnas = linea.split(separador);
      if (columnas.length >= 7) {
        const rutCrudo = columnas[0].trim().replace(/^\ufeff/, '');
        const rutFilaLimpio = rutCrudo.replace(/[^0-9kK]/g, '').toLowerCase();

        if (rutFilaLimpio === rutLimpioBuscado || rutCrudo.includes(rutBuscado)) {
          resultado.push({
            nombre: columnas[1] ? columnas[1].trim() : 'Sin nombre',
            estado: columnas[2] ? columnas[2].trim() : 'Sin estado',
            renovacion: columnas[6] ? columnas[6].trim() : 'N/A',
            estadoVigencia: columnas[7] ? columnas[7].trim() : 'N/A'
          });
        }
      }
    }

    if (resultado.length === 0) {
      setDiagnostico(`⚠️ LECTURA EXITOSA: El CSV tiene ${lineas.length} filas y usa separador "${separador}", pero no encontró ninguna coincidencia para el RUT ${rutBuscado}.`);
    } else {
      setDiagnostico(""); 
    }

    return resultado;
  };

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        // Cargar OTEC
        const resJSON = await fetch('https://dl.dropboxusercontent.com/scl/fi/k4pcikhb2t9kvogzypzhq/trabajadores.json?rlkey=f8k02a04i0n2blrx3qonv5rsc&st=z666jrvc');
        const bdJSON = await resJSON.json();
        localStorage.setItem('bd_trabajadores', JSON.stringify(bdJSON));
        
        const trabajador = bdJSON.find(t => t.identificador && t.identificador.includes(rut));
        if (trabajador && trabajador.cursos) setCursos(trabajador.cursos.flat());

        // Cargar Centinela
        const linkCSV = 'https://dl.dropboxusercontent.com/scl/fi/vm12c2l30i2ics3jhorlq/cursos_centinela_fijo.csv?rlkey=al72qquv2n5c2jgt201kpml5i&st=919wgnpz';
        
        try {
            const resCSV = await fetch(linkCSV);
            if (!resCSV.ok) throw new Error("Error HTTP al descargar CSV");
            
            const textoCSV = await resCSV.text();
            localStorage.setItem('bd_centinela', textoCSV);
            const misCursosCentinela = procesarCSV(textoCSV, rut);
            setCursosCentinela(misCursosCentinela);
        } catch (error) {
            setDiagnostico("❌ ERROR DE CONEXIÓN: No se pudo descargar el archivo de Dropbox. Revisa que el enlace contenga el '?rlkey=...' correcto.");
        }
        
      } catch (error) {
        setDiagnostico("❌ ERROR DE CONEXIÓN OTEC: " + error.message);
        
        // Intento offline OTEC
        const bdTexto = localStorage.getItem('bd_trabajadores');
        if (bdTexto) {
          const bdJSON = JSON.parse(bdTexto);
          const rutLimpioBuscado = rut.trim().replace(/[^0-9kK]/g, '').toLowerCase();
          
          const trabajadoresMatch = bdJSON.filter(t => {
            if (!t.identificador) return false;
            const rutJsonLimpio = String(t.identificador).replace(/[^0-9kK]/g, '').toLowerCase();
            return rutJsonLimpio === rutLimpioBuscado || t.identificador.includes(rut);
          });
          
          let misCursosOtec = [];
          trabajadoresMatch.forEach(t => { 
            if (t.cursos && t.cursos.length > 0) {
              misCursosOtec = misCursosOtec.concat(t.cursos.flat());
            }
          });
          setCursos(misCursosOtec);
        }
        
        // Intento offline Centinela
        const csvTexto = localStorage.getItem('bd_centinela');
        if (csvTexto) setCursosCentinela(procesarCSV(csvTexto, rut));
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, [rut]);

  // Manejador para abrir el certificado en modo online y avisar en offline
  const handleVerCertificado = (url_pdf) => {
    if (navigator.onLine) {
      window.open(url_pdf, '_blank');
    } else {
      alert("Sin conexión: El certificado físico no se puede descargar en faena, pero la competencia está validada en el sistema.");
    }
  };

  if (cargando) return <div style={{ padding: '20px' }}><h2>Sincronizando base de datos STEEL...</h2></div>;

  return (
    <div style={{ backgroundColor: '#f2f2f2', minHeight: '100vh', padding: '20px', fontFamily: 'sans-serif' }}>
      
      {diagnostico && (
        <div style={{ backgroundColor: '#ffe6e6', border: '2px solid red', padding: '15px', borderRadius: '8px', marginBottom: '20px', color: '#cc0000', fontWeight: 'bold' }}>
          {diagnostico}
        </div>
      )}

      <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '8px', borderTop: '5px solid #FF6600', color: '#333333' }}>
        <h1 style={{ color: '#000000', margin: '0 0 10px 0' }}>Ficha del Trabajador</h1>
        <p style={{ fontSize: '18px', color: '#666666' }}>RUT: <strong style={{ color: '#FF6600' }}>{rut}</strong></p>
        <hr style={{ border: '1px solid #e6e6e6', margin: '20px 0' }} />

        <h3 style={{ color: '#333333' }}>Cursos OTEC ({cursos.length})</h3>
        {cursos.length === 0 ? (
          <p>No se encontraron cursos OTEC.</p>
        ) : (
          cursos.map((c, i) => (
            <div key={i} style={{ backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '5px', marginBottom: '10px', borderLeft: '4px solid #333333' }}>
              <h4 style={{ margin: '0 0 5px 0' }}>{c.NombreCurso}</h4>
              <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666666' }}>
                Vencimiento: {c.FechaVencimiento ? `${c.FechaVencimiento.substring(0, 2)}/${c.FechaVencimiento.substring(2, 4)}/${c.FechaVencimiento.substring(4)}` : 'N/A'}
              </p>
              <button 
                onClick={() => handleVerCertificado(c.Enlace)}
                style={{ backgroundColor: '#FF6600', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Ver Certificado
              </button>
            </div>
          ))
        )}

        <hr style={{ border: '1px solid #e6e6e6', margin: '20px 0' }} />

        <h3 style={{ color: '#333333' }}>Cursos Campus Centinela ({cursosCentinela.length})</h3>
        <button onClick={() => setMostrarCentinela(!mostrarCentinela)} style={{ backgroundColor: '#333333', color: '#ffffff', border: 'none', padding: '10px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', width: '100%', marginBottom: '15px' }}>
          {mostrarCentinela ? 'Ocultar Cursos' : 'Ver Cursos Centinela'}
        </button>

        {mostrarCentinela && (
          cursosCentinela.length === 0 ? <p>No registra cursos en Campus Centinela.</p> : cursosCentinela.map((c, i) => (
            <div key={i} style={{ backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '5px', marginBottom: '10px', borderLeft: '4px solid #FF6600' }}>
              <h4 style={{ margin: '0 0 5px 0' }}>{c.nombre}</h4>
              <p style={{ margin: '0 0 5px 0', fontSize: '14px' }}>Estado: <strong>{c.estado}</strong></p>
              <p style={{ margin: '0', fontSize: '14px' }}>Vigencia: <strong>{c.estadoVigencia}</strong> ({c.renovacion})</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default PerfilTrabajador;

import { AndroidPermissions } from '@awesome-cordova-plugins/android-permissions';

/**
 * Codifica texto simple a CP437 (compatible impresoras térmicas).
 * (Opcional: puedes omitirlo si el plugin acepta texto plano)
 */
const encodeCP437 = (str) => {
  const replacements = {
    'á': 0xA0, 'é': 0x82, 'í': 0xA1, 'ó': 0xA2, 'ú': 0xA3,
    'Á': 0xB5, 'É': 0x90, 'Í': 0xD6, 'Ó': 0xE0, 'Ú': 0xE9,
    'ñ': 0xA4, 'Ñ': 0xA5, 'ü': 0x81, 'Ü': 0x9A, '°': 0xF8,
  };
  let result = '';
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (c.charCodeAt(0) < 128) {
      result += c;
    } else if (replacements[c]) {
      result += String.fromCharCode(replacements[c]);
    } else {
      result += '?';
    }
  }
  return result;
};

const permisosBluetooth = [
  AndroidPermissions.PERMISSION.BLUETOOTH_CONNECT,
  AndroidPermissions.PERMISSION.BLUETOOTH_SCAN,
  AndroidPermissions.PERMISSION.ACCESS_FINE_LOCATION,
];

/**
 * Imprime la comanda con cordova-plugin-bluetooth-print.
 * Usa window.bluetoothPrint.print()
 */
export const imprimirComandaBluetooth = async (comanda) => {
  try {
    // 1. Pedir permisos Android
    for (const permiso of permisosBluetooth) {
      const res = await AndroidPermissions.checkPermission(permiso);
      if (!res.hasPermission) {
        const rq = await AndroidPermissions.requestPermission(permiso);
        if (!rq.hasPermission) {
          alert(`❌ Permiso denegado: ${permiso}`);
          return;
        }
      }
    }

    // 2. Preparar texto (opcional: codificar con encodeCP437)
    const textoPlano =
      '*** COMANDA ***\n' +
      `Mesa: ${comanda.mesa?.nombre || comanda.mesa}\n` +
      `Mesero: ${comanda.mesero?.nombre || '---'}\n` +
      '-----------------------\n' +
      comanda.platos.map(p => `${p.cantidad} x ${p.nombre}`).join('\n') + '\n' +
      `Notas: ${comanda.notas || 'Ninguna'}\n` +
      '-----------------------\n\n\n';

    const textoImprimir = encodeCP437(textoPlano); // Opcional: si falla, prueba textoPlano directo

    // 3. Verificar plugin disponible
    if (!window.bluetoothPrint) {
      alert("❌ Plugin bluetoothPrint no está disponible");
      return;
    }

    // 4. Buscar dispositivo emparejado (no requiere listar dispositivos, el plugin usa impresora ya emparejada)
    // El plugin se conecta automáticamente a la impresora emparejada y configura conexión.

    // 5. Imprimir (callback éxito y error)
    await new Promise((resolve, reject) => {
      window.bluetoothPrint.print(
        textoImprimir,
        () => {
          alert('✅ Comanda impresa correctamente');
          resolve();
        },
        (err) => {
          alert('❌ Error en impresión: ' + err);
          reject(err);
        }
      );
    });

  } catch (error) {
    alert("❌ Error inesperado en impresión: " + (error.message || error));
    console.error(error);
  }
};

/**
 * Prueba rápida para imprimir texto simple.
 */
export const pruebaImpresionSimple = async () => {
  try {
    for (const permiso of permisosBluetooth) {
      const res = await AndroidPermissions.checkPermission(permiso);
      if (!res.hasPermission) {
        const rq = await AndroidPermissions.requestPermission(permiso);
        if (!rq.hasPermission) {
          alert(`❌ Permiso denegado: ${permiso}`);
          return;
        }
      }
    }

    if (!window.bluetoothPrint) {
      alert("❌ Plugin bluetoothPrint no está disponible");
      return;
    }

    await new Promise((resolve, reject) => {
      window.bluetoothPrint.print(
        "Prueba impresión BT-581\n\n\n",
        () => {
          alert('✅ Prueba de impresión exitosa');
          resolve();
        },
        (err) => {
          alert('❌ Error en prueba de impresión: ' + err);
          reject(err);
        }
      );
    });

  } catch (error) {
    alert("❌ Error inesperado en prueba: " + (error.message || error));
    console.error(error);
  }
};

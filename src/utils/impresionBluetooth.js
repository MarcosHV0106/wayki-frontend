export async function imprimirComandaBluetooth(texto) {
  try {
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ namePrefix: "BT" }], // o usa "BT-581"
      optionalServices: [0x1101] // servicio serial (puede variar según modelo)
    });

    const server = await device.gatt.connect();
    const service = await server.getPrimaryService(0x1101);
    const characteristic = await service.getCharacteristic(0x2A00); // verificar qué characteristic usar

    const encoder = new TextEncoder("utf-8");
    const data = encoder.encode(texto);

    await characteristic.writeValue(data);

    alert("✅ Comanda enviada a la impresora");
  } catch (error) {
    console.error("❌ Error al imprimir:", error);
    alert("⚠️ No se pudo imprimir la comanda");
  }
}

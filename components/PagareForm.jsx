"use client";

import React, { useState } from "react";
import { generarPagarePDF } from "../lib/pagarePdf";

export default function PagareForm() {
  const [data, setData] = useState({
    buenoPor: 100000,
    moneda: "USD",
    vencimientoTipo: "A_LA_VISTA",
    vencimientoFecha: "2026-12-31",
    suscriptorNombre: "ALFREDO VALENZUELA ORDUNO",
    suscriptorDomicilio: "Belisario Dominguez 135 Sur, Edificio B Planta Alta, Colonia Centro, C.P. 81200, Los Mochis, Ahome, Sinaloa.",
    beneficiarioNombre: "LOGISTICA, PRESTACION Y ADMINISTRACION DE SERVICIOS LAMONT, S.A. DE C.V.",
    lugarPagoCiudadEstado: "la Ciudad de Guadalajara, Jalisco",
    lugarSuscripcion: "la ciudad de Guadalajara, Jalisco",
    fechaSuscripcion: "2026-01-25",
    tasaOrdinariaTexto: "a una tasa anual variable que se obtenga de sumar 3 puntos a la tasa anual variable de SOFR (secured overnight financing rate)",
    tasaMoratoriaTexto: "a una tasa anual que resulte de multiplicar por 2 la tasa de interes ordinaria",
    jurisdiccionTexto: "la jurisdiccion de los Tribunales Competentes del Primer Partido Judicial del Estado con sede en Zapopan, o a los del Decimo Cuarto Partido Judicial con residencia en Zapotlan el Grande, ambos en el estado de Jalisco, renunciando a cualquier otro fuero",
  });

  const onChange = (e) => {
    const { name, value } = e.target;
    setData((p) => ({ ...p, [name]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!data.suscriptorNombre || !data.beneficiarioNombre) return alert("Falta suscriptor o beneficiario.");
    if (!data.buenoPor || Number(data.buenoPor) <= 0) return alert("Monto invalido.");
    if (data.vencimientoTipo === "FECHA" && !data.vencimientoFecha) return alert("Falta fecha de vencimiento.");
    if (!data.fechaSuscripcion) return alert("Falta fecha de suscripcion.");
    await generarPagarePDF({ ...data, buenoPor: Number(data.buenoPor) });
  };

  return (
    <form onSubmit={submit}>
      <h1>Pagare a PDF</h1>
      <p className="helper">Llena el formulario y genera el PDF con formato tipo pagare.</p>

      <label>Monto
        <input name="buenoPor" type="number" step="0.01" value={data.buenoPor} onChange={onChange} />
      </label>

      <label>Moneda
        <select name="moneda" value={data.moneda} onChange={onChange}>
          <option value="USD">USD</option>
          <option value="MXN">MXN</option>
        </select>
      </label>

      <label>Vencimiento
        <select name="vencimientoTipo" value={data.vencimientoTipo} onChange={onChange}>
          <option value="A_LA_VISTA">A la vista</option>
          <option value="FECHA">Fecha</option>
        </select>
      </label>

      {data.vencimientoTipo === "FECHA" && (
        <label>Fecha vencimiento
          <input name="vencimientoFecha" type="date" value={data.vencimientoFecha} onChange={onChange} />
        </label>
      )}

      <label>Suscriptor (deudor)
        <input name="suscriptorNombre" value={data.suscriptorNombre} onChange={onChange} />
      </label>

      <label>Domicilio del suscriptor
        <textarea name="suscriptorDomicilio" value={data.suscriptorDomicilio} onChange={onChange} rows={3} />
      </label>

      <label>Beneficiario (acreedor)
        <input name="beneficiarioNombre" value={data.beneficiarioNombre} onChange={onChange} />
      </label>

      <label>Lugar de pago
        <input name="lugarPagoCiudadEstado" value={data.lugarPagoCiudadEstado} onChange={onChange} />
      </label>

      <label>Lugar de suscripcion
        <input name="lugarSuscripcion" value={data.lugarSuscripcion} onChange={onChange} />
      </label>

      <label>Fecha de suscripcion
        <input name="fechaSuscripcion" type="date" value={data.fechaSuscripcion} onChange={onChange} />
      </label>

      <label>Interes ordinario (texto)
        <textarea name="tasaOrdinariaTexto" value={data.tasaOrdinariaTexto} onChange={onChange} rows={2} />
      </label>

      <label>Interes moratorio (texto)
        <textarea name="tasaMoratoriaTexto" value={data.tasaMoratoriaTexto} onChange={onChange} rows={2} />
      </label>

      <label>Jurisdiccion
        <textarea name="jurisdiccionTexto" value={data.jurisdiccionTexto} onChange={onChange} rows={3} />
      </label>

      <button type="submit">Generar PDF</button>
    </form>
  );
}

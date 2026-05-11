import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  consultarDeudas,
  consultarChequesRechazados,
  normalizarDeudas,
  normalizarCheques
} from "@/lib/bcra";
import { normalizeCuil, validateCuil, formatCuil, computeCuilFromDni } from "@/lib/cuil";

export const dynamic = "force-dynamic";

// Extrae CUIL o DNI de una imagen usando Claude vision.
async function extraerCuilDeImagen(imagenBase64, mimeType) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY no configurada. Ingresa el CUIL manualmente.");
  }

  const anthropic = new Anthropic({ apiKey });

  const result = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mimeType || "image/jpeg",
              data: imagenBase64
            }
          },
          {
            type: "text",
            text: `Analiza este documento argentino. Extraé el CUIL/CUIT (11 dígitos, formato XX-XXXXXXXX-X) si está visible, o el número de DNI (7-8 dígitos) si el CUIL no aparece.
Devolvé ÚNICAMENTE un JSON válido sin texto adicional:
{"cuil": "11 dígitos sin guiones o null", "dni": "7-8 dígitos sin puntos o null", "nombre": "nombre completo en mayusculas o null"}
Si no encontrás ningún número, devolvé: {"cuil": null, "dni": null, "nombre": null}`
          }
        ]
      }
    ]
  });

  const text = result.content[0]?.text?.trim() || "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No se pudo interpretar la respuesta del modelo.");

  return JSON.parse(jsonMatch[0]);
}

export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Cuerpo JSON invalido." }, { status: 400 });
    }

    let cuil = null;
    let denominacion = null;
    let fuenteCuil = "manual";
    let cuilesAConsultar = [];

    if (body.imagen) {
      // Modo foto: extraer CUIL/DNI con Claude vision
      let extraido;
      try {
        extraido = await extraerCuilDeImagen(body.imagen, body.mimeType);
      } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 422 });
      }

      denominacion = extraido.nombre;

      if (extraido.cuil) {
        const cuilNorm = normalizeCuil(extraido.cuil);
        if (!validateCuil(cuilNorm)) {
          return NextResponse.json(
            { error: `El modelo extrajo "${extraido.cuil}" pero no es un CUIL valido. Ingresalo manualmente.` },
            { status: 422 }
          );
        }
        cuil = cuilNorm;
        fuenteCuil = "foto";
        cuilesAConsultar = [{ cuil, etiqueta: null }];
      } else if (extraido.dni) {
        const dni = String(extraido.dni).replace(/\D/g, "");
        const cuilMasc = computeCuilFromDni(dni, "20");
        const cuilFem = computeCuilFromDni(dni, "27");
        fuenteCuil = "foto-dni";
        cuilesAConsultar = [
          { cuil: cuilMasc, etiqueta: "Masculino" },
          { cuil: cuilFem, etiqueta: "Femenino" }
        ];
      } else {
        return NextResponse.json(
          {
            error:
              "No se encontro CUIL ni DNI en la imagen. Asegurate de que el documento sea legible e intenta de nuevo, o ingresá el CUIL manualmente."
          },
          { status: 422 }
        );
      }
    } else if (body.cuil) {
      cuil = normalizeCuil(body.cuil);
      if (!validateCuil(cuil)) {
        return NextResponse.json({ error: "CUIL invalido. Debe tener 11 digitos y ser correcto." }, { status: 400 });
      }
      cuilesAConsultar = [{ cuil, etiqueta: null }];
    } else {
      return NextResponse.json({ error: "Falta el campo cuil o imagen." }, { status: 400 });
    }

    // Consultar BCRA para cada CUIL candidato
    const resultados = await Promise.all(
      cuilesAConsultar.map(async ({ cuil: c, etiqueta }) => {
        const [rawDeudas, rawCheques] = await Promise.allSettled([
          consultarDeudas(c),
          consultarChequesRechazados(c)
        ]);

        const deudas = normalizarDeudas(
          rawDeudas.status === "fulfilled" ? rawDeudas.value : { error: rawDeudas.reason?.message }
        );
        const cheques = normalizarCheques(
          rawCheques.status === "fulfilled" ? rawCheques.value : { error: rawCheques.reason?.message }
        );

        const nombreBcra = deudas.denominacion || cheques.denominacion || null;

        return { cuil: c, etiqueta, deudas, cheques, denominacionBcra: nombreBcra };
      })
    );

    // Si buscamos por DNI, quedarse con el que tenga datos (o el masculino por defecto)
    let resultado;
    if (cuilesAConsultar.length > 1) {
      resultado =
        resultados.find((r) => r.deudas.tieneDeudas || r.cheques.tieneRechazos || r.denominacionBcra) ||
        resultados[0];
    } else {
      resultado = resultados[0];
    }

    const nombreFinal = denominacion || resultado.denominacionBcra || null;

    return NextResponse.json({
      cuil: resultado.cuil,
      cuilFormateado: formatCuil(resultado.cuil),
      denominacion: nombreFinal,
      fuenteCuil,
      deudas: resultado.deudas,
      cheques: resultado.cheques
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al consultar el BCRA." },
      { status: 500 }
    );
  }
}

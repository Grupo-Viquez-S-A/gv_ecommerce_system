declare const Deno: {
  env: { get(key: string): string | undefined };
  connectTls(options: { hostname: string; port: number }): Promise<{
    read(buffer: Uint8Array): Promise<number | null>;
    write(buffer: Uint8Array): Promise<number>;
    close(): void;
  }>;
};

export function getSmtpConfig(secretPrefix = "SMTP") {
  const scopedSecret = (name: string) =>
    Deno.env.get(`${secretPrefix}_${name}`) || Deno.env.get(`SMTP_${name}`) || "";
  const host = scopedSecret("HOST");
  const port = Number(scopedSecret("PORT") || "465");
  const username = scopedSecret("USERNAME");
  const password = scopedSecret("PASSWORD");
  const fromEmail = scopedSecret("FROM_EMAIL") ||
    scopedSecret("SENDER_EMAIL") || username;
  const fromName = scopedSecret("FROM_NAME") ||
    scopedSecret("SENDER_NAME") || "Grupo Viquez S.A";
  return { host, port, username, password, fromEmail, fromName };
}

export function isSmtpConfigured(config: ReturnType<typeof getSmtpConfig>) {
  return Boolean(config.host && config.port && config.username &&
    config.password && config.fromEmail);
}

export function encodeBase64(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function encodeHeader(value: string) {
  return `=?UTF-8?B?${encodeBase64(value)}?=`;
}

function assertMailbox(value: string, field: string) {
  const normalized = value.trim();
  if (
    !normalized ||
    normalized.length > 254 ||
    /[\r\n<>]/.test(normalized) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)
  ) {
    throw new Error(`${field} no es una direccion de correo valida.`);
  }
  return normalized;
}

function assertHeaderText(value: string, field: string) {
  const normalized = value.trim();
  if (!normalized || normalized.length > 200 || /[\r\n]/.test(normalized)) {
    throw new Error(`${field} contiene caracteres no permitidos.`);
  }
  return normalized;
}

function normalizeSmtpBody(value: string) {
  return value.replace(/\r?\n/g, "\r\n").split("\r\n")
    .map((line) => line.startsWith(".") ? `.${line}` : line).join("\r\n");
}

function assertAttachmentFilename(value: string) {
  const normalized = value.trim();
  if (
    !normalized ||
    normalized.length > 160 ||
    /[\r\n"\\/]/.test(normalized)
  ) {
    throw new Error("El nombre del archivo adjunto no es valido.");
  }
  return normalized;
}

function wrapBase64(value: string) {
  const normalized = value.replace(/\s+/g, "");
  if (!normalized || !/^[A-Za-z0-9+/]+={0,2}$/.test(normalized)) {
    throw new Error("El contenido del archivo adjunto no es Base64 valido.");
  }
  return normalized.match(/.{1,76}/g)?.join("\r\n") || "";
}

const SMTP_OPERATION_TIMEOUT_MS = 20_000;

async function withSmtpTimeout<T>(
  operation: Promise<T>,
  stage: string,
): Promise<T> {
  let timeoutId: number | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error(`SMTP_TIMEOUT:${stage}`)),
      SMTP_OPERATION_TIMEOUT_MS,
    );
  });

  try {
    return await Promise.race([operation, timeout]);
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  }
}

async function writeAll(
  connection: { write(buffer: Uint8Array): Promise<number> },
  bytes: Uint8Array,
) {
  let offset = 0;

  while (offset < bytes.length) {
    const written = await withSmtpTimeout(
      connection.write(bytes.subarray(offset)),
      "write",
    );

    if (!Number.isInteger(written) || written <= 0) {
      throw new Error("SMTP_WRITE_FAILED");
    }

    offset += written;
  }
}

async function sendSmtpCommand(
  connection: {
    read(buffer: Uint8Array): Promise<number | null>;
    write(buffer: Uint8Array): Promise<number>;
  },
  bufferState: { value: string },
  command: string | null,
  expectedCodes: number[],
) {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  if (command !== null) {
    await writeAll(connection, encoder.encode(`${command}\r\n`));
  }

  while (true) {
    const match = bufferState.value.match(/(?:^|\r\n)(\d{3}) [^\r\n]*(?:\r\n|$)/);
    if (match) {
      const responseEnd = match.index
        ? match.index + match[0].length
        : match[0].length;
      const response = bufferState.value.slice(0, responseEnd).trim();
      bufferState.value = bufferState.value.slice(responseEnd);
      const statusCode = Number(match[1]);
      if (!expectedCodes.includes(statusCode)) {
        throw new Error(`SMTP respondio ${statusCode}: ${response}`);
      }
      return response;
    }

    const chunk = new Uint8Array(4096);
    const bytesRead = await withSmtpTimeout(
      connection.read(chunk),
      "read",
    );
    if (bytesRead === null) {
      throw new Error("La conexion SMTP se cerro inesperadamente.");
    }
    bufferState.value += decoder.decode(chunk.subarray(0, bytesRead));
  }
}

export async function sendSmtpMail({
  host, port, username, password, fromEmail, fromName, to, subject, text, html,
  attachments = [],
}: {
  host: string;
  port: number;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  attachments?: Array<{
    filename: string;
    contentType: string;
    contentBase64: string;
  }>;
}) {
  if (port !== 465) {
    throw new Error("Esta funcion SMTP usa TLS directo. Configura SMTP_PORT=465.");
  }

  const safeFromEmail = assertMailbox(fromEmail, "El remitente");
  const safeTo = assertMailbox(to, "El destinatario");
  const safeFromName = assertHeaderText(fromName, "El nombre del remitente");
  const safeSubject = assertHeaderText(subject, "El asunto");
  const connection = await withSmtpTimeout(
    Deno.connectTls({ hostname: host, port }),
    "connect",
  );
  const bufferState = { value: "" };
  const alternativeBoundary = `gv-alternative-${crypto.randomUUID()}`;
  const alternativeBody = [
    `--${alternativeBoundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    text,
    "",
    `--${alternativeBoundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    html,
    "",
    `--${alternativeBoundary}--`,
  ].join("\r\n");
  const messageHeaders = [
    `From: ${encodeHeader(safeFromName)} <${safeFromEmail}>`,
    `To: ${safeTo}`,
    `Subject: ${encodeHeader(safeSubject)}`,
    "MIME-Version: 1.0",
  ];
  let message: string;

  if (attachments.length === 0) {
    message = [
      ...messageHeaders,
      `Content-Type: multipart/alternative; boundary="${alternativeBoundary}"`,
      "",
      alternativeBody,
    ].join("\r\n");
  } else {
    const mixedBoundary = `gv-mixed-${crypto.randomUUID()}`;
    const attachmentParts = attachments.flatMap((attachment) => {
      const filename = assertAttachmentFilename(attachment.filename);
      const contentType = attachment.contentType === "application/pdf"
        ? "application/pdf"
        : "application/octet-stream";

      return [
        `--${mixedBoundary}`,
        `Content-Type: ${contentType}; name="${filename}"`,
        "Content-Transfer-Encoding: base64",
        `Content-Disposition: attachment; filename="${filename}"`,
        "",
        wrapBase64(attachment.contentBase64),
        "",
      ];
    });

    message = [
      ...messageHeaders,
      `Content-Type: multipart/mixed; boundary="${mixedBoundary}"`,
      "",
      `--${mixedBoundary}`,
      `Content-Type: multipart/alternative; boundary="${alternativeBoundary}"`,
      "",
      alternativeBody,
      "",
      ...attachmentParts,
      `--${mixedBoundary}--`,
    ].join("\r\n");
  }

  try {
    await sendSmtpCommand(connection, bufferState, null, [220]);
    await sendSmtpCommand(connection, bufferState, `EHLO ${host}`, [250]);
    await sendSmtpCommand(connection, bufferState, "AUTH LOGIN", [334]);
    await sendSmtpCommand(connection, bufferState, encodeBase64(username), [334]);
    await sendSmtpCommand(connection, bufferState, encodeBase64(password), [235]);
    await sendSmtpCommand(connection, bufferState, `MAIL FROM:<${safeFromEmail}>`, [250]);
    await sendSmtpCommand(connection, bufferState, `RCPT TO:<${safeTo}>`, [250, 251]);
    await sendSmtpCommand(connection, bufferState, "DATA", [354]);
    await sendSmtpCommand(connection, bufferState, `${normalizeSmtpBody(message)}\r\n.`, [250]);
    await sendSmtpCommand(connection, bufferState, "QUIT", [221]);
  } finally {
    connection.close();
  }
}

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  connectTls(options: {
    hostname: string;
    port: number;
  }): Promise<{
    read(buffer: Uint8Array): Promise<number | null>;
    write(buffer: Uint8Array): Promise<number>;
    close(): void;
  }>;
};

export function getSmtpConfig() {
  const host = Deno.env.get("SMTP_HOST") || "";
  const port = Number(Deno.env.get("SMTP_PORT") || "465");
  const username = Deno.env.get("SMTP_USERNAME") || "";
  const password = Deno.env.get("SMTP_PASSWORD") || "";
  const fromEmail =
    Deno.env.get("SMTP_FROM_EMAIL") ||
    Deno.env.get("SMTP_SENDER_EMAIL") ||
    username;
  const fromName =
    Deno.env.get("SMTP_FROM_NAME") ||
    Deno.env.get("SMTP_SENDER_NAME") ||
    "Grupo Viquez S.A";

  return { host, port, username, password, fromEmail, fromName };
}

export function isSmtpConfigured(
  config: ReturnType<typeof getSmtpConfig>,
) {
  return Boolean(
    config.host && config.port && config.username && config.password &&
      config.fromEmail,
  );
}

export function encodeBase64(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

export function encodeHeader(value: string) {
  return `=?UTF-8?B?${encodeBase64(value)}?=`;
}

function normalizeSmtpBody(value: string) {
  return value
    .replace(/\r?\n/g, "\r\n")
    .split("\r\n")
    .map((line) => (line.startsWith(".") ? `.${line}` : line))
    .join("\r\n");
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
    await connection.write(encoder.encode(`${command}\r\n`));
  }

  while (true) {
    const completeResponseMatch = bufferState.value.match(
      /(?:^|\r\n)(\d{3}) [^\r\n]*(?:\r\n|$)/,
    );

    if (completeResponseMatch) {
      const responseEnd = completeResponseMatch.index
        ? completeResponseMatch.index + completeResponseMatch[0].length
        : completeResponseMatch[0].length;
      const response = bufferState.value.slice(0, responseEnd).trim();
      bufferState.value = bufferState.value.slice(responseEnd);

      const statusCode = Number(completeResponseMatch[1]);

      if (!expectedCodes.includes(statusCode)) {
        throw new Error(`SMTP respondio ${statusCode}: ${response}`);
      }

      return response;
    }

    const chunk = new Uint8Array(4096);
    const bytesRead = await connection.read(chunk);

    if (bytesRead === null) {
      throw new Error("La conexion SMTP se cerro inesperadamente.");
    }

    bufferState.value += decoder.decode(chunk.subarray(0, bytesRead));
  }
}

export async function sendSmtpMail({
  host,
  port,
  username,
  password,
  fromEmail,
  fromName,
  to,
  subject,
  text,
  html,
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
}) {
  if (port !== 465) {
    throw new Error(
      "Esta funcion SMTP usa TLS directo. Configura SMTP_PORT=465.",
    );
  }

  const connection = await Deno.connectTls({ hostname: host, port });
  const bufferState = { value: "" };
  const boundary = `gv-mail-${crypto.randomUUID()}`;
  const fromHeader = `${encodeHeader(fromName)} <${fromEmail}>`;
  const message = [
    `From: ${fromHeader}`,
    `To: ${to}`,
    `Subject: ${encodeHeader(subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    text,
    "",
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    html,
    "",
    `--${boundary}--`,
  ].join("\r\n");

  try {
    await sendSmtpCommand(connection, bufferState, null, [220]);
    await sendSmtpCommand(connection, bufferState, `EHLO ${host}`, [250]);
    await sendSmtpCommand(connection, bufferState, "AUTH LOGIN", [334]);
    await sendSmtpCommand(connection, bufferState, encodeBase64(username), [
      334,
    ]);
    await sendSmtpCommand(connection, bufferState, encodeBase64(password), [
      235,
    ]);
    await sendSmtpCommand(
      connection,
      bufferState,
      `MAIL FROM:<${fromEmail}>`,
      [250],
    );
    await sendSmtpCommand(connection, bufferState, `RCPT TO:<${to}>`, [
      250,
      251,
    ]);
    await sendSmtpCommand(connection, bufferState, "DATA", [354]);
    await sendSmtpCommand(
      connection,
      bufferState,
      `${normalizeSmtpBody(message)}\r\n.`,
      [250],
    );
    await sendSmtpCommand(connection, bufferState, "QUIT", [221]);
  } finally {
    connection.close();
  }
}

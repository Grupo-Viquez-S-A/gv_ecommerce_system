import express from "express";
import { createClient } from "@supabase/supabase-js";
import { getSmtpConfig, isSmtpConfigured, sendSmtpMail } from "./mailer.js";
import {
  buildAccessEmailHtml,
  buildAccessEmailText,
  buildQuotationEmailHtml,
  buildQuotationEmailText,
  buildPaymentEmailHtml,
  buildPaymentEmailText,
} from "./emailTemplates.js";

const ECOMMERCE_APPLICATION_ID = "64c10718-fce7-42c6-a25f-d81c6b5cd51c";
const CLIENT_ROLE_ID = "7fa43251-f748-4dfa-b0b4-448231d1954d";

const supabaseUrl = process.env.VITE_SUPABASE_API_URL;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "[server] Faltan VITE_SUPABASE_API_URL o VITE_SUPABASE_SERVICE_ROLE_KEY en Secrets.",
  );
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function getRequiredString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getOptionalString(value) {
  const text = getRequiredString(value);
  return text || null;
}

function getNumber(value, fallback = 0) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function splitName(fullName) {
  const words = fullName.trim().split(/\s+/).filter(Boolean);

  if (words.length <= 1) {
    return { name: words[0] || "Cliente", surname: "" };
  }

  return { name: words.slice(0, -1).join(" "), surname: words.at(-1) || "" };
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function generateTempPassword() {
  const bytes = Array.from({ length: 9 }, () => Math.floor(Math.random() * 256));
  const base = bytes.map((byte) => byte.toString(36)).join("").slice(0, 10);

  return `Gv${base}${Math.floor(Math.random() * 90 + 10)}!`;
}

function getErrorMessage(error, fallbackMessage) {
  if (!error) return fallbackMessage;
  if (typeof error === "string") return error;
  if (error.message) return String(error.message);
  return fallbackMessage;
}

function isAccountActive(appMetadata, lastSignInAt) {
  if (appMetadata?.must_change_password === false) return true;
  if (appMetadata?.activation_status === "active") return true;

  if (
    lastSignInAt &&
    appMetadata?.must_change_password !== true &&
    appMetadata?.activation_status !== "pending"
  ) {
    return true;
  }

  return false;
}

async function findAuthUserIdByEmail(email) {
  const normalizedEmail = email.trim().toLowerCase();
  const perPage = 1000;

  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });

    if (error) throw error;

    const existingUser = data?.users?.find(
      (user) => String(user.email || "").trim().toLowerCase() === normalizedEmail,
    );

    if (existingUser?.id) return existingUser.id;
    if (!data?.users || data.users.length < perPage) break;
  }

  return null;
}

function getSiteUrl(req) {
  const configured = (process.env.SITE_URL || process.env.APP_URL || "").trim();

  if (configured) return configured.replace(/\/+$/, "");

  const origin = req.headers.origin || `${req.protocol}://${req.get("host")}`;
  return origin.replace(/\/+$/, "");
}

async function requireAuthUser(req, res) {
  const authorization = req.headers.authorization || "";
  const token = authorization.replace(/^Bearer\s+/i, "");

  if (!token) {
    res.status(401).json({ ok: false, error: "Debes iniciar sesion para continuar." });
    return null;
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data?.user) {
    res.status(401).json({ ok: false, error: "Sesion invalida o expirada." });
    return null;
  }

  return data.user;
}

export function createEmailRouter() {
  const router = express.Router();

  router.post("/create-representative-user", async (req, res) => {
    try {
      const currentUser = await requireAuthUser(req, res);
      if (!currentUser) return;

      const body = req.body || {};
      const representativeId = getRequiredString(body.representative_id);
      const businessId = getRequiredString(body.business_id);
      const branchId = getRequiredString(body.branch_id);
      const companyId = getRequiredString(body.company_id);
      const fullName = getRequiredString(body.name);
      const email = getRequiredString(body.email).toLowerCase();

      const missingFields = [];
      if (!representativeId) missingFields.push("representante");
      if (!businessId) missingFields.push("cliente");
      if (!branchId) missingFields.push("sucursal");
      if (!companyId) missingFields.push("empresa del grupo");
      if (!fullName) missingFields.push("nombre del representante");
      if (!email) missingFields.push("correo del representante");

      if (missingFields.length > 0) {
        return res
          .status(400)
          .json({ ok: false, error: `Faltan estos datos: ${missingFields.join(", ")}.` });
      }

      const { data: representative, error: representativeError } = await supabaseAdmin
        .from("representatives")
        .select("representative_id, business_id, branch_id, user_id, name, email")
        .eq("representative_id", representativeId)
        .maybeSingle();

      if (representativeError) {
        return res.status(500).json({
          ok: false,
          error: getErrorMessage(representativeError, "No fue posible validar el representante."),
        });
      }

      if (!representative) {
        return res.status(404).json({ ok: false, error: "El representante no existe." });
      }

      if (representative.business_id !== businessId || representative.branch_id !== branchId) {
        return res.status(409).json({
          ok: false,
          error: "El representante no pertenece al cliente o sucursal indicados.",
        });
      }

      let userId = representative.user_id || null;

      if (!userId) {
        const { data: existingProfile, error: existingProfileError } = await supabaseAdmin
          .from("profiles")
          .select("user_id, email")
          .ilike("email", email)
          .maybeSingle();

        if (existingProfileError) {
          return res.status(500).json({
            ok: false,
            error: getErrorMessage(
              existingProfileError,
              "No fue posible validar si el perfil del representante ya existe.",
            ),
          });
        }

        userId = existingProfile?.user_id || null;
      }

      if (!userId) {
        userId = await findAuthUserIdByEmail(email);
      }

      let accountState = "active";
      let finalMustChangePassword = false;
      let tempPassword = null;

      if (!userId) {
        tempPassword = generateTempPassword();

        const { data: createdUserData, error: createUserError } =
          await supabaseAdmin.auth.admin.createUser({
            email,
            password: tempPassword,
            email_confirm: true,
            app_metadata: {
              created_from: "quotation_representative",
              role: "client",
              representative_id: representativeId,
              business_id: businessId,
              branch_id: branchId,
              application_id: ECOMMERCE_APPLICATION_ID,
              must_change_password: true,
              activation_status: "pending",
              role_code: "cliente",
              application_code: "ecommerce",
            },
            user_metadata: { full_name: fullName },
          });

        if (createUserError || !createdUserData?.user) {
          return res.status(400).json({
            ok: false,
            error: getErrorMessage(
              createUserError,
              "No fue posible crear la cuenta del representante en Supabase Auth.",
            ),
          });
        }

        userId = createdUserData.user.id;
        accountState = "new";
        finalMustChangePassword = true;
      } else {
        const { data: currentUserRecord, error: currentUserRecordError } =
          await supabaseAdmin.auth.admin.getUserById(userId);

        if (currentUserRecordError || !currentUserRecord?.user) {
          return res.status(500).json({
            ok: false,
            error: "No fue posible validar la cuenta del representante.",
          });
        }

        const existingUser = currentUserRecord.user;
        const currentAppMetadata = existingUser.app_metadata || {};
        const lastSignInAt = existingUser.last_sign_in_at || null;
        const active = isAccountActive(currentAppMetadata, lastSignInAt);

        if (active) {
          accountState = "active";
          finalMustChangePassword = false;
        } else {
          tempPassword = generateTempPassword();

          const { error: updateUserError } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            {
              password: tempPassword,
              app_metadata: {
                ...currentAppMetadata,
                must_change_password: true,
                activation_status: "pending",
                role_code: currentAppMetadata.role_code || "cliente",
                application_code: currentAppMetadata.application_code || "ecommerce",
              },
            },
          );

          if (updateUserError) {
            return res.status(500).json({
              ok: false,
              error: "No fue posible generar una nueva contrasena temporal para el representante.",
            });
          }

          accountState = "pending";
          finalMustChangePassword = true;
        }
      }

      const { name, surname } = splitName(fullName);

      const { error: profileError } = await supabaseAdmin.from("profiles").upsert(
        {
          user_id: userId,
          name,
          surname,
          email,
          phone: getOptionalString(body.phone),
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );

      if (profileError) {
        return res.status(500).json({
          ok: false,
          error: getErrorMessage(profileError, "No fue posible guardar el perfil del representante."),
        });
      }

      const { error: representativeUpdateError } = await supabaseAdmin
        .from("representatives")
        .update({ user_id: userId, name: fullName, email, is_active: true, updated_at: new Date().toISOString() })
        .eq("representative_id", representativeId);

      if (representativeUpdateError) {
        return res.status(500).json({
          ok: false,
          error: "No fue posible enlazar el representante con el perfil.",
        });
      }

      const startDate = getToday();

      const { data: existingMembership, error: existingMembershipError } = await supabaseAdmin
        .from("user_memberships")
        .select("membership_id")
        .eq("user_id", userId)
        .eq("company_id", companyId)
        .eq("role_id", CLIENT_ROLE_ID)
        .maybeSingle();

      if (existingMembershipError) {
        return res.status(500).json({
          ok: false,
          error: "No fue posible validar la membresia del cliente.",
        });
      }

      if (!existingMembership) {
        const { error: membershipError } = await supabaseAdmin.from("user_memberships").insert({
          user_id: userId,
          company_id: companyId,
          department_id: null,
          role_id: CLIENT_ROLE_ID,
          is_active: true,
          start_date: startDate,
          end_date: null,
        });

        if (membershipError) {
          return res.status(500).json({
            ok: false,
            error: "No fue posible asignar el rol Cliente al representante.",
          });
        }
      }

      const { data: existingApplication, error: existingApplicationError } = await supabaseAdmin
        .from("user_applications")
        .select("user_application_id")
        .eq("user_id", userId)
        .eq("application_id", ECOMMERCE_APPLICATION_ID)
        .maybeSingle();

      if (existingApplicationError) {
        return res.status(500).json({
          ok: false,
          error: "No fue posible validar el acceso al e-commerce.",
        });
      }

      if (!existingApplication) {
        const { error: applicationError } = await supabaseAdmin.from("user_applications").insert({
          user_id: userId,
          application_id: ECOMMERCE_APPLICATION_ID,
          is_active: true,
          start_date: startDate,
          end_date: null,
        });

        if (applicationError) {
          return res.status(500).json({
            ok: false,
            error: "No fue posible asignar acceso al e-commerce.",
          });
        }
      }

      const emailNotification = { sent: false, error: null };

      if (tempPassword) {
        const smtpConfig = getSmtpConfig();

        if (!isSmtpConfigured(smtpConfig)) {
          emailNotification.error =
            "Faltan variables SMTP: SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD.";
        } else {
          const loginUrl = getSiteUrl(req);

          try {
            await sendSmtpMail({
              ...smtpConfig,
              to: email,
              subject: "Tu acceso al portal de cliente - Grupo Viquez",
              text: buildAccessEmailText({ representativeName: fullName, email, tempPassword, loginUrl }),
              html: buildAccessEmailHtml({ representativeName: fullName, email, tempPassword, loginUrl }),
            });

            emailNotification.sent = true;
          } catch (sendError) {
            console.error("create-representative-user: fallo el envio de correo", sendError);
            emailNotification.error = getErrorMessage(
              sendError,
              "No fue posible enviar el correo con la contrasena temporal.",
            );
          }
        }
      }

      return res.json({
        ok: true,
        account_state: accountState,
        must_change_password: finalMustChangePassword,
        temp_password: tempPassword,
        email_notification: emailNotification,
        message: "Representante enlazado como cliente del e-commerce.",
        user: { user_id: userId, email },
        representative: { representative_id: representativeId, user_id: userId },
      });
    } catch (error) {
      console.error("create-representative-user error:", error);
      return res.status(500).json({
        ok: false,
        error: getErrorMessage(error, "No fue posible crear el usuario del representante."),
      });
    }
  });

  router.post("/notify-new-quotation", async (req, res) => {
    try {
      const currentUser = await requireAuthUser(req, res);
      if (!currentUser) return;

      const body = req.body || {};
      const quotationId = getRequiredString(body.quotation_id);
      const representativeId = getRequiredString(body.representative_id);

      if (!quotationId || !representativeId) {
        return res.status(400).json({ ok: false, error: "Faltan datos: cotizacion o representante." });
      }

      const { data: quotation, error: quotationError } = await supabaseAdmin
        .from("quotations")
        .select("quotation_id, quotation_number, business_id")
        .eq("quotation_id", quotationId)
        .maybeSingle();

      if (quotationError) {
        return res.status(500).json({ ok: false, error: "No fue posible cargar la cotizacion." });
      }

      if (!quotation) {
        return res.status(404).json({ ok: false, error: "La cotizacion no existe." });
      }

      const [{ data: representative, error: representativeError }, { data: business, error: businessError }] =
        await Promise.all([
          supabaseAdmin
            .from("representatives")
            .select("representative_id, name, email, user_id")
            .eq("representative_id", representativeId)
            .maybeSingle(),
          supabaseAdmin
            .from("businesses")
            .select("business_id, business_name, legal_name")
            .eq("business_id", quotation.business_id)
            .maybeSingle(),
        ]);

      if (representativeError) {
        return res.status(500).json({ ok: false, error: "No fue posible cargar el representante." });
      }

      if (businessError) {
        return res.status(500).json({ ok: false, error: "No fue posible cargar el cliente." });
      }

      if (!representative?.email) {
        return res.status(409).json({ ok: false, error: "El representante no tiene correo registrado." });
      }

      if (!representative.user_id) {
        return res.status(409).json({
          ok: false,
          error: "El representante todavia no ha activado su cuenta; no se envia notificacion de nueva cotizacion.",
        });
      }

      const { data: existingNotification, error: existingNotificationError } = await supabaseAdmin
        .from("quotation_notifications")
        .select("notification_id, status")
        .eq("quotation_id", quotationId)
        .eq("representative_id", representativeId)
        .eq("notification_type", "new_quotation")
        .maybeSingle();

      if (existingNotificationError) {
        return res.status(500).json({ ok: false, error: "No fue posible validar el historial de notificaciones." });
      }

      if (existingNotification && existingNotification.status === "sent") {
        return res.json({ ok: true, message: "La notificacion ya habia sido enviada.", skipped: true });
      }

      const smtpConfig = getSmtpConfig();

      if (!isSmtpConfigured(smtpConfig)) {
        return res.status(500).json({
          ok: false,
          error: "Faltan variables SMTP: SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD.",
        });
      }

      let notificationId = existingNotification?.notification_id || null;

      if (!notificationId) {
        const { data: notificationRow, error: notificationInsertError } = await supabaseAdmin
          .from("quotation_notifications")
          .insert({
            quotation_id: quotationId,
            representative_id: representativeId,
            auth_user_id: representative.user_id,
            email: representative.email,
            notification_type: "new_quotation",
            status: "pending",
            attempt_count: 1,
            created_by: currentUser.id,
          })
          .select("notification_id")
          .maybeSingle();

        if (notificationInsertError) {
          return res.status(500).json({ ok: false, error: "No fue posible registrar la notificacion." });
        }

        notificationId = notificationRow?.notification_id || null;
      } else {
        await supabaseAdmin
          .from("quotation_notifications")
          .update({ status: "pending" })
          .eq("notification_id", notificationId);
      }

      const loginUrl = getSiteUrl(req);
      const clientName = business?.business_name || business?.legal_name || "tu empresa";
      const subject = `Nueva cotizacion - ${quotation.quotation_number}`;

      try {
        await sendSmtpMail({
          ...smtpConfig,
          to: representative.email,
          subject,
          text: buildQuotationEmailText({
            representativeName: representative.name || "",
            clientName,
            quotationNumber: quotation.quotation_number,
            loginUrl,
          }),
          html: buildQuotationEmailHtml({
            representativeName: representative.name || "",
            clientName,
            quotationNumber: quotation.quotation_number,
            loginUrl,
          }),
        });
      } catch (sendError) {
        if (notificationId) {
          await supabaseAdmin
            .from("quotation_notifications")
            .update({
              status: "failed",
              error_message: getErrorMessage(sendError, "No fue posible enviar el correo."),
            })
            .eq("notification_id", notificationId);
        }

        return res.status(500).json({
          ok: false,
          error: getErrorMessage(sendError, "No fue posible enviar la notificacion de nueva cotizacion."),
        });
      }

      if (notificationId) {
        await supabaseAdmin
          .from("quotation_notifications")
          .update({ status: "sent", sent_at: new Date().toISOString() })
          .eq("notification_id", notificationId);
      }

      return res.json({
        ok: true,
        message: "Notificacion de nueva cotizacion enviada.",
        recipient: representative.email,
        subject,
      });
    } catch (error) {
      console.error("notify-new-quotation error:", error);
      return res.status(500).json({
        ok: false,
        error: getErrorMessage(error, "No fue posible enviar la notificacion de nueva cotizacion."),
      });
    }
  });

  router.post("/notify-payment-success", async (req, res) => {
    try {
      const currentUser = await requireAuthUser(req, res);
      if (!currentUser) return;

      const smtpConfig = getSmtpConfig();

      if (!isSmtpConfigured(smtpConfig)) {
        return res.status(500).json({
          ok: false,
          error: "Faltan variables SMTP: SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD.",
        });
      }

      const body = req.body || {};
      const productionOrderId = getRequiredString(body.production_order_id);

      if (!productionOrderId) {
        return res.status(400).json({ ok: false, error: "Falta el identificador de la orden." });
      }

      const { data: order, error: orderError } = await supabaseAdmin
        .from("production_orders")
        .select("production_order_id, quotation_id, production_order_code, payment_status, balance")
        .eq("production_order_id", productionOrderId)
        .maybeSingle();

      if (orderError) {
        return res.status(500).json({ ok: false, error: "No fue posible cargar la orden." });
      }

      if (!order) {
        return res.status(404).json({ ok: false, error: "La orden no existe." });
      }

      const { data: quotation, error: quotationError } = await supabaseAdmin
        .from("quotations")
        .select("quotation_id, quotation_number, representative_id, business_id, total")
        .eq("quotation_id", order.quotation_id)
        .maybeSingle();

      if (quotationError) {
        return res.status(500).json({ ok: false, error: "No fue posible cargar la cotizacion asociada." });
      }

      if (!quotation) {
        return res.status(404).json({ ok: false, error: "La cotizacion asociada no existe." });
      }

      const [
        { data: representative, error: representativeError },
        { data: business, error: businessError },
        { data: payments, error: paymentsError },
      ] = await Promise.all([
        supabaseAdmin
          .from("representatives")
          .select("representative_id, name, email")
          .eq("representative_id", quotation.representative_id)
          .maybeSingle(),
        supabaseAdmin
          .from("businesses")
          .select("business_id, business_name, legal_name")
          .eq("business_id", quotation.business_id)
          .maybeSingle(),
        supabaseAdmin
          .from("payments")
          .select("amount, payment_date, method_id, reference_number, created_at")
          .eq("production_order_id", productionOrderId)
          .eq("is_valid", true)
          .order("payment_date", { ascending: false }),
      ]);

      if (representativeError) {
        return res.status(500).json({ ok: false, error: "No fue posible cargar el representante." });
      }

      if (businessError) {
        return res.status(500).json({ ok: false, error: "No fue posible cargar el cliente." });
      }

      if (paymentsError) {
        return res.status(500).json({ ok: false, error: "No fue posible cargar los pagos validados." });
      }

      if (!representative?.email) {
        return res.status(409).json({ ok: false, error: "El representante no tiene correo registrado." });
      }

      const validPayments = payments || [];
      const amountPaid = validPayments.reduce((sum, payment) => sum + getNumber(payment.amount), 0);
      const lastPayment = validPayments[0] || null;

      let paymentMethod = "No indicado";

      if (lastPayment?.method_id) {
        const { data: method, error: methodError } = await supabaseAdmin
          .from("payment_methods")
          .select("method_name")
          .eq("method_id", lastPayment.method_id)
          .maybeSingle();

        if (methodError) {
          return res.status(500).json({ ok: false, error: "No fue posible cargar el metodo de pago." });
        }

        paymentMethod = method?.method_name || paymentMethod;
      }

      const emailPayload = {
        representativeName: representative.name || "representante",
        clientName: business?.business_name || business?.legal_name || "Cliente sin nombre",
        orderCode: order.production_order_code || "Sin codigo",
        quotationNumber: quotation.quotation_number || "Sin cotizacion",
        amountPaid,
        balance: getNumber(order.balance),
        total: getNumber(quotation.total),
        paymentStatus: String(order.payment_status || ""),
        paymentDate: lastPayment?.payment_date || lastPayment?.created_at || "",
        paymentMethod,
        referenceNumber: lastPayment?.reference_number || null,
      };

      const subject = `Pago confirmado - ${emailPayload.quotationNumber}`;

      await sendSmtpMail({
        ...smtpConfig,
        to: representative.email,
        subject,
        text: buildPaymentEmailText(emailPayload),
        html: buildPaymentEmailHtml(emailPayload),
      });

      return res.json({
        ok: true,
        message: "Notificacion de pago enviada correctamente.",
        recipient: representative.email,
        subject,
      });
    } catch (error) {
      console.error("notify-payment-success error:", error);
      return res.status(500).json({
        ok: false,
        error: getErrorMessage(error, "No fue posible enviar la notificacion de pago."),
      });
    }
  });

  return router;
}

export function createServer() {
  const app = express();
  app.use(express.json({ limit: "1mb" }));
  app.use("/api", createEmailRouter());
  return app;
}

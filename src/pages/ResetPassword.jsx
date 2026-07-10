import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LockKeyhole, ShieldCheck } from "lucide-react";

import { signOut, updatePasswordForCurrentUser } from "../services/loginService";
import { supabase } from "../services/primarySupabaseClient";

import bgImage from "../assets/images/92F606BD-4990-462F-A3D2-124B6BE4B23F.jpg";
import logoImage from "../assets/images/0E7BFEE5-FB79-49F7-9E7D-DE47EBC12758.png";

function getUrlAuthError() {
  const params = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const errorCode = params.get("error_code") || hashParams.get("error_code");
  const errorDescription = params.get("error_description") || hashParams.get("error_description");

  if (!errorCode && !errorDescription) return "";

  if (errorCode === "otp_expired") {
    return "El enlace ya expiro o no es valido. Solicita un nuevo correo de recuperacion.";
  }

  return errorDescription?.replace(/\+/g, " ") || "El enlace de recuperacion no es valido.";
}

function ResetPassword() {
  const navigate = useNavigate();
  const initialUrlError = useMemo(getUrlAuthError, []);
  const activationInFlight = useRef(false);

  // "validating" mientras esperamos que Supabase procese el enlace del
  // correo (intercambio de codigo / hash), "ready" cuando ya hay una
  // sesion valida para restablecer la contrasena, "invalid" si el enlace
  // no sirvio.
  const [linkStatus, setLinkStatus] = useState(initialUrlError ? "invalid" : "validating");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialUrlError);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (initialUrlError) {
      setLinkStatus("invalid");
      return undefined;
    }

    let isMounted = true;

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;

      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setLinkStatus("ready");
      }
    });

    const checkExistingSession = async () => {
      const { data, error: sessionError } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (sessionError) {
        setLinkStatus("invalid");
        setError("El enlace de recuperacion no es valido o ya expiro.");
        return;
      }

      if (data?.session) {
        setLinkStatus("ready");
        return;
      }

      // Le damos tiempo a Supabase para procesar el codigo/hash del enlace
      // antes de decidir que no es valido.
      window.setTimeout(async () => {
        if (!isMounted) return;

        const { data: retryData } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (retryData?.session) {
          setLinkStatus("ready");
        } else {
          setLinkStatus("invalid");
          setError("El enlace de recuperacion no es valido o ya expiro. Solicita uno nuevo.");
        }
      }, 2500);
    };

    checkExistingSession();

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [initialUrlError]);

  const canSubmit =
    linkStatus === "ready" && password && confirmPassword && !loading && !success;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("La contrasena debe tener al menos 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contrasenas no coinciden.");
      return;
    }

    if (activationInFlight.current) return;
    activationInFlight.current = true;

    try {
      setLoading(true);
      const { error: updateError } = await updatePasswordForCurrentUser(password);

      if (updateError) {
        setError(updateError.message || "No fue posible actualizar la contrasena.");
        return;
      }

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (sessionError || !accessToken) {
        setError(
          "La contrasena se actualizo, pero se perdio la sesion antes de completar la activacion. Inicia sesion de nuevo.",
        );
        return;
      }

      const { data: activationData, error: activationError } =
        await supabase.functions.invoke("complete-client-activation", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

      if (activationError || activationData?.ok === false) {
        setError(
          activationData?.error ||
            "La contrasena se actualizo, pero no fue posible completar la activacion. Intenta de nuevo.",
        );
        return;
      }

      setSuccess(true);
      window.sessionStorage.setItem(
        "activationSuccessMessage",
        "Contrasena creada correctamente. Inicia sesion con tu correo y tu nueva contrasena.",
      );
      await signOut();
      window.setTimeout(() => navigate("/", { replace: true }), 1200);
    } finally {
      setLoading(false);
      activationInFlight.current = false;
    }
  };

  const isValidatingLink = linkStatus === "validating";
  const isInvalidLink = linkStatus === "invalid";

  return (
    <div
      className="min-h-screen w-screen bg-cover bg-center bg-no-repeat px-5 py-8"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <section className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
          <div className="mb-7 flex items-center gap-3">
            <img src={logoImage} alt="Logo Grupo Viquez" className="h-10 w-auto" />
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#c9a227]">Grupo Viquez</p>
              <h1 className="text-2xl font-black text-[#1a2f5e]">Restablecer contrasena</h1>
            </div>
          </div>

          <div className="mb-6 rounded-2xl border border-[#c9a227]/30 bg-[#fff8df] p-4 text-sm text-[#735d16]">
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#c9a227]" />
              <p>Define una nueva contrasena para activar tu acceso al e-commerce.</p>
            </div>
          </div>

          {isValidatingLink && (
            <div className="mb-5 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
              Verificando el enlace de activacion...
            </div>
          )}

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              Contrasena actualizada. Te enviaremos al inicio de sesion.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">Nueva contrasena</label>
              <div className="flex items-center gap-2 rounded-xl border border-gray-300 px-3 py-3 transition-colors focus-within:border-[#c9a227]">
                <LockKeyhole className="h-4 w-4 shrink-0 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={8}
                  disabled={isValidatingLink || isInvalidLink || success}
                  placeholder="Minimo 8 caracteres"
                  autoComplete="new-password"
                  className="min-w-0 flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400 disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="text-gray-400 transition hover:text-gray-600"
                  aria-label={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">Confirmar contrasena</label>
              <div className="flex items-center gap-2 rounded-xl border border-gray-300 px-3 py-3 transition-colors focus-within:border-[#c9a227]">
                <LockKeyhole className="h-4 w-4 shrink-0 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  minLength={8}
                  disabled={isValidatingLink || isInvalidLink || success}
                  placeholder="Repite la contrasena"
                  autoComplete="new-password"
                  className="min-w-0 flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400 disabled:opacity-60"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#c9a227] to-[#e6bb45] px-4 py-3.5 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Guardando..." : "Guardar nueva contrasena"}
            </button>
          </form>

          <Link to="/" className="mt-5 block text-center text-sm font-semibold text-[#c9a227] hover:underline">
            Volver al inicio de sesion
          </Link>
        </section>
      </div>
    </div>
  );
}

export default ResetPassword;

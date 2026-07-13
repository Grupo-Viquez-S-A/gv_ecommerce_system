import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext.js";
import { signInWithEmail } from "../services/loginService";
import { isClientAccount } from "../utils/roles.js";

import bgImage from "../assets/images/92F606BD-4990-462F-A3D2-124B6BE4B23F.jpg";
import logoImage from "../assets/images/0E7BFEE5-FB79-49F7-9E7D-DE47EBC12758.png";

function Login() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading, user, mustChangePassword } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [infoMessage] = useState(() => {
    const storedMessage = window.sessionStorage.getItem("activationSuccessMessage");
    if (storedMessage) {
      window.sessionStorage.removeItem("activationSuccessMessage");
    }
    return storedMessage || "";
  });

  const [showForgotPasswordInfo, setShowForgotPasswordInfo] = useState(false);

  useEffect(() => {
    if (authLoading || !isAuthenticated) {
      return;
    }

    if (mustChangePassword) {
      navigate("/restablecer-contrasena");
      return;
    }

    if (isClientAccount(user)) {
      navigate("/mis-cotizaciones");
      return;
    }

    navigate("/dashboard");
  }, [isAuthenticated, authLoading, mustChangePassword, user, navigate]);

  const handleLogin = async (event) => {
    event.preventDefault();

    setLoading(true);
    setError(null);

    const { error, corporateUser, mustChangePassword: shouldChangePassword } =
      await signInWithEmail(email, password);

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setLoading(false);

    if (shouldChangePassword) {
      navigate("/restablecer-contrasena");
      return;
    }

    if (isClientAccount(corporateUser)) {
      navigate("/mis-cotizaciones");
      return;
    }

    navigate("/dashboard");
  };

  return (
    <div
      className="min-h-dvh w-full overflow-y-auto bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="flex min-h-dvh w-full items-center justify-center px-4 py-6 sm:px-6 lg:justify-between lg:px-24">
        <div className="flex w-full max-w-md flex-col gap-5 rounded-3xl bg-white p-6 shadow-2xl sm:p-10">
          <div className="flex items-center gap-2">
            <img
              src={logoImage}
              alt="Logo Grupo Víquez"
              className="h-9 w-auto"
            />

            <span className="text-[#1a2f5e] font-bold text-sm tracking-widest uppercase">
              Grupo Víquez.
            </span>
          </div>

          <div>
            <h1 className="text-4xl font-black text-[#1a2f5e] leading-tight">
              Bienvenido
            </h1>

            <p className="text-gray-500 text-sm mt-1">
              Accede a tu portal corporativo
            </p>
          </div>

          {infoMessage && (
            <div className="bg-emerald-50 text-emerald-700 text-sm p-3 rounded-lg border border-emerald-200">
              {infoMessage}
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1 block">
                Correo electrónico
              </label>

              <div className="flex items-center border border-gray-300 rounded-xl px-3 py-3 gap-2 focus-within:border-[#c9a227] transition-colors">
                <svg
                  className="w-4 h-4 text-gray-400 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>

                <input
                  type="email"
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="email"
                  className="flex-1 outline-none text-sm text-gray-700 bg-transparent placeholder-gray-400"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-semibold text-gray-700">
                  Contraseña
                </label>

                <button
                  type="button"
                  onClick={() => setShowForgotPasswordInfo(true)}
                  className="text-xs text-[#c9a227] hover:underline cursor-pointer"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              <div className="flex items-center border border-gray-300 rounded-xl px-3 py-3 gap-2 focus-within:border-[#c9a227] transition-colors">
                <svg
                  className="w-4 h-4 text-gray-400 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>

                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  autoComplete="current-password"
                  className="flex-1 outline-none text-sm text-gray-700 bg-transparent placeholder-gray-400"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((currentValue) => !currentValue)
                  }
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                  aria-label={
                    showPassword
                      ? "Ocultar contraseña"
                      : "Mostrar contraseña"
                  }
                >
                  {showPassword ? (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />

                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268-2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="remember"
                type="checkbox"
                checked={remember}
                onChange={() =>
                  setRemember((currentValue) => !currentValue)
                }
                className="w-4 h-4 accent-[#c9a227] cursor-pointer"
              />

              <label
                htmlFor="remember"
                className="text-sm text-gray-700 cursor-pointer select-none"
              >
                Recordarme
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              style={{
                background:
                  "linear-gradient(90deg, #c9a227 0%, #e6bb45 100%)",
              }}
            >
              {loading ? "Cargando..." : "Iniciar sesión"}

              {!loading && (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              )}
            </button>
          </form>

          <div className="flex flex-col gap-2 text-center">
            <p className="text-xs text-gray-400">
              El acceso es exclusivo para usuarios autorizados por la empresa.
            </p>

            <p className="text-xs text-gray-400">
              Al iniciar sesión, aceptas nuestros{" "}
              <a href="#" className="text-[#c9a227] hover:underline">
                Términos y Condiciones
              </a>
            </p>
          </div>
        </div>

        <div className="hidden lg:flex items-center justify-center flex-1">
          <img
            src={logoImage}
            alt="Logo Grupo Víquez"
            className="h-auto w-full max-w-[500px] drop-shadow-2xl"
          />
        </div>
      </div>

      {showForgotPasswordInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-[#1a2f5e]">
              Restablecer contraseña
            </h2>
            <p className="mt-3 text-sm text-gray-600">
              Contacta a un administrador para que te comparta una nueva
              contraseña temporal de acceso.
            </p>

            <button
              type="button"
              onClick={() => setShowForgotPasswordInfo(false)}
              className="mt-5 w-full rounded-xl py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer"
              style={{
                background: "linear-gradient(90deg, #c9a227 0%, #e6bb45 100%)",
              }}
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signUpWithEmail } from "../services/loginService";
import bgImage from "../assets/images/92F606BD-4990-462F-A3D2-124B6BE4B23F.jpg";
import logoImage from "../assets/images/0E7BFEE5-FB79-49F7-9E7D-DE47EBC12758.png";

function SignUp() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      setLoading(false);
      return;
    }

    const { data, error } = await signUpWithEmail(email, password, {
      full_name: fullName,
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }

    setLoading(false);
  };

  return (
    <div
      className="w-screen h-screen flex items-center bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="w-full h-full flex items-center justify-between px-10 md:px-16 lg:px-24 ml-50">
        <div className="bg-white rounded-3xl shadow-2xl p-10 w-full max-w-md flex flex-col gap-5">
          <div className="flex items-center gap-2">
            <img src={logoImage} alt="Logo Grupo Víquez" className="h-9 w-auto" />
            <span className="text-[#1a2f5e] font-bold text-sm tracking-widest uppercase">
              Grupo Víquez.
            </span>
          </div>

          <div>
            <h1 className="text-4xl font-black text-[#1a2f5e] leading-tight">
              Crear cuenta
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Regístrate en el portal corporativo
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 text-green-600 text-sm p-3 rounded-lg border border-green-200">
              <strong>¡Cuenta creada exitosamente!</strong>
              <p className="mt-1">Verifica tu correo electrónico para activar tu cuenta. Una vez verificado, puedes iniciar sesión.</p>
              <button
                onClick={() => navigate("/")}
                className="mt-3 text-green-700 font-semibold text-sm underline cursor-pointer"
              >
                Ir al inicio de sesión
              </button>
            </div>
          )}

          {!success && (
            <form onSubmit={handleSignUp} className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">
                  Nombre completo
                </label>
                <div className="flex items-center border border-gray-300 rounded-xl px-3 py-3 gap-2 focus-within:border-[#c9a227] transition-colors">
                  <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Tu nombre completo"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="flex-1 outline-none text-sm text-gray-700 bg-transparent placeholder-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">
                  Correo electrónico
                </label>
                <div className="flex items-center border border-gray-300 rounded-xl px-3 py-3 gap-2 focus-within:border-[#c9a227] transition-colors">
                  <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <input
                    type="email"
                    placeholder="ejemplo@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="flex-1 outline-none text-sm text-gray-700 bg-transparent placeholder-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">
                  Contraseña
                </label>
                <div className="flex items-center border border-gray-300 rounded-xl px-3 py-3 gap-2 focus-within:border-[#c9a227] transition-colors">
                  <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <input
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="flex-1 outline-none text-sm text-gray-700 bg-transparent placeholder-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">
                  Confirmar contraseña
                </label>
                <div className="flex items-center border border-gray-300 rounded-xl px-3 py-3 gap-2 focus-within:border-[#c9a227] transition-colors">
                  <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <input
                    type="password"
                    placeholder="Repite tu contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="flex-1 outline-none text-sm text-gray-700 bg-transparent placeholder-gray-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                style={{ background: "linear-gradient(90deg, #c9a227 0%, #e6bb45 100%)" }}
              >
                {loading ? "Cargando..." : "Crear cuenta"}
                {!loading && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                )}
              </button>
            </form>
          )}

          <p className="text-xs text-center text-gray-400">
            ¿Ya tienes cuenta?{" "}
            <a href="/" className="text-[#c9a227] hover:underline">
              Inicia sesión
            </a>
          </p>
        </div>

        <div className="hidden lg:flex items-center justify-center flex-1">
          <img src={logoImage} alt="Logo Grupo Víquez" className="w-[500px] h-auto drop-shadow-2xl ml-70" />
        </div>
      </div>
    </div>
  );
}

export default SignUp;

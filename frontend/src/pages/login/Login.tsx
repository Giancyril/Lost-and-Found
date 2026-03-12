import { useForm } from "react-hook-form";
import { Spinner } from "flowbite-react";
import Modals from "../../components/modal/Modal";
import { ToastContainer } from "react-toastify";
import { setUserLocalStorage } from "../../auth/auth";
import { useLoginMutation } from "../../redux/api/api";
import { useNavigate } from "react-router-dom";
import { MdVisibility, MdVisibilityOff } from "react-icons/md";
import { useState } from "react";

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm();

  const [login, { isLoading }] = useLoginMutation();

  const onSubmit = async (data: any) => {
    try {
      const res: any = await login(data);
      if (res?.data) {
        Modals({ message: "Logged in successfully", status: true });
        setUserLocalStorage(res?.data?.data?.token);
        navigate("/");
        window.location.reload();
      } else {
        Modals({ message: res?.error?.data?.message || "Invalid credentials", status: false });
      }
    } catch (err: any) {
      Modals({ message: "Failed to login", status: false });
    }
  };

  return (
    <>
      <section className="min-h-screen flex items-start justify-center bg-gray-950 px-6 pt-20">

        {/* Card */}
        <div className="w-full max-w-md">



          <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl p-10">

            <div className="mb-8 text-center">
              <h2 className="text-lg font-bold text-white">Sign In</h2>
              <p className="text-gray-500 text-sm mt-1">Enter your credentials to access the admin panel</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-white uppercase tracking-widest mb-1.5">
                  Email or Username
                </label>
                <input
                  type="text"
                  {...register("username", { required: "Email is required" })}
                  className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm"
                  placeholder=" "
                />
                {errors.username && (
                  <p className="text-red-400 text-xs mt-1">{errors.username?.message as string}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-white uppercase tracking-widest mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    {...register("password", { required: "Password is required" })}
                    placeholder="••••••••"
                    className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-4 pr-11 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500 hover:text-gray-300 transition-colors duration-200"
                  >
                    {showPassword ? <MdVisibilityOff className="w-5 h-5" /> : <MdVisibility className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-400 text-xs mt-1">{errors.password?.message as string}</p>
                )}
              </div>

              {/* Submit */}
              {isLoading ? (
                <div className="flex justify-center py-3">
                  <div className="flex items-center gap-3">
                    <Spinner size="sm" />
                    <span className="text-gray-400 text-sm">Signing in...</span>
                  </div>
                </div>
              ) : (
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-4 px-4 rounded-xl transition-all duration-200 text-sm mt-2 shadow-lg"
                >
                  Sign In
                </button>
              )}

            </form>
          </div>

          <p className="text-center text-gray-600 text-xs mt-6">
            This is for SAS staff only. Students may browse the board without logging in.
          </p>

        </div>
      </section>
      <ToastContainer position="top-right" autoClose={3000} style={{ top: "70px" }} theme="dark" />
    </>
  );
};

export default Login;
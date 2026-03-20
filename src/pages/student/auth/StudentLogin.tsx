import React, { useState } from "react";
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { AuthLayout } from "../../../layouts/AuthLayout";
import api from "../../../api/axios";

export const StudentLogin: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response: any = await api.post("/auth/student-login", {
        email,
        password,
      });

      const authData = response.data;

      localStorage.setItem("accessToken", authData.accessToken);
      localStorage.removeItem("refreshToken");
      localStorage.setItem("user", JSON.stringify(authData.user));

      toast.success("Login successful. You can now attend your exam.");
      const from = (location.state as any)?.from?.pathname || "/student/exam";
      navigate(from, { replace: true });
    } catch (error: any) {
      toast.error(
        error?.message || "Invalid credentials. Please check your email and password.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Student Exam Login"
      subtitle="Use the credentials sent to your email to sign in"
    >
      <form onSubmit={handleStudentLogin} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Mail size={18} />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field pl-10"
              placeholder="your@email.com"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Lock size={18} />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field pl-10 pr-10"
              placeholder="Enter password from email"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button type="submit" disabled={isLoading} className="btn-primary">
          {isLoading ? (
            <div className="flex items-center">
              <Loader2 className="animate-spin mr-2" size={18} />
              Verifying...
            </div>
          ) : (
            <>
              Login And Continue
              <ArrowRight className="ml-2" size={18} />
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => navigate("/login")}
          className="w-full text-sm font-medium text-primary-600 hover:text-primary-500"
        >
          Staff Login
        </button>
      </form>
    </AuthLayout>
  );
};

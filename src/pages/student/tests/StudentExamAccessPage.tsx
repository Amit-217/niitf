import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, FileCode2, ArrowRight } from "lucide-react";
import { toast } from "react-toastify";

export const StudentExamAccessPage: React.FC = () => {
  const navigate = useNavigate();
  const [testId, setTestId] = useState("");

  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;

  const handleStartExam = (e: React.FormEvent) => {
    e.preventDefault();

    const id = testId.trim();
    if (!id) {
      toast.error("Please enter a test ID.");
      return;
    }

    const isObjectId = /^[a-f\d]{24}$/i.test(id);
    const isTestCode = /^TEST\d{4}$/i.test(id);
    if (!isObjectId && !isTestCode) {
      toast.error(
        "Invalid Test ID. Enter your Test Code (e.g. TEST1234) from the exam email.",
      );
      return;
    }

    navigate(`/test/${id}`);
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    toast.info("Logged out successfully.");
    navigate("/student/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 flex items-center justify-center">
      <div className="max-w-xl w-full bg-white border border-gray-100 shadow-xl rounded-3xl p-6 md:p-10">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold">
              Student Exam Portal
            </p>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 mt-1">
              Welcome{user?.name ? `, ${user.name}` : ""}
            </h1>
            <p className="text-sm text-gray-500 mt-2">
              Click the exam link from your email, or paste the Test ID from the
              email below.
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1 px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50"
          >
            <LogOut size={14} /> Logout
          </button>
        </div>

        <form onSubmit={handleStartExam} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Test Code{" "}
              <span className="text-xs text-gray-400 font-normal">
                (e.g. TEST1234 — from your exam email)
              </span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <FileCode2 size={18} />
              </div>
              <input
                type="text"
                value={testId}
                onChange={(e) => setTestId(e.target.value)}
                className="input-field pl-10"
                placeholder="e.g. TEST1234"
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-primary">
            Attend Exam
            <ArrowRight className="ml-2" size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

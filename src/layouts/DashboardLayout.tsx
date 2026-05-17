import React, { useState, useEffect, useRef, useCallback } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  Bell,
  User,
  LogOut,
  LayoutDashboard,
  Users,
  BookOpen,
  Clock,
  CircleHelp,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  ListTodo,
  FileText,
  GraduationCap,
  Search,
  ChevronDown,
  ChevronUp,
  Building2,
  FileBarChart2,
  ClipboardList,
  CalendarClock,
} from "lucide-react";

import { toast } from "react-toastify";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Breadcrumbs } from "../components/Breadcrumbs";
import {
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../api/notificationApi";
import { getAllTasks } from "../api/taskApi";

export const DashboardLayout: React.FC = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false); // desktop sidebar collapsed state
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isNotificationsLoading, setIsNotificationsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [myTaskCount, setMyTaskCount] = useState(0);

  // Sub-menu states
  const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({
    userManagement: true,
    studentManagement: true,
    customerManagement: true,
  });

  const toggleMenu = (menuKey: string) => {
    setOpenMenus((prev) => ({ ...prev, [menuKey]: !prev[menuKey] }));
  };

  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const sidebarCollapsed = isCollapsed && !isMobile;

  const navigate = useNavigate();
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Retrieve user data
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const role = user?.role || "EMPLOYEE";
  const basePath =
    role === "ADMIN" || role === "SUPER_ADMIN"
      ? "admin"
      : "employee";
  const currentUserId = user?.userId || user?.id || user?._id || "";

  const normalizeNotificationId = (value: any) => {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value === "object") {
      const id = value._id || value.id || value.userId;
      if (id) return String(id);
      return String(value);
    }
    return String(value);
  };

  const isTaskNotification = (item: any) => {
    const type = String(item?.type || "");
    return (
      type === "TASK_ASSIGNED" ||
      type === "TASK_UPDATE" ||
      type === "TASK_COMPLETED" ||
      String(item?._id || "").startsWith("task-feed-")
    );
  };

  const getNotificationSection = (item: any) => {
    const type = String(item?.type || "");
    if (type === "TASK_ASSIGNED") return "assigned";
    if (
      type === "TASK_UPDATE" ||
      type === "TASK_COMPLETED" ||
      String(item?._id || "").startsWith("task-feed-")
    )
      return "updates";
    return "other";
  };

  const getNotificationVisual = (item: any) => {
    const section = getNotificationSection(item);
    if (section === "assigned") {
      return {
        Icon: ListTodo,
        iconClass: "bg-primary-50 text-primary-700",
      };
    }
    if (section === "updates") {
      return {
        Icon: FileText,
        iconClass: "bg-amber-50 text-amber-700",
      };
    }
    return {
      Icon: Bell,
      iconClass: "bg-gray-50 text-gray-700",
    };
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setIsProfileDropdownOpen(false);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(e.target as Node)
      ) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchNotifications = useCallback(async () => {
    const isFirstLoad = notifications.length === 0;
    if (isFirstLoad) setIsNotificationsLoading(true);
    try {
      // Only fetch UNREAD notifications to ensure they "disappear" once read/visited
      const res = await getMyNotifications({ limit: 100, unread: true });
      const body: any = res;
      const fetched = Array.isArray(body?.data)
        ? body.data
        : Array.isArray(body)
          ? body
          : [];

      const uniqueNotifications = fetched.filter(
        (item: any, index: number, items: any[]) => {
          const id = normalizeNotificationId(item?._id);
          if (!id) return true;
          return (
            items.findIndex(
              (candidate: any) =>
                normalizeNotificationId(candidate?._id) === id,
            ) === index
          );
        },
      );

      // Further ensure we only show unread items in the list
      setNotifications(
        uniqueNotifications
          .filter((n: any) => !n.readAt)
          .sort(
            (a: any, b: any) =>
              new Date(b.createdAt || 0).getTime() -
              new Date(a.createdAt || 0).getTime(),
          ),
      );
    } catch (error: any) {
      console.error("Notification fetch error:", error);
      if (notifications.length === 0) {
        setNotifications([]);
      }
    } finally {
      if (isFirstLoad) setIsNotificationsLoading(false);
    }
  }, [notifications.length]);

  const fetchMyTaskCount = useCallback(async () => {
    if (!currentUserId) {
      setMyTaskCount(0);
      return;
    }

    try {
      const res = await getAllTasks();
      const allTasks = res.data?.data || (Array.isArray(res.data) ? res.data : []);
      const count = allTasks
        .filter((task: any) => {
        const isAssignedToMe = (task.assignedTo || []).some(
          (emp: any) => String(emp?._id || emp) === String(currentUserId),
        );
        return isAssignedToMe;
        })
        .filter((task: any) => task?.status === "ASSIGNED" || task?.status === "IN_PROGRESS")
        .length;
      setMyTaskCount(count);
    } catch {
      setMyTaskCount(0);
    }
  }, [role, currentUserId]);

  useEffect(() => {
    fetchNotifications();
    fetchMyTaskCount();
    const timer = window.setInterval(fetchNotifications, 5000);
    const taskTimer = window.setInterval(fetchMyTaskCount, 5000);
    const handleNotificationRefresh = () => {
      fetchNotifications();
    };
    const handleWindowFocus = () => {
      fetchNotifications();
    };
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchNotifications();
      }
    };
    window.addEventListener("notifications:refresh", handleNotificationRefresh);
    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.clearInterval(timer);
      window.clearInterval(taskTimer);
      window.removeEventListener(
        "notifications:refresh",
        handleNotificationRefresh,
      );
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchMyTaskCount, fetchNotifications]);

  const unreadCount = notifications.filter((item) => !item.readAt).length;

  const dismissNotificationLocally = (notification: any) => {
    const notificationId = normalizeNotificationId(notification?._id);
    if (!notificationId) return;

    setNotifications((prev) =>
      prev.filter(
        (item) => normalizeNotificationId(item._id) !== notificationId,
      ),
    );
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      // Clear notifications from the list since we only show unread ones
      setNotifications([]);
      toast.success("Cleared all notifications");
    } catch {
      toast.error("Failed to clear notifications");
    }
  };

  const handleBellClick = async () => {
    setIsProfileDropdownOpen(false);
    if (!isNotificationOpen) {
      await fetchNotifications();
    }
    setIsNotificationOpen((v) => !v);
  };

  const handleVisitNotification = async (notification: any) => {
    try {
      await markNotificationRead(notification._id);
    } catch {
      // Ignore read failures and still allow the notification to open.
    }

    dismissNotificationLocally(notification);
    setIsNotificationOpen(false);

    if (notification.taskId?._id || notification.taskId) {
      const taskPath = `/${basePath}/tasks`;
      navigate(taskPath, {
        state: { taskId: notification.taskId?._id || notification.taskId },
      });
    }
  };

  const handleCloseNotification = async (notification: any) => {
    const notificationId = normalizeNotificationId(notification._id);
    try {
      await markNotificationRead(notificationId);
    } catch {
      // Ignore close failures and still dismiss locally.
    }

    dismissNotificationLocally(notification);
  };

  const groupedNotifications = notifications.reduce(
    (acc, item) => {
      if (isTaskNotification(item)) {
        const section = getNotificationSection(item);
        if (section === "assigned") acc.assigned.push(item);
        else if (section === "updates") acc.updates.push(item);
        else acc.other.push(item);
      } else {
        acc.other.push(item);
      }
      return acc;
    },
    { assigned: [] as any[], updates: [] as any[], other: [] as any[] },
  );
  const bellNotificationCount = unreadCount;

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    toast.info("Logged out successfully.");
    navigate("/login", { replace: true });
  };

  const isAdminRole = role === "ADMIN" || role === "SUPER_ADMIN";

  const groups = [
          ...(isAdminRole
            ? [
                {
                  name: "User Management",
                  key: "userManagement",
                  icon: Users,
                  links: [
                    { name: "Users", path: `/${basePath}/users`, icon: Users },
                    {
                      name: "Salary Generation",
                      path: `/${basePath}/payroll/records`,
                      icon: LayoutDashboard,
                    },
                    {
                      name: "Payroll Config",
                      path: `/${basePath}/payroll/config`,
                      icon: Briefcase,
                    },
                    {
                      name: "Attendance",
                      path: `/${basePath}/attendance`,
                      icon: Clock,
                    },
                    {
                      name: "Admin Task",
                      path: `/${basePath}/tasks`,
                      icon: ListTodo,
                    },
                    {
                      name: "Overtime",
                      path: `/${basePath}/payroll/overtime`,
                      icon: Clock,
                    },
                    {
                      name: "Advances",
                      path: `/${basePath}/payroll/advances`,
                      icon: Briefcase,
                    },
                  ],
                },
                {
                  name: "Student Management",
                  key: "studentManagement",
                  icon: GraduationCap,
                  links: [
                    {
                      name: "Courses",
                      path: `/${basePath}/courses`,
                      icon: BookOpen,
                    },
                    {
                      name: "Batches",
                      path: `/${basePath}/batches`,
                      icon: Clock,
                    },
                    {
                      name: "Students",
                      path: `/${basePath}/students`,
                      icon: Users,
                    },
                    {
                      name: "Admissions",
                      path: `/${basePath}/admissions`,
                      icon: GraduationCap,
                    },
                    {
                      name: "Enquiries",
                      path: `/${basePath}/enquiries`,
                      icon: CircleHelp,
                    },
                    {
                      name: "Question Papers",
                      path: `/${basePath}/question-papers`,
                      icon: ClipboardList,
                    },
                    {
                      name: "Assign Tests",
                      path: `/${basePath}/assign-tests`,
                      icon: CalendarClock,
                    },
                  ],
                },
              ]
            : []),
          {
            name: "Customer Management",
            key: "customerManagement",
            icon: Building2,
            links: [
              { name: "Customer", path: `/${basePath}/customers`, icon: Users },
              {
                name: "All Reports",
                path: `/${basePath}/reports`,
                icon: FileBarChart2,
              },
              {
                name: "Quotations",
                path: `/${basePath}/quotations`,
                icon: FileText,
              },
              {
                name: "Invoices",
                path: `/${basePath}/invoices`,
                icon: FileText,
              },
            ],
          },
        ];

  const standaloneLinks = [
          {
            name: "Dashboard",
            path: `/${basePath}/dashboard`,
            icon: LayoutDashboard,
          },
          {
            name: "My Tasks",
            path: `/${basePath}/my-tasks`,
            icon: ListTodo,
          },
          { name: "Settings", path: `/${basePath}/settings`, icon: Briefcase },
        ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ── Top Navbar ─────────────────────────────────────────────────── */}
      <header className="bg-white border border-gray-200 shadow-sm z-30 fixed w-full top-0 h-16 flex items-center justify-between px-2 sm:px-4 lg:px-6 rounded-b-2xl">
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="lg:hidden p-2 text-gray-500 hover:text-primary-600 focus:outline-none rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isMobileSidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          {/* Brand Logo — navigates to dashboard */}
          <button
            onClick={() => navigate(`/${basePath}/dashboard`)}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <img
              src="/logo.png"
              alt="NIIT"
              className="w-24 h-12 object-contain"
            />
          </button>
        </div>

        {/* Right Header */}
        <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
          <div className="relative" ref={notificationRef}>
            <button
              onClick={handleBellClick}
              aria-label="Notifications"
              aria-expanded={isNotificationOpen}
              className="text-gray-500 hover:text-primary-600 relative p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Bell size={18} />
              {bellNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1.5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-md ring-2 ring-white">
                  {bellNotificationCount > 99 ? "99+" : bellNotificationCount}
                </span>
              )}
            </button>

            {isNotificationOpen && (
              <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">
                      Notifications
                    </p>
                    <p className="text-[11px] text-gray-500 mt-1">
                      {unreadCount} unread
                    </p>
                  </div>
                  <button
                    onClick={handleMarkAllRead}
                    disabled={!unreadCount}
                    className="text-xs font-bold text-primary-600 disabled:text-gray-300"
                  >
                    Mark all read
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {isNotificationsLoading ? (
                    <div className="p-5 text-center text-sm text-gray-500">
                      Loading notifications...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-5 text-center text-sm text-gray-500">
                      No recent notifications.
                    </div>
                  ) : (
                    <div className="p-2 space-y-4">
                      {[
                        {
                          key: "assigned",
                          title: "Task Assigned",
                          items: groupedNotifications.assigned,
                        },
                        {
                          key: "updates",
                          title: "Task Updates",
                          items: groupedNotifications.updates,
                        },
                        {
                          key: "other",
                          title: "Other Notifications",
                          items: groupedNotifications.other,
                        },
                      ].map(
                        (section) =>
                          section.items.length > 0 && (
                            <div key={section.key} className="space-y-2">
                              <div className="px-2 pt-1 flex items-center justify-between">
                                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
                                  {section.title}
                                </p>
                                <span className="text-[10px] font-black text-gray-300">
                                  {section.items.length}
                                </span>
                              </div>

                              <div className="space-y-2">
                                {section.items.map((item: any) => {
                                  const canVisit = Boolean(
                                    item.taskId?._id || item.taskId,
                                  );
                                  const isUnread = !item.readAt;
                                  const { Icon, iconClass } =
                                    getNotificationVisual(item);
                                  return (
                                    <div
                                      key={item._id}
                                      className={`rounded-2xl border p-3 transition-colors ${
                                        isUnread
                                          ? "border-gray-200 bg-white"
                                          : "border-gray-100 bg-gray-50/70"
                                      }`}
                                    >
                                      <div className="flex items-start gap-3">
                                        <div
                                          className={`mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${iconClass}`}
                                        >
                                          <Icon size={16} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <div className="flex items-center gap-2">
                                            <p className="text-sm font-bold text-gray-900 truncate">
                                              {item.title}
                                            </p>
                                            {isUnread && (
                                              <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
                                            )}
                                          </div>
                                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                            {item.message}
                                          </p>

                                          <div className="mt-3 flex items-center justify-end gap-2">
                                            {canVisit && (
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  handleVisitNotification(item)
                                                }
                                                className="px-3 py-1.5 rounded-lg bg-primary-600 text-white text-[11px] font-bold hover:bg-primary-700 transition-colors"
                                              >
                                                Visit
                                              </button>
                                            )}
                                            <button
                                              type="button"
                                              onClick={() =>
                                                handleCloseNotification(item)
                                              }
                                              className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-[11px] font-bold hover:bg-gray-50 transition-colors"
                                            >
                                              Close
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ),
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="flex items-center gap-2 focus:outline-none p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold border border-primary-200">
                {user?.name ? (
                  user.name.charAt(0).toUpperCase()
                ) : (
                  <User size={16} />
                )}
              </div>
              <span className="hidden md:block text-sm font-medium text-gray-700">
                {user?.name || "User"}
              </span>
            </button>

            {isProfileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 animate-in fade-in zoom-in duration-150">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-800">
                    {user?.name}
                  </p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">
                    {user?.email}
                  </p>
                  <span className="inline-block mt-1.5 text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full capitalize">
                    {role.replace("_", " ").toLowerCase()}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                >
                  <LogOut size={15} />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 pt-16">
        {/* Mobile overlay background */}
        {isMobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-gray-900/40 z-10 lg:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* ── Sidebar ───────────────────────────────────────────────── */}
        <aside
          className={`
                        fixed lg:sticky top-[76px] left-0 h-[calc(100dvh-76px)] max-h-[calc(100dvh-76px)]
                        bg-white border border-gray-200 rounded-r-2xl
                        shadow-lg z-20 flex flex-col overflow-visible
                        transition-all duration-300 ease-in-out
                        ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
                        ${sidebarCollapsed ? "lg:w-16 w-64" : "w-64"}
                    `}
        >
          {/* Sidebar Search - only desktop & expanded */}
          {!sidebarCollapsed && (
            <div className="px-4 pt-4 mb-2">
              <div className="relative group">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors"
                />
                <input
                  type="text"
                  placeholder="Search modules..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-100 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
                />
              </div>
            </div>
          )}

          {/* Nav Links */}
          <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5 custom-scrollbar">
            {/* Standalone Link: Dashboard */}
            <NavLink
              to={standaloneLinks[0].path}
              className={({ isActive }) => `
                                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group
                                ${sidebarCollapsed ? "justify-center" : ""}
                                ${
                                  isActive
                                    ? "bg-primary-50 text-primary-700 shadow-sm"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                }
                            `}
              onClick={() => setIsMobileSidebarOpen(false)}
            >
              {({ isActive }) => {
                const Icon = standaloneLinks[0].icon;
                return (
                  <>
                    <div
                      className={`p-1 rounded-lg transition-colors ${isActive ? "bg-white shadow-sm" : "group-hover:bg-white"}`}
                    >
                      <Icon
                        size={18}
                        className={`flex-shrink-0 ${isActive ? "text-primary-600" : "text-gray-400"}`}
                      />
                    </div>
                    {!sidebarCollapsed && (
                      <span className="truncate flex-1">
                        {standaloneLinks[0].name}
                      </span>
                    )}
                  </>
                );
              }}
            </NavLink>

            {standaloneLinks[1]?.name === "My Tasks" && (
              <NavLink
                to={standaloneLinks[1].path}
                className={({ isActive }) => `
                                    flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group mt-2
                                    ${sidebarCollapsed ? "justify-center" : ""}
                                    ${
                                      isActive
                                        ? "bg-primary-50 text-primary-700 shadow-sm"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                    }
                                `}
                onClick={() => setIsMobileSidebarOpen(false)}
              >
                {({ isActive }) => {
                  const Icon = standaloneLinks[1].icon;
                  return (
                    <>
                      <div
                        className={`p-1 rounded-lg transition-colors ${isActive ? "bg-white shadow-sm" : "group-hover:bg-white"}`}
                      >
                        <Icon
                          size={18}
                          className={`flex-shrink-0 ${isActive ? "text-primary-600" : "text-gray-400"}`}
                        />
                      </div>
                      {!sidebarCollapsed && (
                        <span className="truncate flex-1">My Tasks</span>
                      )}
                      {!sidebarCollapsed && (
                        <span className="ml-auto min-w-6 h-6 px-2 inline-flex items-center justify-center rounded-full bg-violet-100 text-violet-700 text-[10px] font-black">
                          {myTaskCount}
                        </span>
                      )}
                    </>
                  );
                }}
              </NavLink>
            )}

            {/* Grouped Menus */}
            {groups.map((group) => (
              <div key={group.key} className="mt-2">
                {!sidebarCollapsed && (
                  <button
                    onClick={() => toggleMenu(group.key)}
                    className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors"
                  >
                    <span>{group.name}</span>
                    {openMenus[group.key] ? (
                      <ChevronUp size={12} />
                    ) : (
                      <ChevronDown size={12} />
                    )}
                  </button>
                )}
                {(openMenus[group.key] || sidebarCollapsed) && (
                  <div
                    className={`space-y-0.5 ${!sidebarCollapsed ? "ml-2 border-l border-gray-100 pl-1" : ""}`}
                  >
                    {group.links
                      .filter((link) =>
                        link.name
                          .toLowerCase()
                          .includes(searchTerm.toLowerCase()),
                      )
                      .map((link) => {
                        const Icon = link.icon;
                        return (
                          <NavLink
                            key={link.name}
                            to={link.path}
                            title={sidebarCollapsed ? link.name : undefined}
                            className={({ isActive }) => `
                                                            flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group
                                                            ${sidebarCollapsed ? "justify-center" : ""}
                                                            ${
                                                              isActive
                                                                ? "bg-primary-50 text-primary-700 shadow-sm"
                                                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                                            }
                                                        `}
                            onClick={() => setIsMobileSidebarOpen(false)}
                          >
                            {({ isActive }) => (
                              <>
                                <div
                                  className={`p-1 rounded-lg transition-colors ${isActive ? "bg-white shadow-sm" : "group-hover:bg-white"}`}
                                >
                                  <Icon
                                    size={18}
                                    className={`flex-shrink-0 ${isActive ? "text-primary-600" : "text-gray-400"}`}
                                  />
                                </div>
                                {!sidebarCollapsed && (
                                  <span className="truncate flex-1">
                                    {link.name}
                                  </span>
                                )}
                                {isActive && !sidebarCollapsed && (
                                  <div className="w-1 h-4 bg-primary-600 rounded-full" />
                                )}
                              </>
                            )}
                          </NavLink>
                        );
                      })}
                  </div>
                )}
              </div>
            ))}

            {/* Standalone Link: Settings */}
            {standaloneLinks[standaloneLinks.length - 1]?.name ===
              "Settings" && (
              <NavLink
                to={standaloneLinks[standaloneLinks.length - 1].path}
                className={({ isActive }) => `
                                    flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group mt-2
                                    ${sidebarCollapsed ? "justify-center" : ""}
                                    ${
                                      isActive
                                        ? "bg-primary-50 text-primary-700 shadow-sm"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                    }
                                `}
                onClick={() => setIsMobileSidebarOpen(false)}
              >
                {({ isActive }) => {
                  const Icon = standaloneLinks[standaloneLinks.length - 1].icon;
                  return (
                    <>
                      <div
                        className={`p-1 rounded-lg transition-colors ${isActive ? "bg-white shadow-sm" : "group-hover:bg-white"}`}
                      >
                        <Icon
                          size={18}
                          className={`flex-shrink-0 ${isActive ? "text-primary-600" : "text-gray-400"}`}
                        />
                      </div>
                      {!sidebarCollapsed && (
                        <span className="truncate flex-1">
                          {standaloneLinks[standaloneLinks.length - 1].name}
                        </span>
                      )}
                    </>
                  );
                }}
              </NavLink>
            )}
          </div>

          {/* Simple Branding Footer */}
          <div className="p-4 border-t border-gray-50 flex flex-col items-center justify-center">
            {!sidebarCollapsed ? (
              <div className="text-center group cursor-default">
                <p className="text-[10px] font-medium text-gray-400 tracking-wider uppercase">
                  Powered by
                </p>
                <p className="text-xs font-black text-gray-600 mt-0.5 group-hover:text-primary-600 transition-colors">
                  Viplora Tech
                </p>
              </div>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-[10px] font-black text-gray-400 border border-gray-100 shadow-sm">
                VT
              </div>
            )}
          </div>

          {/* Floating collapse button — only desktop */}
          <button
            onClick={() => setIsCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex absolute top-6 -right-4 w-8 h-8 bg-white border border-gray-200 rounded-full shadow-md items-center justify-center text-gray-500 hover:text-gray-800 hover:shadow-lg transition-all z-30"
          >
            {sidebarCollapsed ? (
              <ChevronRight size={15} />
            ) : (
              <ChevronLeft size={15} />
            )}
          </button>
        </aside>

        {/* ── Main Content ───────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto bg-gray-50/50 min-w-0">
          <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl animate-in fade-in slide-in-from-bottom-2 duration-500">
            <Breadcrumbs />
            <Outlet />
          </div>
        </main>
      </div>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="light"
        style={{ zIndex: 99999 }}
      />
    </div>
  );
};

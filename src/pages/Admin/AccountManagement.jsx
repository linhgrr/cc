import React, { useState, useEffect, useRef } from "react";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import {
  FiSearch,
  FiFilter,
  FiChevronDown,
  FiChevronUp,
  FiArrowUp,
  FiArrowDown,
} from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { toast, ToastContainer } from "react-toastify";
import Pagination from "../../components/Pagination";
import EditUserRole from "../../components/features/admin/editUserRole";

function AccountManagement() {
  const navigate = useNavigate();
  const [user, setUser] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [sortField, setSortField] = useState("id");
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);
  const [rowHeight, setRowHeight] = useState(50);
  const [loading, setLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const roleDropdownRef = useRef(null);

  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [newAccount, setNewAccount] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "User",
  });

  const [selectedUserId, setSelectedUserId] = useState(null);
  const [isEditRoleModalOpen, setIsEditRoleModalOpen] = useState(false);

  // Add a click outside handler to close the dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (
        roleDropdownRef.current &&
        !roleDropdownRef.current.contains(event.target)
      ) {
        setIsRoleDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Sort options
  const sortOptions = [
    {
      value: "id_asc",
      label: (
        <span className="flex items-center">
          Sort by ID <FiArrowUp className="ml-1" />
        </span>
      ),
    },
    {
      value: "id_desc",
      label: (
        <span className="flex items-center">
          Sort by ID <FiArrowDown className="ml-1" />
        </span>
      ),
    },
    {
      value: "name_asc",
      label: (
        <span className="flex items-center">
          Sort by Name <FiArrowUp className="ml-1" />
        </span>
      ),
    },
    {
      value: "name_desc",
      label: (
        <span className="flex items-center">
          Sort by Name <FiArrowDown className="ml-1" />
        </span>
      ),
    },
    {
      value: "role_asc",
      label: (
        <span className="flex items-center">
          Sort by Role <FiArrowUp className="ml-1" />
        </span>
      ),
    },
    {
      value: "role_desc",
      label: (
        <span className="flex items-center">
          Sort by Role <FiArrowDown className="ml-1" />
        </span>
      ),
    },
  ];

  const calculateItemsPerPage = () => {
    // Fixed height elements
    const navbarHeight = 60; // Top navigation bar
    const headerHeight = 120; // Controls section with filters and buttons
    const paginationHeight = 70; // Pagination controls
    const tableHeaderHeight = 54; // Table header row
    const safetyBuffer = 20; // Extra buffer to prevent scrollbar issues

    // Calculate the total height of fixed elements
    const totalNonTableHeight =
      navbarHeight +
      headerHeight +
      paginationHeight +
      tableHeaderHeight +
      safetyBuffer;

    // Calculate available space for table rows
    const availableHeight = window.innerHeight - totalNonTableHeight;

    // Calculate how many rows can fit
    const calculatedRows = Math.max(3, Math.floor(availableHeight / rowHeight));

    // Limit to a reasonable range (3-20 rows)
    return Math.min(20, calculatedRows);
  };

  // Measure actual row height after rendering
  useEffect(() => {
    if (!loading) {
      const measureRowHeight = () => {
        const tableRows = document.querySelectorAll("tbody tr");
        if (tableRows.length > 0) {
          const actualRowHeight = tableRows[0].offsetHeight;
          if (actualRowHeight > 10) {
            // Sanity check to avoid division by zero
            setRowHeight(actualRowHeight);
          }
        }
      };

      measureRowHeight();
      // Small delay to ensure accurate measurement after render
      const timer = setTimeout(measureRowHeight, 100);
      return () => clearTimeout(timer);
    }
  }, [loading, user.length]);

  useEffect(() => {
    const handleResize = () => {
      const newItemsPerPage = calculateItemsPerPage();
      setItemsPerPage(newItemsPerPage);
      setWindowHeight(window.innerHeight);
    };

    window.addEventListener("resize", handleResize);

    // Initial calculation
    if (!loading) {
      handleResize();
    }

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [windowHeight, loading, rowHeight]);

  useEffect(() => {
    if (!loading) {
      setItemsPerPage(calculateItemsPerPage());
    }
  }, [searchTerm, sortOrder, loading, rowHeight]);

  useEffect(() => {
    const userRole = localStorage.getItem("role");
    if (userRole !== "Admin") {
      toast.error("Bạn không có quyền truy cập!");
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/user/");
      const usersWithFullName = response.data.map((user) => ({
        ...user,
        full_name: `${user.first_name || ""} ${user.last_name || ""}`.trim(),
      }));
      setUser(usersWithFullName);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa tài khoản này?")) return;
    try {
      await api.delete(`/api/user/${id}/delete/`);
      toast.success("Tài khoản đã bị xóa!");
      fetchUsers();
    } catch (error) {
      console.error(error);
      toast.error("Không thể xóa tài khoản.");
    }
  };

  const handleAddAccount = async (e) => {
    e.preventDefault();

    if (
      !newAccount.firstName ||
      !newAccount.lastName ||
      !newAccount.email ||
      !newAccount.password
    ) {
      toast.error("All fields are required!");
      return;
    }
    if (newAccount.password !== newAccount.confirmPassword) {
      toast.error("Password and confirm password do not match!");
      return;
    }

    try {
      await api.post("/api/user/register/", {
        first_name: newAccount.firstName,
        last_name: newAccount.lastName,
        email: newAccount.email,
        password: newAccount.password,
        role: newAccount.role,
      });

      try {
        await api.post("/api/user/send-account-info/", {
          email: newAccount.email,
          first_name: newAccount.firstName,
          last_name: newAccount.lastName,
          password: newAccount.password,
        });
        toast.success("Account created and email sent successfully!");
      } catch (emailError) {
        console.error("Failed to send email:", emailError);
        toast.warning("Account created but failed to send email notification.");
      }

      fetchUsers();
      setIsAddingAccount(false);
      setNewAccount({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "User",
      });
    } catch (error) {
      const errorMsg =
        error.response?.data?.detail ||
        Object.values(error.response?.data || {}).join(", ") ||
        "Failed to create account!";
      toast.error(errorMsg);
    }
  };

  // Handle sort order change
  const handleSortChange = (option) => {
    const [field, order] = option.split("_");
    setSortField(field === "name" ? "full_name" : field);
    setSortOrder(order);
    setIsDropdownOpen(false);
  };

  // Get current sort option label
  const getCurrentSortLabel = () => {
    const sortValue = `${
      sortField === "full_name" ? "name" : sortField
    }_${sortOrder}`;
    return (
      sortOptions.find((option) => option.value === sortValue)?.label ||
      sortOptions[0].label
    );
  };

  // Get current role filter label
  const getCurrentRoleLabel = () => {
    switch (filterRole) {
      case "Admin":
        return "Admin Only";
      case "User":
        return "Users Only";
      case "Library Keeper":
        return "Library Keepers Only";
      default:
        return "All Roles";
    }
  };

  // Handle role filter change
  const handleRoleChange = (role) => {
    setFilterRole(role);
    setIsRoleDropdownOpen(false);
  };

  // Sort and filter
  const filteredUsers = [...user]
    .filter((account) => {
      return (
        account.full_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (filterRole === "" || account.role === filterRole)
      );
    })
    .sort((a, b) => {
      const aVal = a[sortField]?.toString().toLowerCase();
      const bVal = b[sortField]?.toString().toLowerCase();
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const currentAccounts = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading)
    return (
      <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 z-50">
        <div className="h-full bg-[#004098CC] animate-loading-bar"></div>
      </div>
    );

  return (
    <div className="flex flex-1 flex-col h-full gap-[0.25rem]">
      {/* Controls Frame with Search, Filter, and Action Buttons */}
      <div className="bg-white p-[0.5rem] rounded-t-lg">
        <div className="flex flex-wrap justify-between items-center gap-[1rem]">
          {/* Left side - Create Account Button */}
          <div className="flex flex-wrap items-center gap-[1rem]">
            <button
              className="flex items-center px-4 py-2 rounded-full text-white bg-orange-500 hover:bg-orange-600"
              onClick={() => setIsAddingAccount(true)}
            >
              <FaPlus className="mr-2" /> Create Account
            </button>
          </div>

          {/* Right side - Search and Sort Controls */}
          <div className="flex flex-wrap items-center gap-[1rem]">
            {/* Search Control */}
            <div className="relative w-[16rem]">
              <FiSearch className="absolute left-[0.75rem] top-[0.75rem] text-gray-500 z-10" />
              <input
                type="text"
                placeholder="Search by name..."
                className="p-[0.5rem] pl-[2.5rem] border border-gray-300 rounded-full w-full bg-white text-black placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Role Filter Dropdown - Redesigned */}
            <div className="relative w-[13rem]" ref={roleDropdownRef}>
              <div
                className="flex items-center p-[0.5rem] pl-[2.5rem] pr-[2rem] border border-gray-300 rounded-full w-full bg-white text-black cursor-pointer hover:border-gray-400 transition-colors relative"
                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              >
                <FiFilter className="absolute left-[0.75rem] top-[0.75rem] text-gray-500 z-10" />
                <span>{getCurrentRoleLabel()}</span>
                <div className="absolute right-[0.75rem] top-[0.75rem] pointer-events-none text-gray-500">
                  {isRoleDropdownOpen ? <FiChevronUp /> : <FiChevronDown />}
                </div>
              </div>

              {isRoleDropdownOpen && (
                <div className="absolute mt-[0.25rem] w-full bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden">
                  <div
                    className={`p-[0.75rem] cursor-pointer transition-colors ${
                      filterRole === ""
                        ? "bg-[#0477BF] text-white font-medium"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => handleRoleChange("")}
                  >
                    <div className="flex items-center">
                      {filterRole === "" && (
                        <span className="inline-block w-[0.25rem] h-[0.25rem] bg-white rounded-full mr-[0.5rem]"></span>
                      )}
                      All Roles
                    </div>
                  </div>
                  <div
                    className={`p-[0.75rem] cursor-pointer transition-colors ${
                      filterRole === "Admin"
                        ? "bg-[#0477BF] text-white font-medium"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => handleRoleChange("Admin")}
                  >
                    <div className="flex items-center">
                      {filterRole === "Admin" && (
                        <span className="inline-block w-[0.25rem] h-[0.25rem] bg-white rounded-full mr-[0.5rem]"></span>
                      )}
                      Admin
                    </div>
                  </div>
                  <div
                    className={`p-[0.75rem] cursor-pointer transition-colors ${
                      filterRole === "User"
                        ? "bg-[#0477BF] text-white font-medium"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => handleRoleChange("User")}
                  >
                    <div className="flex items-center">
                      {filterRole === "User" && (
                        <span className="inline-block w-[0.25rem] h-[0.25rem] bg-white rounded-full mr-[0.5rem]"></span>
                      )}
                      Users
                    </div>
                  </div>
                  <div
                    className={`p-[0.75rem] cursor-pointer transition-colors ${
                      filterRole === "Library Keeper"
                        ? "bg-[#0477BF] text-white font-medium"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => handleRoleChange("Library Keeper")}
                  >
                    <div className="flex items-center">
                      {filterRole === "Library Keeper" && (
                        <span className="inline-block w-[0.25rem] h-[0.25rem] bg-white rounded-full mr-[0.5rem]"></span>
                      )}
                      Library Keepers
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="relative w-[13rem]" ref={dropdownRef}>
              <div
                className="flex items-center p-[0.5rem] pl-[2.5rem] pr-[2rem] border border-gray-300 rounded-full w-full bg-white text-black cursor-pointer hover:border-gray-400 transition-colors relative"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <FiFilter className="absolute left-[0.75rem] top-[0.75rem] text-gray-500 z-10" />
                <span>{getCurrentSortLabel()}</span>
                <div className="absolute right-[0.75rem] top-[0.75rem] pointer-events-none text-gray-500">
                  {isDropdownOpen ? <FiChevronUp /> : <FiChevronDown />}
                </div>
              </div>

              {isDropdownOpen && (
                <div className="absolute mt-[0.25rem] w-full bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden">
                  {sortOptions.map((option) => (
                    <div
                      key={option.value}
                      className={`p-[0.75rem] cursor-pointer transition-colors ${
                        option.value ===
                        `${
                          sortField === "full_name" ? "name" : sortField
                        }_${sortOrder}`
                          ? "bg-[#0477BF] text-white font-medium"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => handleSortChange(option.value)}
                    >
                      <div className="flex items-center">
                        {option.value ===
                          `${
                            sortField === "full_name" ? "name" : sortField
                          }_${sortOrder}` && (
                          <span className="inline-block w-[0.25rem] h-[0.25rem] bg-white rounded-full mr-[0.5rem]"></span>
                        )}
                        {option.value ===
                        `${
                          sortField === "full_name" ? "name" : sortField
                        }_${sortOrder}` ? (
                          <div className="ml-[0.25rem]">{option.label}</div>
                        ) : (
                          option.label
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Frame with Table */}
      <div className="bg-white p-[0.5rem] rounded-b-lg flex-1 flex flex-col">
        {/* Table section */}
        <div className="overflow-auto flex-1">
          <table className="w-full border-collapse bg-white rounded-lg">
            <thead>
              <tr className="bg-[#004098CC] text-white font-bold">
                <th className="p-[0.75rem] border-b border-gray-300 w-[5%] text-center">
                  No
                </th>
                <th className="p-[0.75rem] border-b border-gray-300 w-[25%] text-center">
                  Name
                </th>
                <th className="p-[0.75rem] border-b border-gray-300 w-[15%] text-center">
                  Role
                </th>
                <th className="p-[0.75rem] border-b border-gray-300 w-[30%] text-center">
                  Email
                </th>
                <th className="p-[0.75rem] border-b border-gray-300 w-[25%] text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {currentAccounts.map((account, index) => (
                <tr
                  key={account.id}
                  className={`hover:bg-gray-50 cursor-pointer transition-colors duration-150 ${
                    index % 2 === 0 ? "bg-white" : "bg-[#F8F8F8]"
                  }`}
                >
                  <td className="p-[0.75rem] border-b border-gray-200 text-center">
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </td>
                  <td className="p-[0.75rem] border-b border-gray-200 text-center">
                    <div className="flex items-center space-x-[0.5rem] justify-center">
                      <span>{account.full_name}</span>
                    </div>
                  </td>
                  <td className="p-[0.75rem] border-b border-gray-200 text-center">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                      {account.role}
                    </span>
                  </td>
                  <td className="p-[0.75rem] border-b border-gray-200 text-center">
                    {account.email}
                  </td>
                  <td className="p-[0.75rem] border-b border-gray-200 text-center">
                    <div className="flex justify-center space-x-[1rem]">
                      <button
                        onClick={() => {
                          setSelectedUserId(account.id);
                          setIsEditRoleModalOpen(true);
                        }}
                        className="p-[0.5rem] bg-blue-100 rounded-md hover:bg-blue-200 flex items-center justify-center transition-colors"
                        title="Edit Role"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-blue-600 w-[1.25rem] h-[1.25rem]"
                        >
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        className="p-[0.5rem] bg-red-100 rounded-md hover:bg-red-200 flex items-center justify-center transition-colors"
                        title="Delete Account"
                        onClick={() => handleDelete(account.id)}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-red-600 w-[1.25rem] h-[1.25rem]"
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          <line x1="10" y1="11" x2="10" y2="17" />
                          <line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Modal for creating account */}
      {isAddingAccount && (
        <div
          className="fixed inset-0 flex justify-center items-center z-50 bg-black/20 backdrop-blur-[1px]"
          onClick={() => setIsAddingAccount(false)}
        >
          <div
            className="bg-white p-8 rounded-2xl shadow-2xl max-w-lg w-full mx-4 transform transition-all duration-300 scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-[#004098] mb-2">
                Create New Account
              </h3>
              <p className="text-gray-600 text-sm">
                Fill in the details to create a new user account
              </p>
            </div>

            <form onSubmit={handleAddAccount} className="space-y-5">
              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-gray-700 text-sm font-semibold">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={newAccount.firstName}
                      onChange={(e) =>
                        setNewAccount({
                          ...newAccount,
                          firstName: e.target.value,
                        })
                      }
                      className="w-full p-3 pl-10 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#004098] focus:ring-2 focus:ring-[#004098]/20 transition-all duration-200"
                      placeholder="Enter first name"
                      required
                    />
                    <svg
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-gray-700 text-sm font-semibold">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={newAccount.lastName}
                      onChange={(e) =>
                        setNewAccount({ ...newAccount, lastName: e.target.value })
                      }
                      className="w-full p-3 pl-10 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#004098] focus:ring-2 focus:ring-[#004098]/20 transition-all duration-200"
                      placeholder="Enter last name"
                      required
                    />
                    <svg
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <label className="block text-gray-700 text-sm font-semibold">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={newAccount.email}
                    onChange={(e) =>
                      setNewAccount({ ...newAccount, email: e.target.value })
                    }
                    className="w-full p-3 pl-10 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#004098] focus:ring-2 focus:ring-[#004098]/20 transition-all duration-200"
                    placeholder="example@mail.com"
                    required
                  />
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-gray-700 text-sm font-semibold">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={newAccount.password}
                      onChange={(e) =>
                        setNewAccount({ ...newAccount, password: e.target.value })
                      }
                      className="w-full p-3 pl-10 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#004098] focus:ring-2 focus:ring-[#004098]/20 transition-all duration-200"
                      placeholder="Enter password"
                      required
                    />
                    <svg
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-gray-700 text-sm font-semibold">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={newAccount.confirmPassword}
                      onChange={(e) =>
                        setNewAccount({
                          ...newAccount,
                          confirmPassword: e.target.value,
                        })
                      }
                      className="w-full p-3 pl-10 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#004098] focus:ring-2 focus:ring-[#004098]/20 transition-all duration-200"
                      placeholder="Confirm password"
                      required
                    />
                    <svg
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Role Field */}
              <div className="space-y-2">
                <label className="block text-gray-700 text-sm font-semibold">
                  Account Role <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={newAccount.role}
                    onChange={(e) =>
                      setNewAccount({ ...newAccount, role: e.target.value })
                    }
                    className="w-full p-3 pl-10 pr-10 border-2 border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#004098] focus:ring-2 focus:ring-[#004098]/20 transition-all duration-200 appearance-none"
                    required
                  >
                    <option value="User">User</option>
                    <option value="Admin">Admin</option>
                    <option value="Library Keeper">Library Keeper</option>
                  </select>
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <svg
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center gap-4 pt-6">
                <button
                  type="button"
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold transition-all duration-200 border border-gray-300"
                  onClick={() => setIsAddingAccount(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-[#004098] to-[#0477BF] text-white rounded-lg hover:from-[#003875] hover:to-[#035a9e] font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add EditUserRole modal */}
      <EditUserRole
        isOpen={isEditRoleModalOpen}
        onClose={() => {
          setIsEditRoleModalOpen(false);
          setSelectedUserId(null);
        }}
        userId={selectedUserId}
      />

      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
}

export default AccountManagement;
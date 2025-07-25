import { useState, useEffect, useRef } from "react";
import {
  FaPlus,
  FaFileExport,
  FaCloudUploadAlt,
  FaInfoCircle,
} from "react-icons/fa";
import {
  FiSearch,
  FiFilter,
  FiChevronDown,
  FiChevronUp,
  FiAlertCircle,
  FiArrowUp,
  FiArrowDown,
  FiCloud,
  FiCheck,
  FiX,
} from "react-icons/fi";
import * as XLSX from "xlsx";
import api from "../../services/api";
import { ToastContainer, toast } from "react-toastify";
import Pagination from "../../components/Pagination";

const CommonLibraryManagement = () => {
  const [keywords, setKeywords] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("id_asc");
  const [selectedKeyword, setSelectedKeyword] = useState(null);
  const [editingKeyword, setEditingKeyword] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const [role, setRole] = useState(localStorage.getItem("role") || "");
  const [newKeyword, setNewKeyword] = useState({
    japanese: "",
    english: "",
    vietnamese: "",
    chinese_traditional: "",
    chinese_simplified: "",
  });

  const [isAddingKeyword, setIsAddingKeyword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [rowHeight, setRowHeight] = useState(50); // Track row height explicitly
  const [deleteConfirmModal, setDeleteConfirmModal] = useState({
    isOpen: false,
    keywordId: null,
  });

  // GCS Upload states
  const [gcsStatus, setGcsStatus] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showGcsInfo, setShowGcsInfo] = useState(false);

  // Update role when localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      setRole(localStorage.getItem("role") || "");
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Add a click outside handler to close the dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Options for the sort dropdown
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
      value: "date_asc",
      label: (
        <span className="flex items-center">
          Sort by Date <FiArrowUp className="ml-1" />
        </span>
      ),
    },
    {
      value: "date_desc",
      label: (
        <span className="flex items-center">
          Sort by Date <FiArrowDown className="ml-1" />
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
  }, [loading, keywords.length]);

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
  }, [windowHeight, loading, rowHeight]); // Add rowHeight as dependency

  useEffect(() => {
    if (!loading) {
      setItemsPerPage(calculateItemsPerPage());
    }
  }, [searchTerm, sortOrder, loading, rowHeight]);

  useEffect(() => {
    const fetchKeywords = async () => {
      try {
        const res = await api.get("/api/common-keyword/suggestions/");
        // Lọc chỉ lấy các từ ở trạng thái approved
        const approvedKeywords = res.data.filter(
          (keyword) => keyword.status === "approved"
        );
        setKeywords(approvedKeywords);
      } catch (error) {
        console.error("Error fetching keywords:", error);
        toast.error("Failed to fetch common keywords!", {
          style: { backgroundColor: "red", color: "white" },
          icon: <FiAlertCircle />,
        });
      } finally {
        setLoading(false);
      }
    };

    const fetchGCSStatus = async () => {
      try {
        const response = await api.get("/api/keywords/gcs-status/");
        setGcsStatus(response.data);
      } catch (err) {
        console.error("Failed to fetch GCS status:", err);
      }
    };

    fetchKeywords();
    fetchGCSStatus();
  }, []);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/common-keyword/${id}/delete/`);
      const res = await api.get("/api/common-keyword/suggestions/");
      const approvedKeywords = res.data.filter(
        (keyword) => keyword.status === "approved"
      );
      setKeywords(approvedKeywords);

      toast.success("Common keyword deleted successfully!", {
        style: { backgroundColor: "green", color: "white" },
        icon: <FiAlertCircle />,
      });
    } catch (error) {
      console.error("Error deleting keyword:", error);
      toast.error("Failed to delete common keyword!", {
        style: { backgroundColor: "red", color: "white" },
        icon: <FiAlertCircle />,
      });
    } finally {
      setDeleteConfirmModal({ isOpen: false, keywordId: null });
    }
  };

  const handleEdit = (keyword) => {
    setEditingKeyword({ ...keyword });
  };

  const handleSave = async () => {
    try {
      const res = await api.put(
        `/api/common-keyword/${editingKeyword.id}/update/`,
        editingKeyword
      );
      setKeywords(
        keywords.map((item) =>
          item.id === editingKeyword.id ? res.data : item
        )
      );

      // Tạo notification cho tất cả users về việc sửa từ khóa
      try {
        await api.post("/api/notifications/create-for-all/", {
          title: "Keyword Updated",
          message: "A keyword in the library has been updated.",
          details: true,
          keyword_details: [
            {
              id: editingKeyword.id,
              japanese: editingKeyword.japanese || "",
              english: editingKeyword.english || "",
              vietnamese: editingKeyword.vietnamese || "",
              chinese_traditional: editingKeyword.chinese_traditional || "",
              chinese_simplified: editingKeyword.chinese_simplified || "",
              action: "updated",
              updated_at: new Date().toISOString(),
            },
          ],
        });
      } catch (notificationError) {
        console.error("Failed to create notification:", notificationError);
      }

      setEditingKeyword(null);
      toast.success("Common keyword updated successfully!", {
        style: { backgroundColor: "green", color: "white" },
        icon: <FiAlertCircle />,
      });
    } catch (error) {
      console.error("Error updating keyword:", error);
      toast.error("Failed to update common keyword!", {
        style: { backgroundColor: "red", color: "white" },
        icon: <FiAlertCircle />,
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditingKeyword({ ...editingKeyword, [name]: value });
  };

  const handleAddKeyword = async () => {
    const filledLanguages = Object.values(newKeyword).filter(
      (val) => val.trim() !== ""
    );
    if (filledLanguages.length === 0) {
      toast.error("Please enter at least one language field!", {
        style: { backgroundColor: "red", color: "white" },
        icon: <FiAlertCircle />,
      });
      return;
    }

    try {
      await api.post("/api/common-keyword/suggestions/", newKeyword);
      toast.success("Suggestion submitted successfully!", {
        style: { backgroundColor: "green", color: "white" },
        icon: <FiAlertCircle />,
      });
      setIsAddingKeyword(false);
      setNewKeyword({
        japanese: "",
        english: "",
        vietnamese: "",
        chinese_traditional: "",
        chinese_simplified: "",
      });
    } catch (error) {
      const errorMsg =
        error.response?.data?.detail ||
        Object.values(error.response?.data || {}).join(", ") ||
        "Failed to submit suggestion!";
      toast.error(errorMsg, {
        style: { backgroundColor: "red", color: "white" },
        icon: <FiAlertCircle />,
      });
    }
  };

  const handleUploadToGCS = async () => {
    if (!gcsStatus?.can_upload) {
      toast.error("No approved keywords available to upload!", {
        style: { backgroundColor: "red", color: "white" },
        icon: <FiAlertCircle />,
      });
      return;
    }

    if (!gcsStatus?.user_permissions?.can_upload) {
      toast.error("Permission denied. Admin access required!", {
        style: { backgroundColor: "red", color: "white" },
        icon: <FiAlertCircle />,
      });
      return;
    }

    setIsUploading(true);
    try {
      // Upload keywords to GCS and update glossaries
      const uploadResponse = await api.post("/api/keywords/upload-to-gcs/");
      const result = uploadResponse.data;

      // Tạo message chi tiết về glossary updates
      let successMessage = `Successfully created CSV file and uploaded ${result.details.approved_keywords_count} keywords to GCS!`;

      if (result.details.glossary_updates) {
        const { successful, failed } = result.details.glossary_updates;
        successMessage += ` Updated ${successful} glossaries.`;

        if (failed > 0) {
          successMessage += ` (${failed} glossary updates failed)`;
        }
      }

      toast.success(successMessage, {
        style: { backgroundColor: "green", color: "white" },
        icon: <FiCheck />,
        autoClose: 5000, // Hiển thị lâu hơn cho message dài
      });

      // Log glossary details để debug
      if (result.details.glossary_updates?.errors?.length > 0) {
        console.warn(
          "Glossary update errors:",
          result.details.glossary_updates.errors
        );
      }

      // Refresh GCS status
      const statusResponse = await api.get("/api/keywords/gcs-status/");
      setGcsStatus(statusResponse.data);
    } catch (err) {
      const errorMsg =
        err.response?.data?.error || "Failed to upload keywords to GCS!";
      toast.error(errorMsg, {
        style: { backgroundColor: "red", color: "white" },
        icon: <FiX />,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleExport = () => {
    const exportData = keywords.map((keyword) => ({
      original_word: keyword.japanese || "",
      target_word: keyword.english || "",
      original_language: "Japanese",
      target_language: "English",
      date_modified: keyword.date_modified || "",
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Keywords");
    XLSX.writeFile(workbook, "keywords.xlsx");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // Return original if invalid date

    // Format as MM/DD/YY
    return `${(date.getMonth() + 1).toString().padStart(2, "0")}/${date
      .getDate()
      .toString()
      .padStart(2, "0")}/${date.getFullYear().toString().substring(2)}`;
  };

  const filteredKeywords = keywords
    .filter((item) => {
      const originalWord = item.japanese || "";
      const targetWord = item.english || "";

      return (
        originalWord.includes(searchTerm) ||
        targetWord.toLowerCase().includes(searchTerm.toLowerCase())
      );
    })
    .sort((a, b) => {
      const dateA = a.date_modified || "";
      const dateB = b.date_modified || "";

      switch (sortOrder) {
        case "id_asc":
          return a.id - b.id;
        case "id_desc":
          return b.id - a.id;
        case "date_asc":
          return dateA.localeCompare(dateB);
        case "date_desc":
          return dateB.localeCompare(dateA);
        default:
          return a.id - b.id;
      }
    });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredKeywords.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredKeywords.length / itemsPerPage);

  const isFormValid = () => {
    return Object.values(newKeyword).some((val) => val.trim() !== "");
  };

  return (
    <div className="flex flex-1 flex-col h-full gap-[0.25rem]">
      {/* Loading Bar */}
      {loading && (
        <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 z-50">
          <div className="h-full bg-[#004098CC] animate-loading-bar"></div>
        </div>
      )}

      {/* Controls Frame with Search, Sort, and Action Buttons */}
      <div className="bg-white p-[0.5rem] rounded-t-lg">
        <div className="flex flex-wrap justify-between items-center gap-[1rem]">
          {/* Left side - Import/Export Buttons */}
          <div className="flex flex-wrap items-center gap-[1rem]">
            <button
              className="flex items-center px-4 py-2 rounded-full text-white bg-orange-500 hover:bg-orange-600"
              onClick={() => setIsAddingKeyword(true)}
            >
              <FaPlus className="mr-2" /> Suggest Keyword
            </button>

            <button
              className="flex items-center justify-center px-4 py-2 bg-[#359740] text-white rounded-full hover:bg-[#2e8237] min-w-[130px]"
              onClick={handleExport}
            >
              <FaFileExport className="mr-2" /> Export
            </button>

            {(role === "Library Keeper" || role === "Admin") && (
              <button
                className={`flex items-center justify-center px-4 py-2 text-white rounded-full min-w-[150px] transition-colors ${
                  isUploading
                    ? "bg-gray-400 cursor-not-allowed"
                    : gcsStatus?.can_upload &&
                      gcsStatus?.user_permissions?.can_upload
                    ? "bg-blue-500 hover:bg-blue-600"
                    : "bg-gray-400 cursor-not-allowed"
                }`}
                onClick={handleUploadToGCS}
                disabled={
                  isUploading ||
                  !gcsStatus?.can_upload ||
                  !gcsStatus?.user_permissions?.can_upload
                }
                title={
                  !gcsStatus?.user_permissions?.can_upload
                    ? "Admin permission required"
                    : !gcsStatus?.can_upload
                    ? "No approved keywords to upload"
                    : "Upload approved keywords to Google Cloud Storage"
                }
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <FaCloudUploadAlt className="mr-2" /> Upload to GCS
                  </>
                )}
              </button>
            )}

            {(role === "Library Keeper" || role === "Admin") && (
              <button
                className="flex items-center justify-center px-3 py-2 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition-colors"
                onClick={() => setShowGcsInfo(!showGcsInfo)}
                title="Show GCS Status Info"
              >
                <FaInfoCircle />
              </button>
            )}
          </div>

          {/* Right side - Search and Sort Controls */}
          <div className="flex flex-wrap items-center gap-[1rem]">
            {/* Search Control */}
            <div className="relative w-[16rem]">
              <FiSearch className="absolute left-[0.75rem] top-[0.75rem] text-gray-500 z-10" />
              <input
                type="text"
                placeholder="Search keyword..."
                className="p-[0.5rem] pl-[2.5rem] border border-gray-300 rounded-full w-full bg-white text-black placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Sort Control */}
            <div className="relative w-[13rem]" ref={dropdownRef}>
              <div
                className="flex items-center p-[0.5rem] pl-[2.5rem] pr-[2rem] border border-gray-300 rounded-full w-full bg-white text-black cursor-pointer hover:border-gray-400 transition-colors relative"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <FiFilter className="absolute left-[0.75rem] top-[0.75rem] text-gray-500 z-10" />
                <span>
                  {
                    sortOptions.find((option) => option.value === sortOrder)
                      ?.label
                  }
                </span>
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
                        sortOrder === option.value
                          ? "bg-[#0477BF] text-white font-medium"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => {
                        setSortOrder(option.value);
                        setIsDropdownOpen(false);
                      }}
                    >
                      <div className="flex items-center">
                        {option.value === sortOrder && (
                          <span className="inline-block w-[0.25rem] h-[0.25rem] bg-white rounded-full mr-[0.5rem]"></span>
                        )}
                        {option.value === sortOrder ? (
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
          <table className="w-full border-collapse bg-white overflow-hidden">
            <thead>
              <tr className="bg-[#004098CC] text-white font-bold">
                <th
                  className={`p-[0.75rem] border-b border-gray-300 text-center ${
                    role === "Library Keeper" || role === "Admin"
                      ? "w-[5%]"
                      : "w-[8%]"
                  }`}
                >
                  No
                </th>
                <th
                  className={`p-[0.75rem] border-b border-gray-300 ${
                    role === "Library Keeper" || role === "Admin"
                      ? "w-[15%]"
                      : "w-[18%]"
                  } text-center`}
                >
                  Japanese
                </th>
                <th
                  className={`p-[0.75rem] border-b border-gray-300 ${
                    role === "Library Keeper" || role === "Admin"
                      ? "w-[15%]"
                      : "w-[18%]"
                  } text-center`}
                >
                  English
                </th>
                <th
                  className={`p-[0.75rem] border-b border-gray-300 ${
                    role === "Library Keeper" || role === "Admin"
                      ? "w-[15%]"
                      : "w-[18%]"
                  } text-center`}
                >
                  Vietnamese
                </th>
                <th
                  className={`p-[0.75rem] border-b border-gray-300 ${
                    role === "Library Keeper" || role === "Admin"
                      ? "w-[15%]"
                      : "w-[18%]"
                  } text-center`}
                >
                  Chinese (Traditional)
                </th>
                <th
                  className={`p-[0.75rem] border-b border-gray-300 ${
                    role === "Library Keeper" || role === "Admin"
                      ? "w-[15%]"
                      : "w-[18%]"
                  } text-center`}
                >
                  Chinese (Simplified)
                </th>
                <th
                  className={`p-[0.75rem] border-b border-gray-300 ${
                    role === "Library Keeper" || role === "Admin"
                      ? "w-[10%]"
                      : "w-[12%]"
                  } text-center`}
                >
                  Date Modified
                </th>
                {(role === "Library Keeper" || role === "Admin") && (
                  <th className="p-[0.75rem] border-b border-gray-300 w-[10%] text-center">
                    Action
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {currentItems.map((item, index) => (
                <tr
                  key={item.id}
                  className={`hover:bg-gray-50 cursor-pointer transition-colors duration-150 ${
                    index % 2 === 0 ? "bg-white" : "bg-[#F8F8F8]"
                  }`}
                  onClick={() => setSelectedKeyword(item)}
                >
                  <td className="p-[0.75rem] border-b border-gray-200 text-center">
                    {index + 1 + (currentPage - 1) * itemsPerPage}
                  </td>
                  <td className="p-[0.75rem] border-b border-gray-200 truncate max-w-[200px] text-center">
                    {item.japanese || ""}
                  </td>
                  <td className="p-[0.75rem] border-b border-gray-200 truncate max-w-[200px] text-center">
                    {item.english || ""}
                  </td>
                  <td className="p-[0.75rem] border-b border-gray-200 truncate max-w-[200px] text-center">
                    {item.vietnamese || ""}
                  </td>
                  <td className="p-[0.75rem] border-b border-gray-200 truncate max-w-[200px] text-center">
                    {item.chinese_traditional || ""}
                  </td>
                  <td className="p-[0.75rem] border-b border-gray-200 truncate max-w-[200px] text-center">
                    {item.chinese_simplified || ""}
                  </td>
                  <td className="p-[0.75rem] border-b border-gray-200 text-center text-sm truncate">
                    {formatDate(item.updated_at)}
                  </td>
                  {(role === "Library Keeper" || role === "Admin") && (
                    <td className="p-[0.75rem] border-b border-gray-200 text-center">
                      <div className="flex justify-center space-x-[1rem]">
                        <button
                          className="p-[0.5rem] bg-blue-100 rounded-md hover:bg-blue-200 flex items-center justify-center transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(item);
                          }}
                          title="Edit Keyword"
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
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmModal({
                              isOpen: true,
                              keywordId: item.id,
                            });
                          }}
                          title="Delete Keyword"
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
                  )}
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

      {/* Keep all modals unchanged */}
      {selectedKeyword && (
        <div
          className="fixed inset-0 flex justify-center items-center z-50"
          style={{ backgroundColor: "rgba(255, 255, 255, 0.7)" }}
          onClick={() => setSelectedKeyword(null)}
        >
          <div
            className="bg-white p-6 rounded-lg shadow-xl max-w-4xl w-11/12 max-h-[90vh] overflow-auto text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg text-[#004098CC] font-bold mb-4">
              KEYWORD DETAILS
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-white">
                <thead>
                  <tr className="bg-[#004098CC] text-white font-bold">
                    <th className="p-[0.75rem] border-b border-gray-300 w-[20%] text-center">
                      Japanese
                    </th>
                    <th className="p-[0.75rem] border-b border-gray-300 w-[20%] text-center">
                      English
                    </th>
                    <th className="p-[0.75rem] border-b border-gray-300 w-[20%] text-center">
                      Vietnamese
                    </th>
                    <th className="p-[0.75rem] border-b border-gray-300 w-[20%] text-center">
                      Chinese (Traditional)
                    </th>
                    <th className="p-[0.75rem] border-b border-gray-300 w-[20%] text-center">
                      Chinese (Simplified)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-gray-50">
                    <td className="p-[0.75rem] border-b border-gray-200 truncate max-w-[200px] text-center">
                      {selectedKeyword.japanese || ""}
                    </td>
                    <td className="p-[0.75rem] border-b border-gray-200 truncate max-w-[200px] text-center">
                      {selectedKeyword.english || ""}
                    </td>
                    <td className="p-[0.75rem] border-b border-gray-200 truncate max-w-[200px] text-center">
                      {selectedKeyword.vietnamese || ""}
                    </td>
                    <td className="p-[0.75rem] border-b border-gray-200 truncate max-w-[200px] text-center">
                      {selectedKeyword.chinese_traditional || ""}
                    </td>
                    <td className="p-[0.75rem] border-b border-gray-200 truncate max-w-[200px] text-center">
                      {selectedKeyword.chinese_simplified || ""}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <button
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              onClick={() => setSelectedKeyword(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {editingKeyword && (role === "Library Keeper" || role === "Admin") && (
        <div
          className="fixed inset-0 flex justify-center items-center z-50"
          style={{ backgroundColor: "rgba(255, 255, 255, 0.7)" }}
          onClick={() => setEditingKeyword(null)}
        >
          <div
            className="bg-white p-6 rounded-lg shadow-xl max-w-4xl w-11/12 max-h-[90vh] overflow-auto text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg text-[#004098CC] font-bold mb-4">
              EDIT KEYWORD
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
            >
              <div className="overflow-x-auto">
                <table className="w-full border-collapse bg-white">
                  <thead>
                    <tr className="bg-[#004098CC] text-white font-bold">
                      <th className="p-[0.75rem] border-b border-gray-300 w-[20%] text-center">
                        Japanese
                      </th>
                      <th className="p-[0.75rem] border-b border-gray-300 w-[20%] text-center">
                        English
                      </th>
                      <th className="p-[0.75rem] border-b border-gray-300 w-[20%] text-center">
                        Vietnamese
                      </th>
                      <th className="p-[0.75rem] border-b border-gray-300 w-[20%] text-center">
                        Chinese (Traditional)
                      </th>
                      <th className="p-[0.75rem] border-b border-gray-300 w-[20%] text-center">
                        Chinese (Simplified)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="hover:bg-gray-50">
                      <td className="p-[0.75rem] border-b border-gray-200">
                        <textarea
                          name="japanese"
                          value={editingKeyword.japanese || ""}
                          onChange={handleChange}
                          className="w-full p-2 border-2 border-gray-300 rounded resize-y text-center"
                        />
                      </td>
                      <td className="p-[0.75rem] border-b border-gray-200">
                        <textarea
                          name="english"
                          value={editingKeyword.english || ""}
                          onChange={handleChange}
                          className="w-full p-2 border-2 border-gray-300 rounded resize-y text-center"
                        />
                      </td>
                      <td className="p-[0.75rem] border-b border-gray-200">
                        <textarea
                          name="vietnamese"
                          value={editingKeyword.vietnamese || ""}
                          onChange={handleChange}
                          className="w-full p-2 border-2 border-gray-300 rounded resize-y text-center"
                        />
                      </td>
                      <td className="p-[0.75rem] border-b border-gray-200">
                        <textarea
                          name="chinese_traditional"
                          value={editingKeyword.chinese_traditional || ""}
                          onChange={handleChange}
                          className="w-full p-2 border-2 border-gray-300 rounded resize-y text-center"
                        />
                      </td>
                      <td className="p-[0.75rem] border-b border-gray-200">
                        <textarea
                          name="chinese_simplified"
                          value={editingKeyword.chinese_simplified || ""}
                          onChange={handleChange}
                          className="w-full p-2 border-2 border-gray-300 rounded resize-y text-center"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <button
                type="submit"
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Save
              </button>
              <button
                type="button"
                className="mt-4 px-4 py-2 bg-gray-500 text-white rounded ml-2 hover:bg-gray-600 transition-colors"
                onClick={() => setEditingKeyword(null)}
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}

      {isAddingKeyword && (
        <div
          className="fixed inset-0 flex justify-center items-center z-50"
          style={{ backgroundColor: "rgba(255, 255, 255, 0.7)" }}
          onClick={() => setIsAddingKeyword(false)}
        >
          <div
            className="bg-white p-6 rounded-lg shadow-xl max-w-4xl w-11/12 max-h-[90vh] overflow-auto text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg text-[#004098CC] font-bold mb-4">
              SUGGEST A NEW KEYWORD
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddKeyword();
              }}
            >
              <div className="overflow-x-auto">
                <table className="w-full border-collapse bg-white">
                  <thead>
                    <tr className="bg-[#004098CC] text-white font-bold">
                      <th className="p-[0.75rem] border-b border-gray-300 w-[20%] text-center">
                        Japanese
                      </th>
                      <th className="p-[0.75rem] border-b border-gray-300 w-[20%] text-center">
                        English
                      </th>
                      <th className="p-[0.75rem] border-b border-gray-300 w-[20%] text-center">
                        Vietnamese
                      </th>
                      <th className="p-[0.75rem] border-b border-gray-300 w-[20%] text-center">
                        Chinese (Traditional)
                      </th>
                      <th className="p-[0.75rem] border-b border-gray-300 w-[20%] text-center">
                        Chinese (Simplified)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="hover:bg-gray-50">
                      {[
                        "japanese",
                        "english",
                        "vietnamese",
                        "chinese_traditional",
                        "chinese_simplified",
                      ].map((lang) => (
                        <td
                          key={lang}
                          className="p-[0.75rem] border-b border-gray-200"
                        >
                          <textarea
                            name={lang}
                            value={newKeyword[lang]}
                            onChange={(e) =>
                              setNewKeyword({
                                ...newKeyword,
                                [lang]: e.target.value,
                              })
                            }
                            className="w-full p-2 border-2 border-gray-300 rounded resize-y text-center"
                          />
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
              <button
                type="submit"
                className={`mt-4 px-4 py-2 text-white rounded transition-colors ${
                  isFormValid()
                    ? "bg-blue-500 hover:bg-blue-600"
                    : "bg-gray-400 cursor-not-allowed"
                }`}
                disabled={!isFormValid()}
              >
                Add
              </button>
              <button
                type="button"
                className="mt-4 px-4 py-2 bg-gray-500 text-white rounded ml-2 hover:bg-gray-600 transition-colors"
                onClick={() => setIsAddingKeyword(false)}
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmModal.isOpen &&
        (role === "Library Keeper" || role === "Admin") && (
          <div
            className="fixed inset-0 flex justify-center items-center z-50"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.7)" }}
          >
            <div
              className="bg-white p-6 rounded-lg shadow-xl max-w-md w-11/12 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg text-[#004098CC] font-bold mb-4">
                Confirm Delete
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this keyword? This action cannot
                be undone.
              </p>
              <div className="flex justify-center gap-4">
                <button
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                  onClick={() =>
                    setDeleteConfirmModal({ isOpen: false, keywordId: null })
                  }
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                  onClick={() => handleDelete(deleteConfirmModal.keywordId)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

      {/* GCS Status Info Modal */}
      {showGcsInfo && gcsStatus && (
        <div
          className="fixed inset-0 flex justify-center items-center z-50"
          style={{ backgroundColor: "rgba(255, 255, 255, 0.7)" }}
          onClick={() => setShowGcsInfo(false)}
        >
          <div
            className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-11/12"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg text-[#004098CC] font-bold mb-4 flex items-center">
              <FiCloud className="mr-2" /> GCS Upload & Glossary Status
            </h3>

            <div className="space-y-4">
              {/* Keywords Statistics */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-700 mb-2">
                  Keywords Statistics
                </h4>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Total:</span>
                    <span className="font-medium ml-1">
                      {gcsStatus.keywords_stats?.total || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-green-600">Approved:</span>
                    <span className="font-medium ml-1">
                      {gcsStatus.keywords_stats?.approved || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-orange-600">Pending:</span>
                    <span className="font-medium ml-1">
                      {gcsStatus.keywords_stats?.pending || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Language Pairs Supported */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-700 mb-2">
                  Supported Translation Pairs
                </h4>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <div>🇻🇳 Vietnamese ↔ 🇺🇸 English</div>
                  <div>🇻🇳 Vietnamese ↔ 🇯🇵 Japanese</div>
                  <div>🇻🇳 Vietnamese ↔ 🇹🇼 Chinese (T)</div>
                  <div>🇺🇸 English ↔ 🇯🇵 Japanese</div>
                  <div>🇺🇸 English ↔ 🇹🇼 Chinese (T)</div>
                  <div>🇯🇵 Japanese ↔ 🇹🇼 Chinese (T)</div>
                </div>
                <p className="text-xs text-gray-500 mt-2 italic">
                  Note: Using Chinese Traditional (zh-TW) as zh-CN, Chinese
                  Simplified is excluded
                </p>
              </div>

              {/* GCS File Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-700 mb-2">
                  GCS File Status
                </h4>
                {gcsStatus.gcs_file?.exists ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <FiCheck className="text-green-500 mr-2" />
                      <span>File exists on GCS</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Size:</span>
                      <span className="font-medium ml-1">
                        {gcsStatus.gcs_file.size} bytes
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Last Updated:</span>
                      <span className="font-medium ml-1">
                        {gcsStatus.gcs_file.updated
                          ? new Date(
                              gcsStatus.gcs_file.updated
                            ).toLocaleString()
                          : "Unknown"}
                      </span>
                    </div>
                    <div className="bg-gray-100 p-2 rounded text-xs font-mono">
                      {gcsStatus.gcs_file.url}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center text-sm">
                    <FiX className="text-red-500 mr-2" />
                    <span>No file found on GCS</span>
                  </div>
                )}
              </div>

              {/* Permissions */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-700 mb-2">
                  Permissions
                </h4>
                <div className="flex items-center text-sm">
                  {gcsStatus.user_permissions?.can_upload ? (
                    <>
                      <FiCheck className="text-green-500 mr-2" />
                      <span>You have upload permissions</span>
                    </>
                  ) : (
                    <>
                      <FiX className="text-red-500 mr-2" />
                      <span>Admin permission required for upload</span>
                    </>
                  )}
                </div>
              </div>

              {/* Upload Status */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-700 mb-2">
                  Upload Status
                </h4>
                <div className="flex items-center text-sm">
                  {gcsStatus.can_upload ? (
                    <>
                      <FiCheck className="text-green-500 mr-2" />
                      <span>
                        Ready to upload ({gcsStatus.keywords_stats?.approved}{" "}
                        approved keywords)
                      </span>
                    </>
                  ) : (
                    <>
                      <FiX className="text-red-500 mr-2" />
                      <span>No approved keywords available for upload</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <button
              className="mt-6 w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              onClick={() => setShowGcsInfo(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

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
};

export default CommonLibraryManagement;

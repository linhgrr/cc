import { useState, useEffect, useRef } from "react";
import {
  FiDownload,
  FiExternalLink,
  FiSearch,
  FiFilter,
  FiChevronDown,
  FiChevronUp,
  FiShare2,
} from "react-icons/fi";
import Pagination from "../../components/Pagination";
import LoadingBar from "../../components/LoadingBar";
import api from "../../services/api";
import { notification } from "antd";
import pdfIcon from "../../assets/icons/FilePdf.png";
import wordIcon from "../../assets/icons/FileDoc.png";
import excelIcon from "../../assets/icons/FileXls.png";

// PowerPoint icon component using SVG
const PowerPointIcon = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    className="w-[1.75rem] h-[1.75rem]"
  >
    <path
      fill="#D24726"
      d="M21 2H3c-.6 0-1 .4-1 1v18c0 .6.4 1 1 1h18c.6 0 1-.4 1-1V3c0-.6-.4-1-1-1z"
    />
    <path
      fill="white"
      d="M6.5 7h4c1.4 0 2.5 1.1 2.5 2.5S11.9 12 10.5 12H8v3H6.5V7zm1.5 3.5h2c.6 0 1-.4 1-1s-.4-1-1-1H8v2z"
    />
  </svg>
);

const fileIcons = {
  pdf: <img src={pdfIcon} alt="PDF" className="w-[1.75rem] h-[1.75rem]" />,
  docx: <img src={wordIcon} alt="Word" className="w-[1.75rem] h-[1.75rem]" />,
  xlsx: <img src={excelIcon} alt="Excel" className="w-[1.75rem] h-[1.75rem]" />,
  pptx: <PowerPointIcon />,
};

const languageMap = {
  vi: "Vietnamese",
  ja: "Japanese",
  en: "English",
  "zh-CN": "Chinese (Simplified)",
  "zh-TW": "Chinese (Traditional)",
};

const getLanguageName = (code) => {
  return languageMap[code];
};

const FileHistory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("id_asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const tableContainerRef = useRef(null);
  const [showTranslationsModal, setShowTranslationsModal] = useState(false);
  const [selectedOriginalFile, setSelectedOriginalFile] = useState(null);

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

  useEffect(() => {
    fetchHistoryData();
  }, []);

  const fetchHistoryData = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/translated-file/history/");
      setHistoryData(response.data);
      setError(null);
    } catch {
      setError("Could not load history data. Please try again later.");
      notification.error({
        message: "Loading Error",
        description:
          "Could not load translation history. Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateItemsPerPage = () => {
    if (!tableContainerRef.current) return 6;

    const rowHeight = 52;
    const tableHeaderHeight = 56;
    const tableBorderHeight = 4;
    const paginationHeight = 60; // Increased to match actual pagination height
    const safetyBuffer = 40; // Reduced buffer

    const containerHeight = tableContainerRef.current.clientHeight;

    // Ensure minimum container height
    if (containerHeight < 200) return 3;

    const availableHeight =
      containerHeight -
      tableHeaderHeight -
      tableBorderHeight -
      paginationHeight -
      safetyBuffer;

    // Ensure positive available height
    if (availableHeight <= 0) return 3;

    const calculatedRows = Math.max(
      3, // Minimum 3 rows
      Math.floor(availableHeight / rowHeight)
    );

    return Math.min(calculatedRows, 20); // Maximum 20 rows
  };

  const getOriginalFiles = () => {
    if (!historyData || historyData.length === 0) return [];

    return historyData.map((group) => ({
      id: group.id,
      name: group.original_file_name,
      type: group.file_type, // Giữ nguyên file type gốc cho original files
      date: new Date(group.created_at).toLocaleDateString("en-US"),
      url: group.original_file_url,
      translations_count: group.translations.length,
      language: group.original_language,
      rawData: group,
    }));
  };
  const handleOriginalFileClick = (file) => {
    setSelectedOriginalFile(file);
    setShowTranslationsModal(true);
  };

  const handleCloseTranslationsModal = () => {
    setShowTranslationsModal(false);
    setSelectedOriginalFile(null);
  };

  const filteredFiles = getOriginalFiles()
    .filter((file) => {
      return file.name.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => {
      switch (sortOrder) {
        case "id_asc":
          return a.id - b.id;
        case "id_desc":
          return b.id - a.id;
        case "name_asc":
          return a.name.localeCompare(b.name);
        case "name_desc":
          return b.name.localeCompare(a.name);
        case "date_asc":
          return new Date(a.date) - new Date(b.date);
        case "date_desc":
          return new Date(b.date) - new Date(a.date);
        default:
          return new Date(b.date) - new Date(a.date);
      }
    });

  useEffect(() => {
    const handleResize = () => {
      requestAnimationFrame(() => {
        const newItemsPerPage = calculateItemsPerPage();
        if (newItemsPerPage !== itemsPerPage) {
          setItemsPerPage(newItemsPerPage);
          setCurrentPage(1);
        }
      });
    };

    window.addEventListener("resize", handleResize);

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });

    if (tableContainerRef.current) {
      resizeObserver.observe(tableContainerRef.current);
    }

    // Initial calculation
    requestAnimationFrame(() => {
      handleResize();
    });

    return () => {
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
    };
  }, [itemsPerPage]);

  useEffect(() => {
    if (!loading) {
      requestAnimationFrame(() => {
        const newItemsPerPage = calculateItemsPerPage();
        if (newItemsPerPage !== itemsPerPage) {
          setItemsPerPage(newItemsPerPage);
          setCurrentPage(1);
        }
      });
    }
  }, [loading, historyData]);

  // Reset currentPage when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortOrder]);

  // Ensure currentPage is within valid range
  useEffect(() => {
    if (filteredFiles.length > 0 && itemsPerPage > 0) {
      const maxPages = Math.ceil(filteredFiles.length / itemsPerPage);
      if (currentPage > maxPages) {
        setCurrentPage(maxPages);
      }
    }
  }, [filteredFiles.length, itemsPerPage, currentPage]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const filteredItems = filteredFiles.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = itemsPerPage > 0 ? Math.ceil(filteredFiles.length / itemsPerPage) : 0;

  // Ensure currentPage is valid when data changes
  const validCurrentPage = Math.max(1, Math.min(currentPage, totalPages || 1));

  const handlePageChange = (newPage) => {
    // Validate page number
    if (typeof newPage !== 'number' || newPage < 1) {
      setCurrentPage(1);
      return;
    }
    
    const maxPages = totalPages || 1;
    if (newPage > maxPages) {
      setCurrentPage(maxPages);
      return;
    }
    
    setCurrentPage(newPage);
  };

  const handleDownload = async (file, languageCode, actualFileType = null) => {
    // Xác định file extension thực tế
    // Nếu file gốc là PDF thì file dịch sẽ là DOCX
    const originalExt = file.name.split(".").pop();
    const actualExt =
      actualFileType ||
      (originalExt === "pdf" && languageCode ? "docx" : originalExt);

    const nameParts = file.name.split(".");
    nameParts.pop(); // Remove original extension
    const baseName = nameParts.join(".");

    const newFileName = languageCode
      ? `${baseName}_${languageCode}.${actualExt}`
      : `${baseName}.${actualExt}`;

    try {
      const response = await fetch(file.url, { method: "GET" });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", newFileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      notification.error({
        message: "Lỗi tải file",
        description: "Không thể tải file. Vui lòng thử lại.",
      });
    }
  };

  const handleOpenInNewTab = (
    file,
    isTranslatedFile = false,
    originalFileType = null
  ) => {
    // Xác định file type thực tế để chọn viewer phù hợp
    let actualFileType;
    if (isTranslatedFile && originalFileType === "pdf") {
      actualFileType = "docx"; // File PDF dịch thành DOCX
    } else if (file.type) {
      actualFileType = file.type;
    } else {
      actualFileType = file.name.split(".").pop().toLowerCase();
    }

    let viewerUrl;
    if (actualFileType === "pdf") {
      viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(
        file.url
      )}&embedded=true`;
    } else {
      viewerUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(
        file.url
      )}`;
    }

    window.open(viewerUrl, "_blank");
  };

  const handleShareFile = async (file, isTranslatedFile = false, originalFileType = null) => {
    try {
      // Xác định file type thực tế để chọn viewer phù hợp
      let actualFileType;
      if (isTranslatedFile && originalFileType === "pdf") {
        actualFileType = "docx"; // File PDF dịch thành DOCX
      } else if (file.type) {
        actualFileType = file.type;
      } else {
        actualFileType = file.name.split(".").pop().toLowerCase();
      }

      let viewerUrl;
      if (actualFileType === "pdf") {
        viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(
          file.url
        )}&embedded=true`;
      } else {
        viewerUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(
          file.url
        )}`;
      }

      await navigator.clipboard.writeText(viewerUrl);
      notification.success({
        message: "View link copied",
        description: "File view link has been copied to clipboard",
      });
    } catch {
      notification.error({
        message: "Copy failed",
        description: "Could not copy file view link. Please try again.",
      });
    }
  };

  const handleDelete = async (fileId) => {
    try {
      await api.delete(`/api/translated-file/history/${fileId}/`);
      notification.success({
        message: "Deleted",
        description: "File has been successfully deleted from the database",
      });
      fetchHistoryData();
      setFileToDelete(null);
    } catch {
      notification.error({
        message: "Error",
        description: "Could not delete file. Please try again later.",
      });
    }
  };

  const sortOptions = [
    { value: "id_asc", label: "Sort by ID (Ascending)" },
    { value: "id_desc", label: "Sort by ID (Descending)" },
    { value: "name_asc", label: "Sort by Name (A-Z)" },
    { value: "name_desc", label: "Sort by Name (Z-A)" },
    { value: "date_asc", label: "Sort by Date (Oldest)" },
    { value: "date_desc", label: "Sort by Date (Newest)" },
  ];

  return (
    <div className="flex flex-1 flex-col h-full gap-[0.25rem]">
      <div className="bg-white p-[1rem] rounded-t-lg">
        <div className="flex flex-wrap items-center justify-between gap-[1rem]">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-800">File History</h1>
          </div>

          <div className="flex flex-wrap items-center gap-[1rem]">
            <div className="relative w-[16rem]">
              <FiSearch className="absolute left-[0.75rem] top-[0.75rem] text-gray-500 z-10" />
              <input
                type="text"
                placeholder="Search"
                className="p-[0.5rem] pl-[2.5rem] border border-gray-300 rounded-full w-full bg-white text-black placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="relative w-[16rem]" ref={dropdownRef}>
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
                      className={`p-[0.75rem] hover:bg-gray-50 cursor-pointer transition-colors ${
                        sortOrder === option.value
                          ? "bg-[#E9F9F9] text-[#3881A2] font-medium"
                          : ""
                      }`}
                      onClick={() => {
                        setSortOrder(option.value);
                        setIsDropdownOpen(false);
                      }}
                    >
                      {option.value === sortOrder && (
                        <span className="inline-block w-[0.25rem] h-[0.25rem] bg-teal-600 rounded-full mr-[0.5rem]"></span>
                      )}
                      {option.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {loading && <LoadingBar />}

      <div className="bg-white p-[0.5rem] rounded-b-lg flex-1 flex flex-col">
        <div ref={tableContainerRef} className="flex-1 h-full flex flex-col">
          {error ? (
            <div className="text-center py-10 text-red-500">
              <p>{error}</p>
              <button
                onClick={fetchHistoryData}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Try Again
              </button>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              {searchTerm
                ? "No matching results found"
                : "No files have been translated yet. Translate files to see history."}
            </div>
          ) : (
            <div className="overflow-hidden flex-1">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse bg-white rounded-lg table-fixed min-w-[800px]">
                  <thead>
                    <tr className="bg-[#004098CC] text-white font-bold">
                      <th className="p-[0.75rem] border-b border-gray-300 w-[5%] text-center min-w-[50px]">
                        ID
                      </th>
                      <th className="p-[0.75rem] border-b border-gray-300 w-[30%] text-center min-w-[200px]">
                        Name
                      </th>
                      <th className="p-[0.75rem] border-b border-gray-300 w-[12%] text-center min-w-[100px]">
                        Language
                      </th>
                      <th className="p-[0.75rem] border-b border-gray-300 w-[10%] text-center min-w-[80px]">
                        Translations
                      </th>
                      <th className="p-[0.75rem] border-b border-gray-300 w-[15%] text-center min-w-[100px]">
                        Date
                      </th>
                      <th className="p-[0.75rem] border-b border-gray-300 w-[28%] text-center min-w-[200px]">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((file, index) => (
                      <tr
                        key={file.id}
                        className={`hover:bg-gray-50 cursor-pointer transition-colors duration-150 ${
                          index % 2 === 0 ? "bg-white" : "bg-[#F8F8F8]"
                        }`}
                        onClick={() => handleOriginalFileClick(file)}
                      >
                        <td className="p-[0.75rem] border-b border-gray-200 text-center">
                          {/* Display sequential number across all pages: (currentPage - 1) * itemsPerPage + rowIndex + 1 */}
                          {indexOfFirstItem + index + 1}
                        </td>
                        <td className="p-[0.75rem] border-b border-gray-200 text-left">
                          <div className="flex items-center space-x-[0.5rem] min-w-0">
                            <div className="flex-shrink-0">
                              {fileIcons[file.type] || <span>📄</span>}
                            </div>
                            <span 
                              className="truncate block min-w-0 flex-1"
                              title={file.name}
                            >
                              {file.name}
                            </span>
                          </div>
                        </td>
                        <td className="p-[0.75rem] border-b border-gray-200 text-center">
                          {getLanguageName(file.language)}
                        </td>
                        <td className="p-[0.75rem] border-b border-gray-200 text-center">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                            {file.translations_count}
                          </span>
                        </td>
                        <td className="p-[0.75rem] border-b border-gray-200 text-center">
                          {file.date}
                        </td>
                        <td className="p-[0.75rem] border-b border-gray-200 text-center">
                          <div className="flex justify-center space-x-[1rem]">
                            <button
                              className="p-[0.5rem] bg-blue-100 rounded-md hover:bg-blue-200 flex items-center justify-center transition-colors"
                              title="Download"
                              onClick={async (e) => {
                                e.stopPropagation();
                                await handleDownload(file, null); // File gốc, không cần language code
                              }}
                            >
                              <FiDownload className="text-blue-600 w-[1.25rem] h-[1.25rem]" />
                            </button>
                            <button
                              className="p-[0.5rem] bg-green-100 rounded-md hover:bg-green-200 flex items-center justify-center transition-colors"
                              title="Open in new tab"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenInNewTab(file);
                              }}
                            >
                              <FiExternalLink className="text-green-600 w-[1.25rem] h-[1.25rem]" />
                            </button>
                            <button
                              className="p-[0.5rem] bg-orange-100 rounded-md hover:bg-orange-200 flex items-center justify-center transition-colors"
                              title="Share file"
                              onClick={async (e) => {
                                e.stopPropagation();
                                await handleShareFile(file);
                              }}
                            >
                              <FiShare2 className="text-orange-600 w-[1.25rem] h-[1.25rem]" />
                            </button>
                            <button
                              className="p-[0.5rem] bg-red-100 rounded-md hover:bg-red-200 flex items-center justify-center transition-colors"
                              title="Delete file"
                              onClick={(e) => {
                                e.stopPropagation();
                                setFileToDelete(file);
                              }}
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
            </div>
          )}
        </div>

        {!loading && !error && filteredFiles.length > 0 && (
          <div>
            <Pagination
              currentPage={validCurrentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>

      {showTranslationsModal && selectedOriginalFile && (
        <div
          className="fixed inset-0 flex justify-center items-center z-50"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
          onClick={handleCloseTranslationsModal}
        >
          <div
            className="bg-white p-[1.5rem] rounded-lg shadow-xl w-11/12 max-w-6xl max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold truncate pr-4 min-w-0 flex-1">
                Translations for &quot;
                <span className="truncate" title={selectedOriginalFile.name}>
                  {selectedOriginalFile.name}
                </span>
                &quot;
              </h2>
              <button
                onClick={handleCloseTranslationsModal}
                className="p-2 text-gray-500 hover:text-gray-700 flex-shrink-0"
              >
                ✕
              </button>
            </div>

            <div className="bg-gray-100 p-3 rounded mb-4">
              <p className="mb-1">
                <strong>Original File:</strong> 
                <span className="ml-2 break-all">{selectedOriginalFile.name}</span>
              </p>
              <p className="mb-1">
                <strong>Language:</strong>{" "}
                {getLanguageName(selectedOriginalFile.language)}
              </p>
              <p className="mb-0">
                <strong>Date:</strong> {selectedOriginalFile.date}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-white rounded-lg table-fixed">
                <thead>
                  <tr className="bg-[#004098CC] text-white font-bold">
                    <th className="p-[0.75rem] border-b border-gray-300 w-[5%] text-center">
                      ID
                    </th>
                    <th className="p-[0.75rem] border-b border-gray-300 w-[35%] text-center">
                      Name
                    </th>
                    <th className="p-[0.75rem] border-b border-gray-300 w-[15%] text-center">
                      Language
                    </th>
                    <th className="p-[0.75rem] border-b border-gray-300 w-[15%] text-center">
                      Date
                    </th>
                    <th className="p-[0.75rem] border-b border-gray-300 w-[30%] text-center">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOriginalFile.rawData.translations.length > 0 ? (
                    selectedOriginalFile.rawData.translations.map(
                      (translation, idx) => (
                        <tr
                          key={translation.id}
                          className={`hover:bg-gray-50 transition-colors duration-150 ${
                            idx % 2 === 0 ? "bg-white" : "bg-[#F8F8F8]"
                          }`}
                        >
                          <td className="p-[0.75rem] border-b border-gray-200 text-center">
                            {idx + 1}
                          </td>
                          <td className="p-[0.75rem] border-b border-gray-200 text-left">
                            <div className="flex items-center space-x-[0.5rem] min-w-0">
                              <div className="flex-shrink-0">
                                {(() => {
                                  // Hiển thị icon đúng với file type thực tế
                                  const actualType =
                                    selectedOriginalFile.type === "pdf"
                                      ? "docx"
                                      : selectedOriginalFile.type;
                                  return fileIcons[actualType] || <span>📄</span>;
                                })()}
                              </div>
                              <span 
                                className="truncate block min-w-0 flex-1"
                                title={(() => {
                                  const nameParts =
                                    selectedOriginalFile.name.split(".");
                                  nameParts.pop(); // Remove original extension
                                  const baseName = nameParts.join(".");
                                  // Sử dụng extension thực tế: PDF gốc → DOCX dịch
                                  const actualExt =
                                    selectedOriginalFile.type === "pdf"
                                      ? "docx"
                                      : selectedOriginalFile.type;
                                  return `${baseName}_${translation.language_code}.${actualExt}`;
                                })()}
                              >
                                {(() => {
                                  const nameParts =
                                    selectedOriginalFile.name.split(".");
                                  nameParts.pop(); // Remove original extension
                                  const baseName = nameParts.join(".");
                                  // Sử dụng extension thực tế: PDF gốc → DOCX dịch
                                  const actualExt =
                                    selectedOriginalFile.type === "pdf"
                                      ? "docx"
                                      : selectedOriginalFile.type;
                                  return `${baseName}_${translation.language_code}.${actualExt}`;
                                })()}
                              </span>
                            </div>
                          </td>
                          <td className="p-[0.75rem] border-b border-gray-200 text-center">
                            {getLanguageName(translation.language_code)}
                          </td>
                          <td className="p-[0.75rem] border-b border-gray-200 text-center">
                            {new Date(
                              translation.created_at
                            ).toLocaleDateString("en-US")}
                          </td>
                          <td className="p-[0.75rem] border-b border-gray-200 text-center">
                            <div className="flex justify-center space-x-[1rem]">
                              <button
                                className="p-[0.5rem] bg-blue-100 rounded-md hover:bg-blue-200 flex items-center justify-center transition-colors"
                                title="Download"
                                onClick={async () => {
                                  // Xác định file type thực tế: PDF gốc → DOCX dịch
                                  const actualType =
                                    selectedOriginalFile.type === "pdf"
                                      ? "docx"
                                      : selectedOriginalFile.type;
                                  await handleDownload(
                                    {
                                      url: translation.translated_file_url,
                                      name: selectedOriginalFile.name,
                                    },
                                    translation.language_code,
                                    actualType
                                  );
                                }}
                              >
                                <FiDownload className="text-blue-600 w-[1.25rem] h-[1.25rem]" />
                              </button>
                              <button
                                className="p-[0.5rem] bg-green-100 rounded-md hover:bg-green-200 flex items-center justify-center transition-colors"
                                title="Open in new tab"
                                onClick={() => {
                                  handleOpenInNewTab(
                                    {
                                      url: translation.translated_file_url,
                                      name: selectedOriginalFile.name,
                                      type: selectedOriginalFile.type,
                                    },
                                    true,
                                    selectedOriginalFile.type
                                  );
                                }}
                              >
                                <FiExternalLink className="text-green-600 w-[1.25rem] h-[1.25rem]" />
                              </button>
                              <button
                                className="p-[0.5rem] bg-orange-100 rounded-md hover:bg-orange-200 flex items-center justify-center transition-colors"
                                title="Share file"
                                onClick={async () => {
                                  await handleShareFile({
                                    url: translation.translated_file_url,
                                    name: selectedOriginalFile.name,
                                    type: selectedOriginalFile.type,
                                  }, true, selectedOriginalFile.type);
                                }}
                              >
                                <FiShare2 className="text-orange-600 w-[1.25rem] h-[1.25rem]" />
                              </button>
                              <button
                                className="p-[0.5rem] bg-red-100 rounded-md hover:bg-red-200 flex items-center justify-center transition-colors"
                                title="Delete file"
                                onClick={() =>
                                  setFileToDelete({
                                    id: translation.id,
                                    name: selectedOriginalFile.name,
                                  })
                                }
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
                      )
                    )
                  ) : (
                    <tr>
                      <td
                        colSpan="5"
                        className="p-[0.75rem] text-center text-gray-500"
                      >
                        No translations available for this file.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {selectedFile && (
        <div
          className="fixed inset-0 flex justify-center items-center z-50"
          style={{ backgroundColor: "rgba(255, 255, 255, 0.7)" }}
          onClick={() => setSelectedFile(null)}
        >
          <div
            className="bg-white p-[1.5rem] rounded-lg shadow-xl max-w-2xl w-11/12 max-h-[90vh] overflow-auto text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-[1rem]">FILE DETAILS</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-white shadow-md rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-[0.75rem] border-b border-gray-300 text-center">
                      Property
                    </th>
                    <th className="p-[0.75rem] border-b border-gray-300 text-center">
                      Value
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white">
                    <td className="p-[0.75rem] border-b border-gray-200 text-center">
                      File Name
                    </td>
                    <td className="p-[0.75rem] border-b border-gray-200 text-center">
                      <div className="flex items-center space-x-[0.5rem] justify-center">
                        {fileIcons[selectedFile.type] || <span>📄</span>}
                        <span>{selectedFile.name}</span>
                      </div>
                    </td>
                  </tr>
                  <tr className="bg-[#F8F8F8]">
                    <td className="p-[0.75rem] border-b border-gray-200 text-center">
                      Language
                    </td>
                    <td className="p-[0.75rem] border-b border-gray-200 text-center">
                      {selectedFile.lang}
                    </td>
                  </tr>
                  <tr className="bg-white">
                    <td className="p-[0.75rem] border-b border-gray-200 text-center">
                      Date
                    </td>
                    <td className="p-[0.75rem] border-b border-gray-200 text-center">
                      {selectedFile.date}
                    </td>
                  </tr>
                  <tr className="bg-[#F8F8F8]">
                    <td className="p-[0.75rem] border-b border-gray-200 text-center">
                      File Type
                    </td>
                    <td className="p-[0.75rem] border-b border-gray-200 text-center">
                      {selectedFile.type?.toUpperCase() || "UNKNOWN"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-[1rem] flex justify-center space-x-[1rem]">
              <button
                className="px-[1rem] py-[0.5rem] bg-blue-500 text-white rounded flex items-center"
                onClick={async () => {
                  await handleDownload(selectedFile, null); // File gốc, không cần language code
                }}
              >
                <FiDownload className="mr-[0.5rem]" /> Download
              </button>
              <button
                className="px-[1rem] py-[0.5rem] bg-green-500 text-white rounded flex items-center"
                onClick={() => handleOpenInNewTab(selectedFile)}
              >
                <FiExternalLink className="mr-[0.5rem]" /> Open in new tab
              </button>
              <button
                className="px-[1rem] py-[0.5rem] bg-orange-500 text-white rounded flex items-center"
                onClick={async () => {
                  await handleShareFile(selectedFile);
                }}
              >
                <FiShare2 className="mr-[0.5rem]" /> Share
              </button>
              <button
                className="px-[1rem] py-[0.5rem] bg-red-500 text-white rounded flex items-center"
                onClick={() => setFileToDelete(selectedFile)}
              >
                Delete
              </button>
              <button
                className="px-[1rem] py-[0.5rem] bg-gray-500 text-white rounded"
                onClick={() => setSelectedFile(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {fileToDelete && (
        <div
          className="fixed inset-0 flex justify-center items-center"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        >
          <div
            className="bg-white p-[1.5rem] rounded shadow-lg w-[24rem] text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-[1rem]">Confirm Delete</h3>
            <p className="mb-[1.5rem]">
              Are you sure you want to delete the file &quot;
              {fileToDelete.name}&quot;?
            </p>
            <div className="flex justify-center space-x-[1rem]">
              <button
                className="px-[1rem] py-[0.5rem] bg-red-500 text-white rounded hover:bg-red-600"
                onClick={() => handleDelete(fileToDelete.id)}
              >
                Delete
              </button>
              <button
                className="px-[1rem] py-[0.5rem] bg-gray-500 text-white rounded hover:bg-gray-600"
                onClick={() => setFileToDelete(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileHistory;
